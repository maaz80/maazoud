import { supabase } from "../../utils/supabase";

export async function GET() {
  const baseUrl = "https://www.maazoud.in";
  const urls = [
    `${baseUrl}/`,
    `${baseUrl}/about-us`,
    `${baseUrl}/blog`,
    `${baseUrl}/contact-us`,
    `${baseUrl}/shipping-policy`,
    `${baseUrl}/disclaimer`,
    `${baseUrl}/privacy-policy`
  ];

  try {
    const { data: categories } = await supabase.from("categories").select("slug");
    if (categories) {
      categories.forEach(c => urls.push(`${baseUrl}/category/${c.slug}`));
    }

    const { data: products } = await supabase.from("products").select("id");
    if (products) {
      products.forEach(p => urls.push(`${baseUrl}/product/${p.id}`));
    }

    const { data: blogs } = await supabase.from("blogs").select("slug");
    if (blogs) {
      blogs.forEach(b => urls.push(`${baseUrl}/blog/${b.slug}`));
    }
  } catch (e) {
    console.error(e);
  }

  return new Response(urls.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
