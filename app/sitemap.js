import { supabase } from "../utils/supabase";

export default async function sitemap() {
  const baseUrl = "https://maazoud.in";

  // 1. Static pages
  const staticUrls = [
    "",
    "/about",
    "/contact",
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
    const { data: categories } = await supabase.from("categories").select("slug");
    const categoryUrls = (categories || []).map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: new Date().toISOString().split("T")[0],
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    // 3. Dynamic Products
    const { data: products } = await supabase.from("products").select("id");
    const productUrls = (products || []).map((prod) => ({
      url: `${baseUrl}/product/${prod.id}`,
      lastModified: new Date().toISOString().split("T")[0],
      changeFrequency: "daily",
      priority: 0.9,
    }));

    // 4. Dynamic Blogs
    const { data: blogs } = await supabase.from("blogs").select("slug");
    const blogUrls = (blogs || []).map((blog) => ({
      url: `${baseUrl}/blog/${blog.slug}`,
      lastModified: new Date().toISOString().split("T")[0],
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    return [...staticUrls, ...categoryUrls, ...productUrls, ...blogUrls];
  } catch (err) {
    console.error("Sitemap generation error:", err);
    return staticUrls;
  }
}
