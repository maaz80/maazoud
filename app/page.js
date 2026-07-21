import React, { Suspense } from "react";
import HomeClient from "./HomeClient";
import { supabase } from "../utils/supabase";

export const revalidate = 60; // Dynamic rendering or revalidate as needed

async function getInitialData() {
  try {
    const [bannersRes, categoriesRes, productsRes, testimonialsRes, blogsRes] = await Promise.all([
      supabase.from("banners").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("testimonials").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("blogs").select("id, title, image, slug, created_at").order("created_at", { ascending: false }).limit(3)
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
      products: products,
      testimonials: testimonialsRes?.data || [],
      blogs: blogsRes?.data || []
    };
  } catch (e) {
    console.error("Error fetching initial data on server:", e);
    return { banners: [], categories: [], products: [], testimonials: [], blogs: [] };
  }
}

export default async function Home() {
  const data = await getInitialData();

  // Structured data representing the global shop product / brand ratings
  const brandProductSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Maaz Oud Luxury Perfumes",
    "image": "https://www.maazoud.in/maazoud-logo.webp",
    "description": "Premium collection of pure Cambodian Oud, Indian Agarwood, and non-alcoholic botanical attars.",
    "sku": "brand-maazoud-perfumes",
    "brand": {
      "@type": "Brand",
      "name": "Maaz Oud"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": "499",
      "highPrice": "5999",
      "offerCount": "6",
      "availability": "https://schema.org/InStock",
      "url": "https://www.maazoud.in/"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "184",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Mohammad Shadab"
        },
        "headline": "Exceptional Quality",
        "reviewBody": "Highly impressed by the depth and longevity of the attars. The packaging was also very elegant."
      },
      {
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": "Vikram Singh"
        },
        "headline": "Truly Natural & Pure",
        "reviewBody": "Mitti Attar and Ruh Khus are outstanding. Pure, alcohol-free, and natural scent."
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(brandProductSchema) }}
      />
      <HomeClient 
        initialBanners={data.banners} 
        initialCategories={data.categories} 
        initialProducts={data.products} 
        initialTestimonials={data.testimonials}
        initialBlogs={data.blogs}
      />
    </>
  );
}
