"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProductCard from "../../../components/ProductCard";
import { CATEGORIES, PRODUCTS } from "../../../utils/mockData";
import { FaChevronLeft, FaChevronRight, FaArrowLeft } from "react-icons/fa";
import BlogsSection from "../../../components/BlogsSection";
import { supabase } from "../../../utils/supabase";

// Skeleton Loader for Product Grid
const ProductSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-4 border border-stone-100 rounded p-3">
        <div className="w-full aspect-4/4 bg-stone-200 rounded-md" />
        <div className="w-3/4 h-4 bg-stone-200 rounded" />
        <div className="w-1/2 h-3 bg-stone-200 rounded" />
        <div className="w-1/3 h-4 bg-stone-200 rounded" />
      </div>
    ))}
  </div>
);

export default function CategoryPage() {
  const { slug } = useParams();
  const topRef = useRef(null);
  
  const [category, setCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const [catRes, prodRes] = await Promise.all([
          supabase.from("categories").select("*").eq("id", slug).single(),
          supabase.from("products").select("*").contains("category", [slug]).order("created_at", { ascending: false })
        ]);

        // Fallback to local mock data if Supabase is empty
        if (catRes.data) {
          setCategory(catRes.data);
        } else {
          const foundMockCat = CATEGORIES.find((cat) => cat.slug === slug);
          setCategory(foundMockCat || null);
        }

        if (prodRes.data && prodRes.data.length > 0) {
          const mapped = prodRes.data.map(p => {
            const orig = p.price3mlorig || p.price3mloffer;
            const offer = p.price3mloffer;
            const discount = orig > offer ? Math.round(((orig - offer) / orig) * 100) : 0;
            return {
              ...p,
              id: p.id,
              slug: p.id,
              price: offer,
              originalPrice: orig,
              discount: discount,
              size: "3ml",
              category: p.category || "top-selling"
            };
          });
          setCategoryProducts(mapped);
        } else {
          const foundMockProducts = PRODUCTS.filter((prod) => 
            Array.isArray(prod.category) ? prod.category.includes(slug) : prod.category === slug
          );
          setCategoryProducts(foundMockProducts);
        }
      } catch (err) {
        console.error("Error loading category page:", err.message);
        // Clean fallbacks
        const foundMockCat = CATEGORIES.find((cat) => cat.slug === slug);
        setCategory(foundMockCat || null);
        const foundMockProducts = PRODUCTS.filter((prod) => 
          Array.isArray(prod.category) ? prod.category.includes(slug) : prod.category === slug
        );
        setCategoryProducts(foundMockProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
    setCurrentPage(1);
  }, [slug]);

  if (!slug) return null;

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 bg-stone-100">
        <div className="h-6 w-32 bg-stone-200 animate-pulse rounded" />
        <div className="space-y-4 text-center max-w-xl mx-auto">
          <div className="h-8 w-48 bg-stone-200 animate-pulse rounded mx-auto" />
          <div className="h-4 w-64 bg-stone-200 animate-pulse rounded mx-auto" />
        </div>
        <ProductSkeleton />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Category Not Found</h2>
        <p className="text-sm text-stone-500">The category you are looking for does not exist.</p>
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

  // Pagination configurations
  const productsPerPage = 8;
  const totalPages = Math.ceil(categoryProducts.length / productsPerPage);
  
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = categoryProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div ref={topRef} className="bg-white font-sans">
      
      {/* Category Hero Header */}
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={category.image} 
            alt={category.name} 
            className="w-full h-full object-cover opacity-25 blur-[1px]"
          />
          <div className="absolute inset-0 bg-stone-950/720" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
          >
            <FaArrowLeft size={9} />
            Back to Catalog
          </Link>
          <h1 className="text-3xl md:text-5xl font-serif font-bold tracking-wide">
            {category.name}
          </h1>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto my-3" />
          <p className="text-xs md:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed font-light">
            {category.description}
          </p>
        </div>
      </div>

      {/* Products Listing Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        
        {categoryProducts.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-stone-500 font-light">
              No products found in this category yet.
            </p>
            <Link 
              href="/"
              className="inline-flex px-6 py-2.5 bg-black text-white hover:bg-[#8c6239] text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
            >
              Show All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {currentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-8 border-t border-stone-100">
                {/* Prev Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded border border-stone-200 text-stone-600 hover:border-black hover:text-black disabled:opacity-30 disabled:hover:border-stone-200 disabled:hover:text-stone-600 transition-all cursor-pointer"
                  aria-label="Previous Page"
                >
                  <FaChevronLeft size={12} />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 text-xs font-bold rounded transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? "bg-black text-white"
                        : "bg-white border border-stone-200 text-stone-700 hover:border-black"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded border border-stone-200 text-stone-600 hover:border-black hover:text-black disabled:opacity-30 disabled:hover:border-stone-200 disabled:hover:text-stone-600 transition-all cursor-pointer"
                  aria-label="Next Page"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            )}
          </>
        )}

        {/* Blogs Section */}
        <BlogsSection />

        {/* Category specific FAQ */}
        <CategoryFAQ slug={slug} categoryName={category.name} />

      </div>
    </div>
  );
}

