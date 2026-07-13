"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaTimes, FaPlus, FaMinus, FaTrash, FaLock, FaSpinner } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { supabase } from "../utils/supabase";

// Razorpay Script Loader Helper
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    orders,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    deliveryCharge,
    cartTotal,
    clearCart,
    saveOrders,
    showCheckout,
    setShowCheckout,
    user
  } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

// Fetch user profile on mount if logged in
  useEffect(() => {
    if (user && showCheckout) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (data) {
            setFormData(prev => ({
              ...prev,
              name: data.full_name || prev.name,
              phone: data.phone || prev.phone,
              address: data.address || prev.address,
              city: data.city || prev.city,
              state: data.state || prev.state,
              pincode: data.pincode || prev.pincode,
            }));
          }
        } catch (e) {
          console.log("No profile found.");
        }
      };
      fetchProfile();
    }
  }, [user, showCheckout]);

  if (!isCartOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  

  // Save profile upon successful order
  const saveProfileData = async (formDataStr) => {
    if (!user) return;
    try {
      await supabase.from("user_profiles").upsert({
        id: user.id,
        full_name: formDataStr.name,
        phone: formDataStr.phone,
        address: formDataStr.address,
        city: formDataStr.city,
        state: formDataStr.state,
        pincode: formDataStr.pincode,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.log("Error auto-saving profile:", e);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters.";
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit Indian phone number.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }

    const pinRegex = /^\d{6}$/;
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!pinRegex.test(formData.pincode.trim())) {
      newErrors.pincode = "Enter a valid 6-digit Pincode.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetCheckout = () => {
    setFormData({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
    setErrors({});
    setShowCheckout(false);
  };

  // Automated Razorpay Gateway Checkout Flow
  const handleRazorpayPayment = async (fullAddress) => {
    setIsPlacingOrder(true);
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      alert("Failed to load Razorpay payment helper. Please check your internet connection.");
      setIsPlacingOrder(false);
      return;
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_your_razorpay_key_here";
    const checkoutItems = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedSize: item.selectedSize || "3ml",
    }));

    const { data: razorpayOrder, error: createError } = await supabase.functions.invoke("razorpay-checkout", {
      body: {
        action: "create_order",
        items: checkoutItems,
      },
    });

    if (createError || !razorpayOrder?.razorpayOrderId) {
      alert(createError?.message || razorpayOrder?.error || "Could not create Razorpay order.");
      setIsPlacingOrder(false);
      return;
    }

    const options = {
      key: keyId,
      amount: razorpayOrder.amount,
      currency: "INR",
      name: "Maaz Oud",
      description: "Premium Attars Order Checkout",
      order_id: razorpayOrder.razorpayOrderId,
      prefill: {
        name: formData.name,
        contact: formData.phone,
        method: "upi" // Auto-opens UPI/QR screen first by default
      },
      theme: {
        color: "#8c6239"
      },
      handler: async function (response) {
        try {
          const { data: verifiedOrder, error: verifyError } = await supabase.functions.invoke("razorpay-checkout", {
            body: {
              action: "verify_payment",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              customer: {
                name: formData.name,
                phone: formData.phone,
                address: fullAddress,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
              },
              items: checkoutItems,
            },
          });

          if (verifyError || !verifiedOrder?.orderId) {
            throw new Error(verifyError?.message || verifiedOrder?.error || "Payment verification failed.");
          }

          if (verifiedOrder.order) {
            saveOrders([verifiedOrder.order, ...orders]);
          }
          await clearCart();
          await saveProfileData(formData);
          resetCheckout();
          setIsCartOpen(false);
          router.push(`/order-success?orderId=${verifiedOrder.orderId}`);
        } catch (err) {
          alert("Error placing order: " + err.message);
        } finally {
          setIsPlacingOrder(false);
        }
      },
      modal: {
        ondismiss: function () {
          setIsPlacingOrder(false);
        }
      }
    };

    try {
      const rzpObj = new window.Razorpay(options);
      rzpObj.open();
    } catch (err) {
      alert("Razorpay payment window failed to load. Please verify Key ID inside .env file: " + err.message);
      setIsPlacingOrder(false);
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

    await handleRazorpayPayment(fullAddress);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isPlacingOrder) {
            setIsCartOpen(false);
            setShowCheckout(false);
          }
        }}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-xl flex flex-col h-full relative">

          {/* Header */}
          <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wider">
              {showCheckout ? "Checkout Details" : "Shopping Cart"}
            </h2>
            <button
              disabled={isPlacingOrder}
              onClick={() => {
                setIsCartOpen(false);
                setShowCheckout(false);
              }}
              className="p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer disabled:opacity-30"
              aria-label="Close cart"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Checkout Steps & Processing Overlay */}
          {isPlacingOrder && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center z-45 space-y-3">
              <FaSpinner className="text-[#8c6239] animate-spin" size={32} />
              <span className="text-xs font-bold uppercase tracking-widest text-stone-600">Processing order...</span>
            </div>
          )}

          {/* Cart Items / Form */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-stone-500 font-light">Your cart is currently empty.</p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-black text-white hover:bg-[#8c6239] text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : !showCheckout ? (
              cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex gap-4 p-3 border border-stone-100 rounded-md hover:border-stone-200 transition-all"
                >
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded bg-stone-50 border border-stone-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-stone-900 truncate">
                      {item.product.name}
                    </h4>
                    <span className="text-[10px] text-stone-500 block mt-0.5">
                      Size: {item.selectedSize}
                    </span>
                    <span className="text-xs font-bold text-stone-900 block mt-1">
                      Rs. {item.price}
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-3 mt-3">
                      <div className="flex items-center border border-stone-200 rounded">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="px-2 py-1 text-stone-500 hover:text-black transition-colors cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <FaMinus size={10} />
                        </button>
                        <span className="px-2 text-xs font-medium text-stone-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="px-2 py-1 text-stone-500 hover:text-black transition-colors cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-stone-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Checkout Delivery Form */
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
                {/* Pricing Summary Breakdown */}
                <div className="p-4 bg-stone-50 rounded border border-stone-150/50 space-y-2">
                  <div className="flex justify-between text-xs text-stone-500 font-light">
                    <span>Subtotal</span>
                    <span className="font-semibold text-stone-900">Rs. {cartSubtotal}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500 font-light">
                    <span>Delivery Charge</span>
                    <span className="font-semibold text-stone-900 ">Rs. {deliveryCharge}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-stone-200 pt-2 text-stone-900">
                    <span>Total Amount</span>
                    <span className="text-[#8c6239] text-base">Rs. {cartTotal}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">
                  Delivery Details
                </h3>

                {/* Full Name */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full bg-stone-50 border ${errors.name ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full bg-stone-50 border ${errors.phone ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                  />
                  {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Shipping Address */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Address Line *
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="House no., Street, Area"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full bg-stone-50 border ${errors.address ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                  />
                  {errors.address && <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>}
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full bg-stone-50 border ${errors.city ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                    />
                    {errors.city && <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      placeholder="e.g. Maharashtra"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full bg-stone-50 border ${errors.state ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                    />
                    {errors.state && <p className="text-[10px] text-red-500 mt-1">{errors.state}</p>}
                  </div>
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Pincode (6-digit) *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    placeholder="e.g. 400001"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    className={`w-full bg-stone-50 border ${errors.pincode ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                  />
                  {errors.pincode && <p className="text-[10px] text-red-500 mt-1">{errors.pincode}</p>}
                </div>

                {/* Payment Method */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Payment Method *
                  </label>
                  <div className="p-3 bg-stone-50 rounded border border-stone-100 text-[10px] text-stone-500 leading-normal font-light">
                    <p className="text-[#8c6239] font-medium flex items-center gap-1">
                      <FaLock size={8} /> Pay securely via Razorpay (UPI, Cards, GPay, PhonePe).
                    </p>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-wider rounded transition-all text-stone-800 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-black text-white hover:bg-[#8c6239] text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                  >
                    Pay & Confirm
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer (Pricing Summary) */}
          {cart.length > 0 && !showCheckout && (
            <div className="border-t border-stone-200 px-6 py-6 bg-stone-50 space-y-4">
              <div className="space-y-2 text-xs text-stone-500 font-light border-b border-stone-200/60 pb-3">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">Rs. {cartSubtotal}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery Charge</span>
                  <span className="font-semibold text-stone-900">Rs. {deliveryCharge}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-stone-700">Total Payable</span>
                <span className="font-black text-stone-900 text-lg">Rs. {cartTotal}</span>
              </div>
              <p className="text-[10px] text-stone-400 leading-relaxed">
                Taxes and delivery charges calculated at checkout.
              </p>
              <button
                onClick={() => setShowCheckout(true)}
                className="w-full py-3 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-widest rounded transition-all shadow-md cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
