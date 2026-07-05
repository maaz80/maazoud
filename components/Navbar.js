"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiSearch, FiShoppingBag, FiPackage, FiX } from "react-icons/fi";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const router = useRouter();
  const { 
    cartCount, 
    setIsCartOpen, 
    setIsOrdersOpen, 
    setIsLoginOpen, 
    user, 
    logoutUser,
    globalProducts,
    fetchGlobalProducts
  } = useCart();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real-time Search Suggestions states
  const [suggestions, setSuggestions] = useState([]);
  
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  // Fetch all products once on mount to enable ultra-fast zero-latency local search filtering
  useEffect(() => {
    fetchGlobalProducts();
  }, []);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        (desktopRef.current && !desktopRef.current.contains(e.target)) &&
        (mobileRef.current && !mobileRef.current.contains(e.target))
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (val.trim().length >= 2) {
      const query = val.toLowerCase().trim();
      const filtered = globalProducts.filter(prod => 
        prod.name.toLowerCase().includes(query)
      ).slice(0, 5); // Limit suggestions to top 5 items
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (slug) => {
    setSearchQuery("");
    setSuggestions([]);
    setMobileSearchOpen(false);
    router.push(`/product/${slug}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSuggestions([]);
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}#products`);
      setMobileSearchOpen(false);
    } else {
      router.push("/");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSuggestions([]);
    router.push("/");
  };

  const renderSuggestionsDropdown = () => {
    if (searchQuery.trim().length < 2) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-stone-250 rounded-md shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-stone-100">
        {suggestions.length > 0 ? (
          suggestions.map((prod) => (
            <div
              key={prod.id}
              onClick={() => handleSuggestionClick(prod.id)}
              className="flex items-center gap-3.5 p-3 hover:bg-stone-50 transition-colors cursor-pointer text-left"
            >
              <img 
                src={prod.image} 
                alt={prod.name} 
                className="w-10 h-10 object-cover rounded border border-stone-100 bg-stone-50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[8px] uppercase font-bold tracking-widest text-[#8c6239] block leading-none mb-1">
                  {Array.isArray(prod.category)
                    ? prod.category.map(c => c.replace("-", " ")).join(", ")
                    : (prod.category ? prod.category.replace("-", " ") : "Attar")}
                </span>
                <span className="text-xs font-bold text-stone-900 block truncate">
                  {prod.name}
                </span>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-xs font-black text-stone-900">
                  Rs. {prod.price3mloffer}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-stone-400 font-light">
            No premium attars found matching "{searchQuery}"
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 bg-white border-b border-stone-200 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Left Group: Logo & Search Bar */}
          <div className="flex items-center gap-6 md:grow">
            <Link href="/" className="shrink-0 flex items-center">
              <img 
                src="/maazoud-logo-no-bg.png" 
                alt="Maaz Oud Logo" 
                className="h-14 w-auto object-contain hover:opacity-90 transition-opacity" 
              />
            </Link>

            {/* Desktop Search wrapper */}
            <div ref={desktopRef} className="hidden md:flex grow max-w-md relative">
              <form 
                onSubmit={handleSearchSubmit} 
                className="w-full relative flex items-center"
              >
                <input
                  type="text"
                  placeholder="Search premium attars..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md py-2 pl-4 pr-10 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] text-sm transition-all"
                />
                {searchQuery ? (
                  <button 
                    type="button" 
                    onClick={handleClearSearch}
                    className="absolute right-10 text-stone-400 hover:text-stone-600 transition-colors p-1 cursor-pointer"
                    aria-label="Clear Search"
                  >
                    <FiX size={14} />
                  </button>
                ) : null}
                <button 
                  type="submit" 
                  className="absolute right-3 text-stone-500 hover:text-[#8c6239] transition-colors cursor-pointer"
                  aria-label="Submit Search"
                >
                  <FiSearch size={16} />
                </button>
              </form>
              {renderSuggestionsDropdown()}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            
            {/* Mobile search toggle */}
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                setSearchQuery("");
                setSuggestions([]);
              }}
              className="md:hidden p-2 text-stone-700 hover:text-[#8c6239] hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle Search"
            >
              {mobileSearchOpen ? <FiX size={20} /> : <FiSearch size={20} />}
            </button>

            {/* My Orders */}
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="p-2 text-stone-700 hover:text-[#8c6239] hover:bg-stone-50 rounded-full transition-colors relative cursor-pointer"
              title="My Orders"
              aria-label="My Orders"
            >
              <FiPackage size={20} />
            </button>

            {/* Cart Icon */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2 text-stone-700 hover:text-[#8c6239] hover:bg-stone-50 rounded-full transition-colors relative cursor-pointer"
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <FiShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#8c6239] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Login / Logout */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
                <span className="hidden sm:inline-block text-xs font-semibold text-stone-700">
                  Hi, {user.name}
                </span>
                <button
                  onClick={logoutUser}
                  className="px-3 py-1.5 border border-stone-200 text-stone-700 hover:border-black hover:bg-stone-50 text-xs rounded transition-all font-medium cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="px-4 py-2 bg-black text-white hover:bg-[#8c6239] text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer"
              >
                Login
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search Input */}
        {mobileSearchOpen && (
          <div ref={mobileRef} className="md:hidden border-t border-stone-200 bg-stone-50 p-4 transition-all duration-300 relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search premium attars..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-md py-2.5 pl-4 pr-10 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] text-sm"
                autoFocus
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={handleClearSearch}
                  className="absolute right-12 text-stone-400 p-1 cursor-pointer"
                  aria-label="Clear Search"
                >
                  <FiX size={16} />
                </button>
              )}
              <button 
                type="submit" 
                className="absolute right-4 text-stone-500 hover:text-[#8c6239] cursor-pointer"
                aria-label="Submit Search"
              >
                <FiSearch size={18} />
              </button>
            </form>
            {renderSuggestionsDropdown()}
          </div>
        )}
      </header>
    </>
  );
}
