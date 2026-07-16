import { supabase } from "../../../utils/supabase";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const { data: product } = await supabase
      .from("products")
      .select("name, description, image")
      .eq("id", slug)
      .single();
    
    if (product) {
      const title = `${product.name} Attar | Long-Lasting Pure Perfume Oil`;
      const cleanDesc = product.description 
        ? product.description.replace(/<[^>]*>/g, '').slice(0, 155).trim() + "..."
        : `Buy ${product.name} attar by Maaz Oud. A premium, long-lasting fragrance oil made from 100% pure alcohol-free ingredients. Free shipping across India.`;
      
      const imageUrl = product.image;
      return {
        title,
        description: cleanDesc,
        alternates: {
          canonical: `/product/${slug}`
        },
        openGraph: {
          title: `${title} | Maaz Oud`,
          description: cleanDesc,
          type: "product",
          url: `https://www.maazoud.in/product/${slug}`,
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
