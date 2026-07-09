"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import BlogsSection from "../../components/BlogsSection";

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [status, setStatus] = useState(null); // "loading" | "success" | "error"
  const [errMsg, setErrMsg] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.email.trim() || !formState.message.trim()) {
      setStatus("error");
      setErrMsg("Please fill in all required fields marked with *.");
      return;
    }

    setStatus("loading");
    setErrMsg("");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          access_key: "db99f393-fc9a-4693-a3cf-457afee77c59",
          name: formState.name.trim(),
          email: formState.email.trim(),
          subject: formState.subject.trim() || "New Contact Form Message - Maaz Oud",
          message: formState.message.trim()
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setStatus("success");
        setFormState({ name: "", email: "", subject: "", message: "" });
      } else {
        setStatus("error");
        setErrMsg(resData.message || "Failed to submit form. Please check your credentials.");
      }
    } catch (err) {
      console.error("Web3Forms submission error:", err);
      setStatus("error");
      setErrMsg("Failed to connect to the email server. Please check your network connection.");
    }
  };

  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16">
      
      {/* Hero Header */}
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden border-b border-stone-850">
        <div className="absolute inset-0 z-0 bg-[url('/images/oud_banner_2.jpg')] bg-cover bg-center opacity-20 blur-[1px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
          >
            <FaArrowLeft size={10} />
            Back to Catalog
          </Link>
          <h1 id="contact-heading" className="text-3xl md:text-5xl font-serif font-bold tracking-wide">
            Contact Our Team
          </h1>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto my-3" />
          <p className="text-xs md:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed font-light">
            We are here to assist you with order inquiries, product sizing advice, or customized bulk requests.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-5xl mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Left 2 Cols: Contact Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-stone-200 p-6 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-100 pb-3">
              Direct Contact Details
            </h2>

            <ul className="space-y-6 text-xs text-stone-600 font-light">
              <li className="flex items-start gap-3">
                <div className="p-2 bg-stone-50 border border-stone-150 rounded text-[#8c6239] mt-0.5">
                  <FaMapMarkerAlt size={14} />
                </div>
                <div>
                  <span className="font-bold text-stone-900 block mb-0.5">Physical Address</span>
                  <span>Sabzi Mandi, Station Road, Jaunpur, Uttar Pradesh - 222001, India</span>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="p-2 bg-stone-50 border border-stone-150 rounded text-[#8c6239] mt-0.5">
                  <FaPhoneAlt size={14} />
                </div>
                <div>
                  <span className="font-bold text-stone-900 block mb-0.5">Phone Number</span>
                  <a href="tel:+919616584237" className="hover:text-[#8c6239] transition-colors font-mono font-medium">+91 96165 84237</a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="p-2 bg-stone-50 border border-stone-150 rounded text-[#8c6239] mt-0.5">
                  <FaEnvelope size={14} />
                </div>
                <div>
                  <span className="font-bold text-stone-900 block mb-0.5">Email Support</span>
                  <a href="mailto:maazoudofficial@gmail.com" className="hover:text-[#8c6239] transition-colors font-medium">maazoudofficial@gmail.com</a>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="p-2 bg-stone-50 border border-stone-150 rounded text-[#8c6239] mt-0.5">
                  <FaClock size={14} />
                </div>
                <div>
                  <span className="font-bold text-stone-900 block mb-0.5">Working Hours</span>
                  <span>Monday - Saturday: 10:00 AM to 07:00 PM IST<br />Sunday: Closed</span>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-stone-900 text-stone-300 p-6 rounded-lg shadow-sm border border-stone-850 space-y-3">
            <span className="text-[10px] uppercase font-bold text-[#8c6239] tracking-widest block">Direct Support & Consultations</span>
            <p className="text-xs leading-relaxed font-light">
              Are you looking for custom attar bottles, wedding gifting hampers, or bulk requirements? Or are you facing any issues with your order, payment, or delivery?
            </p>
            <p className="text-xs leading-relaxed font-light">
              Contact Maaz Shakeel directly at our phone number or drop an email for immediate assistance and personalized consulting.
            </p>
          </div>
        </div>

        {/* Right 3 Cols: Message form */}
        <div className="md:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#8c6239] border-b border-stone-100 pb-3">
              Send Us A Message
            </h2>

            {/* Status alerts */}
            {status === "success" && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded font-light text-center leading-normal">
                Thank you! Your inquiry has been submitted successfully. We will review your message and reach out to you shortly.
              </div>
            )}
            {status === "error" && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded font-light text-center leading-normal">
                {errMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">Your Name *</label>
                <input 
                  type="text" 
                  name="name"
                  id="contact-name"
                  required 
                  value={formState.name}
                  onChange={handleInputChange}
                  disabled={status === "loading"}
                  placeholder="e.g. John Doe"
                  className="w-full bg-stone-50 border border-stone-200 rounded p-3 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none placeholder-stone-400"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">Email Address *</label>
                <input 
                  type="email" 
                  name="email"
                  id="contact-email"
                  required 
                  value={formState.email}
                  onChange={handleInputChange}
                  disabled={status === "loading"}
                  placeholder="e.g. customer@example.com"
                  className="w-full bg-stone-50 border border-stone-200 rounded p-3 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none placeholder-stone-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">Subject</label>
              <input 
                type="text" 
                name="subject"
                id="contact-subject"
                value={formState.subject}
                onChange={handleInputChange}
                disabled={status === "loading"}
                placeholder="How can we help you?"
                className="w-full bg-stone-50 border border-stone-200 rounded p-3 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">Message Details *</label>
              <textarea 
                rows={5}
                name="message"
                id="contact-message"
                required
                value={formState.message}
                onChange={handleInputChange}
                disabled={status === "loading"}
                placeholder="Write your detailed query or consultation requirements here..."
                className="w-full bg-stone-50 border border-stone-200 rounded p-3 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none placeholder-stone-400"
              />
            </div>

            <button 
              type="submit" 
              id="contact-submit-btn"
              disabled={status === "loading"}
              className="w-full py-3 bg-stone-950 hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-widest rounded transition-all cursor-pointer shadow disabled:opacity-40"
            >
              {status === "loading" ? "Submitting Inquiry..." : "Submit Inquiry"}
            </button>
          </form>
        </div>

      </div>

      {/* Blogs Section */}
      <BlogsSection />

      {/* FAQ Section */}
      <div className="max-w-5xl mx-auto px-4 mt-16">
        <div className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-100 pb-3 text-center">
            Contact & Support FAQs
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What is the typical response time for support inquiries?",
                a: "We review and respond to all email and contact form submissions within 24 business hours (Monday to Saturday, 10:00 AM to 07:00 PM IST). For urgent inquiries, please contact us directly via phone."
              },
              {
                q: "Can I track my order status?",
                a: "Yes! Once your order is dispatched, you will receive a tracking link via email. You can also track your orders dynamically by clicking on the 'My Orders' package icon in the navbar."
              },
              {
                q: "Do you offer custom gifting packages or wedding hampers?",
                a: "Yes, we curate custom premium gifting options for corporate events, weddings, and special celebrations. Contact us directly with your volume and packaging requirements for a personalized catalog."
              },
              {
                q: "Do you offer wholesale prices for bulk retail orders?",
                a: "Yes, we support bulk distribution and retail partnerships. Write to us at maazoudofficial@gmail.com with your store details and product list for wholesale volume pricing."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group border border-stone-150 rounded-md overflow-hidden bg-stone-50/50">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-xs md:text-sm text-stone-800 hover:bg-stone-50 list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="text-stone-500 transition-transform duration-200 group-open:rotate-180">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="p-4 text-xs md:text-sm text-stone-600 font-light leading-relaxed border-t border-stone-150 bg-white">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is the typical response time for support inquiries?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We review and respond to all email and contact form submissions within 24 business hours (Monday to Saturday, 10:00 AM to 07:00 PM IST). For urgent inquiries, please contact us directly via phone."
                }
              },
              {
                "@type": "Question",
                "name": "Can I track my order status?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Once your order is dispatched, you will receive a tracking link via email. You can also track your orders dynamically by clicking on the 'My Orders' package icon in the navbar."
                }
              },
              {
                "@type": "Question",
                "name": "Do you offer custom gifting packages or wedding hampers?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, we curate custom premium gifting options for corporate events, weddings, and special celebrations. Contact us directly with your volume and packaging requirements for a personalized catalog."
                }
              },
              {
                "@type": "Question",
                "name": "Do you offer wholesale prices for bulk retail orders?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, we support bulk distribution and retail partnerships. Write to us at maazoudofficial@gmail.com with your store details and product list for wholesale volume pricing."
                }
              }
            ]
          })
        }}
      />

    </div>
  );
}
