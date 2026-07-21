import React from "react";
import Link from "next/link";
import { FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";

export const metadata = {
  title: "Disclaimer & Skin Sensitivity Info",
  description: "Read the Disclaimer of Maaz Oud. Learn about fragrance development on different skin chemistries and our skin safety patch testing guidance.",
  alternates: {
    canonical: "/disclaimer"
  },
  openGraph: {
    title: "Disclaimer & Skin Sensitivity Info | Maaz Oud",
    description: "Read the Disclaimer of Maaz Oud. Learn about fragrance development on different skin chemistries and our skin safety patch testing guidance.",
    url: "https://www.maazoud.in/disclaimer",
    siteName: "Maaz Oud",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Disclaimer & Skin Sensitivity Info | Maaz Oud",
    description: "Read the Disclaimer of Maaz Oud. Learn about fragrance development on different skin chemistries and our skin safety patch testing guidance.",
  }
};

export default function DisclaimerPage() {
  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16">
      
      {/* Hero Header */}
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden border-b border-stone-850">
        <div className="absolute inset-0 z-0 bg-[url('/images/oud_banner_2.jpg')] bg-cover bg-center opacity-10 blur-[1px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
          >
            <FaArrowLeft size={10} />
            Back to Catalog
          </Link>
          <h1 id="disclaimer-heading" className="text-3xl md:text-5xl font-serif font-bold tracking-wide">
            Disclaimer
          </h1>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto my-3" />
          <p className="text-xs md:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed font-light">
            Please read this disclaimer carefully before using or purchasing from Maaz Oud.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 mt-12">
        <div className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-8 text-xs text-stone-600 font-light leading-relaxed">
          
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3 text-stone-900">
            <FaExclamationTriangle className="text-[#8c6239]" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">General Disclaimers</h2>
          </div>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">1. Fragrance Notes & Scent Perception</h3>
            <p>
              Fragrances, attars, and perfume oils develop subjectively. How a scent projects and unfolds is influenced by individual skin chemistry, body temperature, diet, and environmental factors:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>A particular attar that smells leathery or sweet on one individual may develop different prominent notes on another.</li>
              <li>We compile detailed lists of top, heart, and base notes for all products to help guide your choices, but actual sensory perception remains personal and subjective.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">2. Skin Sensitivity & Patch Testing</h3>
            <p>
              Our attars are completely alcohol-free and formulated on premium, skin-friendly carrier bases. However, highly concentrated fragrance compounds and aromatic compounds can occasionally trigger irritation on exceptionally sensitive skin types:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>We highly recommend performing a simple <strong>patch test</strong> before regular use. Apply a single droplet of oil to your inner wrist or elbow and monitor the area for 24 hours.</li>
              <li>If any redness, itching, or irritation occurs, discontinue use immediately and wash the skin area gently with soap and water.</li>
              <li>Maaz Oud (operated by Maaz Shakeel) is not responsible for individual skin reactions or allergies resulting from hypersensitivity to perfume formulations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">3. Non-Returnable Personal Care Policy</h3>
            <p>
              Due to strict cosmetics safety and hygiene standards, all our products are non-returnable and non-exchangeable once shipped and delivered. We do not restock returned items to ensure every client receives brand new, sealed bottles. Refer to our Shipping & Returns section for full details.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">4. External Links & Services</h3>
            <p>
              Our site may redirect you to secure third-party platforms (like Razorpay for transactions or Delhivery for courier tracking). We do not assume responsibility for the network connectivity, content, or policies of these external platforms.
            </p>
          </section>

        </div>
      </div>

    </div>
  );
}