function CategoryFAQ({ slug, categoryName }) {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = {
    "top-selling": [
      {
        question: `Which are the best-selling attars in ${categoryName}?`,
        answer: "Our top-selling attars include Dehn Al Oud Yusuf Royale, Imperial Kalakassi Reserve, and Cambodi Intense. These premium oud creations are highly appreciated for their rich, aged scent profiles and outstanding projection."
      },
      {
        question: "What makes these attars best sellers?",
        answer: "Our best-selling attars represent the perfect balance of rarity, premium distillation quality, and mass appeal. They are 100% alcohol-free oil concentrates that stay on the skin for 8-12 hours and clothes for days."
      },
      {
        question: "Are these top-selling attars suitable for gifting?",
        answer: "Yes, they make the ultimate luxury gift. Packed in beautiful bottles, these fragrances are universally loved by oud connoisseurs and beginners alike."
      }
    ],
    "winter": [
      {
        question: `Why are ${categoryName} recommended for cold weather?`,
        answer: "Winter attars contain warm, deep, and heavy base notes like aged oud, amber, musk, and spices. These notes evaporate slowly and project beautifully in cold temperatures, creating a comforting fragrance bubble."
      },
      {
        question: "How long do winter attars last on woolens?",
        answer: "Because winter attars are made of concentrated heavy oils, their scent can linger on heavy winter garments like woolen jackets and sweaters for several days, even up to a week."
      },
      {
        question: "Can I wear heavy winter attars during the day?",
        answer: "Yes, winter attars are highly versatile for winter days and nights. The cool outdoor air tempers the density of the fragrance, making it rich but not overwhelming."
      }
    ],
    "summer": [
      {
        question: `What makes ${categoryName} suitable for hot weather?`,
        answer: "Summer attars focus on fresh, airy, citrusy, and light floral notes (like White Musk Imperial and Taif Rose). They provide a cooling, clean, and refreshing scent that counteracts summer heat."
      },
      {
        question: "How long do summer attars last compared to winter attars?",
        answer: "Summer attars use lighter molecules, lasting about 6 to 8 hours on skin. For maximum projection in summer, we recommend applying them to pulse points and light-colored clothes."
      },
      {
        question: "Will summer attars stain light summer clothes?",
        answer: "Our light summer blends like White Musk are clear and skin-friendly. However, when applying to very light fabrics, we suggest rubbing the oil on your palms first and lightly dabbing to prevent concentrated oil spots."
      }
    ],
    "all-season": [
      {
        question: `What exactly are ${categoryName}?`,
        answer: "All-season attars are balanced, versatile blends featuring notes that transition smoothly from fresh/floral top notes to warm/woody base notes, making them perfect for any weather."
      },
      {
        question: "Can I wear these attars daily to the office?",
        answer: "Yes, all-season attars like Mukhallat Al Badar are designed to be elegant, sophisticated, and close to the skin. They are non-offensive and create a professional aura."
      },
      {
        question: "How should I store all-season attars for long-term freshness?",
        answer: "Store your attars in a cool, dry place away from direct sunlight. High-quality natural oils mature and get better with age if kept in stable temperatures."
      }
    ]
  };

  const currentFaqs = faqData[slug] || [
    {
      question: "Are these attars 100% alcohol-free?",
      answer: "Yes, all Maaz Oud attars are 100% pure perfume oils, completely free of alcohol or chemical solvents."
    },
    {
      question: "How should I apply attar for the best projection?",
      answer: "Apply a few drops on your pulse points—inner wrists, behind the neck, and ears. Rub gently to activate the fragrance with body heat."
    }
  ];

  const toggleFAQ = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="border-t border-stone-200 pt-12 mt-12">
      {/* FAQ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": currentFaqs.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })
        }}
      />

      <h2 className="text-xl font-serif font-bold text-stone-900 mb-6 text-center">
        {categoryName} - Frequently Asked Questions
      </h2>
      <div className="space-y-4">
        {currentFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="border border-stone-150 rounded-md overflow-hidden bg-stone-50/50">
              <button
                onClick={() => toggleFAQ(idx)}
                aria-expanded={isOpen}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-xs md:text-sm text-stone-800 hover:bg-stone-50 transition-colors"
              >
                <span>{faq.question}</span>
                <span className="text-stone-500 ml-2">
                  {isOpen ? "-" : "+"}
                </span>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? "max-h-40 border-t border-stone-150" : "max-h-0"
                }`}
              >
                <p className="p-4 text-xs md:text-sm text-stone-600 font-light leading-relaxed bg-white">
                  {faq.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
