"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaShoppingBag, FaBoxOpen, FaTruck, FaTimes, FaLock } from "react-icons/fa";
import Link from "next/link";
import { useCart } from "../../context/CartContext";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { user, setIsLoginOpen, setIsOrdersOpen } = useCart();

  useEffect(() => {
    // Agar URL me koi valid orderId nahi hai (matlab direct access ki koshish ki gayi hai), 
    // toh user ko wapas home page par bhej do
    if (!orderId) {
      router.push('/');
    }
  }, [orderId, router]);

  if (!orderId) return null; // Jab tak redirect ho, tab tak kuch mat dikhao


  const deliveryDate = (() => {
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 7);
    return delivery.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  })();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fdf8f3_0%,#f6efe8_45%,#f1e6da_100%)] flex items-start md:items-center justify-center p-4 sm:p-6 font-sans mt-2 md:mt-0">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_20px_70px_-25px_rgba(0,0,0,0.35)]">
        <div className="h-1.5 w-full bg-linear-to-r from-[#8c6239] via-[#b98752] to-[#e4b97b]" />

        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Close success page"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition-all hover:border-[#8c6239] hover:text-[#8c6239]"
        >
          <FaTimes size={14} />
        </button>

        <div className="p-8 text-center sm:p-10">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-100">
            <FaCheckCircle size={42} className="text-green-600" />
          </div>

          <div className="space-y-3">
            <span className="block text-[10px] font-bold uppercase tracking-[0.35em] text-[#8c6239]">
              Payment Confirmed
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              Order Placed Successfully!
            </h1>
            <p className="mx-auto max-w-md text-sm leading-6 text-stone-500">
              Your premium attars are being prepared with care. We&apos;ll keep you updated as your order moves forward.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left shadow-sm">
            <div className="flex items-center justify-between gap-3 text-xs md:text-sm">
              <span className="text-stone-500">Order reference</span>
              <span className="font-mono font-semibold text-stone-800">{orderId}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] md:text-xs font-medium uppercase tracking-wide text-stone-500">
              <FaTruck className="text-[#8c6239]" />
              Order will be delivered before {deliveryDate}
            </div>
          </div>

          {/* Guest User: To Track Your Order Login First */}
          {!user ? (
            <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-left shadow-xs space-y-2">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-800 shrink-0 mt-0.5">
                  <FaLock size={14} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Want to track your order in real-time?
                  </h4>
                  <p className="text-xs text-amber-800 font-normal leading-relaxed">
                    To track your order live (courier movement, dispatch status & delivery hub), please login first with your mobile number.
                  </p>
                </div>
              </div>
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#8c6239] hover:bg-stone-900 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-xs"
                >
                  Login First to Track Order &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Live Tracking Active</span>
                <span className="text-xs font-semibold text-stone-800">You can track your order live in My Orders</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOrdersOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#8c6239] hover:bg-stone-900 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-xs"
              >
                Track Order &rarr;
              </button>
            </div>
          )}

          <div className="mt-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-white transition-all hover:bg-[#8c6239]"
            >
              <FaShoppingBag size={12} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <span className="text-xs uppercase tracking-widest text-stone-400 animate-pulse">Loading Order details...</span>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
