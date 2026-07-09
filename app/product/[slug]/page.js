import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import ProductClient from "./ProductClient";
import { supabase } from "../../../utils/supabase";
import { PRODUCTS } from "../../../utils/mockData";

export const revalidate = 0; // Dynamic server rendering

async function getProductData(slug) {
  try {
    // 1. Fetch product
    let { data: prodData, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", slug)
      .single();

    // Fallback: If not found, try to match by prefix (e.g. 'khas' -> 'khas-(vetiver)')
    if (prodErr || !prodData) {
      const { data: fallbackData } = await supabase
        .from("products")
        .select("*")
        .ilike("id", `%${slug}%`)
        .limit(1);

      if (fallbackData && fallbackData.length > 0) {
        prodData = fallbackData[0];
        prodErr = null;
      }
    }

    if (prodErr || !prodData) {
      // Try fallback to mock data
      const foundProduct = PRODUCTS.find((p) => p.slug === slug);
      if (foundProduct) {
        const fpCats = Array.isArray(foundProduct.category) ? foundProduct.category : (foundProduct.category ? [foundProduct.category] : []);
        let related = PRODUCTS.filter((p) => {
          if (p.id === foundProduct.id) return false;
          const pCats = Array.isArray(p.category) ? p.category : (p.category ? [p.category] : []);
          return pCats.some(c => fpCats.includes(c));
        });
        if (related.length < 4) {
          const extra = PRODUCTS.filter(p => p.id !== foundProduct.id && !related.some(r => r.id === p.id));
          related = [...related, ...extra];
        }
        return {
          product: foundProduct,
          reviews: [],
          relatedProducts: related.slice(0, 4)
        };
      }
      return { product: null, reviews: [], relatedProducts: [] };
    }

    // 2. Fetch reviews and related products
    const prodCategories = Array.isArray(prodData.category) ? prodData.category : (prodData.category ? [prodData.category] : []);
    const [revRes, relRes] = await Promise.all([
      supabase.from("reviews").select("*").eq("product_id", prodData.id).order("created_at", { ascending: false }),
      supabase.from("products").select("*").overlaps("category", prodCategories).neq("id", prodData.id).limit(4)
    ]);

    let reviews = [];
    if (revRes.data) {
      reviews = revRes.data.map(r => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
      }));
    }

    let relatedProducts = [];
    if (relRes.data && relRes.data.length > 0) {
      relatedProducts = relRes.data.map(p => {
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

      if (relatedProducts.length < 4) {
        const { data: allProds } = await supabase
          .from("products")
          .select("*")
          .neq("id", prodData.id)
          .limit(8);

        if (allProds) {
          const extraProds = allProds
            .filter(ap => !relatedProducts.some(mr => mr.id === ap.id))
            .map(p => {
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
          relatedProducts = [...relatedProducts, ...extraProds].slice(0, 4);
        }
      }
    } else {
      const { data: fallbackProds } = await supabase
        .from("products")
        .select("*")
        .neq("id", prodData.id)
        .limit(4);

      if (fallbackProds) {
        relatedProducts = fallbackProds.map(p => {
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
    }

    return {
      product: prodData,
      reviews: reviews,
      relatedProducts: relatedProducts
    };
  } catch (err) {
    console.error("Error fetching product data on server:", err);
    return { product: null, reviews: [], relatedProducts: [] };
  }
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const data = await getProductData(slug);

  // If a valid product was found but the requested slug doesn't match its ID (canonical slug), redirect to the canonical URL!
  if (data.product && data.product.id && data.product.id !== slug) {
    redirect(`/product/${data.product.id}`);
  }

  // Construct Google Product JSON-LD Schema
  let productSchema = null;
  if (data.product) {
    const product = data.product;
    const price = product.price3mloffer || product.price || 0;
    const ratingValue = data.reviews && data.reviews.length > 0
      ? (data.reviews.reduce((sum, r) => sum + r.rating, 0) / data.reviews.length).toFixed(1)
      : (product.rating || 5.0).toFixed(1);
    const reviewCount = data.reviews && data.reviews.length > 0
      ? data.reviews.length
      : (product.ratingcount || 0);

    const schemaObj = {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": product.name,
      "image": (product.images && product.images.length > 0) ? product.images : [product.image],
      "description": product.description || `Buy ${product.name} attar by Maaz Oud. Premium, long-lasting alcohol-free fragrance oil.`,
      "sku": product.id,
      "brand": {
        "@type": "Brand",
        "name": "Maaz Oud"
      },
      "offers": {
        "@type": "Offer",
        "url": `https://maazoud.in/product/${product.id}`,
        "priceCurrency": "INR",
        "price": price,
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": "https://schema.org/InStock"
      }
    };

    if (reviewCount > 0) {
      schemaObj.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": ratingValue,
        "reviewCount": reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      };
    }

    if (data.reviews && data.reviews.length > 0) {
      schemaObj.review = data.reviews.slice(0, 5).map(r => ({
        "@type": "Review",
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating,
          "bestRating": "5"
        },
        "author": {
          "@type": "Person",
          "name": r.name || "Verified Buyer"
        },
        "headline": r.title || "Excellent",
        "reviewBody": r.comment || ""
      }));
    }

    productSchema = schemaObj;
  }

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      <ProductClient 
        slug={data.product ? data.product.id : slug}
        initialProduct={data.product} 
        initialReviews={data.reviews} 
        initialRelatedProducts={data.relatedProducts} 
      />
    </>
  );
}
