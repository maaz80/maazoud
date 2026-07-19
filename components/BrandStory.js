import React from "react";
import Image from "next/image";

export default function BrandStory() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Image Container with Luxury Accents */}
          <div className="w-full lg:w-1/2 relative">
            <div className="absolute -inset-4 bg-[#f8f5f0] rounded-tl-[100px] rounded-br-[100px] z-0 hidden md:block"></div>
            <div className="relative z-10 rounded-tl-[80px] rounded-br-[80px] overflow-hidden border-2 border-[#e5d9c5] aspect-[4/5] shadow-xl">
              <Image 
                src="/maazoud-bottles.png" 
                alt="Maaz Oud Luxury Craftsmanship"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              {/* Overlay tint for aesthetic */}
              <div className="absolute inset-0 bg-stone-900/10 mix-blend-multiply pointer-events-none"></div>
            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 border border-[#8c6239] rounded-full z-0 opacity-30"></div>
          </div>

          {/* Text Content */}
          <div className="w-full lg:w-1/2 space-y-6 md:space-y-8 text-center lg:text-left z-10">
            <div className="space-y-2">
              <span className="text-[#8c6239] font-bold tracking-[0.2em] text-xs uppercase">
                The Heritage of Luxury
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl  font-bold text-stone-900 leading-tight">
                Crafting <span className="italic font-light font-serif">Timeless</span> Fragrances
              </h2>
            </div>
            
            <p className="text-stone-600 text-sm md:text-base leading-relaxed">
              At Maaz Oud, we believe that perfumery is an exquisite art form. Every drop in our collection represents a meticulous journey of refinement, blending the rarest botanical ingredients to create a truly premium sensory experience.
            </p>
            <p className="text-stone-600 text-sm md:text-base leading-relaxed">
              Our master artisans dedicate themselves to preserving the classical heritage of attar-making while introducing sophisticated, contemporary profiles. The result is a luxury fragrance that lingers gracefully, leaving an unforgettable and majestic presence wherever you go.
            </p>
            
            <div className="pt-4">
              <a href="/about-us" className="inline-flex items-center gap-3 border-b border-[#8c6239] pb-1 cursor-pointer group">
                <span className="text-stone-900 font-bold uppercase tracking-widest text-xs group-hover:text-[#8c6239] transition-colors">
                  Discover Our Philosophy
                </span>
                <span className="text-[#8c6239] transform group-hover:translate-x-2 transition-transform">
                  &rarr;
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
