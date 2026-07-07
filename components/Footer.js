"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaInstagram, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { supabase } from "../utils/supabase";
import { CATEGORIES } from "../utils/mockData";

export default function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchFooterCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug");
        if (error) throw error;
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(CATEGORIES);
        }
      } catch (err) {
        console.error("Error loading footer categories:", err.message);
        setCategories(CATEGORIES);
      }
    };
    fetchFooterCategories();
  }, []);

  return (
    <footer className="bg-stone-50 border-t border-stone-200 text-stone-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Image 
              src="/maazoud-logo-no-bg.webp" 
              alt="Maaz Oud Logo" 
              width={56}
              height={56}
              className="h-14 w-auto object-contain"
            />
            <p className="text-sm text-stone-500 max-w-xs leading-relaxed font-light">
              Crafting premium and alcohol-free attars for perfume connoisseurs. Experience long-lasting fragrances compiled to perfection.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="https://www.instagram.com/maazoud.in/" className="p-2 bg-white rounded-full border border-stone-200 text-stone-600 hover:text-[#8c6239] hover:border-[#8c6239] transition-all">
                <FaInstagram size={16} />
              </a>
              <a href="https://wa.me/919616584237" target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full border border-stone-200 text-stone-600 hover:text-green-600 hover:border-green-600 transition-all" title="WhatsApp Support">
                <FaWhatsapp size={16} />
              </a>
              <a href="https://www.youtube.com/@MaazOud" className="p-2 bg-white rounded-full border border-stone-200 text-stone-600 hover:text-[#8c6239] hover:border-[#8c6239] transition-all">
                <FaYoutube size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Dynamic Shop Collections */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-4">Shop Collections</h3>
            <ul className="space-y-2 text-sm text-stone-550">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.id}`} className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Customer Care SEO Pages */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-4">Customer Services</h3>
            <ul className="space-y-2 text-sm text-stone-550">
              <li>
                <Link href="/about" className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all">About Us</Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all">Shipping & Returns</Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all">Disclaimer Policy</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact details */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-black mb-4">Contact Info</h3>
            <ul className="space-y-3 text-sm text-stone-550">
              <li className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-[#8c6239] mt-1 shrink-0" size={14} />
                <span className="text-stone-500 font-light leading-relaxed">
                  Sabzi Mandi, Station Road, Jaunpur, Uttar Pradesh - 222001
                </span>
              </li>
              <li className="flex items-center gap-2">
                <FaPhoneAlt className="text-[#8c6239] shrink-0" size={14} />
                <a href="tel:+919616584237" className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all font-mono">
                  +91 96165 84237
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FaEnvelope className="text-[#8c6239] shrink-0" size={14} />
                <a href="mailto:maazoudofficial@gmail.com" className="hover:text-[#8c6239] text-stone-500 hover:underline transition-all">
                  maazoudofficial@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 text-center">
          <p className="text-xs text-stone-400">
            &copy; {new Date().getFullYear()} Maaz Oud. All rights reserved. Created with absolute purity.
          </p>
        </div>
      </div>
    </footer>
  );
}
