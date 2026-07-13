import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";

// Browser se function call allow karne ke liye CORS headers.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Har response ko same JSON + CORS format me return karta hai.
const json = (body, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

// Required Supabase/Razorpay secrets missing hon to clear error deta hai.
const getEnv = (name) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value.trim();
};

// Frontend se aaye cart items ko validate/sanitize karta hai.
const normalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty.");
  }

  return items.map((item) => {
    const productId = String(item.productId || "").trim();
    const quantity = Number(item.quantity || 0);
    const selectedSize = String(item.selectedSize || "3ml").toLowerCase();

    if (!productId) throw new Error("Invalid cart item.");
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new Error("Invalid item quantity.");
    }
    if (!["3ml", "6ml"].includes(selectedSize)) {
      throw new Error("Invalid product size.");
    }

    return { productId, quantity, selectedSize };
  });
};

// Product size ke hisab se trusted price Supabase product row se nikalta hai.
const priceForSize = (product, selectedSize = "3ml") => {
  const price3ml = Number(product.price3mloffer || 0);
  const price6ml = Number(product.price6mloffer || 0);

  if (selectedSize === "6ml") {
    return price6ml > 0 ? price6ml : Math.round(price3ml * 1.8);
  }

  return price3ml;
};

// Amount frontend se trust nahi hota; products table se price dubara calculate hota hai.
const calculateOrder = async (supabase, items) => {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const { data: products, error } = await supabase
    .from("products")
    .select("id,name,image,price3mloffer,price6mloffer")
    .in("id", productIds);

  if (error) throw new Error(error.message);
  if (!products || products.length !== productIds.length) {
    throw new Error("One or more products are not available.");
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const orderItems = items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) throw new Error("Product not found.");

    const price = priceForSize(product, item.selectedSize);
    if (!price || price <= 0) throw new Error(`Price unavailable for ${product.name}.`);

    return {
      cartItemId: `${product.id}-${item.selectedSize || "3ml"}`,
      product: {
        id: product.id,
        name: product.name,
        image: product.image,
      },
      quantity: item.quantity,
      selectedSize: item.selectedSize || "3ml",
      price,
    };
  });

  const subtotal = orderItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const deliveryCharge = orderItems.length > 0 ? 40 : 0;
  const total = subtotal + deliveryCharge;

  return { subtotal, deliveryCharge, total, amountInPaise: total * 100, orderItems };
};

// Razorpay API ko server-side secret key ke saath call karta hai.
const razorpayRequest = async (path, init = {}) => {
  const keyId = getEnv("RAZORPAY_KEY_ID");
  const keySecret = getEnv("RAZORPAY_KEY_SECRET");
  const auth = btoa(`${keyId}:${keySecret}`);
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.description || "Razorpay request failed.");
  }

  return data;
};

// Razorpay payment signature verify karne ke liye HMAC generate karta hai.
const hmacSha256Hex = async (message, secret) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

// Timing-safe comparison, taaki signature compare predictable na ho.
const secureCompare = (a, b) => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

// Main Edge Function handler: create_order aur verify_payment dono yahin handle hote hain.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Checkout sirf logged-in Supabase user ke liye allow hai.
    const token = req.headers.get("Authorization")?.replace("Bearer ", "") || "";
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Please login before payment." }, 401);

    const body = await req.json();
    const action = String(body.action || "");
    const items = normalizeItems(body.items);
    const calculated = await calculateOrder(supabase, items);

    // Step 1: Razorpay order create karta hai aur checkout ke liye order id frontend ko deta hai.
    if (action === "create_order") {
      const receipt = `MO-${Date.now().toString().slice(-10)}`;
      const razorpayOrder = await razorpayRequest("/orders", {
        method: "POST",
        body: JSON.stringify({
          amount: calculated.amountInPaise,
          currency: "INR",
          receipt,
          notes: {
            user_id: userData.user.id,
            source: "maazoud",
          },
        }),
      });

      return json({
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      });
    }

    // Step 2: Payment success ke baad Razorpay signature/status verify karke Supabase order banata hai.
    if (action === "verify_payment") {
      const razorpayOrderId = String(body.razorpayOrderId || "");
      const razorpayPaymentId = String(body.razorpayPaymentId || "");
      const razorpaySignature = String(body.razorpaySignature || "");
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        throw new Error("Missing Razorpay payment details.");
      }

      // Signature valid hai to payment genuine hai; invalid ho to order insert nahi hoga.
      const expectedSignature = await hmacSha256Hex(
        `${razorpayOrderId}|${razorpayPaymentId}`,
        getEnv("RAZORPAY_KEY_SECRET"),
      );
      if (!secureCompare(expectedSignature, razorpaySignature)) {
        throw new Error("Payment signature verification failed.");
      }

      // Razorpay se latest order/payment status fetch karke amount aur status cross-check karta hai.
      const [razorpayOrder, razorpayPayment] = await Promise.all([
        razorpayRequest(`/orders/${razorpayOrderId}`),
        razorpayRequest(`/payments/${razorpayPaymentId}`),
      ]);

      if (razorpayOrder.amount !== calculated.amountInPaise || razorpayOrder.currency !== "INR") {
        throw new Error("Payment amount mismatch.");
      }
      if (razorpayPayment.order_id !== razorpayOrderId) {
        throw new Error("Payment does not belong to this order.");
      }
      if (!["authorized", "captured"].includes(razorpayPayment.status)) {
        throw new Error("Payment is not successful yet.");
      }

      // Same payment id se duplicate order create hone se rokta hai.
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("id")
        .ilike("payment_method", `%${razorpayPaymentId}%`)
        .maybeSingle();

      if (existingOrder?.id) {
        return json({ orderId: existingOrder.id, duplicate: true });
      }

      const customer = body.customer || {};
      const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
      // Verified payment ke baad final order Supabase orders table me save hota hai.
      const orderPayload = {
        id: orderId,
        customer_name: String(customer.name || "").trim(),
        phone: String(customer.phone || "").trim(),
        address: String(customer.address || "").trim(),
        city: String(customer.city || "N/A").trim() || "N/A",
        state: String(customer.state || "N/A").trim() || "N/A",
        pincode: String(customer.pincode || "N/A").trim() || "N/A",
        payment_method: `Payment ID: ${razorpayPaymentId}, Order ID: ${razorpayOrderId}, Status: ${razorpayPayment.status}`,
        total_amount: calculated.total,
        status: "Processing",
        items: calculated.orderItems,
        user_id: userData.user.id,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("orders").insert([orderPayload]);
      if (insertError) throw new Error(insertError.message);

      return json({ orderId, order: orderPayload });
    }

    return json({ error: "Invalid action." }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unexpected server error." }, 400);
  }
});