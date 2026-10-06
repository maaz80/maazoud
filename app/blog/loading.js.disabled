import React from "react";

export default function BlogListLoading() {
  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16 animate-pulse">
      {/* Hero Header Skeleton */}
      <div className="bg-stone-950 py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4 space-y-4 flex flex-col items-center">
          {/* Back button */}
          <div className="h-3 w-28 bg-stone-800 rounded" />
          {/* Main Title */}
          <div className="h-10 w-72 bg-stone-800 rounded" />
          <div className="w-16 h-0.5 bg-[#8c6239] my-2" />
          {/* Tagline */}
          <div className="h-4 w-96 max-w-full bg-stone-800 rounded" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col bg-white border border-stone-200 rounded-md overflow-hidden p-4 space-y-4"
            >
              {/* Image Aspect Box */}
              <div className="aspect-video w-full bg-stone-100 rounded" />

              {/* Card Meta & Title */}
              <div className="space-y-2 grow">
                <div className="h-2 w-16 bg-stone-200 rounded" />
                <div className="h-4 w-11/12 bg-stone-200 rounded" />
                <div className="h-4 w-3/4 bg-stone-200 rounded" />
              </div>

              {/* Read button */}
              <div className="h-3.5 w-24 bg-stone-200 rounded mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
