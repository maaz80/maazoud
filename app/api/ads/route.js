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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("ad_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        return NextResponse.json(
          { success: false, tableMissing: true, message: "Table 'ad_campaigns' does not exist yet." },
          { status: 200, headers: corsHeaders }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json({ success: true, campaigns: data || [] }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action = "save", campaign } = body;

    if (action === "delete") {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ error: "Missing campaign id" }, { status: 400, headers: corsHeaders });
      }

      const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json({ success: true }, { headers: corsHeaders });
    }

    if (action === "save") {
      if (!campaign || !campaign.ad_name) {
        return NextResponse.json({ error: "Ad name is required" }, { status: 400, headers: corsHeaders });
      }

      const payload = {
        ad_name: campaign.ad_name.trim(),
        platform: campaign.platform || "Meta / Instagram",
        spend: Number(campaign.spend) || 0,
        ad_date: campaign.ad_date || new Date().toISOString().split("T")[0],
        order_ids: Array.isArray(campaign.order_ids) ? campaign.order_ids : [],
        notes: campaign.notes || "",
        updated_at: new Date().toISOString(),
      };

      let result;
      if (campaign.id) {
        result = await supabase
          .from("ad_campaigns")
          .update(payload)
          .eq("id", campaign.id)
          .select();
      } else {
        payload.created_at = new Date().toISOString();
        result = await supabase
          .from("ad_campaigns")
          .insert([payload])
          .select();
      }

      if (result.error) {
        if (result.error.code === "PGRST205" || result.error.message?.includes("does not exist")) {
          return NextResponse.json(
            { success: false, tableMissing: true, message: "Table 'ad_campaigns' does not exist yet." },
            { status: 200, headers: corsHeaders }
          );
        }
        return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, campaign: result.data?.[0] }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
