import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft } from "react-icons/fa";
import { supabase } from "../../utils/supabase";
import { getImageAlt, getOptimizedImageUrl } from "../../utils/imageHelper";
import ProductCard from "../../components/ProductCard";

export const revalidate = 60; // Dynamic server rendering with 1 min cache

export const metadata = {
  title: "Maaz Oud Journal | Perfume Guides, Oud Heritage & Attar Tips",
  description: "Read the latest articles on pure oud extraction, traditional attar distillation heritage, and fragrance guides from Maaz Oud.",
  alternates: {
    canonical: "/blog"
  },
  openGraph: {
    title: "Maaz Oud Journal | Perfume Guides & Attar Heritage",
    description: "Read the latest articles on pure oud extraction, traditional attar distillation heritage, and fragrance guides from Maaz Oud.",
    url: "https://www.maazoud.in/blog",
    siteName: "Maaz Oud",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Maaz Oud Journal | Perfume Guides & Attar Heritage",
    description: "Read the latest articles on pure oud extraction, traditional attar distillation heritage, and fragrance guides from Maaz Oud.",
  }
};

async function getAllBlogs() {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("id, title, image, slug, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching all blogs on server:", err);
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      id: p.id,
      slug: p.id,
      price: p.price3mloffer,
      originalPrice: p.price3mlorig || p.price3mloffer,
      discount: p.price3mlorig > p.price3mloffer 
        ? Math.round(((p.price3mlorig - p.price3mloffer) / p.price3mlorig) * 100)
        : 0,
      size: "3ml",
      category: p.category || "top-selling"
    }));
  } catch (err) {
    console.error("Error fetching featured products on server:", err);
    return [];
  }
}

export default async function BlogListPage() {
  const [blogs, featuredProducts] = await Promise.all([
    getAllBlogs(),
    getFeaturedProducts()
  ]);

  const blogFaqs = [
    {
      question: "What topics are covered in the Maaz Oud Journal?",
      answer: "Our journal covers a wide range of topics including expert attar buying guides, traditional agarwood (oud) extraction processes, tips for making fragrance oils last longer, and the rich history of oriental perfumery."
    },
    {
      question: "How can I find guides on specific attars or ingredients?",
      answer: "You can read our dedicated articles like 'Attar vs Perfume' or 'How Long Does Attar Last' to understand the core characteristics of our pure oils. We also highlight specific ingredient origins like Khas (Vetiver) and Kashmiri Musk in our detailed blog entries."
    },
    {
      question: "Are the products mentioned in the articles available for purchase?",
      answer: "Yes! All featured fragrances highlighted in our journal articles are sourced directly from our active catalog and can be purchased by clicking on the product cards."
    },
    {
      question: "Can I request a custom guide or topic?",
      answer: "Absolutely. If you want us to cover a specific topic—such as comparing different types of oud wood or tips on layering attars—please reach out to us via our Contact Us page, and our blenders will feature it in a future journal entry."
    }
  ];

  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16">
      
      {/* Hero Header */}
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden border-b border-stone-850">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/oud_banner_1.jpg" 
            alt="Maaz Oud Journal Heritage Banner" 
            fill
            priority
            fetchPriority="high"
            className="w-full h-full object-cover opacity-15 blur-[1px]"
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
          <h1 id="blog-heading" className="text-3xl md:text-5xl font-serif font-bold tracking-wide">
            The Maaz Oud Journal
          </h1>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto my-3" />
          <p className="text-xs md:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed font-light">
            Explore our archives for premium perfume guides, attar usage tips, and pure oud distillation heritage.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {blogs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200 rounded-md shadow-sm">
            <p className="text-stone-500 font-light">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {blogs.map((blog) => {
              const dateStr = new Date(blog.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              return (
                <Link 
                  key={blog.id} 
                  href={`/blog/${blog.slug}`}
                  className="group flex flex-col bg-white border border-stone-200 rounded-md overflow-hidden hover:shadow-md transition-all h-full"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-stone-50 border-b border-stone-100">
                    <Image
                      src={getOptimizedImageUrl(blog.image, 640)}
                      alt={getImageAlt(blog.image, blog.title)}
                      width={320}
                      height={180}
                      quality={60}
                      sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 768px) 50vw, 300px"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-5 flex flex-col justify-between grow space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#8c6239] block">
                        {dateStr}
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#8c6239] transition-colors leading-snug line-clamp-2">
                        {blog.title}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold text-stone-700 hover:text-[#8c6239] flex items-center gap-1 group-hover:underline">
                      Read Article →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Structured FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": blogFaqs.map(faq => ({
              "@type": "Question",
              "name": faq.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
              }
            }))
          })
        }}
      />

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-bold text-stone-900 tracking-wide font-sans">
              Featured Fragrances
            </h2>
            <Link 
              href="/" 
              className="text-xs font-semibold text-[#8c6239] hover:underline uppercase tracking-wider font-sans"
            >
              Shop All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-12 border-t border-stone-200">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-wide">
            Frequently Asked Questions
          </h2>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto" />
        </div>

        <div className="space-y-4">
          {blogFaqs.map((faq, idx) => (
            <details key={idx} className="group border border-stone-200 rounded-md overflow-hidden bg-white shadow-sm transition-all duration-300">
              <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-xs md:text-sm text-stone-850 hover:bg-stone-50/50 list-none select-none [&::-webkit-details-marker]:hidden">
                <span>{faq.question}</span>
                <span className="transition-transform duration-300 group-open:rotate-180 text-stone-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </summary>
              <p className="p-4 text-xs md:text-sm text-stone-600 font-light leading-relaxed border-t border-stone-100 bg-stone-50/20">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

    </div>
  );
}
