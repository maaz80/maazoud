import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import BlogsSection from "../../components/BlogsSection";
import ContactFormClient from "./ContactFormClient";
import { supabase } from "../../utils/supabase";

export default async function ContactPage() {
  let initialBlogs = [];
  try {
    const { data } = await supabase
      .from("blogs")
      .select("id, title, image, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) initialBlogs = data;
  } catch (e) {
    console.error("Error fetching blogs for contact page:", e);
  }

  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16">
      
      {/* Hero Header */}
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden border-b border-stone-850">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/oud_banner_2.jpg" 
            alt="Contact Our Team Banner" 
            fill
            priority
            fetchPriority="high"
            className="w-full h-full object-cover opacity-20 blur-[1px]"
          />
        </div>
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
            <span className="text-[10px] uppercase font-bold text-[#d4b28c] tracking-widest block">Direct Support & Consultations</span>
            <p className="text-xs leading-relaxed font-light">
              Are you looking for custom attar bottles, wedding gifting hampers, or bulk requirements? Or are you facing any issues with your order, payment, or delivery?
            </p>
            <p className="text-xs leading-relaxed font-light">
              Contact Maaz Shakeel directly at our phone number or drop an email for immediate assistance and personalized consulting.
            </p>
          </div>
        </div>

        {/* Right 3 Cols: Message form */}
        <ContactFormClient />

      </div>

      {/* Blogs Section */}
      <BlogsSection initialBlogs={initialBlogs} />

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
              <details key={idx} className="group border border-stone-200 rounded-md overflow-hidden bg-stone-50/50">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-xs md:text-sm text-stone-850 hover:bg-stone-50 list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="text-stone-500 transition-transform duration-200 group-open:rotate-180">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="p-4 text-xs md:text-sm text-stone-600 font-light leading-relaxed border-t border-neutral-200 bg-white">
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
