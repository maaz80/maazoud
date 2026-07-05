export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/_next/",
        "/order-success",
      ],
    },
    sitemap: "https://maazoud.in/sitemap.xml",
  };
}
