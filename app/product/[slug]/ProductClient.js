"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PRODUCTS } from "../../../utils/mockData";
import ProductCard from "../../../components/ProductCard";
import BlogsSection from "../../../components/BlogsSection";
import { getImageAlt, getOptimizedImageUrl, supabaseLoader } from "../../../utils/imageHelper";
import { useCart } from "../../../context/CartContext";
import { FaArrowLeft, FaArrowRight, FaStar, FaRegStar, FaShoppingBag, FaPlus, FaMinus } from "react-icons/fa";
import { supabase } from "../../../utils/supabase";

const normalizeProductSlug = (value = "") => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const findProductBySlug = async (slug) => {
  const decodedSlug = decodeURIComponent(String(slug || "")).trim();
  const normalizedTarget = normalizeProductSlug(decodedSlug);

  const { data: allProducts, error } = await supabase.from("products").select("*");
  if (error) throw error;

  if (!allProducts || allProducts.length === 0) return null;

  const exactMatches = allProducts.filter((product) => {
    const candidates = [product.id, product.slug, product.name].filter(Boolean).map(String);
    return candidates.some((candidate) => normalizeProductSlug(candidate) === normalizedTarget);
  });

  if (exactMatches.length > 0) {
    return exactMatches[0];
  }

  return null;
};

