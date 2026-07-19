import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import OrdersModal from "../components/OrdersModal";
import LoginModal from "../components/LoginModal";
import ScrollToTop from "../components/ScrollToTop";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL("https://www.maazoud.in"),
  applicationName: "Maaz Oud",
  title: {
    default: "Maaz Oud | Best Oud Attar & Pure Perfume Oils in India",
    template: "%s | Maaz Oud"
  },
  alternates: {
    canonical: "/"
  },
  description: "Buy premium oud attar online at Maaz Oud. Discover the best long-lasting attar for men & women in India. Explore pure, alcohol-free perfume oils, natural ittar, premium khas, mitti attar, and luxury oud fragrances.",
  keywords: [
    "maaz oud",
    "best oud attar in india",
    "buy original oud attar online",
    "pure oud perfume oil price",
    "long lasting attar for men",
    "alcohol-free perfume oil india",
    "natural ittar online",
    "ruh khus attar",
    "khas attar",
    "mitti attar",
    "black musk attar",
    "kasturi musk",
    "organic oud perfumes",
    "non-alcoholic fragrances",
    "pure perfume oil",
    "khushbu",
    "oud fragrance online"
  ],
  openGraph: {
    title: "Maaz Oud | Best Oud Attar & Pure Perfume Oils in India",
    description: "Buy premium oud attar online at Maaz Oud. Discover the best long-lasting attar for men & women in India. Explore pure, alcohol-free perfume oils, natural ittar, premium khas, mitti attar, and luxury oud fragrances.",
    url: "https://www.maazoud.in",
    siteName: "Maaz Oud",
    images: [
      {
        url: "/maazoud-logo.webp",
        width: 1200,
        height: 630,
        alt: "Maaz Oud Luxury Perfumes"
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Maaz Oud | Best Oud Attar & Pure Perfume Oils in India",
    description: "Buy premium oud attar online at Maaz Oud. Discover the best long-lasting attar for men & women in India. Explore pure, alcohol-free perfume oils, natural ittar, premium khas, mitti attar, and luxury oud fragrances.",
    images: ["/maazoud-logo.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#1c1917',
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <head>
        {/* Google Site Name Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "@id": "https://maazoud.in/#website",
              "name": "Maaz Oud",
              "alternateName": "MaazOud",
              "url": "https://maazoud.in/"
            })
          }}
        />
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Maaz Oud",
              "url": "https://maazoud.in/",
              "logo": "https://maazoud.in/maazoud-logo.webp",
              "description": "Experience the ultimate luxury of pure Cambodian Oud, Indian Agarwood, non-alcoholic botanical attars, and premium natural fragrances.",
              "telephone": "+919616584237",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Jaunpur",
                "addressRegion": "Uttar Pradesh",
                "addressCountry": "IN"
              }
            })
          }}
        />
        {/* Product Rating Schema for Search Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Maaz Oud Luxury Perfumes",
              "image": "https://maazoud.in/maazoud-logo.webp",
              "description": "Premium collection of pure Cambodian Oud, Indian Agarwood, and non-alcoholic botanical attars.",
              "brand": {
                "@type": "Brand",
                "name": "Maaz Oud"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "ratingCount": "184",
                "bestRating": "5",
                "worstRating": "1"
              }
            })
          }}
        />
        <link rel="preconnect" href="https://fdfvzzqiyyhxowftegpl.supabase.co" crossOrigin="anonymous" />
      </head>
      <body className={`${poppins.className} min-h-full flex flex-col bg-white text-stone-900`}>
        {/* Google Analytics 4 Tracking */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity Tracking */}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script id="microsoft-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window,document,"clarity","script","${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
            `}
          </Script>
        )}

        <CartProvider>
          <ScrollToTop />
          <Navbar />
          <main className="grow">{children}</main>
          <Footer />
          <CartDrawer />
          <OrdersModal />
          <LoginModal />
        </CartProvider>
      </body>
    </html>
  );
}

