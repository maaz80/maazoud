"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext";
import { useRouter } from "next/navigation";
import { supabase } from "../../utils/supabase";
import { FiSave, FiUser, FiMapPin, FiPhone, FiCheckCircle } from "react-icons/fi";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ProfilePage() {
  const { user } = useCart();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let timeoutId;
    if (user) {
      fetchProfile();
    } else {
      // If no user is found, wait a moment for auth to initialize. 
      // If still no user, redirect to home.
      timeoutId = setTimeout(() => {
        router.push('/');
      }, 1500);
    }
    return () => clearTimeout(timeoutId);
  }, [user, router]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (data) {
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || ""
        });
      }
    } catch (err) {
      console.log("No existing profile found or error fetching.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    
    try {
      const { error } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          ...formData,
          updated_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      setMessage("Profile details saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-600 font-sans">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      {/* <Navbar /> */}
      
      <main className="flex-grow py-5 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-xl shadow-stone-200/50 rounded-2xl overflow-hidden border border-stone-100">
            {/* Header */}
            <div className="bg-[#8c6239] px-3 py-3 md:py-8 sm:px-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4 border border-white/30">
                  <FiUser className="text-white text-2xl" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-wide">My Profile</h1>
                <p className="text-white/80 text-sm mt-1">Manage your personal details and shipping address</p>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-8 sm:px-10">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-stone-200 border-t-[#8c6239] rounded-full animate-spin"></div>
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-6">
                  
                  {message && (
                    <div className={`p-4 rounded-md flex items-center gap-3 text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                      {message.includes('success') && <FiCheckCircle size={18} />}
                      {message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Details */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 border-b border-stone-100 pb-2 flex items-center gap-2">
                        <FiUser /> Personal Info
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c6239]/20 focus:border-[#8c6239] transition-all placeholder:text-gray-400 text-neutral-900" placeholder="Enter your full name" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Phone Number</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c6239]/20 focus:border-[#8c6239] transition-all placeholder:text-gray-400 text-neutral-900" placeholder="Enter 10-digit phone number" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                        <input type="email" value={user?.email || ""} disabled className="w-full bg-stone-100 border border-stone-200 rounded-lg py-2.5 px-4 text-sm text-stone-500 cursor-not-allowed" />
                        <p className="text-[10px] text-stone-400 mt-1">Email cannot be changed.</p>
                      </div>
                    </div>

                    {/* Shipping Details */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 border-b border-stone-100 pb-2 flex items-center gap-2">
                        <FiMapPin /> Default Shipping Address
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">Street Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} required rows="2" className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c6239]/20 focus:border-[#8c6239] transition-all placeholder:text-gray-400 text-neutral-900" placeholder="House/Flat No., Building Name, Street"></textarea>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">City</label>
                          <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c6239]/20 focus:border-[#8c6239] transition-all placeholder:text-gray-400 text-neutral-900" placeholder="City" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode</label>
                          <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c6239]/20 focus:border-[#8c6239] transition-all placeholder:text-gray-400 text-neutral-900" placeholder="Pincode" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">State</label>
                        <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full bg-stone-50 border border-stone-200 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8c6239]/20 focus:border-[#8c6239] transition-all placeholder:text-gray-400 text-neutral-900" placeholder="State" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-100 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="bg-[#8c6239] text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-[#7a5531] transition-colors flex items-center gap-2 shadow-lg shadow-[#8c6239]/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave size={16} /> Save Details
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
