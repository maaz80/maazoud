import React from "react";
import { FaLeaf, FaHourglassHalf, FaGem, FaShippingFast } from "react-icons/fa";

export default function FeaturesSection() {
  const features = [
    { icon: <FaLeaf size={18} />, title: "100% Alcohol-Free" },
    { icon: <FaHourglassHalf size={18} />, title: "Exceptional Longevity" },
    { icon: <FaGem size={18} />, title: "Premium Extracts" },
    { icon: <FaShippingFast size={18} />, title: "Secure Delivery" },
  ];

  // Duplicate items to create a seamless infinite scrolling effect
  const marqueeItems = [...features, ...features, ...features, ...features];

  return (
    <section className="py-5 bg-[#8c6239] overflow-hidden flex items-center relative">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Decorative gradient edges for smooth fading effect */}
      <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-linear-to-r from-[#8c6239] to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-linear-to-l from-[#8c6239] to-transparent z-10 pointer-events-none"></div>

      <div className="flex animate-scroll w-max space-x-12 px-6">
        {marqueeItems.map((feature, idx) => (
          <div key={idx} className="flex items-center space-x-3 text-white transition-opacity duration-300 hover:opacity-80 cursor-default">
            <div className="shrink-0 text-white">
              {feature.icon}
            </div>
            <span className=" font-bold uppercase tracking-widest text-xs md:text-sm whitespace-nowrap">
              {feature.title}
            </span>
            {/* Small decorative dot between items */}
            <div className="w-1.5 h-1.5 rounded-full bg-white/40 ml-12 hidden md:block"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
