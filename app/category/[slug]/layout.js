import { supabase } from "../../../utils/supabase";

export async function generateMetadata({ params }) {
  // Await params in Next.js 16/15 to handle them correctly
  const { slug } = await params;
  try {
    const { data: category } = await supabase
      .from("categories")
      .select("name, description, image")
      .eq("slug", slug)
      .single();
    
    if (category) {
      const title = `${category.name} Attars Collection | Premium Fragrances`;
      const description = category.description || `Explore our exquisite collection of premium, 100% pure alcohol-free ${category.name} attars and luxury perfume oils at Maaz Oud.`;
      const imageUrl = category.image || "https://www.maazoud.in/maazoud-logo.webp";
      return {
        title,
        description,
        alternates: {
          canonical: `/category/${slug}`
        },
        openGraph: {
          title: `${title} | Maaz Oud`,
          description,
          type: "website",
          url: `https://www.maazoud.in/category/${slug}`,
          siteName: "Maaz Oud",
          images: [
            {
              url: imageUrl,
              width: 800,
              height: 800,
              alt: category.name,
            }
          ],
          locale: "en_US",
        },
        twitter: {
          card: "summary_large_image",
          title: `${title} | Maaz Oud`,
          description,
          images: [imageUrl],
        }
      };
    }
  } catch (err) {
    console.error("Metadata generation error for category:", err);
  }
  
  return {
    title: "Premium Attars Collection",
    description: "Shop luxury attars and organic pure perfume oils by category.",
    alternates: {
      canonical: "/"
    }
  };
}

export default function CategoryLayout({ children }) {
  return <>{children}</>;
}
