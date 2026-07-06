"use client";

import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Link from "next/link";
import { getImageAlt, getBannerSrcSet, getOptimizedImageUrl } from "../utils/imageHelper";
import { useCart } from "../context/CartContext";
import { BANNERS } from "../utils/mockData";

export default function Carousel() {
  const { globalBanners, bannersLoading, fetchGlobalBanners } = useCart();
  const [current, setCurrent] = useState(0);

  // Fetch banners from Supabase dynamically via global context cache
  useEffect(() => {
    fetchGlobalBanners();
  }, []);

  const banners = globalBanners.length > 0 ? globalBanners : BANNERS;
  const loading = bannersLoading && globalBanners.length === 0;

  // Auto slide effect
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [banners]);

  const nextSlide = () => {
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  if (loading) {
    return (
      <div className="w-full h-37.5 md:h-100 bg-stone-105 flex items-center justify-center animate-pulse">
        <span className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Loading Banners...</span>
      </div>
    );
  }

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full h-37.5 md:h-140 bg-stone-100 overflow-hidden group font-sans">
      
      {/* Slides Wrapper */}
      <div 
        className="flex w-full h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => {
          const content = (
            <div className="w-full h-full shrink-0 relative flex items-center cursor-pointer">
              <img 
                src={getOptimizedImageUrl(banner.image, 1200)} 
                srcSet={getBannerSrcSet(banner.image)}
                alt={getImageAlt(banner.image, banner.title || "Banner Image")} 
                fetchpriority={banners.indexOf(banner) === 0 ? "high" : "low"}
                loading={banners.indexOf(banner) === 0 ? "eager" : "lazy"}
                className="absolute inset-0 w-full h-full object-cover" 
                sizes="100vw"
              />
            </div>
          );

          return banner.link ? (
            <Link key={banner.id} href={banner.link} className="w-full h-full shrink-0">
              {content}
            </Link>
          ) : (
            <div key={banner.id} className="w-full h-full shrink-0">
              {content}
            </div>
          );
        })}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-[#8c6239] hover:text-white rounded-full text-black transition-all shadow-md z-20 opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Previous Slide"
          >
            <FaChevronLeft size={16} />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/70 hover:bg-[#8c6239] hover:text-white rounded-full text-black transition-all shadow-md z-20 opacity-0 group-hover:opacity-100 cursor-pointer"
            aria-label="Next Slide"
          >
            <FaChevronRight size={16} />
          </button>
        </>
      )}

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
          {banners.map((_, index) => (
            <button 
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                current === index 
                  ? "bg-[#8c6239] w-8" 
                  : "bg-white/50 hover:bg-white"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
