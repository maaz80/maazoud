"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiSearch, FiShoppingBag, FiPackage, FiX, FiMenu, FiUser, FiLogOut } from "react-icons/fi";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const router = useRouter();
  const {
    cartCount,
    orders,
    setIsCartOpen,
    setIsOrdersOpen,
    setIsLoginOpen,
    user,
    logoutUser,
    globalProducts,
    fetchGlobalProducts
  } = useCart();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [suggestions, setSuggestions] = useState([]);

  const desktopRef = useRef(null);
  const mobileRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    fetchGlobalProducts();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        (desktopRef.current && !desktopRef.current.contains(e.target)) &&
        (mobileRef.current && !mobileRef.current.contains(e.target))
      ) {
        setSuggestions([]);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
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
      ).slice(0, 5);
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

  const pendingOrdersCount = orders.filter(
    (order) => String(order.status || "").toLowerCase() !== "delivered"
  ).length;

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
              <Image
                src={prod.image}
                alt={prod.name}
                width={40}
                height={40}
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

          <div className="flex items-center gap-6 md:grow">
            <Link href="/" className="shrink-0 flex items-center">
              <Image
                src="/maazoud-logo-no-bg.webp"
                alt="Maaz Oud Logo"
                width={56}
                height={56}
                priority
                quality={60}
                className="h-14 w-14 object-contain hover:opacity-90 transition-opacity"
              />
            </Link>

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
                  className="w-full bg-stone-50 border border-stone-200 rounded-md py-2 pl-4 pr-18 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] text-sm transition-all"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-9 w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors cursor-pointer focus:outline-none"
                    aria-label="Clear Search"
                  >
                    <FiX size={14} />
                  </button>
                ) : null}
                <button
                  type="submit"
                  className="absolute right-0.5 w-9 h-9 flex items-center justify-center text-stone-500 hover:text-[#8c6239] transition-colors cursor-pointer focus:outline-none"
                  aria-label="Submit Search"
                >
                  <FiSearch size={16} />
                </button>
              </form>
              {renderSuggestionsDropdown()}
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">

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

            <button
              onClick={() => setIsOrdersOpen(true)}
              className="p-2 text-stone-700 hover:text-[#8c6239] hover:bg-stone-50 rounded-full transition-colors relative cursor-pointer"
              title="My Orders"
              aria-label="My Orders"
            >
              <FiPackage size={20} />
              {pendingOrdersCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#8c6239] text-white text-[10px] font-bold min-w-5 h-5 px-1 flex items-center justify-center rounded-full border-2 border-white">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

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

            {/* Main Menu (Hamburger) */}
            <div className="relative pl-2 border-l border-stone-200" ref={profileMenuRef}>
              <div className="flex items-center gap-2">
                {!user && (
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="hidden sm:block px-4 py-2 bg-black text-white hover:bg-[#8c6239] text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer"
                  >
                    Login
                  </button>
                )}
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="p-2 flex items-center gap-2 text-stone-700 hover:text-[#8c6239] hover:bg-stone-50 rounded-full transition-colors cursor-pointer"
                  aria-label="Menu"
                >
                  <FiMenu size={20} />
                </button>
              </div>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-stone-200 rounded-md shadow-xl z-50 py-2">
                  {user && (
                    <div className="px-4 py-2 border-b border-stone-100 mb-1">
                      <p className="text-xs text-stone-500">Signed in as</p>
                      <p className="text-sm font-bold text-stone-800 truncate">{user.name}</p>
                    </div>
                  )}

                  <button onClick={() => { setProfileMenuOpen(false); router.push('/'); }} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-[#8c6239] flex items-center gap-2 transition-colors cursor-pointer">
                    Home
                  </button>
                  <button onClick={() => { setProfileMenuOpen(false); router.push('/about-us'); }} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-[#8c6239] flex items-center gap-2 transition-colors cursor-pointer">
                    About Us
                  </button>
                  <button onClick={() => { setProfileMenuOpen(false); router.push('/contact-us'); }} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-[#8c6239] flex items-center gap-2 transition-colors cursor-pointer">
                    Contact Us
                  </button>
                  {/* <button onClick={() => { setProfileMenuOpen(false); router.push('/blog'); }} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-[#8c6239] flex items-center gap-2 transition-colors cursor-pointer">
                    Blogs
                  </button> */}

                  <div className="border-t border-stone-100 my-1"></div>

                  {user ? (
                    <>
                      <button onClick={() => { setProfileMenuOpen(false); router.push('/profile'); }} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-[#8c6239] flex items-center gap-2 transition-colors cursor-pointer">
                        <FiUser size={16} /> My Profile
                      </button>
                      <button onClick={() => { setProfileMenuOpen(false); setIsOrdersOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-[#8c6239] flex items-center gap-2 transition-colors cursor-pointer">
                        <FiPackage size={16} /> My Orders
                      </button>
                      <button onClick={() => { setProfileMenuOpen(false); logoutUser(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer mt-1 border-t border-stone-100 pt-2">
                        <FiLogOut size={16} /> Logout
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setProfileMenuOpen(false); setIsLoginOpen(true); }} className="w-full text-left px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 hover:text-[#8c6239] flex items-center gap-2 transition-colors cursor-pointer">
                      <FiUser size={16} /> Login
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileSearchOpen && (
          <div ref={mobileRef} className="md:hidden border-t border-stone-200 bg-stone-50 p-4 transition-all duration-300 relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search premium attars..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-md py-2.5 pl-4 pr-18 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239] text-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-9 w-9 h-9 flex items-center justify-center text-stone-400 cursor-pointer focus:outline-none"
                  aria-label="Clear Search"
                >
                  <FiX size={16} />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-0.5 w-9 h-9 flex items-center justify-center text-stone-500 hover:text-[#8c6239] cursor-pointer focus:outline-none"
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
