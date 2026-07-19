"use client";

import React from "react";
import { FaTimes, FaBoxOpen } from "react-icons/fa";
import Image from "next/image";
import { useCart } from "../context/CartContext";

export default function OrdersModal() {
  const { orders, isOrdersOpen, setIsOrdersOpen } = useCart();

  if (!isOrdersOpen) return null;

  // Helper selectors to support both legacy and Supabase schemas safely
  const getOrderDate = (order) => {
    if (order.created_at) {
      return new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
    return order.date || "N/A";
  };

  const getDeliveryDate = (order) => {
    const baseDate = order.created_at ? new Date(order.created_at) : new Date();
    if (Number.isNaN(baseDate.getTime())) {
      return new Date();
    }
    const deliveryDate = new Date(baseDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);
    return deliveryDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getOrderAddress = (order) => {
    if (order.address) return order.address;
    if (order.shippingAddress) return order.shippingAddress;
    return `${order.city || ""}, ${order.state || ""} - ${order.pincode || ""}`.trim() || "N/A";
  };

  const getOrderTotal = (order) => {
    return order.total_amount !== undefined ? order.total_amount : (order.total || 0);
  };

  const getOrderBillDetails = (order) => {
    const items = order.items || [];
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const totalAmount = getOrderTotal(order);
    
    // Check if COD
    const isCod = String(order.payment_method || "").toLowerCase().includes("cod");
    
    // Delivery charge is normally 40 if subtotal > 0
    const deliveryCharge = subtotal > 0 ? 40 : 0;
    
    // COD fee is 30 if COD
    const codFee = isCod ? 30 : 0;
    
    return {
      subtotal,
      deliveryCharge,
      codFee,
      isCod,
      totalAmount
    };
  };

  const getStatusBadgeStyles = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "delivered") return "bg-green-100 text-green-800 border border-green-200/55";
    if (s === "shipped") return "bg-blue-100 text-blue-800 border border-blue-200/55";
    if (s === "cancelled") return "bg-red-100 text-red-800 border border-red-200/55";
    return "bg-yellow-100 text-yellow-800 border border-yellow-200/55";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOrdersOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-lg max-w-2xl w-full shadow-xl overflow-hidden z-10 border border-stone-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900 uppercase tracking-wider">
            My Orders
          </h2>
          <button
            onClick={() => setIsOrdersOpen(false)}
            className="p-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            aria-label="Close orders modal"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {orders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <FaBoxOpen className="text-stone-300" size={48} />
              <p className="text-stone-500 font-light text-sm">
                You haven't placed any orders yet.
              </p>
              <button
                onClick={() => setIsOrdersOpen(false)}
                className="px-6 py-2 bg-black text-white hover:bg-[#8c6239] text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-stone-200 rounded-md p-4 bg-stone-50 hover:bg-stone-100/50 transition-all space-y-4"
                >
                  {/* Order Details Header */}
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-200 pb-3">
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        {order.id}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        Placed on {getOrderDate(order)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${getStatusBadgeStyles(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items && order.items.map((item, idx) => (
                      <div key={item.cartItemId || idx} className="flex justify-between items-center gap-2 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Image
                            src={item.product?.image || "/images/placeholder.jpg"}
                            alt={item.product?.name || "Oud Product"}
                            width={40}
                            height={48}
                            className="w-10 h-12 object-cover rounded bg-white border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-stone-900 block truncate" title={item.product?.name}>
                              {item.product?.name || "Attar Scent"}
                            </span>
                            <span className="text-[10px] text-stone-400 block mt-0.5">
                              Qty: {item.quantity} &bull; Size: {item.selectedSize || "3ml"}
                            </span>
                          </div>
                        </div>
                        <span className="ml-2 text-right font-bold text-stone-900 shrink-0">
                          Rs. {item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Total & Info */}
                  <div className="border-t border-stone-200 pt-3 flex flex-col md:flex-row justify-between items-start gap-4 text-xs">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase tracking-wider mb-0.5">
                          Shipping Address
                        </span>
                        <span className="block font-light text-stone-600 wrap-break-word">
                          {getOrderAddress(order)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase tracking-wider mb-0.5">
                          Payment Method
                        </span>
                        <span className="block font-medium text-stone-700">
                          {order.payment_method && order.payment_method.toLowerCase().includes("cod") ? "Cash on Delivery (COD)" : "Prepaid Online"}
                        </span>
                      </div>
                      {String(order.status || "").toLowerCase() !== "cancelled" && String(order.status || "").toLowerCase() !== "delivered" && (
                        <span className="text-[10px] text-[#8c6239] font-semibold block pt-1">
                          Order will be delivered before {getDeliveryDate(order)}
                        </span>
                      )}
                    </div>

                    <div className="w-full md:w-56 bg-stone-100/60 rounded p-3 border border-stone-200/50 space-y-1.5 shrink-0">
                      {(() => {
                        const bill = getOrderBillDetails(order);
                        return (
                          <>
                            <div className="flex justify-between text-[11px] text-stone-500">
                              <span>Items Subtotal</span>
                              <span className="font-semibold text-stone-800">Rs. {bill.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-stone-500">
                              <span>Delivery Charge</span>
                              <span className="font-semibold text-stone-800">Rs. {bill.deliveryCharge}</span>
                            </div>
                            {bill.isCod && (
                              <div className="flex justify-between text-[11px] text-stone-500">
                                <span>COD Fee</span>
                                <span className="font-semibold text-stone-800">Rs. 30</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-bold border-t border-stone-200 pt-1.5 text-stone-900">
                              <span>Total Amount</span>
                              <span className="text-[#8c6239]">Rs. {bill.totalAmount}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 text-right">
          <button
            onClick={() => setIsOrdersOpen(false)}
            className="px-5 py-2 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
