import { supabase } from "../../../utils/supabase";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const { data: blog } = await supabase
      .from("blogs")
      .select("title, image, content")
      .eq("slug", slug)
      .single();
    
    if (blog) {
      const title = `${blog.title} | Maaz Oud Journal`;
      const cleanDesc = blog.content
        ? blog.content.replace(/<[^>]*>/g, '').slice(0, 155).trim() + "..."
        : `Read our latest article: ${blog.title} on the Maaz Oud Journal. Learn about traditional Indian attars, oud extraction, and fragrance guides.`;
      
      const imageUrl = blog.image;
      return {
        title,
        description: cleanDesc,
        alternates: {
          canonical: `/blog/${slug}`
        },
        openGraph: {
          title,
          description: cleanDesc,
          type: "article",
          url: `https://www.maazoud.in/blog/${slug}`,
          siteName: "Maaz Oud",
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: blog.title,
            }
          ],
          locale: "en_US",
        },
        twitter: {
          card: "summary_large_image",
          title,
          description: cleanDesc,
          images: [imageUrl],
        }
      };
    }
  } catch (err) {
    console.error("Metadata generation error for blog:", err);
  }
  
  return {
    title: "Maaz Oud Journal | Fragrance Guides & Heritage",
    description: "Read our latest articles on pure oud extraction, attar heritage, and fragrance guides.",
    alternates: {
      canonical: "/"
    }
  };
}

export default function BlogLayout({ children }) {
  return <>{children}</>;
}
