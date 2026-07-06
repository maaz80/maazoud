"use client";

import React from "react";
import Link from "next/link";
import { getImageAlt, getImageSrcSet, getOptimizedImageUrl } from "../utils/imageHelper";

export default function CategoryCard({ category }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="group block overflow-hidden text-center cursor-pointer"
    >
      {/* Category Image Container */}
      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden rounded-md border border-stone-200 transition-all group-hover:border-[#8c6239] group-hover:shadow-md">
        <img
          src={getOptimizedImageUrl(category.image, 400)}
          srcSet={getImageSrcSet(category.image)}
          sizes="(max-width: 640px) 200px, 400px"
          alt={getImageAlt(category.image, category.name)}
          width={300}
          height={300}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Soft elegant overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Category Name below */}
      <h3 className="mt-1 md:mt-4 text-[11px] md:text-sm font-semibold uppercase tracking-wider text-stone-900 group-hover:text-[#8c6239] transition-colors">
        {category.name}
      </h3>
    </Link>
  );
}
