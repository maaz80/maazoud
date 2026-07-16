import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaGem, FaFlask, FaShippingFast } from "react-icons/fa";
import BlogsSection from "../../components/BlogsSection";
import { supabase } from "../../utils/supabase";

export const metadata = {
  title: "About Our Heritage | Traditional Attar Distillation",
  description: "Discover the journey of Maaz Oud. Learn about our traditional Kannauj & Kanpur distillation processes, organic ingredients, and pure alcohol-free attars.",
  alternates: {
    canonical: "/about-us"
  },
  openGraph: {
    title: "About Our Heritage | Traditional Attar Distillation | Maaz Oud",
    description: "Discover the journey of Maaz Oud. Learn about our traditional Kannauj & Kanpur distillation processes, organic ingredients, and pure alcohol-free attars.",
    url: "https://maazoud.in/about-us",
    siteName: "Maaz Oud",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "About Our Heritage | Traditional Attar Distillation | Maaz Oud",
    description: "Discover the journey of Maaz Oud. Learn about our traditional Kannauj & Kanpur distillation processes, organic ingredients, and pure alcohol-free attars.",
  }
};

export default async function AboutPage() {
  let initialBlogs = [];
  try {
    const { data } = await supabase
      .from("blogs")
      .select("id, title, image, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(3);
    if (data) initialBlogs = data;
  } catch (e) {
    console.error("Error fetching blogs for about-us page:", e);
  }

  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16">
      
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden border-b border-stone-850">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/oud_banner_1.jpg" 
            alt="Traditional Attar Distillation Heritage" 
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
          <h1 id="about-heading" className="text-3xl md:text-5xl font-serif font-bold tracking-wide">
            Our Story & Heritage
          </h1>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto my-3" />
          <p className="text-xs md:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed font-light">
            Bringing premium, long-lasting, and alcohol-free fragrances to perfume lovers.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mt-12 space-y-12">
        
        {/* Intro Section */}
        <section className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-stone-900 border-b border-stone-100 pb-3">
            The Vision Behind Maaz Oud
          </h2>
          <div className="text-sm text-stone-600 font-light leading-relaxed space-y-4">
            <p>
              Maaz Oud was founded by <strong>Maaz Shakeel</strong>, a professional software developer with a deep, lifelong passion for high-quality perfumery. Today, Maaz Oud serves as a premium side business managed with an absolute commitment to quality, offering fragrance lovers access to highly curated, premium attar formulations.
            </p>
            <p>
              Our collections are handpicked and sourced from expert fragrance houses in <strong>Kanpur</strong>, a renowned hub of perfumery in Uttar Pradesh. We work closely with our partners to ensure that every blend is compiled under strict quality guidelines, delivering rich profiles that match the expectations of modern connoisseurs.
            </p>
          </div>
        </section>

        {/* Pillars Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <FaFlask size={24} className="text-[#8c6239]" />,
              title: "100% Alcohol-Free",
              desc: "Every single drop in our catalog is completely alcohol-free, crafted using skin-safe premium carrier bases that are non-irritating and smooth to apply."
            },
            {
              icon: <FaGem size={24} className="text-[#8c6239]" />,
              title: "Premium Formulation",
              desc: "We prioritize rich, deep fragrance notes. Our attars carry highly concentrated aromatic compounds, ensuring that the scent profile remains true and rich throughout the day."
            },
            {
              icon: <FaShippingFast size={24} className="text-[#8c6239]" />,
              title: "Long-Lasting Performance",
              desc: "Engineered for durability, our fragrances project strongly and stay on clothes and skin for hours, delivering a comforting scent bubble that lingers."
            }
          ].map((pillar, idx) => (
            <div key={idx} className="bg-white border border-stone-200 p-6 rounded-lg shadow-sm space-y-4 hover:border-[#8c6239] transition-all">
              <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center">
                {pillar.icon}
              </div>
              <h3 className="text-xs uppercase font-bold text-stone-900 tracking-wider">
                {pillar.title}
              </h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </section>

        {/* Founder note */}
        <section className="bg-stone-900 text-stone-100 p-8 rounded-lg shadow-md space-y-4">
          <span className="text-[10px] uppercase font-bold text-[#d4b28c] tracking-widest block">Founder's Note</span>
          <p className="text-sm font-serif italic text-stone-300 leading-relaxed">
            "As a software developer, I value precision, system design, and reliability. I run Maaz Oud with the exact same dedication. It is a side business built on my love for premium fragrances. We strive to bring the finest, longest-lasting, and completely alcohol-free attars straight to you at an accessible luxury point."
          </p>
          <div className="pt-2">
            <span className="text-xs font-bold block text-white">Maaz Shakeel</span>
            <span className="text-[10px] text-stone-400 font-mono">Software Developer & Founder, Maaz Oud</span>
          </div>
        </section>

        {/* Blogs Section */}
        <BlogsSection initialBlogs={initialBlogs} />

        {/* FAQ Section */}
        <section className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-6">
          <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-100 pb-3">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "What is the origin of Maaz Oud?",
                a: "Maaz Oud was founded by Maaz Shakeel, a software developer passionate about luxury perfumery. Our fragrances are crafted in Kanpur, Uttar Pradesh, a historical hub for Indian attar distillation."
              },
              {
                q: "Are all Maaz Oud attars organic and safe for skin?",
                a: "Yes, our attars are 100% alcohol-free and formulated with skin-friendly premium oils. We prioritize organic botanical extracts and high-grade aged resins."
              },
              {
                q: "How can Maaz Oud offer premium quality at accessible prices?",
                a: "As a boutique brand managed directly by the founder without heavy retail overheads, high markups, or middleman margins, we pass the savings directly to fragrance lovers."
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
                <div className="p-4 text-xs md:text-sm bg-white">
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
                  "name": "What is the origin of Maaz Oud?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Maaz Oud was founded by Maaz Shakeel, a software developer passionate about luxury perfumery. Our fragrances are crafted in Kanpur, Uttar Pradesh, a historical hub for Indian attar distillation."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Are all Maaz Oud attars organic and safe for skin?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, our attars are 100% alcohol-free and formulated with skin-friendly premium oils. We prioritize organic botanical extracts and high-grade aged resins."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can Maaz Oud offer premium quality at accessible prices?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "As a boutique brand managed directly by the founder without heavy retail overheads, high markups, or middleman margins, we pass the savings directly to fragrance lovers."
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
