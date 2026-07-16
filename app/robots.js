export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/_next/",
        "/order-success",
        "/profile",
      ],
    },
    sitemap: "https://www.maazoud.in/sitemap.xml",
  };
}
