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

  const { data: allProducts, error } = await supabase.from("products").select("id, name, description, image");
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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    let { data: product, error: prodErr } = await supabase
      .from("products")
      .select("id, name, description, image")
      .eq("id", slug)
      .single();
    
    if (prodErr || !product) {
      const fallbackProduct = await findProductBySlug(slug);
      if (fallbackProduct) {
        product = fallbackProduct;
      }
    }
    
    if (product) {
      const title = `${product.name} Attar | Long-Lasting Pure Perfume Oil`;
      const cleanDesc = product.description 
        ? product.description.replace(/<[^>]*>/g, '').slice(0, 155).trim() + "..."
        : `Buy ${product.name} attar by Maaz Oud. A premium, long-lasting fragrance oil made from 100% pure alcohol-free ingredients. Free shipping across India.`;
      
      const imageUrl = product.image;
      const productCanonical = `/product/${product.id}`;
      return {
        title,
        description: cleanDesc,
        alternates: {
          canonical: productCanonical
        },
        openGraph: {
          title: `${title} | Maaz Oud`,
          description: cleanDesc,
          type: "website",
          url: `https://www.maazoud.in${productCanonical}`,
          siteName: "Maaz Oud",
          images: [
            {
              url: imageUrl,
              width: 800,
              height: 800,
              alt: product.name,
            }
          ],
          locale: "en_US",
        },
        twitter: {
          card: "summary_large_image",
          title: `${title} | Maaz Oud`,
          description: cleanDesc,
          images: [imageUrl],
        }
      };
    }
  } catch (err) {
    console.error("Metadata generation error for product:", err);
  }
  
  return {
    title: "Premium Luxury Attars & Perfumes",
    description: "Shop premium luxury attars and organic pure perfume oils.",
    alternates: {
      canonical: "/"
    }
  };
}

export default function ProductLayout({ children }) {
  return <>{children}</>;
}
