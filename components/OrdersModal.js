"use client";

import React, { useState } from "react";
import { 
  FaTimes, 
  FaBoxOpen, 
  FaTruck, 
  FaLock, 
  FaChevronDown, 
  FaChevronUp, 
  FaSyncAlt, 
  FaMapMarkerAlt,
  FaCheck
} from "react-icons/fa";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { getOptimizedImageUrl, supabaseLoader } from "../utils/imageHelper";

function FlipkartTrackingTimeline({ order }) {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState(null);

  const fetchTracking = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/track?orderId=${encodeURIComponent(order.id)}`);
      const data = await res.json();
      if (data.success) {
        setTrackingData(data);
      } else {
        setError(data.error || "Unable to fetch live tracking details");
      }
    } catch (e) {
      setError("Network error fetching live tracking");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded && !trackingData) {
      fetchTracking();
    }
    setIsExpanded(!isExpanded);
  };

  const status = String(order.status || '').toLowerCase();
  const isCancelled = status === 'cancelled';
  const isDelivered = status === 'delivered' || (trackingData && trackingData.status === 'Delivered');
  const isOutForDelivery = trackingData?.currentStatusText?.toLowerCase().includes('out for delivery') || isDelivered;
  const isShipped = status === 'shipped' || isOutForDelivery || isDelivered;

  const shipmentDetails = typeof order?.shipment_details === 'string'
    ? (() => { try { return JSON.parse(order.shipment_details); } catch(e) { return {}; } })()
    : (order?.shipment_details || {});

  const awb = shipmentDetails.zipypost_awb || shipmentDetails.awb || order.shiprocket_awb;
  const courier = shipmentDetails.zipypost_courier_name || order.shiprocket_courier_name || (shipmentDetails.carrier === 'zipypost' ? 'ZipyPost Partner' : 'Courier Partner');

  const step1Done = true;
  const step2Done = isShipped;
  const step3Done = isOutForDelivery;
  const step4Done = isDelivered;

  return (
    <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-4 space-y-3 font-sans shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-150 pb-2.5">
        <div className="flex items-center gap-1.5">
          <FaTruck className="text-[#8c6239]" size={13} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-800">
            Order Tracking Status
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#8c6239] hover:text-stone-900 transition-colors cursor-pointer bg-[#8c6239]/10 hover:bg-[#8c6239]/20 px-2.5 py-1 rounded"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <FaSyncAlt className="animate-spin" size={10} /> Fetching Scans...
            </span>
          ) : isExpanded ? (
            <span className="flex items-center gap-1">
              Hide Scans <FaChevronUp size={9} />
            </span>
          ) : (
            <span className="flex items-center gap-1">
              Live Scans & Timeline <FaChevronDown size={9} />
            </span>
          )}
        </button>
      </div>

      {/* Flipkart 4-Step Stepper */}
      <div className="pt-2 pb-1 relative">
        {/* Background Connecting Line Track (Centered at circle height: 20px) */}
        <div className="absolute top-[20px] left-[12.5%] right-[12.5%] h-1 bg-stone-200 -translate-y-1/2 z-0 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-600 transition-all duration-300 rounded-full"
            style={{
              width: isCancelled 
                ? (step3Done ? '66.6%' : step2Done ? '33.3%' : '0%') 
                : (step4Done ? '100%' : step3Done ? '66.6%' : step2Done ? '33.3%' : '0%')
            }}
          />
        </div>

        {/* 4 Steps Row: items-start keeps all circles perfectly leveled at top */}
        <div className="flex items-start justify-between relative z-1">
          {/* Step 1: Confirmed */}
          <div className="flex flex-col items-center text-center flex-1 min-w-0 px-0.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-4 ring-white transition-all shadow-xs ${
              step1Done ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              <FaCheck size={9} />
            </div>
            <span className="text-[10px] font-bold text-stone-800 mt-1.5 leading-tight block">Confirmed</span>
            <span className="text-[9px] text-stone-400 block font-light leading-tight mt-0.5">Order verified</span>
          </div>

          {/* Step 2: Shipped */}
          <div className="flex flex-col items-center text-center flex-1 min-w-0 px-0.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-4 ring-white transition-all shadow-xs ${
              step2Done ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              {step2Done ? <FaCheck size={9} /> : '2'}
            </div>
            <span className="text-[10px] font-bold text-stone-800 mt-1.5 leading-tight block">Shipped</span>
            <span className="text-[9px] text-stone-400 block font-light leading-tight mt-0.5 truncate max-w-[85px]" title={courier}>
              {step2Done ? courier : 'Preparing'}
            </span>
          </div>

          {/* Step 3: Out for Delivery */}
          <div className="flex flex-col items-center text-center flex-1 min-w-0 px-0.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-4 ring-white transition-all shadow-xs ${
              step3Done ? 'bg-green-600 text-white' : 'bg-stone-200 text-stone-500'
            }`}>
              {step3Done ? <FaCheck size={9} /> : '3'}
            </div>
            <span className="text-[10px] font-bold text-stone-800 mt-1.5 leading-tight block">
              Out for Delivery
            </span>
            <span className="text-[9px] text-stone-400 block font-light leading-tight mt-0.5">Local hub</span>
          </div>

          {/* Step 4: Delivered */}
          <div className="flex flex-col items-center text-center flex-1 min-w-0 px-0.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-4 ring-white transition-all shadow-xs ${
              isCancelled 
                ? 'bg-rose-600 text-white' 
                : step4Done 
                  ? 'bg-green-600 text-white' 
                  : 'bg-stone-200 text-stone-500'
            }`}>
              {isCancelled ? '✕' : step4Done ? <FaCheck size={9} /> : '4'}
            </div>
            <span className="text-[10px] font-bold text-stone-800 mt-1.5 leading-tight block">
              {isCancelled ? 'Cancelled' : 'Delivered'}
            </span>
            <span className="text-[9px] text-stone-400 block font-light leading-tight mt-0.5">
              {isCancelled ? 'Cancelled' : step4Done ? 'Completed' : 'Final Step'}
            </span>
          </div>
        </div>
      </div>

      {/* Courier & AWB Badge */}
      {awb && (
        <div className="bg-stone-50 border border-stone-200 rounded px-2.5 py-1.5 flex flex-wrap items-center justify-between text-[11px] gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="text-stone-500 font-medium">Carrier:</span>
            <span className="font-bold text-stone-850">{courier}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500 font-medium">Tracking / AWB:</span>
            <span className="font-mono font-bold text-[#8c6239]">{awb}</span>
          </div>
        </div>
      )}

      {/* Expandable Live Tracking Timeline (Flipkart style scans) */}
      {isExpanded && (
        <div className="border-t border-stone-150 pt-3 space-y-2.5">
          {loading && !trackingData && (
            <div className="py-4 text-center text-xs text-stone-400 space-y-1">
              <FaSyncAlt className="animate-spin mx-auto text-[#8c6239]" size={16} />
              <p>Fetching real-time scans from courier network...</p>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchTracking}
                className="underline font-bold text-[10px] uppercase cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {trackingData && (
            <div className="space-y-3">
              {/* Current Status Highlight */}
              <div className="bg-green-50 border border-green-200 p-2.5 rounded text-xs flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-green-800 block">Current Location & Status</span>
                  <span className="font-bold text-green-950 text-sm">
                    {trackingData.currentStatusText || order.status}
                  </span>
                  {trackingData.currentLocation && (
                    <span className="text-[10px] text-green-700 block mt-0.5 flex items-center gap-1">
                      <FaMapMarkerAlt size={9} /> {trackingData.currentLocation}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase text-green-800 block">Expected By</span>
                  <span className="font-bold text-green-950 text-xs">
                    {trackingData.expectedDelivery}
                  </span>
                </div>
              </div>

              {/* Scans Checkpoints List */}
              {trackingData.scans && trackingData.scans.length > 0 ? (
                <div className="space-y-0 pl-1 pt-1">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block mb-2">
                    Live Checkpoint Timeline
                  </span>
                  <div className="border-l-2 border-green-500 pl-3.5 space-y-3 py-1">
                    {trackingData.scans.map((scan, sIdx) => (
                      <div key={sIdx} className="relative text-xs">
                        <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-green-600 ring-4 ring-green-100" />
                        <div className="space-y-0.5">
                          <p className="font-bold text-stone-850 leading-snug">{scan.activity}</p>
                          <p className="text-[10px] text-stone-400 font-light flex items-center gap-2">
                            {scan.location && <span>📍 {scan.location}</span>}
                            {scan.date && <span>📅 {scan.date} {scan.time || ''}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded border border-stone-200 text-center text-xs text-stone-500">
                  <p className="font-medium">Shipment registered with courier.</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Live tracking scans will update as soon as the courier picks up the package from warehouse.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrdersModal() {
  const { orders, isOrdersOpen, setIsOrdersOpen, user, setIsLoginOpen } = useCart();

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
          {/* Guest User: To Track Your Order Login First */}
          {!user && (
            <div className="mb-4 bg-amber-50/90 border border-amber-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <FaLock className="text-amber-700 shrink-0" size={13} />
                <span className="text-amber-900 font-medium">
                  To track your order live like Flipkart and get instant delivery updates, please login first.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOrdersOpen(false);
                  setIsLoginOpen(true);
                }}
                className="bg-[#8c6239] hover:bg-stone-900 text-white px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[10px] shrink-0 transition-all cursor-pointer shadow-xs"
              >
                Login First &rarr;
              </button>
            </div>
          )}

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
                            loader={supabaseLoader}
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

                  {/* Flipkart Live Tracking Stepper & Scans */}
                  <FlipkartTrackingTimeline order={order} />

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
