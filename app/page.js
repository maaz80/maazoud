import React, { Suspense } from "react";
import HomeClient from "./HomeClient";
import { supabase } from "../utils/supabase";

export const revalidate = 0; // Dynamic rendering or revalidate as needed

async function getInitialData() {
  try {
    const [bannersRes, categoriesRes, productsRes] = await Promise.all([
      supabase.from("banners").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("*").order("created_at", { ascending: false })
    ]);

    let products = [];
    if (productsRes.data) {
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

    return {
      banners: bannersRes.data || [],
      categories: categoriesRes.data || [],
      products: products
    };
  } catch (e) {
    console.error("Error fetching initial data on server:", e);
    return { banners: [], categories: [], products: [] };
  }
}

export default async function Home() {
  const data = await getInitialData();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-stone-600 font-sans">Loading luxury collection...</div>}>
      <HomeClient 
        initialBanners={data.banners} 
        initialCategories={data.categories} 
        initialProducts={data.products} 
      />
    </Suspense>
  );
}
