import { supabase } from "../../utils/supabase";

export async function GET() {
  const baseUrl = "https://www.maazoud.in";
  let items = `
    <item>
      <link>${baseUrl}/</link>
      <title>Maaz Oud | Luxury Pure Attars &amp; Organic Oud Perfumes</title>
      <ror:updatePeriod>day</ror:updatePeriod>
      <ror:sortOrder>1</ror:sortOrder>
      <ror:resourceOf>sitemap</ror:resourceOf>
    </item>
    <item>
      <link>${baseUrl}/about-us</link>
      <title>About Our Heritage | Traditional Attar Distillation</title>
      <ror:updatePeriod>week</ror:updatePeriod>
      <ror:sortOrder>2</ror:sortOrder>
      <ror:resourceOf>sitemap</ror:resourceOf>
    </item>
    <item>
      <link>${baseUrl}/contact-us</link>
      <title>Contact Us | Customer Support &amp; Gifting Queries</title>
      <ror:updatePeriod>week</ror:updatePeriod>
      <ror:sortOrder>2</ror:sortOrder>
      <ror:resourceOf>sitemap</ror:resourceOf>
    </item>
    <item>
      <link>${baseUrl}/shipping-policy</link>
      <title>Shipping &amp; Returns Policy | Hassle-Free Delivery</title>
      <ror:updatePeriod>month</ror:updatePeriod>
      <ror:sortOrder>3</ror:sortOrder>
      <ror:resourceOf>sitemap</ror:resourceOf>
    </item>
    <item>
      <link>${baseUrl}/disclaimer</link>
      <title>Disclaimer &amp; Skin Sensitivity Info</title>
      <ror:updatePeriod>month</ror:updatePeriod>
      <ror:sortOrder>3</ror:sortOrder>
      <ror:resourceOf>sitemap</ror:resourceOf>
    </item>
    <item>
      <link>${baseUrl}/privacy-policy</link>
      <title>Privacy Policy &amp; Secure Shopping</title>
      <ror:updatePeriod>month</ror:updatePeriod>
      <ror:sortOrder>3</ror:sortOrder>
      <ror:resourceOf>sitemap</ror:resourceOf>
    </item>
  `;

  try {
    const { data: categories } = await supabase.from("categories").select("name, slug");
    if (categories) {
      categories.forEach(c => {
        items += `
          <item>
            <link>${baseUrl}/category/${c.slug}</link>
            <title>${c.name.replace(/&/g, "&amp;")} Attars Collection</title>
            <ror:updatePeriod>week</ror:updatePeriod>
            <ror:sortOrder>3</ror:sortOrder>
            <ror:resourceOf>sitemap</ror:resourceOf>
          </item>
        `;
      });
    }

    const { data: products } = await supabase.from("products").select("name, id");
    if (products) {
      products.forEach(p => {
        items += `
          <item>
            <link>${baseUrl}/product/${p.id}</link>
            <title>${p.name.replace(/&/g, "&amp;")} Attar | Premium Fragrance</title>
            <ror:updatePeriod>day</ror:updatePeriod>
            <ror:sortOrder>2</ror:sortOrder>
            <ror:resourceOf>sitemap</ror:resourceOf>
          </item>
        `;
      });
    }

    const { data: blogs } = await supabase.from("blogs").select("title, slug");
    if (blogs) {
      blogs.forEach(b => {
        items += `
          <item>
            <link>${baseUrl}/blog/${b.slug}</link>
            <title>${b.title.replace(/&/g, "&amp;")} | Maaz Oud Journal</title>
            <ror:updatePeriod>week</ror:updatePeriod>
            <ror:sortOrder>3</ror:sortOrder>
            <ror:resourceOf>sitemap</ror:resourceOf>
          </item>
        `;
      });
    }
  } catch (e) {
    console.error(e);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:ror="http://www.rorweb.com/0.1/">
  <channel>
    <title>ROR Sitemap for Maaz Oud</title>
    <link>${baseUrl}</link>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
