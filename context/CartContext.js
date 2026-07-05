"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [user, setUser] = useState(null); // null means guest

  const [globalBanners, setGlobalBanners] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [globalProducts, setGlobalProducts] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchGlobalBanners = async (force = false) => {
    if (globalBanners.length > 0 && !force) return globalBanners;
    setBannersLoading(true);
    try {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setGlobalBanners(data);
      return data || [];
    } catch (e) {
      console.error("Error fetching banners:", e.message);
      return [];
    } finally {
      setBannersLoading(false);
    }
  };

  const fetchGlobalCategories = async (force = false) => {
    if (globalCategories.length > 0 && !force) return globalCategories;
    setCategoriesLoading(true);
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      if (data) setGlobalCategories(data);
      return data || [];
    } catch (e) {
      console.error("Error fetching categories:", e.message);
      return [];
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchGlobalProducts = async (force = false) => {
    if (globalProducts.length > 0 && !force) return globalProducts;
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      let formatted = (data || []).map(p => ({
        ...p,
        id: p.id,
        slug: p.id,
        price: p.price3mloffer,
        originalPrice: p.price3mlorig || p.price3mloffer,
        discount: p.price3mlorig > p.price3mloffer 
          ? Math.round(((p.price3mlorig - p.price3mloffer) / p.price3mlorig) * 100)
          : 0,
        size: "3ml",
        category: p.category || "top-selling"
      }));

      if (data) setGlobalProducts(formatted);
      return formatted;
    } catch (e) {
      console.error("Error fetching products:", e.message);
      return [];
    } finally {
      setProductsLoading(false);
    }
  };

  // Load orders from localStorage on mount, cart loading is managed in auth hook
  useEffect(() => {
    const savedOrders = localStorage.getItem("maazoud_orders");
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  // Listen to Supabase auth state changes and sync user cart from DB
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split("@")[0],
        });
        fetchAndMergeCart(session.user.id);
        fetchUserOrders(session.user.id);
      } else {
        setUser(null);
        // Load guest cart from local storage if no user logged in
        const savedCart = localStorage.getItem("maazoud_cart");
        if (savedCart) setCart(JSON.parse(savedCart));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split("@")[0],
        });
        fetchAndMergeCart(session.user.id);
        fetchUserOrders(session.user.id);
      } else {
        setUser(null);
        setCart([]); // Clear cart state on logout
        setOrders([]);
        localStorage.removeItem("maazoud_cart");
        localStorage.removeItem("maazoud_orders");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch from DB and Merge local guest cart items on login
  const fetchAndMergeCart = async (userId) => {
    try {
      // 1. Read local guest items first and immediately clear from localStorage to prevent concurrent race condition loops
      const guestCartStr = localStorage.getItem("maazoud_cart");
      localStorage.removeItem("maazoud_cart"); // Clear immediately
      const guestCart = guestCartStr ? JSON.parse(guestCartStr) : [];

      // 2. Fetch user's cart items from DB
      const { data: dbItems, error } = await supabase
        .from("cart_items")
        .select("*, product:products(*)")
        .eq("user_id", userId);

      if (error) throw error;

      let mergedCart = (dbItems || []).map(item => ({
        cartItemId: item.cart_item_id,
        product: {
          ...item.product,
          id: item.product.id,
          slug: item.product.id,
          price: item.product.price3mloffer,
          originalPrice: item.product.price3mlorig || item.product.price3mloffer,
          discount: item.product.price3mlorig > item.product.price3mloffer 
            ? Math.round(((item.product.price3mlorig - item.product.price3mloffer) / item.product.price3mlorig) * 100)
            : 0,
          size: "3ml",
          category: item.product.category || "top-selling"
        },
        quantity: item.quantity,
        selectedSize: item.selected_size,
        price: item.price
      }));

      // Merge local guest items if present
      if (guestCart.length > 0) {
        for (const guestItem of guestCart) {
          const existingIndex = mergedCart.findIndex(item => item.cartItemId === guestItem.cartItemId);
          if (existingIndex > -1) {
            mergedCart[existingIndex].quantity += guestItem.quantity;
          } else {
            mergedCart.push(guestItem);
          }

          // Upload guest items to DB
          await supabase
            .from("cart_items")
            .upsert({
              user_id: userId,
              cart_item_id: guestItem.cartItemId,
              product_id: guestItem.product.id,
              quantity: existingIndex > -1 ? mergedCart[existingIndex].quantity : guestItem.quantity,
              selected_size: guestItem.selectedSize,
              price: guestItem.price
            }, { onConflict: "user_id,cart_item_id" });
        }
      }

      setCart(mergedCart);
    } catch (err) {
      console.error("Error fetching/merging cart:", err.message);
      // fallback
      const savedCart = localStorage.getItem("maazoud_cart");
      if (savedCart) setCart(JSON.parse(savedCart));
    }
  };

  const fetchUserOrders = async (userId) => {
    try {
      const { data: dbOrders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (dbOrders) {
        setOrders(dbOrders);
        localStorage.setItem("maazoud_orders", JSON.stringify(dbOrders));
      }
    } catch (err) {
      console.error("Error loading user orders:", err.message);
    }
  };

  const saveOrders = (newOrders) => {
    setOrders(newOrders);
    localStorage.setItem("maazoud_orders", JSON.stringify(newOrders));
  };

  const addToCart = async (product, quantity = 1, selectedSize = null, customPrice = null) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    const size = selectedSize || product.size || "3ml";
    const price = customPrice !== null ? customPrice : product.price;
    const cartItemId = `${product.id}-${size}`;

    const existingIndex = cart.findIndex((item) => item.cartItemId === cartItemId);
    let newCart = [...cart];
    if (existingIndex > -1) {
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart.push({ cartItemId, product, quantity, selectedSize: size, price });
    }

    setCart(newCart);
    if (!user) {
      localStorage.setItem("maazoud_cart", JSON.stringify(newCart));
    }

    // Upload to database if logged in
    if (user?.id) {
      try {
        const { error } = await supabase
          .from("cart_items")
          .upsert({
            user_id: user.id,
            cart_item_id: cartItemId,
            product_id: product.id,
            quantity: existingIndex > -1 ? newCart[existingIndex].quantity : quantity,
            selected_size: size,
            price: price
          }, { onConflict: "user_id,cart_item_id" });
        if (error) throw error;
      } catch (err) {
        console.error("Error upserting cart item:", err.message);
      }
    }

    setIsCartOpen(true); // Open cart drawer on add
  };

  const triggerBuyNow = (product, quantity = 1, selectedSize = null, customPrice = null) => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    addToCart(product, quantity, selectedSize, customPrice);
    setShowCheckout(true);
    setIsCartOpen(true);
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
  };

  const sendOtp = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      }
    });
    if (error) throw error;
  };

  const verifyOtp = async (email, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: "email",
    });
    if (error) throw error;
    return data;
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    const newCart = cart.map((item) =>
      item.cartItemId === cartItemId ? { ...item, quantity } : item
    );
    setCart(newCart);
    if (!user) {
      localStorage.setItem("maazoud_cart", JSON.stringify(newCart));
    }

    if (user?.id) {
      try {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .match({ user_id: user.id, cart_item_id: cartItemId });
        if (error) throw error;
      } catch (err) {
        console.error("Error updating cart quantity:", err.message);
      }
    }
  };

  const removeFromCart = async (cartItemId) => {
    const newCart = cart.filter((item) => item.cartItemId !== cartItemId);
    setCart(newCart);
    if (!user) {
      localStorage.setItem("maazoud_cart", JSON.stringify(newCart));
    }

    if (user?.id) {
      try {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .match({ user_id: user.id, cart_item_id: cartItemId });
        if (error) throw error;
      } catch (err) {
        console.error("Error removing cart item:", err.message);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    localStorage.removeItem("maazoud_cart");

    if (user?.id) {
      try {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);
        if (error) throw error;
      } catch (err) {
        console.error("Error clearing cart items:", err.message);
      }
    }
  };

  const placeOrder = async (orderDetails) => {
    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const orderPayload = {
      id: orderId,
      customer_name: orderDetails.name,
      phone: orderDetails.phone,
      address: orderDetails.address,
      city: orderDetails.city || "N/A",
      state: orderDetails.state || "N/A",
      pincode: orderDetails.pincode || "N/A",
      payment_method: orderDetails.paymentMethod,
      total_amount: cartTotal,
      status: "Processing",
      items: cart.map(item => ({
        cartItemId: item.cartItemId,
        product: {
          id: item.product.id,
          name: item.product.name,
          image: item.product.image
        },
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        price: item.price
      })),
      user_id: user?.id || null,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from("orders")
      .insert([orderPayload]);

    if (error) {
      console.error("Error inserting order:", error.message);
      throw new Error("Failed to place order in database: " + error.message);
    }

    const newOrders = [orderPayload, ...orders];
    saveOrders(newOrders);
    await clearCart();
    return orderId;
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const deliveryCharge = cart.length > 0 ? 50 : 0;
  const cartTotal = cartSubtotal + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartSubtotal,
        deliveryCharge,
        cartTotal,
        orders,
        isCartOpen,
        isOrdersOpen,
        isLoginOpen,
        showCheckout,
        user,
        setIsCartOpen,
        setIsOrdersOpen,
        setIsLoginOpen,
        setShowCheckout: (val) => {
          if (val && !user) {
            setIsLoginOpen(true);
          } else {
            setShowCheckout(val);
          }
        },
        setUser,
        addToCart,
        triggerBuyNow,
        logoutUser,
        sendOtp,
        verifyOtp,
        updateQuantity,
        removeFromCart,
        clearCart,
        placeOrder,
        saveOrders,
        globalBanners,
        globalCategories,
        globalProducts,
        bannersLoading,
        categoriesLoading,
        productsLoading,
        fetchGlobalBanners,
        fetchGlobalCategories,
        fetchGlobalProducts,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
