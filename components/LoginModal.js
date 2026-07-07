"use client";

import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import Image from "next/image";
import { useCart } from "../context/CartContext";

export default function LoginModal() {
  const { isLoginOpen, setIsLoginOpen, sendOtp, verifyOtp } = useCart();
  
  const [step, setStep] = useState("email"); // "email" or "otp"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Reset modal state to email step on close/open toggle
  useEffect(() => {
    if (!isLoginOpen) {
      setStep("email");
      setEmail("");
      setOtp("");
      setError("");
      setSuccessMsg("");
    }
  }, [isLoginOpen]);

  if (!isLoginOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await sendOtp(email.trim());
      setSuccessMsg(`OTP sent successfully to ${email}`);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Failed to send OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError("");
    try {
      await verifyOtp(email.trim(), otp.trim());
      // Reset state and close modal
      setStep("email");
      setEmail("");
      setOtp("");
      setIsLoginOpen(false);
    } catch (err) {
      setError(err.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setError("");
    setSuccessMsg("");
    setOtp("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsLoginOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-lg max-w-sm w-full shadow-xl overflow-hidden z-10 border border-stone-200 p-6 space-y-6">
        
        {/* Close Button */}
        <button 
          onClick={() => setIsLoginOpen(false)}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
          aria-label="Close login modal"
        >
          <FiX size={20} />
        </button>

        {/* Heading */}
        <div className="text-center space-y-2">
          <Image 
            src="/maazoud-logo-no-bg.webp" 
            alt="Maaz Oud Logo" 
            width={56}
            height={56}
            quality={60}
            className="h-14 mx-auto w-14 object-contain"
          />
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest pt-2">
            Welcome to Maaz Oud
          </h2>
          <p className="text-[10px] text-stone-400 font-light uppercase tracking-wider">
            {step === "email" ? "Sign in / Sign up to start" : "Enter Verification Code"}
          </p>
        </div>

        {/* Errors / Success Alerts */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100 font-light leading-normal text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-green-50 text-green-700 text-xs rounded border border-green-100 font-light leading-normal text-center">
            {successMsg}
          </div>
        )}

        {/* Step 1: Email Form */}
        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-md py-2.5 px-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] text-xs"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-md py-2.5 px-3 text-stone-900 placeholder-stone-400 focus:outline-none tracking-[0.5em] text-center font-bold text-sm focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239]"
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code & Login"}
            </button>

            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider pt-2">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-stone-400 hover:text-black transition-colors cursor-pointer"
                disabled={loading}
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-[#8c6239] hover:text-[#5c3e21] transition-colors cursor-pointer"
                disabled={loading}
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* <p className="text-[9px] text-center text-stone-400 leading-relaxed pt-2 border-t border-stone-100 uppercase tracking-wider">
          Authentication is fully connected to Supabase passwordless auth.
        </p> */}

      </div>
    </div>
  );
}
