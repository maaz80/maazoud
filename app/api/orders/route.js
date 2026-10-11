import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

function sanitizePhone(raw) {
  if (!raw) return "";
  const cleaned = String(raw).replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      phone,
      address,
      city = "N/A",
      state = "N/A",
      pincode = "N/A",
      payment_method = "Cash on Delivery (COD)",
      total_amount,
      items = [],
      user_id = null,
      session_id = null,
    } = body;

    // 1. Validation
    if (!customer_name || customer_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid customer name." },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit Indian phone number." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!address || address.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid delivery address." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Your shopping cart is empty." },
        { status: 400, headers: corsHeaders }
      );
    }

    const amount = Number(total_amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid total order amount." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Format cart items consistently
    const formattedItems = items.map((item) => {
      const prod = item.product || {};
      const size = item.selectedSize || prod.size || "3ml";
      return {
        cartItemId: item.cartItemId || `${prod.id || "item"}-${size}`,
        product: {
          id: prod.id || "unknown",
          name: prod.name || "Attar",
          image: prod.image || "",
        },
        quantity: Number(item.quantity) || 1,
        selectedSize: size,
        price: Number(item.price) || 0,
      };
    });

    // 3. Generate unique Order ID
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const orderPayload = {
      id: orderId,
      customer_name: customer_name.trim(),
      phone: cleanPhone,
      address: address.trim(),
      city: String(city || "N/A").trim() || "N/A",
      state: String(state || "N/A").trim() || "N/A",
      pincode: String(pincode || "N/A").trim() || "N/A",
      payment_method: payment_method,
      total_amount: Math.round(amount),
      status: "Processing",
      items: formattedItems,
      user_id: user_id || null,
      created_at: new Date().toISOString(),
    };

    // 4. Insert into database using Service Role client
    const { error: insertError } = await supabase.from("orders").insert([orderPayload]);

    if (insertError) {
      console.error("Order insertion error into Supabase:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save order: " + insertError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // 5. Mark associated lead as converted in abandoned_leads (fire and continue)
    try {
      let leadQuery = supabase
        .from("abandoned_leads")
        .update({
          status: "converted",
          order_id: orderId,
          updated_at: new Date().toISOString(),
        });

      if (session_id && cleanPhone) {
        leadQuery = leadQuery.or(`session_id.eq.${session_id},phone.eq.${cleanPhone}`);
      } else if (cleanPhone) {
        leadQuery = leadQuery.eq("phone", cleanPhone);
      } else if (session_id) {
        leadQuery = leadQuery.eq("session_id", session_id);
      }

      await leadQuery;
    } catch (leadErr) {
      console.warn("Could not mark abandoned lead converted:", leadErr);
    }

    return NextResponse.json(
      {
        success: true,
        orderId: orderId,
        order: orderPayload,
      },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("Critical error in /api/orders route:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
