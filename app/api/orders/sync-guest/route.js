import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, orderIds = [], phone } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400, headers: corsHeaders });
    }

    const linkedOrderIds = [];

    // 1. Sync orders by explicit Order IDs from local session/storage
    if (Array.isArray(orderIds) && orderIds.length > 0) {
      const validIds = orderIds.filter(id => typeof id === 'string' && id.trim().length > 0);
      if (validIds.length > 0) {
        // Link all orders where id matches and (user_id is null OR matches this user)
        const { data: updatedOrders, error: updateErr } = await supabase
          .from('orders')
          .update({ user_id: userId })
          .in('id', validIds)
          .or(`user_id.is.null,user_id.eq.${userId}`)
          .select('id');

        if (!updateErr && updatedOrders) {
          updatedOrders.forEach(o => linkedOrderIds.push(o.id));
        }
      }
    }

    // 2. Also check if the user profile has a phone number, or phone was passed
    let userPhone = phone;
    if (!userPhone) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.phone) {
        userPhone = profile.phone;
      }
    }

    // Link any guest orders placed with this phone number
    if (userPhone) {
      const cleanPhone = String(userPhone).replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        const { data: phoneOrders, error: phoneErr } = await supabase
          .from('orders')
          .update({ user_id: userId })
          .eq('phone', cleanPhone)
          .is('user_id', null)
          .select('id');

        if (!phoneErr && phoneOrders) {
          phoneOrders.forEach(o => {
            if (!linkedOrderIds.includes(o.id)) {
              linkedOrderIds.push(o.id);
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: linkedOrderIds.length,
      linkedOrderIds: linkedOrderIds
    }, { headers: corsHeaders });

  } catch (err) {
    console.error("Error in sync-guest orders API:", err);
    return NextResponse.json({ error: err.message || "Failed to sync guest orders" }, { status: 500, headers: corsHeaders });
  }
}
