"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FaQuoteLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { getOptimizedImageUrl, supabaseLoader } from "../utils/imageHelper";

export default function TestimonialSlider({ testimonials = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // If no testimonials provided from DB, use fallback luxury mock data
  const data = testimonials.length > 0 ? testimonials : [
    {
      id: 1,
      name: "Ahmad Raza",
      role: "Fragrance Connoisseur",
      text: "The sheer elegance and depth of these attars are unmatched. It leaves a majestic trail wherever I go, truly a premium experience.",
      image: "https://ui-avatars.com/api/?name=Ahmad+Raza&background=8c6239&color=fff&size=150"
    },
    {
      id: 2,
      name: "Sarah M.",
      role: "Luxury Collector",
      text: "I have collected fragrances globally, and Maaz Oud stands out for its exceptional craftsmanship. It is the definition of a luxury scent.",
      image: "https://ui-avatars.com/api/?name=Sarah+M&background=1c1917&color=fff&size=150"
    },
    {
      id: 3,
      name: "Tariq J.",
      role: "Verified Buyer",
      text: "A sophisticated and long-lasting aroma. It is rare to find such high-quality botanical blends. Absolutely exquisite.",
      image: "https://ui-avatars.com/api/?name=Tariq+J&background=8c6239&color=fff&size=150"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === data.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev === 0 ? data.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  if (!data || data.length === 0) return null;

  return (
    <section className="py-20 bg-[#8c6239] text-stone-50 overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#8c6239] blur-[150px] opacity-20 rounded-full"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#e5d9c5] blur-[150px] opacity-10 rounded-full"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center mb-12 space-y-3">
          <span className="text-[#eed9c4] font-bold tracking-[0.2em] text-xs uppercase">
            Voices of Customers
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
            Happy Customers
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="bg-[#815c37] backdrop-blur-md border border-stone-700/50 rounded-2xl p-8 md:p-14 text-center relative transition-opacity duration-500 shadow-2xl">
            <FaQuoteLeft className="text-white opacity-30 text-5xl md:text-7xl absolute top-6 left-6 md:top-10 md:left-10" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#c7a17a] p-1 mb-6 shadow-[0_0_20px_rgba(140,98,57,0.3)]">
                <div className="w-full h-full relative rounded-full overflow-hidden">
                  <Image 
                    loader={supabaseLoader}
                    src={data[currentIndex]?.image || "https://ui-avatars.com/api/?name=Guest&background=8c6239&color=fff"} 
                    alt={data[currentIndex]?.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              <p className={`text-lg md:text-2xl font-serif font-light leading-relaxed italic text-stone-200 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                "{data[currentIndex]?.text}"
              </p>

              <div className={`mt-8 transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                <h3 className="text-white font-bold tracking-wide uppercase text-sm">{data[currentIndex]?.name}</h3>
                <p className="text-[#eed9c4] text-xs mt-1">{data[currentIndex]?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <button 
            onClick={handlePrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 md:w-12 md:h-12 bg-white hover:bg-white/90 text-[#8c6239] rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer"
            aria-label="Previous Testimonial"
          >
            <FaChevronLeft size={14} />
          </button>
          
          <button 
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 md:w-12 md:h-12 bg-white hover:bg-white/90 text-[#8c6239] rounded-full flex items-center justify-center transition-colors shadow-lg cursor-pointer"
            aria-label="Next Testimonial"
          >
            <FaChevronRight size={14} />
          </button>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {data.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex 
                    ? "w-8 h-1.5 bg-[#c7a17a]" 
                    : "w-2 h-1.5 bg-stone-700 hover:bg-stone-500"
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
