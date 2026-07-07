"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "../utils/supabase";
import { getImageAlt } from "../utils/imageHelper";

export default function BlogsSection() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data, error } = await supabase
          .from("blogs")
          .select("id, title, image, slug, created_at")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        if (data) setBlogs(data);
      } catch (err) {
        console.error("Error loading blogs in section:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-12 animate-pulse space-y-6">
        <div className="h-6 w-48 bg-stone-100 rounded mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="border border-stone-100 rounded-md p-4 space-y-4">
              <div className="aspect-video w-full bg-stone-100 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-stone-100 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-stone-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (blogs.length === 0) return null;

  return (
    <section className="border-t border-stone-200 pt-12 mt-12 space-y-8 font-sans">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-wide">
          From The Maaz Oud Journal
        </h2>
        <div className="w-16 h-0.5 bg-[#8c6239] mx-auto" />
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          Read our latest articles on pure oud extraction, attar heritage, and fragrance guides.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4">
        {blogs.map((blog) => {
          const dateStr = new Date(blog.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          return (
            <Link 
              key={blog.id} 
              href={`/blog/${blog.slug}`}
              className="group flex flex-col bg-white border border-stone-200 rounded-md overflow-hidden hover:shadow-md transition-all h-full"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-stone-50 border-b border-stone-100">
                <Image
                  src={blog.image}
                  alt={getImageAlt(blog.image, blog.title)}
                  width={320}
                  height={180}
                  quality={60}
                  sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 768px) 50vw, 300px"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="p-5 flex flex-col justify-between grow space-y-4">
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-[#8c6239] block">
                    {dateStr}
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#8c6239] transition-colors leading-snug line-clamp-2">
                    {blog.title}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-stone-700 hover:text-[#8c6239] flex items-center gap-1 group-hover:underline">
                  Read Article →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
