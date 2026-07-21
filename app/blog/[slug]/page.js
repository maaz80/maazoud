import React from "react";
import BlogClient from "./BlogClient";
import { supabase } from "../../../utils/supabase";

export const revalidate = 60; // Dynamic server rendering

async function getBlogData(slug) {
  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error("Error fetching blog on server:", err);
    return null;
  }
}

export default async function BlogDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  const [blog, blogsRes, productsRes] = await Promise.all([
    getBlogData(slug),
    supabase
      .from("blogs")
      .select("id, title, image, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3)
  ]);

  let products = [];
  if (productsRes?.data) {
    products = productsRes.data.map(p => ({
      ...p,
      id: p.id,
      slug: p.id,
      price: p.price3mloffer,
      originalPrice: p.price3mlorig || p.price3mloffer,
      discount: p.price3mlorig > p.price3mloffer 
        ? Math.round(((p.price3mlorig - p.price3mloffer) / p.price3mlorig) * 100)
        : 0,
      size: "3ml",
      category: p.category || "top-selling"
    }));
  }

  return (
    <BlogClient 
      slug={slug} 
      initialBlog={blog} 
      initialBlogs={blogsRes?.data || []} 
      initialProducts={products}
    />
  );
}
