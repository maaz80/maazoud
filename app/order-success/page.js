"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaShoppingBag, FaBoxOpen, FaTruck, FaTimes } from "react-icons/fa";
import Link from "next/link";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "ORD-XXXXXX";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fdf8f3_0%,#f6efe8_45%,#f1e6da_100%)] flex items-center justify-center p-4 sm:p-6 font-sans">
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

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm">
              <FaCheckCircle className="mx-auto mb-2 text-green-600" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-700">Confirmed</p>
            </div>
            {/* <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm">
              <FaBoxOpen className="mx-auto mb-2 text-[#8c6239]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-700">Packed</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm">
              <FaTruck className="mx-auto mb-2 text-[#8c6239]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-700">Delivered</p>
            </div> */}
          </div>

          <div className="mt-6 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-left shadow-sm">
            <p className="text-sm text-stone-600">
              You can close this page anytime and continue shopping from the homepage.
            </p>
          </div>

          <div className="mt-8">
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
