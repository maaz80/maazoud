import React from "react";
import Link from "next/link";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";

export const metadata = {
  title: "Privacy Policy & Secure Shopping",
  description: "Read the Privacy Policy of Maaz Oud. Learn how we securely protect customer accounts, OTP verification codes, and transaction details.",
  alternates: {
    canonical: "/privacy-policy"
  },
  openGraph: {
    title: "Privacy Policy & Secure Shopping | Maaz Oud",
    description: "Read the Privacy Policy of Maaz Oud. Learn how we securely protect customer accounts, OTP verification codes, and transaction details.",
    url: "https://maazoud.in/privacy-policy",
    siteName: "Maaz Oud",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy & Secure Shopping | Maaz Oud",
    description: "Read the Privacy Policy of Maaz Oud. Learn how we securely protect customer accounts, OTP verification codes, and transaction details.",
  }
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-stone-50 font-sans min-h-screen text-stone-900 pb-16">
      
      {/* Hero Header */}
      <div className="relative bg-stone-950 text-white py-16 md:py-24 overflow-hidden border-b border-stone-850">
        <div className="absolute inset-0 z-0 bg-[url('/images/oud_banner_1.jpg')] bg-cover bg-center opacity-10 blur-[1px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-stone-400 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors mb-2"
          >
            <FaArrowLeft size={10} />
            Back to Catalog
          </Link>
          <h1 id="privacy-heading" className="text-3xl md:text-5xl font-serif font-bold tracking-wide">
            Privacy Policy
          </h1>
          <div className="w-16 h-0.5 bg-[#8c6239] mx-auto my-3" />
          <p className="text-xs md:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed font-light">
            Effective Date: July 5, 2026. How we manage and safeguard your personal information.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 mt-12">
        <div className="bg-white border border-stone-200 p-8 rounded-lg shadow-sm space-y-8 text-xs text-stone-600 font-light leading-relaxed">
          
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-3 text-stone-900">
            <FaShieldAlt className="text-[#8c6239]" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider">Our Privacy Commitment</h2>
          </div>

          <p>
            At <strong>Maaz Oud</strong>, operated by Maaz Shakeel, we respect your privacy and are committed to protecting it. This Privacy Policy explains how we collect, use, and store your personal information when you visit or make a purchase from our website.
          </p>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">1. Data Collection</h3>
            <p>
              When you interact with our website, we collect necessary personal information to process your orders and manage your account:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Account Info:</strong> Email address for login and passwordless OTP verification.</li>
              <li><strong>Checkout Info:</strong> Customer name, billing/shipping address, phone number, city, state, and pincode.</li>
              <li><strong>System Cache:</strong> Dynamic cart items sync data to preserve products inside your shopping bag.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">2. Secure Account Storage</h3>
            <p>
              All customer profiles, account details, and order history records are stored and processed securely using industry-standard database protection protocols.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>We implement strict access control measures to ensure that your private delivery address and contact details can only be accessed by your verified session.</li>
              <li>Verification codes are handled directly via secure verification protocols, eliminating standard password-theft and account takeover vulnerabilities.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">3. Payment Processing</h3>
            <p>
              Online card/UPI payments are integrated securely via verified third-party payment gateways (e.g. Razorpay). Maaz Oud does not collect or store your private credit/debit card numbers or bank credentials on our local servers.
            </p>
          </section>

          <section className="space-y-3 p-4 bg-stone-50 border border-stone-150 rounded text-stone-700">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">4. Important Return Policy</h3>
            <p className="leading-relaxed">
              <strong>Please Note:</strong> Because attars and oud oils are personal care products, hygienic integrity is critical. To ensure that every customer receives 100% pure, untainted, and factory-sealed oils, <strong>all sales are final. Products sold on Maaz Oud are non-returnable and non-exchangeable</strong> once delivered. We appreciate your understanding in helping us maintain the highest standards of purity.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">5. Contact Information</h3>
            <p>
              If you have any questions regarding our privacy practices or wish to request data deletion, please contact us at:
              <br />
              <strong className="block text-stone-900 mt-2">Maaz Oud Support</strong>
              Email: <a href="mailto:maazoudofficial@gmail.com" className="text-[#8c6239] hover:underline">maazoudofficial@gmail.com</a>
              <br />
              Address: Sabzi Mandi, Station Road, Jaunpur, Uttar Pradesh - 222001
            </p>
          </section>

        </div>
      </div>

    </div>
  );
}
