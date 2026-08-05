import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const userToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!userToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    if (authError || !user || user.email !== 'maazforlap@gmail.com') {
      return NextResponse.json({ error: "Access Denied." }, { status: 403, headers: corsHeaders });
    }

    const responseData = {
      shiprocket: {
        connected: false,
        wallet_balance: 0,
        upcoming_remittance_total: 0,
        remittances_schedule: [],
        error: null
      },
      razorpay: {
        connected: false,
        total_captured: 0,
        total_settled: 0,
        unsettled_balance: 0,
        settlements_schedule: [],
        error: null
      },
      local_metrics: {
        cod_delivered_unremitted_estimate: 0,
        prepaid_razorpay_total: 0
      }
    };

    // Calculate DB estimates from Supabase orders
    const { data: allOrders } = await supabase.from('orders').select('*');
    if (allOrders && Array.isArray(allOrders)) {
      const nonCancelled = allOrders.filter(o => o.status !== 'Cancelled');

      // 1. Offline / Self Handover Sales
      const offlineOrders = nonCancelled.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return pm.includes('offline') || pm.includes('cash (offline)') || (o.id || '').startsWith('ORD-OFFLINE');
      });
      const offlineSum = offlineOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      // 2. COD Orders
      const codDelivered = nonCancelled.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return (pm.includes('cod') || pm.includes('cash on delivery')) && o.status === 'Delivered';
      });
      const codDeliveredSum = codDelivered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const codShipped = nonCancelled.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return (pm.includes('cod') || pm.includes('cash on delivery')) && o.status === 'Shipped';
      });
      const codShippedSum = codShipped.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const codProcessing = nonCancelled.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return (pm.includes('cod') || pm.includes('cash on delivery')) && (o.status === 'Processing' || o.status === 'Placed');
      });
      const codProcessingSum = codProcessing.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      // 3. Prepaid Orders
      const prepaidOrders = nonCancelled.filter(o => {
        const pm = (o.payment_method || '').toLowerCase();
        return pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid');
      });
      const prepaidTotalSum = prepaidOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const prepaidDelivered = prepaidOrders.filter(o => o.status === 'Delivered');
      const prepaidDeliveredSum = prepaidDelivered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const prepaidShipped = prepaidOrders.filter(o => o.status === 'Shipped');
      const prepaidShippedSum = prepaidShipped.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const prepaidProcessing = prepaidOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Shipped');
      const prepaidProcessingSum = prepaidProcessing.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const fullCodFuture = codDeliveredSum + codShippedSum + codProcessingSum;

      responseData.local_metrics = {
        offline_sales_total: Number(offlineSum.toFixed(2)),
        offline_orders_count: offlineOrders.length,
        cod_delivered_total: Number(codDeliveredSum.toFixed(2)),
        cod_delivered_count: codDelivered.length,
        cod_shipped_total: Number(codShippedSum.toFixed(2)),
        cod_shipped_count: codShipped.length,
        cod_processing_total: Number(codProcessingSum.toFixed(2)),
        cod_processing_count: codProcessing.length,
        cod_pipeline_total: Number(fullCodFuture.toFixed(2)),
        cod_future_total: Number(fullCodFuture.toFixed(2)),
        prepaid_delivered_total: Number(prepaidDeliveredSum.toFixed(2)),
        prepaid_delivered_count: prepaidDelivered.length,
        prepaid_shipped_total: Number(prepaidShippedSum.toFixed(2)),
        prepaid_shipped_count: prepaidShipped.length,
        prepaid_processing_total: Number(prepaidProcessingSum.toFixed(2)),
        prepaid_processing_count: prepaidProcessing.length,
        prepaid_pipeline_total: Number(prepaidTotalSum.toFixed(2)),
        cod_delivered_unremitted_estimate: Number(codDeliveredSum.toFixed(2)),
        prepaid_razorpay_total: Number(prepaidTotalSum.toFixed(2))
      };
    }

    // 1. Razorpay Live Data
    try {
      const rzpKeyId = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TChSaArXl63I22').trim();
      const rzpKeySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

      if (rzpKeyId && rzpKeySecret) {
        const authHeaderRzp = 'Basic ' + Buffer.from(`${rzpKeyId}:${rzpKeySecret}`).toString('base64');

        const pRes = await fetch('https://api.razorpay.com/v1/payments?count=100', {
          headers: { 'Authorization': authHeaderRzp },
          cache: 'no-store'
        });

        if (pRes.ok) {
          const pData = await pRes.json();
          responseData.razorpay.connected = true;
          const capturedItems = (pData.items || []).filter(p => p.status === 'captured');
          const grossCaptured = capturedItems.reduce((sum, p) => sum + (parseFloat(p.amount) / 100), 0);
          responseData.razorpay.total_captured = Number(grossCaptured.toFixed(2));

          const sRes = await fetch('https://api.razorpay.com/v1/settlements?count=100', {
            headers: { 'Authorization': authHeaderRzp },
            cache: 'no-store'
          });

          if (sRes.ok) {
            const sData = await sRes.json();
            const items = sData.items || [];
            let settledSum = 0;
            responseData.razorpay.settlements_schedule = items.map(item => {
              const netAmt = parseFloat(item.amount) / 100;
              if (item.status === 'processed') settledSum += netAmt;
              return {
                id: item.id,
                amount: Number(netAmt.toFixed(2)),
                fees: Number((parseFloat(item.fees || 0) / 100).toFixed(2)),
                tax: Number((parseFloat(item.tax || 0) / 100).toFixed(2)),
                status: item.status,
                date: new Date(item.created_at * 1000).toISOString(),
                utr: item.utr || 'Pending'
              };
            });

            responseData.razorpay.total_settled = Number(settledSum.toFixed(2));
            const unsettled = Math.max(0, responseData.razorpay.total_captured - settledSum);
            responseData.razorpay.unsettled_balance = Number(unsettled.toFixed(2));
          }
        } else {
          const errData = await pRes.json().catch(() => ({}));
          responseData.razorpay.error = errData.error?.description || "Razorpay API Auth Failed.";
        }
      }
    } catch (rzpErr) {
      responseData.razorpay.error = rzpErr.message;
    }

    // 2. Shiprocket Live Data
    try {
      const email = (process.env.SHIPROCKET_EMAIL || '').trim();
      const password = (process.env.SHIPROCKET_PASSWORD || '').trim();

      if (email && password) {
        const srLoginRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          cache: 'no-store'
        });

        if (srLoginRes.ok) {
          const srAuthData = await srLoginRes.json();
          const token = srAuthData.token;

          if (token) {
            responseData.shiprocket.connected = true;

            const walletRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/account/details/wallet-balance`, {
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-store'
            });
            if (walletRes.ok) {
              const wData = await walletRes.json();
              responseData.shiprocket.wallet_balance = parseFloat(wData.data?.balance_amount || wData.balance || 0);
            }

            // Query Delivered shipments to compute estimated upcoming COD remittance
            const shipRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/shipments?per_page=100`, {
              headers: { 'Authorization': `Bearer ${token}` },
              cache: 'no-store'
            });
            if (shipRes.ok) {
              const sData = await shipRes.json();
              const shipments = sData.data || [];
              const codDelivered = shipments.filter(s => 
                (s.status === 'DELIVERED' || (s.status || '').toUpperCase() === 'DELIVERED') && 
                (s.payment_method || '').toLowerCase() === 'cod'
              );

              let codSum = 0;
              const schedule = [];

              for (const s of codDelivered) {
                let amt = 0;
                let channelOrdId = '';
                const matchInDb = (allOrders || []).find(o => 
                  o.shiprocket_order_id == s.order_id || 
                  o.shiprocket_awb == s.awb ||
                  (o.id && s.order_id && o.id.includes(s.order_id.toString()))
                );

                if (matchInDb && parseFloat(matchInDb.total_amount)) {
                  amt = parseFloat(matchInDb.total_amount);
                  channelOrdId = matchInDb.id;
                } else {
                  try {
                    const oRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/show/${s.order_id}`, {
                      headers: { 'Authorization': `Bearer ${token}` },
                      cache: 'no-store'
                    });
                    if (oRes.ok) {
                      const oData = await oRes.json();
                      amt = parseFloat(oData.data?.total || 0);
                      channelOrdId = oData.data?.channel_order_id || `SR-${s.order_id}`;
                    }
                  } catch (_) {}
                }

                codSum += amt;
                schedule.push({
                  id: channelOrdId || `AWB-${s.awb}`,
                  date: s.created_at || new Date().toISOString(),
                  status: 'Pending Payout',
                  utr: s.awb ? `AWB: ${s.awb}` : 'Processing',
                  amount: Number(amt.toFixed(2))
                });
              }

              responseData.shiprocket.upcoming_remittance_total = Number(codSum.toFixed(2));
              responseData.shiprocket.remittances_schedule = schedule;
            }
          }
        } else {
          const errData = await srLoginRes.json().catch(() => ({}));
          responseData.shiprocket.error = errData.message || "Shiprocket auth failed.";
        }
      }
    } catch (srErr) {
      responseData.shiprocket.error = srErr.message;
    }

    const codPipeline = responseData.local_metrics.cod_pipeline_total || 0;
    const codDeliveredPending = responseData.shiprocket.upcoming_remittance_total || responseData.local_metrics.cod_delivered_total || 0;
    const prepaidUnsettled = responseData.razorpay.unsettled_balance || 0;
    const totalSettled = (responseData.razorpay.total_settled || 0);
    const offlineTotal = responseData.local_metrics.offline_sales_total || 0;

    responseData.combined_summary = {
      offline_self_handover_total: Number(offlineTotal.toFixed(2)),
      cod_delivered_pending: Number(codDeliveredPending.toFixed(2)),
      cod_shipped_in_transit: Number((responseData.local_metrics.cod_shipped_total || 0).toFixed(2)),
      cod_pipeline_total: Number(codPipeline.toFixed(2)),
      prepaid_unsettled_balance: Number(prepaidUnsettled.toFixed(2)),
      prepaid_shipped_in_transit: Number((responseData.local_metrics.prepaid_shipped_total || 0).toFixed(2)),
      prepaid_pipeline_total: Number((responseData.local_metrics.prepaid_pipeline_total || 0).toFixed(2)),
      total_pending_bank_payout: Number((codDeliveredPending + prepaidUnsettled).toFixed(2)),
      total_already_received_in_bank: Number(totalSettled.toFixed(2))
    };

    return NextResponse.json(responseData, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
