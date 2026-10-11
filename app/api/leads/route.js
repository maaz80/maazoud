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

// Clean phone helper (extract 10-digit Indian phone)
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("abandoned_leads")
      .select("*")
      .order("updated_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          { success: false, tableMissing: true, message: "Table 'abandoned_leads' does not exist in Supabase yet." },
          { status: 200, headers: corsHeaders }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, leads: data || [] }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = "save" } = body;

    // 1. Mark lead as converted upon successful order
    if (action === "convert") {
      const { session_id, phone, order_id } = body;
      const cleanPhone = sanitizePhone(phone);

      let updateQuery = supabase
        .from("abandoned_leads")
        .update({
          status: "converted",
          order_id: order_id || null,
          updated_at: new Date().toISOString(),
        });

      if (session_id && cleanPhone) {
        updateQuery = updateQuery.or(`session_id.eq.${session_id},phone.eq.${cleanPhone}`);
      } else if (session_id) {
        updateQuery = updateQuery.eq("session_id", session_id);
      } else if (cleanPhone) {
        updateQuery = updateQuery.eq("phone", cleanPhone);
      } else {
        return NextResponse.json({ error: "Missing session_id or phone" }, { status: 400, headers: corsHeaders });
      }

      const { data, error } = await updateQuery;
      if (error) {
        console.warn("Lead convert error:", error.message);
      }

      return NextResponse.json({ success: true, data }, { headers: corsHeaders });
    }

    // 2. Update status (e.g. 'contacted', 'pending')
    if (action === "update_status") {
      const { lead_id, status } = body;
      if (!lead_id || !status) {
        return NextResponse.json({ error: "Missing lead_id or status" }, { status: 400, headers: corsHeaders });
      }

      const { data, error } = await supabase
        .from("abandoned_leads")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", lead_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, data }, { headers: corsHeaders });
    }

    // 3. Delete lead
    if (action === "delete") {
      const { lead_id } = body;
      if (!lead_id) {
        return NextResponse.json({ error: "Missing lead_id" }, { status: 400, headers: corsHeaders });
      }

      const { error } = await supabase
        .from("abandoned_leads")
        .delete()
        .eq("id", lead_id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    // 4. Save / Auto-capture lead
    if (action === "save") {
      const {
        session_id,
        customer_name,
        phone,
        address,
        city,
        state,
        pincode,
        cart_items = [],
        cart_total = 0,
      } = body;

      const cleanPhone = sanitizePhone(phone);
      if (!cleanPhone || cleanPhone.length < 10) {
        return NextResponse.json(
          { success: false, message: "Valid 10-digit phone number is required to save lead." },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check if lead already exists for this session or phone
      let existingLead = null;
      if (session_id) {
        const { data } = await supabase
          .from("abandoned_leads")
          .select("id, status")
          .eq("session_id", session_id)
          .maybeSingle();
        existingLead = data;
      }

      if (!existingLead && cleanPhone) {
        // Also check if recent pending lead exists with this phone today
        const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { data } = await supabase
          .from("abandoned_leads")
          .select("id, status")
          .eq("phone", cleanPhone)
          .gte("created_at", oneDayAgo)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        existingLead = data;
      }

      // If user has already purchased in this session, don't revert to pending
      if (existingLead && existingLead.status === "converted") {
        return NextResponse.json({ success: true, message: "Lead already converted." }, { headers: corsHeaders });
      }

      const leadPayload = {
        session_id: session_id || null,
        customer_name: (customer_name || "").trim(),
        phone: cleanPhone,
        address: (address || "").trim(),
        city: (city || "").trim(),
        state: (state || "").trim(),
        pincode: (pincode || "").trim(),
        cart_items: Array.isArray(cart_items) ? cart_items : [],
        cart_total: Number(cart_total) || 0,
        status: "pending",
        updated_at: new Date().toISOString(),
      };

      let result;
      if (existingLead?.id) {
        // Update existing lead record
        result = await supabase
          .from("abandoned_leads")
          .update(leadPayload)
          .eq("id", existingLead.id)
          .select("id");
      } else {
        // Insert new lead record
        leadPayload.created_at = new Date().toISOString();
        result = await supabase
          .from("abandoned_leads")
          .insert([leadPayload])
          .select("id");
      }

      if (result.error) {
        if (result.error.code === "PGRST205" || result.error.message?.includes("does not exist")) {
          return NextResponse.json(
            { success: false, tableMissing: true, message: "Table 'abandoned_leads' does not exist in Supabase yet." },
            { status: 200, headers: corsHeaders }
          );
        }
        return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json(
        { success: true, lead_id: result.data?.[0]?.id || existingLead?.id },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
