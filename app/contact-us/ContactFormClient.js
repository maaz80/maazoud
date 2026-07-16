"use client";

import React, { useState } from "react";

export default function ContactFormClient() {
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
  );
}
