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
  const blog = await getBlogData(slug);

  return (
    <BlogClient slug={slug} initialBlog={blog} />
  );
}
