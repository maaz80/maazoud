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

  const [blog, blogsRes] = await Promise.all([
    getBlogData(slug),
    supabase
      .from("blogs")
      .select("id, title, image, slug, created_at")
      .order("created_at", { ascending: false })
      .limit(3)
  ]);

  return (
    <BlogClient slug={slug} initialBlog={blog} initialBlogs={blogsRes?.data || []} />
  );
}
