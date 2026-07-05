import React from "react";
import Link from "next/link";
import { FaArrowLeft, FaTruck, FaUndo } from "react-icons/fa";
import BlogsSection from "../../components/BlogsSection";

export const metadata = {
  title: "Shipping & Returns Policy | Hassle-Free Delivery",
  description: "Read the shipping rates, dispatch timelines, non-returnable personal care policies, and damaged items replacement process at Maaz Oud.",
  alternates: {
    canonical: "/shipping-policy"
  },
  openGraph: {
    title: "Shipping & Returns Policy | Hassle-Free Delivery | Maaz Oud",
    description: "Read the shipping rates, dispatch timelines, non-returnable personal care policies, and damaged items replacement process at Maaz Oud.",
    url: "https://maazoud.in/shipping-policy",
    siteName: "Maaz Oud",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Shipping & Returns Policy | Hassle-Free Delivery | Maaz Oud",
    description: "Read the shipping rates, dispatch timelines, non-returnable personal care policies, and damaged items replacement process at Maaz Oud.",
  }
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16">
      
      {/* Hero Header */}
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden border-b border-stone-850">
        <div className="absolute inset-0 z-0 bg-[url('/images/oud_banner_1.jpg')] bg-cover bg-center opacity-10 blur-[1px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
          >
            <FaArrowLeft size={10} />
            Back to Catalog
          </Link>
          <h1 id="shipping-heading" className="text-3xl md:text-5xl font-serif font-bold tracking-wide">
            Shipping & Returns
          </h1>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto my-3" />
          <p className="text-xs md:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed font-light">
            Details regarding delivery timelines, packing, and our product return policies.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 mt-12 grid grid-cols-1 gap-8">
        
        {/* Shipping details */}
        <section className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3 text-stone-900">
            <FaTruck className="text-[#8c6239]" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Shipping Policy</h2>
          </div>
          
          <div className="text-xs text-stone-600 font-light leading-relaxed space-y-4">
            <p>
              We process and pack orders within <strong>24 to 48 hours</strong> of purchase confirmations. Since our oils are highly premium and bottled fresh, we pay maximum care to secure cushion wrapping to avoid transit damage.
            </p>
            <ul className="list-disc pl-4 space-y-2">
              <li><strong>Domestic Shipping (India):</strong> We ship across India through standard logistics partners (e.g. BlueDart, Delhivery, Speed Post).</li>
              <li><strong>Delivery Timelines:</strong> Standard shipping takes approximately <strong>3 to 7 working days</strong> to reach most cities. Remote areas may experience slightly longer delivery times.</li>
              <li><strong>Shipping Charge:</strong> Standard delivery charge of Rs. 50 is applicable on checkout.</li>
            </ul>
          </div>
        </section>

        {/* Returns details */}
        <section className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3 text-stone-900">
            <FaUndo className="text-red-500" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Returns & Exchange Policy</h2>
          </div>
          
          <div className="text-xs text-stone-600 font-light leading-relaxed space-y-4">
            <div className="p-4 bg-red-50 border border-red-150 rounded text-red-800 font-medium">
              Important: All products sold on Maaz Oud are non-returnable, non-exchangeable, and non-refundable.
            </div>
            <p>
              Due to the hygienic nature of perfume oils, attars, and aged Oud distillations, <strong>we do not accept returns or exchanges</strong> under any circumstances. Once an item is dispatched and delivered, its seal and hygiene integrity cannot be verified, making it ineligible for return to our inventory.
            </p>
            <p>
              In the rare event that your product is received damaged or leaked during transit, please email us within <strong>24 hours</strong> of delivery at <a href="mailto:maazoudofficial@gmail.com" className="text-[#8c6239] hover:underline font-medium">maazoudofficial@gmail.com</a> with an unboxing video or photographs of the damage, and we will arrange a replacement bottle.
            </p>
          </div>
        </section>

        {/* Blogs Section */}
        <BlogsSection />

        {/* FAQ Section */}
        <section className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-100 pb-3">
            Shipping & Returns FAQs
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What are the shipping charges for orders in India?",
                a: "We charge a flat shipping fee of Rs. 50 on checkout for standard delivery across India."
              },
              {
                q: "How long does it take for my order to be delivered?",
                a: "Standard delivery takes approximately 3 to 7 working days to reach most cities across India. Orders are processed and dispatched within 24 to 48 hours."
              },
              {
                q: "Why are fragrance items non-returnable?",
                a: "Due to hygiene standards and to guarantee the absolute purity of our concentrated attars, we cannot accept returns or exchanges once the fragrance bottles have been delivered."
              },
              {
                q: "What should I do if my attar bottle is damaged or leaks during transit?",
                a: "If you receive a damaged or leaking bottle, please email us at maazoudofficial@gmail.com within 24 hours of delivery with an unboxing video or photographs, and we will immediately arrange a replacement."
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
        </section>

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
                  "name": "What are the shipping charges for orders in India?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "We charge a flat shipping fee of Rs. 50 on checkout for standard delivery across India."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How long does it take for my order to be delivered?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Standard delivery takes approximately 3 to 7 working days to reach most cities across India. Orders are processed and dispatched within 24 to 48 hours."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why are fragrance items non-returnable?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Due to hygiene standards and to guarantee the absolute purity of our concentrated attars, we cannot accept returns or exchanges once the fragrance bottles have been delivered."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What should I do if my attar bottle is damaged or leaks during transit?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "If you receive a damaged or leaking bottle, please email us at maazoudofficial@gmail.com within 24 hours of delivery with an unboxing video or photographs, and we will immediately arrange a replacement."
                  }
                }
              ]
            })
          }}
        />

      </div>
    </div>
  );
}
