import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import OrdersModal from "../components/OrdersModal";
import LoginModal from "../components/LoginModal";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  metadataBase: new URL("https://maazoud.vercel.app"),
  title: {
    default: "Maaz Oud | Luxury Pure Attars & Organic Oud Perfumes",
    template: "%s | Maaz Oud"
  },
  description: "Experience the ultimate luxury of pure Cambodian Oud, Indian Agarwood, non-alcoholic botanical attars, and premium natural fragrances. Free shipping in India.",
  keywords: ["maaz oud", "luxury attars", "pure oud oil", "cambodian oud", "non-alcoholic attars", "indian perfume house", "organic fragrances"],
  openGraph: {
    title: "Maaz Oud | Luxury Pure Attars & Organic Oud Perfumes",
    description: "Experience the ultimate luxury of pure Cambodian Oud, Indian Agarwood, non-alcoholic botanical attars, and premium natural fragrances.",
    url: "https://maazoud.vercel.app",
    siteName: "Maaz Oud",
    images: [
      {
        url: "/maazoud-logo.png",
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
    title: "Maaz Oud | Luxury Pure Attars & Organic Oud Perfumes",
    description: "Experience the ultimate luxury of pure Cambodian Oud, Indian Agarwood, non-alcoholic botanical attars, and premium natural fragrances.",
    images: ["/maazoud-logo.png"],
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
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className={`${poppins.className} min-h-full flex flex-col bg-white text-stone-900`}>
        <CartProvider>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
          <CartDrawer />
          <OrdersModal />
          <LoginModal />
        </CartProvider>
      </body>
    </html>
  );
}

