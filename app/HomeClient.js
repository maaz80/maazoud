"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Carousel from "../components/Carousel";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import BlogsSection from "../components/BlogsSection";
import { CATEGORIES, PRODUCTS } from "../utils/mockData";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import { useCart } from "../context/CartContext";

// Category Skeleton Loader
const CategorySkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="animate-pulse bg-stone-50 border border-stone-100 rounded-lg p-6 flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-stone-200" />
        <div className="w-24 h-4 bg-stone-200 rounded" />
        <div className="w-12 h-3 bg-stone-200 rounded" />
      </div>
    ))}
  </div>
);

// Product Grid Skeleton Loader
const ProductSkeleton = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="animate-pulse space-y-4 border border-stone-100 rounded p-3">
        <div className="w-full aspect-4/4 bg-stone-200 rounded-md" />
        <div className="w-3/4 h-4 bg-stone-200 rounded" />
        <div className="w-1/2 h-3 bg-stone-200 rounded" />
        <div className="w-1/3 h-4 bg-stone-200 rounded" />
      </div>
    ))}
  </div>
);

function HomeContent({ initialBanners, initialCategories, initialProducts }) {
  const searchParams = useSearchParams();
  const searchVal = searchParams.get("search") || "";
  const productsRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [filterSearch, setFilterSearch] = useState("");
  
  const {
    globalCategories,
    globalProducts,
    categoriesLoading,
    productsLoading,
    fetchGlobalCategories,
    fetchGlobalProducts
  } = useCart();

  // Load Categories & Products from global context cache on mount
  useEffect(() => {
    Promise.all([fetchGlobalCategories(), fetchGlobalProducts()]);
  }, []);

  const categories = globalCategories.length > 0 
    ? globalCategories 
    : (initialCategories && initialCategories.length > 0 ? initialCategories : CATEGORIES);

  const products = globalProducts.length > 0 
    ? globalProducts 
    : (initialProducts && initialProducts.length > 0 ? initialProducts : PRODUCTS);

  const loading = (categoriesLoading || productsLoading) && 
                  (globalCategories.length === 0 || globalProducts.length === 0) &&
                  (!initialCategories || initialCategories.length === 0) &&
                  (!initialProducts || initialProducts.length === 0);

  // Keep filterSearch state in sync with URL search query
  useEffect(() => {
    setFilterSearch(searchVal);
    setCurrentPage(1); // Reset page on new search
  }, [searchVal]);

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    if (!filterSearch) return true;
    const query = filterSearch.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.description && product.description.toLowerCase().includes(query)) ||
      (product.category && (
        Array.isArray(product.category)
          ? product.category.some(c => c.toLowerCase().includes(query))
          : product.category.toLowerCase().includes(query)
      ))
    );
  });

  // Pagination configurations
  const productsPerPage = 8;
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    if (productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const clearSearchFilter = () => {
    setFilterSearch("");
    window.history.pushState({}, "", "/");
  };

  return (
    <div className="bg-white font-sans">
      {/* 1. Hero Carousel */}
      <Carousel initialBanners={initialBanners} />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-12 space-y-6 md:space-y-16">
        <h1 className="sr-only">Maaz Oud | Luxury Pure Attars & Organic Oud Perfumes</h1>
        
        {/* 2. Categories Section */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-wide">
              Shop by Category
            </h2>
            <div className="w-16 h-0.5 bg-[#8c6239] mx-auto" />
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              Explore our curated ranges meticulously blended for diverse preferences and seasons.
            </p>
          </div>

          {loading ? (
            <CategorySkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>

        {/* 3. Products Section */}
        <section ref={productsRef} id="products" className="space-y-8 pt-8 border-t border-stone-100">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-stone-900">
                {filterSearch ? `Search Results for "${filterSearch}"` : "Our Attar Collection"}
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Showing {filteredProducts.length} premium creations
              </p>
            </div>

            {/* Clear Search Button if active */}
            {filterSearch && (
              <button
                onClick={clearSearchFilter}
                className="flex items-center gap-2 self-start md:self-auto px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded transition-all cursor-pointer"
              >
                <FaTimes size={12} />
                Clear Search
              </button>
            )}
          </div>

          {/* Product Grid / Skeleton */}
          {loading ? (
            <ProductSkeleton />
          ) : currentProducts.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <p className="text-stone-500 font-light">
                No products found matching your criteria. Try searching for something else.
              </p>
              <button
                onClick={clearSearchFilter}
                className="px-6 py-2.5 bg-black text-white hover:bg-[#8c6239] text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
              >
                Show All Products
              </button>
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
        </section>

        {/* Blogs Section */}
        <BlogsSection />

        {/* Homepage FAQ Section */}
        <section className="space-y-8 pt-12 border-t border-stone-100">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-wide">
              Frequently Asked Questions
            </h2>
            <div className="w-16 h-0.5 bg-[#8c6239] mx-auto" />
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              Everything you need to know about our premium attars, shipping, and quality assurance.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is an Attar and how is it different from normal perfumes?",
                a: "Attars are highly concentrated perfume oils extracted naturally from flowers, herbs, and wood (like agarwood or sandalwood). Unlike modern spray perfumes, they are 100% free of alcohol and chemical propellants, making them richer, closer to the skin, and extremely skin-friendly."
              },
              {
                q: "How long do Maaz Oud attars typically last?",
                a: "Since our attars are pure oil concentrates without any alcohol dilution, they have exceptional longevity. On the skin, they last between 8 to 12 hours, and on clothing, the scent can linger for multiple days."
              },
              {
                q: "Are these attars safe for sensitive skin?",
                a: "Yes! All Maaz Oud attars are 100% alcohol-free and formulated with premium, skin-safe natural ingredients. If you have highly sensitive skin or known botanical allergies, we suggest doing a small patch test on your inner wrist first."
              },
              {
                q: "How should I apply the attar for the best projection?",
                a: "For maximum performance, apply a few drops of attar to your pulse points: the wrists, behind the ears, and on the sides of the neck. The heat from these spots naturally diffuses the oil throughout the day. You can also lightly dab it on clothing."
              }
            ].map((faq, idx) => (
              <details key={idx} className="group border border-gray-200 rounded-md overflow-hidden bg-stone-50/50">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-semibold text-xs md:text-sm text-stone-800 hover:bg-stone-50 list-none select-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="text-stone-500 transition-transform duration-200 group-open:rotate-180">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="p-4 text-xs md:text-sm text-stone-600 font-light leading-relaxed bg-white">
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
                  "name": "What is an Attar and how is it different from normal perfumes?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Attars are highly concentrated perfume oils extracted naturally from flowers, herbs, and wood (like agarwood or sandalwood). Unlike modern spray perfumes, they are 100% free of alcohol and chemical propellants, making them richer, closer to the skin, and extremely skin-friendly."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How long do Maaz Oud attars typically last?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Since our attars are pure oil concentrates without any alcohol dilution, they have exceptional longevity. On the skin, they last between 8 to 12 hours, and on clothing, the scent can linger for multiple days."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Are these attars safe for sensitive skin?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! All Maaz Oud attars are 100% alcohol-free and formulated with premium, skin-safe natural ingredients. If you have highly sensitive skin or known botanical allergies, we suggest doing a small patch test on your inner wrist first."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How should I apply the attar for the best projection?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "For maximum performance, apply a few drops of attar to your pulse points: the wrists, behind the ears, and on the sides of the neck. The heat from these spots naturally diffuses the oil throughout the day. You can also lightly dab it on clothing."
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

export default function HomeClient({ initialBanners, initialCategories, initialProducts }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-stone-600 font-sans">Loading luxury collection...</div>}>
      <HomeContent 
        initialBanners={initialBanners} 
        initialCategories={initialCategories} 
        initialProducts={initialProducts} 
      />
    </Suspense>
  );
}