export default function ProductClient({ slug, initialProduct, initialReviews, initialRelatedProducts, initialBlogs }) {
  const { cart, addToCart, triggerBuyNow } = useCart();

  const [product, setProduct] = useState(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState(initialRelatedProducts || []);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("3ml");
  const [loading, setLoading] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic Review State
  const [reviews, setReviews] = useState(initialReviews || []);
  const [reviewPage, setReviewPage] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const [newReview, setNewReview] = useState({ name: "", rating: 5, title: "", comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const totalReviews = reviews.length > 0 ? reviews.length : (product?.ratingcount || 0);
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : (product?.rating || 5.0).toFixed(1);

  const fetchReviewsAndProduct = async () => {
    const { data: revData } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", slug)
      .order("created_at", { ascending: false });

    if (revData) {
      const mapped = revData.map(r => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
      }));
      setReviews(mapped);
    }

    const fallbackProduct = await findProductBySlug(slug);
    if (fallbackProduct) {
      setProduct(fallbackProduct);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess(false);

    if (!newReview.name.trim()) {
      setReviewError("Please enter your name.");
      return;
    }
    if (!newReview.title.trim()) {
      setReviewError("Please enter a review title.");
      return;
    }
    if (!newReview.comment.trim()) {
      setReviewError("Please write your review comments.");
      return;
    }

    try {
      const { error } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: slug,
            name: newReview.name.trim(),
            rating: newReview.rating,
            title: newReview.title.trim(),
            comment: newReview.comment.trim()
          }
        ]);

      if (error) throw error;

      setNewReview({ name: "", rating: 5, title: "", comment: "" });
      setReviewSuccess(true);
      setShowReviewForm(false);

      await fetchReviewsAndProduct();
    } catch (err) {
      setReviewError(err.message || "Failed to submit review.");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }, (_, i) => {
          const starNumber = i + 1;
          return starNumber <= rating ? (
            <FaStar key={i} size={14} />
          ) : (
            <FaRegStar key={i} size={14} />
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!slug) return;
      if (product && product.id === slug) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const fallbackProduct = await findProductBySlug(slug);

        if (!fallbackProduct) {
          throw new Error("Product not found");
        }

        const prodData = fallbackProduct;
        setProduct(prodData);

        const prodCategories = Array.isArray(prodData.category) ? prodData.category : (prodData.category ? [prodData.category] : []);
        const [revRes, relRes] = await Promise.all([
          supabase.from("reviews").select("*").eq("product_id", slug).order("created_at", { ascending: false }),
          supabase.from("products").select("*").overlaps("category", prodCategories).neq("id", prodData.id).limit(4)
        ]);

        if (revRes.data) {
          const mapped = revRes.data.map(r => ({
            id: r.id,
            name: r.name,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            date: new Date(r.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
          }));
          setReviews(mapped);
        }

        if (relRes.data && relRes.data.length > 0) {
          let mappedRel = relRes.data.map(p => {
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

          if (mappedRel.length < 4) {
            const { data: allProds } = await supabase
              .from("products")
              .select("*")
              .neq("id", prodData.id)
              .limit(8);

            if (allProds) {
              const extraProds = allProds
                .filter(ap => !mappedRel.some(mr => mr.id === ap.id))
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
              mappedRel = [...mappedRel, ...extraProds].slice(0, 4);
            }
          }
          setRelatedProducts(mappedRel);
        } else {
          const { data: fallbackProds } = await supabase
            .from("products")
            .select("*")
            .neq("id", prodData.id)
            .limit(4);

          if (fallbackProds) {
            const mappedFallback = fallbackProds.map(p => {
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
            setRelatedProducts(mappedFallback);
          } else {
            setRelatedProducts([]);
          }
        }
      } catch (err) {
        console.error("Error loading product details:", err.message);
        const foundProduct = PRODUCTS.find((p) => p.slug === slug);
        setProduct(foundProduct || null);
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
          setRelatedProducts(related.slice(0, 4));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
    setQuantity(1);
    setSelectedSize("3ml");
    setActiveImageIndex(0);
    setReviewPage(1);
    setShowReviewForm(false);
  }, [slug]);

  if (!slug) return null;

  if (loading) {
    return (
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 animate-pulse font-sans bg-white min-h-screen">
        <div className="h-6 w-24 bg-stone-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start">
          <div className="aspect-4/4 bg-stone-200 rounded-lg" />
          <div className="space-y-6">
            <div className="h-4 w-32 bg-stone-200 rounded" />
            <div className="h-8 w-3/4 bg-stone-200 rounded" />
            <div className="h-4 w-1/4 bg-stone-200 rounded" />
            <div className="h-10 w-1/3 bg-stone-200 rounded" />
            <div className="space-y-2">
              <div className="h-4 w-24 bg-stone-200 rounded" />
              <div className="flex gap-2">
                <div className="h-10 w-16 bg-stone-200 rounded" />
                <div className="h-10 w-16 bg-stone-200 rounded" />
              </div>
            </div>
            <div className="h-12 w-full bg-stone-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4 font-sans bg-white min-h-screen">
        <h2 className="text-xl font-bold text-stone-900">Product Not Found</h2>
        <p className="text-sm text-stone-500">The product you are looking for does not exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white hover:bg-[#8c6239] text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
        >
          <FaArrowLeft size={10} />
          Back to Home
        </Link>
      </div>
    );
  }

  let currentPrice = 0;
  let currentOriginalPrice = 0;

  if (product.price3mloffer !== undefined) {
    if (selectedSize === "3ml") {
      currentPrice = product.price3mloffer;
      currentOriginalPrice = product.price3mlorig || product.price3mloffer;
    } else if (selectedSize === "6ml") {
      currentPrice = product.price6mloffer;
      currentOriginalPrice = product.price6mlorig || product.price6mloffer;
    }
  } else {
    let sizeMultiplier = 1;
    if (selectedSize === "6ml") sizeMultiplier = 1.8;
    currentPrice = Math.round(product.price * sizeMultiplier);
    currentOriginalPrice = Math.round(product.originalPrice * sizeMultiplier);
  }

  const isComboProduct = Boolean(product?.description && String(product.description).includes('<!-- product-type:combo -->'));
  const isAdded = product ? cart.some(item => item.cartItemId === `${product.id}-${selectedSize}`) : false;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, currentPrice);
  };

  const handleBuyNow = () => {
    triggerBuyNow(product, quantity, selectedSize, currentPrice);
  };

  const reviewsPerPage = 4;
  const totalReviewPages = Math.ceil(reviews.length / reviewsPerPage);
  const indexOfLastReview = reviewPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((rev) => {
    const r = Math.round(rev.rating);
    if (starCounts[r] !== undefined) {
      starCounts[r]++;
    }
  });

  const finalReviewCount = totalReviews > 0 ? totalReviews : 1;
  const finalRatingValue = totalReviews > 0 ? averageRating : (product?.rating || 5.0).toFixed(1);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images && product.images.length > 0 ? product.images : [product.image],
    "description": product.description ? product.description.replace(/<[^>]*>/g, '').slice(0, 160).trim() : "",
    "sku": product.id,
    "mpn": product.id,
    "brand": {
      "@type": "Brand",
      "name": "Maaz Oud"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.maazoud.in/product/${product.id}`,
      "priceCurrency": "INR",
      "price": currentPrice,
      "priceValidUntil": "2030-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Maaz Oud"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": finalRatingValue,
      "reviewCount": finalReviewCount,
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": reviews.length > 0 
      ? reviews.slice(0, 5).map((r) => ({
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": r.name || "Verified Buyer"
          },
          "datePublished": new Date(r.created_at || Date.now()).toISOString().split("T")[0],
          "reviewBody": r.comment || "",
          "name": r.title || "Excellent",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": r.rating,
            "bestRating": "5",
            "worstRating": "1"
          }
        }))
      : [
          {
            "@type": "Review",
            "author": {
              "@type": "Person",
              "name": "Verified Buyer"
            },
            "datePublished": new Date(product?.created_at || Date.now()).toISOString().split("T")[0],
            "reviewBody": `Extremely long-lasting and premium ${product.name} attar from Maaz Oud. Highly recommended.`,
            "name": "Excellent Fragrance",
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": Math.round(parseFloat(finalRatingValue)),
              "bestRating": "5",
              "worstRating": "1"
            }
          }
        ]
  };

  return (
    <div className="bg-white min-h-screen pb-12 pt-4 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3 md:space-y-8">

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-stone-500 hover:text-black text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <FaArrowLeft size={10} />
            Back to Collection
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-start">

          <div className="space-y-4 w-full">
            <div className="relative aspect-4/4 w-full rounded-md border border-stone-200 overflow-hidden bg-stone-50 shadow-sm group">
              <Image
                loader={supabaseLoader}
                src={(product.images && product.images.length > 0) ? product.images[activeImageIndex] : product.image}
                alt={getImageAlt((product.images && product.images.length > 0) ? product.images[activeImageIndex] : product.image, product.name)}
                width={640}
                height={640}
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 640px"
                className="w-full h-full object-contain transition-all duration-300"
              />

              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-[#8c6239] hover:text-white rounded-full text-black transition-all shadow-md opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <FaArrowLeft size={10} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-[#8c6239] hover:text-white rounded-full text-black transition-all shadow-md opacity-0 group-hover:opacity-100 cursor-pointer"
                    aria-label="Next image"
                  >
                    <FaArrowRight size={10} />
                  </button>
                </>
              )}

              {product.discount > 0 && (
                <span className="absolute top-4 left-4 bg-[#8c6239] text-white text-xs uppercase font-bold tracking-widest px-3 py-1.5 rounded shadow">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-16 rounded border overflow-hidden bg-stone-50 shrink-0 transition-all cursor-pointer ${activeImageIndex === idx
                      ? "border-[#8c6239] ring-1 ring-[#8c6239]"
                      : "border-stone-200 hover:border-stone-400"
                      }`}
                  >
                    <Image
                      loader={supabaseLoader}
                      src={img}
                      width={56}
                      height={64}
                      className="w-full h-full object-contain"
                      alt={getImageAlt(img, `${product.name} thumbnail ${idx + 1}`)}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="hidden md:block">
              <ProductFAQ product={product} />
            </div>
          </div>

          <div className="space-y-6">

            <div className="flex items-start justify-between gap-4 text-xs">
              <span className="text-[#8c6239] font-bold uppercase tracking-widest leading-relaxed">
                {Array.isArray(product.category)
                  ? product.category.map(c => c.replace("-", " ")).join(", ")
                  : (product.category ? product.category.replace("-", " ") : "top-selling")}
              </span>
              <div className="flex items-center gap-1.5 text-stone-700 shrink-0 mt-0.5">
                <FaStar className="text-amber-500" size={14} />
                <span className="font-bold">{averageRating}</span>
                <span className="text-stone-600">({totalReviews} reviews)</span>
              </div>
            </div>

            <div className="space-y-1 md:space-y-3">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 leading-tight">
                {product.name}
              </h1>
              <span className="inline-block text-xs font-medium text-stone-600 bg-stone-100 px-3 py-1 rounded">
                Base Size: {product.size || "3ml"}
              </span>
            </div>

            <div className="border-t border-b border-stone-100 pt-1 md:py-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-stone-900">Rs. {currentPrice}</span>
              {currentOriginalPrice > currentPrice && (
                <>
                  <span className="text-sm text-stone-600 line-through">Rs. {currentOriginalPrice}</span>
                  <span className="text-xs text-[#8c6239] font-bold">
                    You save Rs. {currentOriginalPrice - currentPrice}
                  </span>
                </>
              )}
            </div>

            {!isComboProduct && (
              <div className="space-y-2.5 -mt-2 md:mt-0">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Select Bottle Size
                </label>
                <div className="flex gap-3">
                  {["3ml", "6ml"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 text-xs font-bold border rounded transition-all cursor-pointer ${selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">

              <div className="flex items-center justify-between border border-stone-300 rounded-md">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-stone-500 hover:text-black transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <FaMinus size={12} />
                </button>
                <span className="px-4 text-sm font-bold text-stone-800 select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2.5 text-stone-500 hover:text-black transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <FaPlus size={12} />
                </button>
              </div>

              <div className="flex flex-1 gap-3">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-md transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border ${isAdded
                    ? "bg-green-700 hover:bg-green-800 text-white border-green-750"
                    : "border-black hover:bg-stone-50 text-black"
                    }`}
                >
                  <FaShoppingBag size={14} />
                  {isAdded ? "Added to Cart ✓" : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="flex-1 py-3 bg-[#8c6239] hover:bg-[#5c3e21] text-white text-xs font-bold uppercase tracking-widest rounded-md transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  Buy Now
                </button>
              </div>

            </div>

            <div className="border-t border-stone-100 pt-6 space-y-2 text-left">
              <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Product Description
              </h2>
              <div
                className="text-sm text-stone-600 font-light leading-relaxed prose prose-stone max-w-none product-content"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

          </div>
        </div>

        <section className="border-t border-stone-200 pt-12 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16">

          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Customer Reviews
            </h2>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-stone-50 rounded-md border border-stone-150 font-sans">
              <div className="flex flex-col items-center text-center space-y-2 sm:pr-6 sm:border-r border-stone-200 shrink-0">
                <span className="text-5xl font-extrabold text-stone-900 leading-none">
                  {averageRating}
                </span>
                <div>
                  {renderStars(Math.round(parseFloat(averageRating)))}
                </div>
                <span className="text-xs text-stone-500 font-light block">
                  {totalReviews} reviews
                </span>
              </div>

              <div className="grow w-full space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = starCounts[star] || 0;
                  const total = reviews.length;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs text-stone-600 font-medium">
                      <span className="w-2 text-right">{star}</span>
                      <span className="text-amber-500">★</span>

                      <div className="grow bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#242b35] h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="w-6 text-right text-stone-400 font-light">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {reviewSuccess && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded border border-green-200 text-center font-semibold">
                  Thank you! Your review was posted successfully.
                </div>
              )}

              <button
                onClick={() => {
                  setReviewError("");
                  if (!showReviewForm) setReviewSuccess(false);
                  setShowReviewForm(!showReviewForm);
                }}
                className="w-full px-5 py-2.5 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm text-center"
              >
                {showReviewForm ? "Cancel Review" : "Write a Review"}
              </button>
            </div>

            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} className="border border-stone-200 rounded-md p-5 bg-white space-y-4 transition-all duration-300">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-2">
                  Write a Customer Review
                </h3>

                {reviewError && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-100 text-center font-light">
                    {reviewError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider">
                    Rating *
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                        className="text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                      >
                        {star <= newReview.rating ? <FaStar size={20} /> : <FaRegStar size={20} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={newReview.name}
                    onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Review Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smells amazing!"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Comments *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write your honest review here..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded p-2 text-xs focus:ring-1 focus:ring-[#8c6239] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xs uppercase font-bold tracking-wider text-stone-500 border-b border-stone-100 pb-3">
              Customer Feedbacks ({totalReviews})
            </h2>

            <div className="space-y-6 divide-y divide-stone-100">
              {currentReviews.map((rev) => (
                <div key={rev.id} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-150 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-stone-750">
                        {rev.name ? rev.name.charAt(0).toUpperCase() : "U"}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">{rev.name}</span>
                        <span className="text-[8px] bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider px-1.5 py-0.5 rounded-full font-bold">
                          Verified Buyer
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-600 font-light block">
                        Reviewed on {rev.date}
                      </span>
                    </div>
                  </div>
                  {renderStars(rev.rating)}
                </div>
              ))}
            </div>

            {totalReviewPages > 1 && (
              <div className="flex items-center justify-center space-x-1.5 pt-6 border-t border-stone-100">
                {Array.from({ length: totalReviewPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setReviewPage(pageNum)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded transition-all cursor-pointer ${reviewPage === pageNum
                      ? "bg-black text-white"
                      : "bg-white border border-stone-200 text-stone-700 hover:border-black"
                      }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            )}
          </div>

        </section>

        {relatedProducts.length > 0 && (
          <section className="space-y-6 pt-12 border-t border-stone-100">
            <h2 className="text-xl font-serif font-bold text-stone-900">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        <BlogsSection initialBlogs={initialBlogs} />

        <div className="block md:hidden">
          <ProductFAQ product={product} />
        </div>

      </div>
    </div>
  );
}

function ProductFAQ({ product }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!product) return null;

  const isOud = product.name.toLowerCase().includes("oud") ||
    (product.description && product.description.toLowerCase().includes("oud"));
  const isMusk = product.name.toLowerCase().includes("musk") ||
    (product.description && product.description.toLowerCase().includes("musk"));

  let faqItems = [];

  if (isOud) {
    faqItems = [
      {
        question: `How long does ${product.name} stay on skin?`,
        answer: "Since this is a premium, highly concentrated Oud formulation without any alcohol dilution, it has outstanding longevity. On skin, it typically projects beautifully for 10 to 14 hours, and its deep resinous aroma can linger on clothing for multiple days."
      },
      {
        question: "Is this Oud oil animalic or sweet?",
        answer: "Our Oud oils are selected for their sophisticated profiles. Cambodian Oud variants (like Dehn Al Oud Yusuf Royale) carry sweet, smooth floral, and mild woody characters. Indian Oud variants (like Imperial Kalakassi Reserve) present a warm, leathery, and deeply complex opening that matures into a spiritual, sweet woody dry-down."
      },
      {
        question: "How is this premium Oud oil distilled?",
        answer: "Our Oud is steam-distilled using traditional vintage methods from the resinous heartwood of mature Aquilaria trees. The aging process after distillation ensures the oil loses harsh top notes, resulting in a smooth and rich experience."
      },
      {
        question: "Are these attars safe for daily skin application?",
        answer: "Absolutely. Our attars are 100% alcohol-free and formulated with pure essential oils and carrier oils. They are exceptionally gentle on the skin, but we always recommend a brief patch test on the wrist if you have highly sensitive skin."
      }
    ];
  } else if (isMusk) {
    faqItems = [
      {
        question: `What is the scent profile of ${product.name}?`,
        answer: "This depends on the blend. Our Kashmiri Kasturi Musk presents a warm, dark, powdery, and animalic character inspired by vintage deer musk. White Musk Imperial, on the other hand, is clean, soft, velvety, and soapy, designed specifically for a fresh aura in warm weather."
      },
      {
        question: "Is this musk ethically and cruelty-free sourced?",
        answer: "Yes, 100%. To protect wildlife, we do not use real deer musk pods. Instead, we use premium, high-grade botanical musk equivalents and cruelty-free, nature-identical reconstructions blended in rich sandalwood carrier oils."
      },
      {
        question: "Will this musk attar stain my clothes?",
        answer: "Clear musks like White Musk Imperial are completely transparent and safe for clothes. For darker musks like Kashmiri Kasturi, we recommend rubbing the oil between your palms first and dabbing it on fabrics, or avoiding contact with very light-colored silk or delicate garments."
      },
      {
        question: "How should I apply this musk for best results?",
        answer: "Apply a few drops of attar to your pulse points (wrists, behind the ears, and sides of the neck). The warm temperature at these points slowly diffuses the fragrance molecules throughout the day."
      }
    ];
  } else {
    faqItems = [
      {
        question: `How long does ${product.name} fragrance last?`,
        answer: "Since our attars are 100% pure oil concentrates without any alcohol dilution, they are extremely long-lasting. On skin, they typically last between 8 to 12 hours, and on clothing, the scent can linger for multiple days depending on the specific notes."
      },
      {
        question: "Are these attars 100% alcohol-free?",
        answer: "Yes, all Maaz Oud attars are 100% alcohol-free and made from natural botanical extracts, essential oils, and premium aged resins."
      },
      {
        question: "How should I apply the attar for best results?",
        answer: "Apply a few drops of attar to your pulse points: the wrists, behind the ears, and on the sides of the neck. You can also apply a small amount to your clothes (rubbing wrists together and spreading onto fabrics) for enhanced longevity."
      },
      {
        question: "Do you offer returns or exchanges?",
        answer: "To ensure hygiene and the absolute purity of our products for all customers, we do not accept returns on opened fragrance bottles. If you receive a damaged product or have questions about a scent, please contact our support team and we will happily resolve it for you."
      }
    ];
  }

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="border-t border-stone-200 pt-8 mt-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })
        }}
      />

      <h2 className="text-lg font-serif font-bold text-stone-900 mb-4">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="border border-stone-100 rounded-md overflow-hidden bg-stone-50/50">
              <button
                onClick={() => toggleFAQ(idx)}
                aria-expanded={isOpen}
                className="w-full flex justify-between items-center p-4 text-left font-semibold text-xs md:text-sm text-stone-800 cursor-pointer hover:bg-stone-50 transition-colors duration-200"
              >
                <span>{item.question}</span>
                <span className="text-stone-500 shrink-0 ml-2">
                  {isOpen ? <FaMinus size={10} /> : <FaPlus size={10} />}
                </span>
              </button>
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-40 border-t border-stone-100/50" : "max-h-0"
                  }`}
              >
                <p className="p-4 text-xs md:text-sm text-stone-600 font-light leading-relaxed bg-white">
                  {item.answer}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
