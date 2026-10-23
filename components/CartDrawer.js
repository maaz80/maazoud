"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaTimes, FaPlus, FaMinus, FaTrash, FaLock, FaSpinner } from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { supabase } from "../utils/supabase";
import { trackGAEvent } from "../utils/analytics";
import { getOptimizedImageUrl, supabaseLoader } from "../utils/imageHelper";

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
    user,
    placeOrder
  } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("prepaid");
  const [errors, setErrors] = useState({});
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isInternational, setIsInternational] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("IN");
  const [showInternationalModal, setShowInternationalModal] = useState(false);
  const [leadSessionId, setLeadSessionId] = useState(null);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeAutoFilled, setPincodeAutoFilled] = useState(false);
  const captureTimeoutRef = React.useRef(null);

  // Initialize checkout lead session id
  useEffect(() => {
    if (typeof window !== "undefined") {
      let sid = sessionStorage.getItem("maazoud_lead_session_id");
      if (!sid) {
        sid = "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem("maazoud_lead_session_id", sid);
      }
      setLeadSessionId(sid);
    }
  }, []);

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

  // Geolocation visitor country check
  useEffect(() => {
    if (isCartOpen) {
      const checkCountry = async () => {
        try {
          const res = await fetch("/api/detect-country");
          const data = await res.json();
          if (data.country) {
            setDetectedCountry(data.country);
            setIsInternational(data.country !== "IN");
          }
        } catch (e) {
          console.log("Error checking visitor country:", e);
        }
      };
      checkCountry();
    }
  }, [isCartOpen]);

  // Google Analytics Event Tracking for Checkout Steps
  useEffect(() => {
    if (showCheckout && cart.length > 0) {
      trackGAEvent("begin_checkout", {
        currency: "INR",
        value: cartTotal,
        items: cart.map(item => ({
          item_id: item.product.id,
          item_name: item.product.name,
          price: item.price,
          quantity: item.quantity
        }))
      });
    }
  }, [showCheckout, cart, cartTotal]);

  if (!isCartOpen) return null;

  const captureLead = (dataOverride = null) => {
    try {
      const currentData = dataOverride || formData;
      const cleanPhone = (currentData.phone || "").replace(/\D/g, "");
      if (cleanPhone.length < 10) return; // Only capture if valid 10 digits entered

      const currentSid = leadSessionId || (typeof window !== "undefined" ? sessionStorage.getItem("maazoud_lead_session_id") : null);

      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          session_id: currentSid,
          customer_name: currentData.name,
          phone: cleanPhone,
          address: currentData.address,
          city: currentData.city,
          state: currentData.state,
          pincode: currentData.pincode,
          cart_items: cart.map((item) => ({
            id: item.product?.id,
            name: item.product?.name,
            selectedSize: item.selectedSize || "3ml",
            quantity: item.quantity,
            price: item.price,
          })),
          cart_total: cartTotal,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {
      // Background capture is completely safe and silent
    }
  };

  const markLeadConverted = (orderId) => {
    try {
      const currentSid = leadSessionId || (typeof window !== "undefined" ? sessionStorage.getItem("maazoud_lead_session_id") : null);
      const cleanPhone = (formData.phone || "").replace(/\D/g, "");

      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "convert",
          session_id: currentSid,
          phone: cleanPhone,
          order_id: orderId,
        }),
        keepalive: true,
      }).catch(() => {});

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("maazoud_lead_session_id");
      }
    } catch (e) {}
  };

  // Phone validator: requires minimum 10 digits; allows spaces, +, country codes, and 10+ digits
  const getPhoneError = (phoneVal) => {
    const raw = (phoneVal || "").trim();
    if (!raw) {
      return "Phone number is required.";
    }

    const cleanDigits = raw.replace(/\D/g, "");
    if (cleanDigits.length < 10) {
      return `Please enter at least 10 digits (currently ${cleanDigits.length}/10 digits).`;
    }

    return null;
  };

  // Auto-fetch city & state from 6-digit Indian pincode
  const fetchPincodeDetails = async (pin) => {
    const cleanPin = (pin || "").trim();
    if (!/^\d{6}$/.test(cleanPin)) return;

    setIsFetchingPincode(true);
    try {
      const res = await fetch(`/api/pincode?code=${cleanPin}`);
      const data = await res.json();
      if (data.success && (data.city || data.state)) {
        setFormData((prev) => ({
          ...prev,
          city: data.city || prev.city,
          state: data.state || prev.state,
        }));
        setPincodeAutoFilled(true);
        // Clear errors on city, state, pincode
        setErrors((prev) => ({
          ...prev,
          city: "",
          state: "",
          pincode: "",
        }));
      }
    } catch (err) {
      console.warn("Pincode auto-fetch error:", err);
    } finally {
      setIsFetchingPincode(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (name === "phone") {
      const cleanDigits = value.replace(/\D/g, "");
      if (cleanDigits.length >= 10 && errors.phone) {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    } else if (name === "pincode") {
      const cleanPin = value.trim();
      if (/^\d{6}$/.test(cleanPin)) {
        fetchPincodeDetails(cleanPin);
      } else {
        setPincodeAutoFilled(false);
      }
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    } else {
      // Clear error
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }

    // Debounced lead capture after 1.5 seconds of user typing
    if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
    captureTimeoutRef.current = setTimeout(() => {
      captureLead(updated);
    }, 1500);
  };

  const handleInputBlur = (e) => {
    const fieldName = e?.target?.name;
    if (fieldName === "phone") {
      const phoneErr = getPhoneError(formData.phone);
      if (phoneErr) {
        setErrors((prev) => ({ ...prev, phone: phoneErr }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    } else if (fieldName === "pincode") {
      const cleanPin = (formData.pincode || "").trim();
      if (/^\d{6}$/.test(cleanPin) && (!formData.city || !formData.state)) {
        fetchPincodeDetails(cleanPin);
      }
    }
    captureLead();
  };

  // Save profile upon successful order
  const saveProfileData = async (formDataStr) => {
    if (!user) return;
    try {
      const cleanPhone = (formDataStr.phone || "").replace(/\D/g, "");
      await supabase.from("user_profiles").upsert({
        id: user.id,
        full_name: formDataStr.name,
        phone: cleanPhone,
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

    const phoneErr = getPhoneError(formData.phone);
    if (phoneErr) {
      newErrors.phone = phoneErr;
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
      newErrors.pincode = "Enter a valid 6-digit Pincode (Domestic shipping only).";
    }

    // Check for foreign keywords in address, city, or state fields
    const foreignKeywords = [
      "united states", "usa", "united kingdom", "uk", "london", "canada", 
      "australia", "germany", "dubai", "uae", "singapore", "malaysia", 
      "bangladesh", "pakistan", "new york", "california", "america"
    ];
    
    const cityVal = (formData.city || "").toLowerCase().trim();
    const stateVal = (formData.state || "").toLowerCase().trim();

    let hasForeign = false;

    // Check state field
    const stateHasForeign = foreignKeywords.some(keyword => stateVal.includes(keyword));
    if (stateHasForeign) {
      newErrors.state = "We do not deliver to international states. Domestic shipping only.";
      hasForeign = true;
    }

    // Check city field
    const cityHasForeign = foreignKeywords.some(keyword => cityVal.includes(keyword));
    if (cityHasForeign) {
      newErrors.city = "We do not deliver to international cities. Domestic shipping only.";
      hasForeign = true;
    }

    if (hasForeign) {
      setShowInternationalModal(true);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetCheckout = () => {
    setFormData({ name: "", phone: "", address: "", city: "", state: "", pincode: "" });
    setErrors({});
    setShowCheckout(false);
    setPaymentMethod("prepaid");
    setIsFetchingPincode(false);
    setPincodeAutoFilled(false);
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

    const cleanPhone = (formData.phone || "").replace(/\D/g, "");
    let razorpayContact = cleanPhone;
    if (razorpayContact.length === 12 && razorpayContact.startsWith("91")) {
      razorpayContact = razorpayContact.slice(2);
    } else if (razorpayContact.length === 11 && razorpayContact.startsWith("0")) {
      razorpayContact = razorpayContact.slice(1);
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
        contact: razorpayContact,
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
                phone: cleanPhone,
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

          markLeadConverted(verifiedOrder.orderId);

          // Google Analytics Event Tracking for Purchase Conversion
          trackGAEvent("purchase", {
            transaction_id: verifiedOrder.orderId,
            value: cartTotal,
            currency: "INR",
            shipping: 40,
            items: cart.map(item => ({
              item_id: item.product.id,
              item_name: item.product.name,
              price: item.price,
              quantity: item.quantity
            }))
          });

          await clearCart();
          await saveProfileData({ ...formData, phone: cleanPhone });
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
    const cleanPhone = (formData.phone || "").replace(/\D/g, "");

    if (paymentMethod === "cod") {
      setIsPlacingOrder(true);
      try {
        const checkoutItems = cart.map((item) => ({
          cartItemId: item.cartItemId,
          productId: item.product?.id,
          product: {
            id: item.product?.id,
            name: item.product?.name,
            image: item.product?.image,
          },
          quantity: item.quantity,
          selectedSize: item.selectedSize || "3ml",
          price: item.price,
        }));

        let orderId = null;
        let createdOrder = null;

        // 1. Submit to reliable Next.js server route (uses Supabase Service Role Key)
        try {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customer_name: formData.name,
              phone: cleanPhone,
              address: fullAddress,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              payment_method: "Cash on Delivery (COD)",
              total_amount: cartTotal + 30, // Include COD Fee
              items: checkoutItems,
              user_id: user?.id || null,
              session_id: leadSessionId || (typeof window !== "undefined" ? sessionStorage.getItem("maazoud_lead_session_id") : null),
            }),
          });

          const data = await res.json();
          if (res.ok && data.success && data.orderId) {
            orderId = data.orderId;
            createdOrder = data.order;
          } else {
            console.warn("API route returned error, falling back to direct client placeOrder:", data?.error);
          }
        } catch (apiErr) {
          console.warn("API route request failed, falling back to direct client placeOrder:", apiErr);
        }

        // 2. Direct client fallback via placeOrder if API route was unreachable
        if (!orderId) {
          orderId = await placeOrder({
            name: formData.name,
            phone: cleanPhone,
            address: fullAddress,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            paymentMethod: "Cash on Delivery (COD)",
            totalAmount: cartTotal + 30, // Include COD Fee
          });
        } else {
          if (createdOrder) {
            saveOrders([createdOrder, ...orders]);
          }
          await clearCart();
        }

        if (!orderId) {
          throw new Error("Unable to save order. Please check your internet connection and try again.");
        }

        // Google Analytics Event Tracking for Purchase Conversion
        trackGAEvent("purchase", {
          transaction_id: orderId,
          value: cartTotal + 30, // Include COD Fee
          currency: "INR",
          shipping: 40,
          items: cart.map(item => ({
            item_id: item.product?.id,
            item_name: item.product?.name,
            price: item.price,
            quantity: item.quantity
          }))
        });

        await saveProfileData({ ...formData, phone: cleanPhone });
        markLeadConverted(orderId);
        resetCheckout();
        setIsCartOpen(false);
        router.push(`/order-success?orderId=${orderId}`);
      } catch (err) {
        console.error("Error placing COD order:", err);
        alert("Error placing order: " + err.message);
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      await handleRazorpayPayment(fullAddress);
    }
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
                    loader={supabaseLoader}
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
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
                {isInternational && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[10px] text-amber-900 leading-normal font-medium mb-3">
                     <strong>International Visitor:</strong> We only ship orders within India. You can place your order from anywhere as long as the delivery address and phone number are in India.
                  </div>
                )}

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
                    onBlur={handleInputBlur}
                    className={`w-full bg-stone-50 border ${errors.name ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Phone Number */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                      Phone Number *
                    </label>
                    {formData.phone && (
                      <span className={`text-[10px] font-medium transition-colors ${
                        formData.phone.replace(/\D/g, "").length >= 10 && !errors.phone
                          ? "text-emerald-600 font-bold"
                          : "text-stone-400"
                      }`}>
                        {formData.phone.replace(/\D/g, "").length >= 10 ? "✓ Minimum 10 digits" : `${formData.phone.replace(/\D/g, "").length}/10 digits`}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g. 98765 43210 or +91 98765 43210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={`w-full bg-stone-50 border ${
                        errors.phone
                          ? 'border-red-500 focus:ring-red-400'
                          : formData.phone.replace(/\D/g, "").length >= 10
                          ? 'border-emerald-500 focus:ring-emerald-400'
                          : 'border-stone-200 focus:ring-[#8c6239]'
                      } rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 text-xs`}
                    />
                    {formData.phone.replace(/\D/g, "").length >= 10 && !errors.phone && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold pointer-events-none">
                        ✓
                      </span>
                    )}
                  </div>
                  {errors.phone && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                      <span className="shrink-0">⚠️</span>
                      <span>{errors.phone}</span>
                    </p>
                  )}
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
                    onBlur={handleInputBlur}
                    className={`w-full bg-stone-50 border ${errors.address ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                  />
                  {errors.address && <p className="text-[10px] text-red-500 mt-1">{errors.address}</p>}
                </div>

                {/* Pincode (Placed above City & State with Auto-Fill) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                      Pincode (6-digit) *
                    </label>
                    {isFetchingPincode ? (
                      <span className="text-[10px] text-[#8c6239] animate-pulse font-medium">
                        Fetching City & State...
                      </span>
                    ) : pincodeAutoFilled && formData.city && formData.state ? (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        ✓ City & State auto-filled
                      </span>
                    ) : null}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="pincode"
                      placeholder="e.g. 400001"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleInputChange}
                      onBlur={handleInputBlur}
                      className={`w-full bg-stone-50 border ${
                        errors.pincode
                          ? 'border-red-500 focus:ring-red-400'
                          : pincodeAutoFilled && formData.city && formData.state
                          ? 'border-emerald-500 focus:ring-emerald-400'
                          : 'border-stone-200 focus:ring-[#8c6239]'
                      } rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 text-xs`}
                    />
                    {isFetchingPincode && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-3.5 h-3.5 border-2 border-[#8c6239] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {errors.pincode && <p className="text-[10px] text-red-500 mt-1">{errors.pincode}</p>}
                </div>

                {/* City & State (Auto-filled from Pincode, still editable) */}
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
                      onBlur={handleInputBlur}
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
                      onBlur={handleInputBlur}
                      className={`w-full bg-stone-50 border ${errors.state ? 'border-red-500' : 'border-stone-200'} rounded-md py-2 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] text-xs`}
                    />
                    {errors.state && <p className="text-[10px] text-red-500 mt-1">{errors.state}</p>}
                  </div>
                </div>

                {/* Shipping Country (Fixed to India) */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Shipping Country
                  </label>
                  <input
                    type="text"
                    value="India (Domestic Delivery Only)"
                    disabled
                    className="w-full bg-stone-100 border border-stone-200 rounded-md py-2 px-3 text-stone-500 text-xs font-semibold cursor-not-allowed"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Payment Method *
                  </label>
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("prepaid")}
                      className={`p-3.5 rounded-lg border-2 text-left cursor-pointer transition-all ${
                        paymentMethod === "prepaid"
                          ? "border-emerald-600 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-600/20"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm md:text-base font-extrabold tracking-tight transition-colors ${
                            paymentMethod === "prepaid" ? "text-emerald-600" : "text-stone-900"
                          }`}>
                            Prepaid
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                            Save ₹30 COD Fee
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          paymentMethod === "prepaid" ? "border-emerald-600" : "border-stone-300"
                        }`}>
                          {paymentMethod === "prepaid" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1 font-normal leading-snug">
                        Pay online securely via UPI (Google Pay, PhonePe, Paytm), Cards & Netbanking.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-3.5 rounded-lg border-2 text-left cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "border-emerald-600 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-600/20"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm md:text-base font-extrabold tracking-tight transition-colors ${
                            paymentMethod === "cod" ? "text-emerald-600" : "text-stone-900"
                          }`}>
                            COD (Cash on Delivery)
                          </span>
                          <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                            +₹30 Fee
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          paymentMethod === "cod" ? "border-emerald-600" : "border-stone-300"
                        }`}>
                          {paymentMethod === "cod" && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-1 font-normal leading-snug">
                        Pay with Cash or UPI when your parcel is delivered at your doorstep.
                      </p>
                    </button>
                  </div>
                  
                  {paymentMethod === "prepaid" ? (
                    <div className="p-3 bg-stone-50 rounded border border-stone-100 text-[10px] text-stone-500 leading-normal font-light">
                      <p className="text-[#8c6239] font-medium flex items-center gap-1">
                        <FaLock size={8} /> Pay securely via Razorpay (UPI, Cards, Wallet).
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-stone-50 rounded border border-stone-100 text-[10px] text-stone-500 leading-normal font-light">
                      <p className="text-stone-600 font-medium">
                        Pay cash upon delivery. COD Handling Fee of ₹30 applies.
                      </p>
                    </div>
                  )}
                </div>

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
                  {paymentMethod === "cod" && (
                    <div className="flex justify-between text-xs text-stone-500 font-light">
                      <span>COD Fee</span>
                      <span className="font-semibold text-stone-900">Rs. 30</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold border-t border-stone-200 pt-2 text-stone-900">
                    <span>Total Amount</span>
                    <span className="text-[#8c6239] text-base">Rs. {paymentMethod === "cod" ? cartTotal + 30 : cartTotal}</span>
                  </div>
                  {paymentMethod === "prepaid" ? (
                    <p className="text-[9px] text-emerald-600 font-medium pt-1 text-right">
                      🎉 You saved ₹30 COD fees by choosing Prepaid!
                    </p>
                  ) : (
                    <p className="text-[9px] text-[#8c6239] font-medium pt-1 text-right">
                      💡 Choose Prepaid to save ₹30 COD fees.
                    </p>
                  )}
                </div>

              </form>
            )}
          </div>

          {/* Checkout actions stay visible while delivery details scroll */}
          {cart.length > 0 && showCheckout && (
            <div className="shrink-0 border-t border-stone-200 bg-white px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between text-sm font-bold text-stone-900 mb-3">
                <span>Total Payable</span>
                <span className="text-[#8c6239] text-base">Rs. {paymentMethod === "cod" ? cartTotal + 30 : cartTotal}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-3 border border-stone-200 hover:bg-stone-50 text-[10px] font-bold uppercase tracking-wider rounded transition-all text-stone-800 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isPlacingOrder}
                  className="flex-1 py-3 bg-black text-white hover:bg-[#8c6239] text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer disabled:opacity-60"
                >
                  {paymentMethod === "cod" ? "Confirm COD Order" : "Pay & Confirm"}
                </button>
              </div>
            </div>
          )}

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
              <div className="bg-emerald-50 border border-emerald-100 rounded p-2.5 flex items-center gap-2">
                <span className="text-base">💡</span>
                <p className="text-[10px] text-emerald-800 leading-tight font-medium">
                  Select <strong className="font-bold text-emerald-900">Prepaid</strong> at checkout to save ₹30 COD fees!
                </p>
              </div>
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



      {/* International Shipping Warning Modal */}
      {showInternationalModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-stone-200 text-center relative space-y-5">
            <button
              onClick={() => setShowInternationalModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <FaTimes size={16} />
            </button>

            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200/60 shadow-sm">
              <span className="text-2xl">✈️</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-serif font-bold text-stone-900">
                International Shipping Not Available
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                We are currently shipping only within India. If you wish to send this order as a gift to family or friends in India, please use an Indian delivery address, pincode, and phone number.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-150 rounded-lg p-3 text-left">
              <p className="text-[11px] text-stone-600 leading-tight font-medium">
                🇮🇳 <strong>Domestic Shipping Requirements:</strong>
                <br />• 10-digit Indian Mobile Number (starts with 6-9)
                <br />• 6-digit Indian Postal Pincode
                <br />• Local State and City within India
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowInternationalModal(false)}
                className="w-full py-2.5 bg-stone-900 hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
              >
                Got It, Change Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
