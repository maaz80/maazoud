import React, { Suspense } from "react";
import CategoryClient from "./CategoryClient";
import { supabase } from "../../../utils/supabase";

export const revalidate = 60; // Dynamic server rendering or revalidation as needed

async function getCategoryData(slug) {
  try {
    const { data: categoryData, error: catErr } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (catErr || !categoryData) {
      return { category: null, products: [], blogs: [] };
    }

    const [prodRes, blogsRes] = await Promise.all([
      supabase.from("products").select("*").contains("category", [categoryData.id]).order("created_at", { ascending: false }),
      supabase.from("blogs").select("id, title, image, slug, created_at").order("created_at", { ascending: false }).limit(3)
    ]);
    const prodData = prodRes.data;

    let products = [];
    if (prodData) {
      products = prodData.map(p => {
        const orig = p.price3mlorig || p.price3mloffer;
        const offer = p.price3mloffer;
        const discount = orig > offer ? Math.round(((orig - offer) / orig) * 100) : 0;
        return {
          ...p,
          id: p.id,
          slug: p.id,
          price: offer,
          originalPrice: orig,
          discount: discount,
          size: "3ml",
          category: p.category || "top-selling"
        };
      });
    }

    return {
      category: categoryData,
      products: products,
      blogs: blogsRes?.data || []
    };
  } catch (e) {
    console.error("Error fetching category data on server:", e);
    return { category: null, products: [], blogs: [] };
  }
}

export default async function CategoryPage({ params }) {
  // Await params as required by Next.js 15+ / 16
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const data = await getCategoryData(slug);

  return (
    <CategoryClient 
      slug={slug} 
      initialCategory={data.category} 
      initialProducts={data.products} 
      initialBlogs={data.blogs}
    />
  );
}
