import { supabase } from "../../utils/supabase";

export const revalidate = 3600; // Revalidate every 1 hour

export async function GET() {
  const baseUrl = "https://www.maazoud.in";

  // Current timestamp in W3C DateTime format with timezone
  const now = new Date().toISOString();

  // Static pages with their last modified dates
  const staticPages = [
    { loc: `${baseUrl}/`, lastmod: now },
    { loc: `${baseUrl}/about-us`, lastmod: now },
    { loc: `${baseUrl}/contact-us`, lastmod: now },
    { loc: `${baseUrl}/shipping-policy`, lastmod: now },
    { loc: `${baseUrl}/disclaimer`, lastmod: now },
    { loc: `${baseUrl}/privacy-policy`, lastmod: now },
  ];

  // Dynamic pages from Supabase
  const dynamicPages = [];

  try {
    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, created_at, updated_at");

    if (categories) {
      categories.forEach((c) => {
        dynamicPages.push({
          loc: `${baseUrl}/category/${c.slug}`,
          lastmod: new Date(c.updated_at || c.created_at || now).toISOString(),
        });
      });
    }

    // Fetch products
    const { data: products } = await supabase
      .from("products")
      .select("id, created_at, updated_at");

    if (products) {
      products.forEach((p) => {
        dynamicPages.push({
          loc: `${baseUrl}/product/${p.id}`,
          lastmod: new Date(p.updated_at || p.created_at || now).toISOString(),
        });
      });
    }

    // Fetch blogs
    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, created_at, updated_at");

    if (blogs) {
      blogs.forEach((b) => {
        dynamicPages.push({
          loc: `${baseUrl}/blog/${b.slug}`,
          lastmod: new Date(b.updated_at || b.created_at || now).toISOString(),
        });
      });
    }
  } catch (e) {
    console.error("Sitemap generation error:", e);
  }

  const allPages = [...staticPages, ...dynamicPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
