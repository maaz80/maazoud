import React from "react";

export default function BlogDetailLoading() {
  return (
    <div className="w-full bg-white min-h-screen font-sans animate-pulse">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Back Button Skeleton */}
        <div className="h-4 w-28 bg-stone-200 rounded" />
        
        {/* Metadata (Date/Read Time) */}
        <div className="h-4 w-36 bg-stone-200 rounded mt-4" />
        
        {/* Title */}
        <div className="h-10 w-11/12 bg-stone-200 rounded mt-2" />
        
        {/* Featured Image */}
        <div className="aspect-video w-full bg-stone-100 border border-stone-200 rounded-lg mt-6" />
        
        {/* Paragraph blocks */}
        <div className="space-y-4 pt-6">
          <div className="h-4 w-full bg-stone-200 rounded" />
          <div className="h-4 w-full bg-stone-200 rounded" />
          <div className="h-4 w-11/12 bg-stone-200 rounded" />
          <div className="h-4 w-5/6 bg-stone-200 rounded" />
          <div className="h-4 w-4/5 bg-stone-200 rounded" />
        </div>
      </div>
    </div>
  );
}
