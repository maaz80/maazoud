import { supabase } from "../../utils/supabase";

export const revalidate = 3600; // Revalidate every 1 hour

function formatKolkataDate(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toISOString();
  
  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(d);
  const getPart = (type) => parts.find((p) => p.type === type).value;
  
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  let hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");
  
  if (hour === "24") hour = "00";
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+05:30`;
}

export async function GET() {
  const baseUrl = "https://www.maazoud.in";
  const now = new Date();

  // Static pages with their last modified dates
  const staticPages = [
    { loc: `${baseUrl}/`, lastmod: formatKolkataDate(now) },
    { loc: `${baseUrl}/about-us`, lastmod: formatKolkataDate(now) },
    { loc: `${baseUrl}/blog`, lastmod: formatKolkataDate(now) },
    { loc: `${baseUrl}/contact-us`, lastmod: formatKolkataDate(now) },
    { loc: `${baseUrl}/shipping-policy`, lastmod: formatKolkataDate(now) },
    { loc: `${baseUrl}/disclaimer`, lastmod: formatKolkataDate(now) },
    { loc: `${baseUrl}/privacy-policy`, lastmod: formatKolkataDate(now) },
  ];

  // Dynamic pages from Supabase
  const dynamicPages = [];

  try {
    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, created_at");

    if (categories) {
      categories.forEach((c) => {
        dynamicPages.push({
          loc: `${baseUrl}/category/${c.slug}`,
          lastmod: formatKolkataDate(c.created_at || now),
        });
      });
    }

    // Fetch products
    const { data: products } = await supabase
      .from("products")
      .select("id, created_at");

    if (products) {
      products.forEach((p) => {
        dynamicPages.push({
          loc: `${baseUrl}/product/${p.id}`,
          lastmod: formatKolkataDate(p.created_at || now),
        });
      });
    }

    // Fetch blogs
    const { data: blogs } = await supabase
      .from("blogs")
      .select("slug, created_at");

    if (blogs) {
      blogs.forEach((b) => {
        dynamicPages.push({
          loc: `${baseUrl}/blog/${b.slug}`,
          lastmod: formatKolkataDate(b.created_at || now),
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
    <loc>${page.loc.replace(/&/g, "&amp;")}</loc>
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
