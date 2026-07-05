"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle, FaShoppingBag } from "react-icons/fa";
import Link from "next/link";

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "ORD-XXXXXX";
  const [countdown, setCountdown] = useState(3);

  // 1. Tick the countdown every second
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 2. Perform redirect side-effect when countdown reaches 0 to avoid React lifecycle updates warning
  useEffect(() => {
    if (countdown === 0) {
      router.push("/");
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-lg border border-stone-200 p-8 text-center shadow-lg space-y-6">

        {/* Animated Check Icon */}
        <div className="flex justify-center">
          <div className="relative flex items-center justify-center">
            {/* outer glowing pulse ring */}
            <span className="absolute inline-flex h-16 w-16 rounded-full bg-green-100 animate-ping opacity-75" />
            <div className="relative w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
              <FaCheckCircle size={36} className="animate-bounce" />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#8c6239] block">
            Thank you for shopping
          </span>
          <h1 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="text-xs text-stone-400 font-light leading-relaxed max-w-xs mx-auto">
            Your premium attars are packed with extreme purity. Order reference: <strong className="font-mono text-stone-800">{orderId}</strong>
          </p>
        </div>

        {/* Flipkart style Countdown Tracker */}
        <div className="p-4 bg-stone-50 rounded border border-stone-150/50 text-black">
          <p className="text-xs font-semibold">
            Redirecting to homepage in <span className="text-lg font-black text-[#8c6239] font-mono">{countdown}</span> seconds...
          </p>
          <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden mt-3 max-w-50 mx-auto">
            <div
              className="bg-[#8c6239] h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-[#8c6239] text-white text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm"
          >
            <FaShoppingBag size={10} />
            Go to Homepage Now
          </Link>
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
