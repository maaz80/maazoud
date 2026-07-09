import { supabase } from "../utils/supabase";

export const revalidate = 0; // Force dynamic sitemap on every request

export default async function sitemap() {
  const baseUrl = "https://maazoud.in";

  // 1. Static pages
  const staticUrls = [
    "",
    "/about-us",
    "/contact-us",
    "/shipping-policy",
    "/disclaimer",
    "/privacy-policy",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1.0 : 0.8,
  }));

  try {
    // 2. Dynamic Categories
    const { data: categories } = await supabase.from("categories").select("slug, image");
    const categoryUrls = (categories || []).map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date().toISOString().split("T")[0],
      changeFrequency: "weekly",
      priority: 0.7,
      ...(cat.image ? { images: [cat.image] } : {}),
    }));

    // 3. Dynamic Products
    const { data: products } = await supabase.from("products").select("id, image, images");
    const productUrls = (products || []).map((prod) => {
      const productImages = [];
      if (prod.image) productImages.push(prod.image);
      if (prod.images && Array.isArray(prod.images)) {
        prod.images.forEach(img => {
          if (img && !productImages.includes(img)) {
            productImages.push(img);
          }
        });
      }
      return {
        url: `${baseUrl}/product/${prod.id}`,
        lastModified: new Date().toISOString().split("T")[0],
        changeFrequency: "daily",
        priority: 0.9,
        ...(productImages.length > 0 ? { images: productImages } : {}),
      };
    });

    // 4. Dynamic Blogs
    const { data: blogs } = await supabase.from("blogs").select("slug, image");
    const blogUrls = (blogs || []).map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date().toISOString().split("T")[0],
      changeFrequency: "weekly",
      priority: 0.6,
      ...(blog.image ? { images: [blog.image] } : {}),
    }));

    return [...staticUrls, ...categoryUrls, ...productUrls, ...blogUrls];
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return staticUrls;
  }
}
