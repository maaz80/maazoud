import React from "react";

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans bg-white min-h-screen animate-pulse">
      {/* Category Header Skeleton */}
      <div className="space-y-4 mb-12 text-center max-w-xl mx-auto">
        <div className="h-4 w-24 bg-stone-200 rounded mx-auto" />
        <div className="h-8 w-64 bg-stone-200 rounded mx-auto" />
        <div className="h-3 w-80 bg-stone-200 rounded mx-auto" />
        <div className="h-3 w-60 bg-stone-200 rounded mx-auto" />
      </div>

      {/* Product Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-white border border-stone-200 rounded-md overflow-hidden p-3 space-y-4"
          >
            {/* Image Box */}
            <div className="aspect-square w-full bg-stone-100 rounded-md" />
            
            {/* Title & Category Info */}
            <div className="space-y-2 grow">
              <div className="h-2.5 w-16 bg-stone-200 rounded" />
              <div className="h-4 w-5/6 bg-stone-200 rounded" />
              <div className="h-3.5 w-12 bg-stone-200 rounded" />
            </div>

            {/* Button */}
            <div className="h-8 w-full bg-stone-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
