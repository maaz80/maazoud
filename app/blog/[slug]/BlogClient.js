"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaCalendarAlt, FaClock } from "react-icons/fa";
import { supabase } from "../../../utils/supabase";
import BlogsSection from "../../../components/BlogsSection";
import ProductCard from "../../../components/ProductCard";
import { getImageAlt } from "../../../utils/imageHelper";

export default function BlogClient({ slug, initialBlog, initialBlogs, initialProducts = [] }) {
  const [blog, setBlog] = useState(initialBlog || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBlogData = async () => {
      if (!slug) return;
      if (blog && blog.slug === slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;
        if (data) {
          setBlog(data);
        }
      } catch (err) {
        console.error("Error loading blog details:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogData();
  }, [slug]);

  if (!slug) return null;

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-38 py-12 space-y-8 animate-pulse font-sans bg-white min-h-screen">
        <div className="h-6 w-24 bg-stone-200 rounded" />
        <div className="h-4 w-32 bg-stone-200 rounded" />
        <div className="h-10 w-3/4 bg-stone-200 rounded" />
        <div className="aspect-video w-full bg-stone-200 rounded-lg" />
        <div className="max-w-3xl mx-auto space-y-4 mt-8">
          <div className="h-4 w-full bg-stone-200 rounded" />
          <div className="h-4 w-5/6 bg-stone-200 rounded" />
          <div className="h-4 w-4/5 bg-stone-200 rounded" />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4 font-sans bg-white min-h-screen">
        <h2 className="text-xl font-bold text-stone-900 font-serif">Article Not Found</h2>
        <p className="text-sm text-stone-500">The blog post you are looking for does not exist or has been removed.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white hover:bg-[#8c6239] text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
        >
          <FaArrowLeft size={10} />
          Back to Home
        </Link>
      </div>
    );
  }

  const publishDate = new Date(blog.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const rawFaqs = Array.isArray(blog.faqs) ? blog.faqs : [];

  return (
    <div className="bg-white min-h-screen pb-16 pt-4 font-sans text-stone-900">
      
      {/* Dynamic SEO Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": blog.title,
              "image": blog.image,
              "datePublished": blog.created_at,
              "author": {
                "@type": "Person",
                "name": "Maaz Shakeel",
              },
              "publisher": {
                "@type": "Organization",
                "name": "Maaz Oud",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://www.maazoud.in/maazoud-logo-no-bg.png",
                },
              },
            },
            ...(rawFaqs.length > 0 ? [{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": rawFaqs.map(faq => ({
                "@type": "Question",
                "name": faq.q || faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.a || faq.answer
                }
              }))
            }] : [])
          ]),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <FaArrowLeft size={10} />
            Back to Journal
          </Link>
        </div>

        {/* Header Metadata */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs text-[#8c6239] font-semibold tracking-wider uppercase">
            <span className="flex items-center gap-1.5">
              <FaCalendarAlt size={12} />
              {publishDate}
            </span>
            <span className="flex items-center gap-1.5">
              <FaClock size={12} />
              By Maaz Shakeel
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-stone-900 leading-tight">
            {blog.title}
          </h1>
          <div className="w-20 h-1 bg-[#8c6239]" />
        </div>

        {/* Cover Image */}
        <div className="relative aspect-video w-full rounded-md border border-stone-200 overflow-hidden bg-stone-50 shadow-sm">
          <Image
            src={blog.image}
            alt={getImageAlt(blog.image, blog.title)}
            fill
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 100vw, 1080px"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="max-w-7xl mx-auto w-full">
          <article 
            className="text-sm md:text-base text-stone-800 font-light leading-relaxed prose prose-stone max-w-none product-content pb-3 md:pb-12"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>

        {/* Related Products Section */}
        {initialProducts && initialProducts.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-stone-100 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold text-stone-900 tracking-wide">
                Featured Fragrances
              </h2>
              <Link 
                href="/" 
                className="text-xs font-semibold text-[#8c6239] hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {initialProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        {/* Blogs Section */}
        <BlogsSection initialBlogs={initialBlogs} />

        {/* Dynamic Blog FAQ Section */}
        {rawFaqs.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-stone-100 max-w-7xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-wide">
                Frequently Asked Questions
              </h2>
              <div className="w-16 h-0.5 bg-[#8c6239] mx-auto" />
            </div>

            <div className="space-y-4 mt-8">
              {rawFaqs.map((faq, idx) => (
                <details key={idx} className="group border border-gray-200 rounded-md overflow-hidden bg-stone-50/50">
                  <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-xs md:text-sm text-stone-800 hover:bg-stone-50 list-none select-none [&::-webkit-details-marker]:hidden">
                    <span>{faq.q || faq.question}</span>
                    <span className="transition-transform duration-300 group-open:rotate-180 text-stone-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <p className="p-4 text-xs md:text-sm text-stone-600 font-light leading-relaxed border-t border-stone-100 bg-white">
                    {faq.a || faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
