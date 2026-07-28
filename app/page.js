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
      const mapped = productsRes.data.map(p => ({
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

      // Interleave combo packs and single attars to show affordable single attars mixed in on landing
      const combos = [];
      const singles = [];
      mapped.forEach(p => {
        let categories = [];
        if (Array.isArray(p.category)) {
          categories = p.category;
        } else if (typeof p.category === 'string') {
          categories = p.category.split(',').map(c => c.trim());
        }
        if (categories.includes('combo-packs')) {
          combos.push(p);
        } else {
          singles.push(p);
        }
      });

      let comboIdx = 0;
      let singleIdx = 0;
      while (singleIdx < singles.length || comboIdx < combos.length) {
        if (singleIdx < singles.length) {
          products.push(singles[singleIdx++]);
        }
        if (comboIdx < combos.length) {
          products.push(combos[comboIdx++]);
        }
        if (singleIdx < singles.length) {
          products.push(singles[singleIdx++]);
        }
      }
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
    "description": "Premium collection of exquisite Cambodian Oud, Indian Agarwood, and non-alcoholic botanical attars.",
    "sku": "brand-maazoud-perfumes",
    "brand": {
      "@type": "Brand",
      "name": "Maaz Oud"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "INR",
      "lowPrice": "199",
      "highPrice": "399",
      "offerCount": "7",
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
        "headline": "Truly Premium & Long-Lasting",
        "reviewBody": "Mitti Attar and Ruh Khus are outstanding. Alcohol-free and exquisite scent."
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
