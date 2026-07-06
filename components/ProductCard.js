"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { getImageAlt, getImageSrcSet, getOptimizedImageUrl } from "../utils/imageHelper";
export default function ProductCard({ product }) {
  const { cart, addToCart } = useCart();
  const size = product.size || "3ml";
  const isAdded = cart.some(item => item.cartItemId === `${product.id}-${size}`);

  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Parse gallery images (fallback to single product.image)
  const gallery = (product.images && product.images.length > 0) ? product.images : [product.image];

  const handlePrevImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImgIndex(prev => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const handleNextImg = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImgIndex(prev => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="group flex flex-col bg-white border border-stone-200 rounded-md overflow-hidden hover:shadow-md transition-all h-full font-sans">

      {/* Product Image & Gallery Slider */}
      <Link href={`/product/${product.slug}`} className="relative aspect-4/4 w-full overflow-hidden block group/img bg-stone-50 border-b border-stone-100">
        <img
          src={getOptimizedImageUrl(gallery[activeImgIndex], 320)}
          srcSet={getImageSrcSet(gallery[activeImgIndex])}
          sizes="(max-width: 640px) 160px, 320px"
          alt={getImageAlt(gallery[activeImgIndex], product.name)}
          width={300}
          height={300}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-300"
        />
        {/* Soft overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/img:opacity-100 transition-opacity" />

        {/* Card Gallery Nav Buttons */}
        {gallery.length > 1 && (
          <>
            <button
              onClick={handlePrevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-[#8c6239] hover:text-white transition-all shadow-sm opacity-0 group-hover/img:opacity-100 cursor-pointer z-10 text-xs font-bold font-mono"
              aria-label="Previous Image"
            >
              <IoIosArrowBack />
            </button>
            <button
              onClick={handleNextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/95 border border-stone-200 flex items-center justify-center text-stone-700 hover:bg-[#8c6239] hover:text-white transition-all shadow-sm opacity-0 group-hover/img:opacity-100 cursor-pointer z-10 text-xs font-bold font-mono"
              aria-label="Next Image"
            >
              <IoIosArrowForward />
            </button>
          </>
        )}

        {/* Tiny Dot Indicators */}
        {gallery.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity">
            {gallery.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${activeImgIndex === idx ? "bg-[#8c6239] w-3" : "bg-white/80"
                  }`}
              />
            ))}
          </div>
        )}

        {/* Discount Badge */}
        {product.discount > 0 && (
          <span className="absolute bottom-3 right-3 bg-[#8c6239] text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded shadow-sm z-10">
            {product.discount}% OFF
          </span>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex flex-col grow">
        {/* Category tag */}
        <div className="text-[10px] text-stone-400 uppercase tracking-widest font-semibold mb-1 line-clamp-1 md:line-clamp-2">
          {Array.isArray(product.category)
            ? product.category.map(c => c.replace("-", " ")).join(", ")
            : (product.category ? product.category.replace("-", " ") : "")}
        </div>

        {/* Product Name with Line Clamp */}
        <Link href={`/product/${product.slug}`}>
          <h4 className="text-sm font-medium text-stone-900 group-hover:text-[#8c6239] transition-colors line-clamp-1 min-h-5 leading-snug">
            {product.name}
          </h4>
        </Link>

        {/* Size Badge */}
        <span className="text-xs text-stone-500 mt-1 font-light block">
          Size: {product.size}
        </span>

        {/* Pricing */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-stone-900">
            Rs. {product.price}
          </span>
          {product.originalPrice > product.price && (
            <>
              <span className="text-xs text-stone-400 line-through">
                Rs. {product.originalPrice}
              </span>
            </>
          )}
        </div>

        {/* Quick Add Button */}
        <div className="mt-2 pt-1 md:pt-2">
          <button
            onClick={() => addToCart(product, 1)}
            className={`w-full py-2 text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${isAdded
                ? "bg-green-700 hover:bg-green-800 text-white"
                : "bg-stone-900 hover:bg-[#8c6239] text-white"
              }`}
          >
            {isAdded ? "Added to Cart ✓" : "Add to Cart"}
          </button>
        </div>

      </div>
    </div>
  );
}
