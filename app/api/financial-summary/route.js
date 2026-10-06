import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in';

// Helper to generate HMAC auth token for ZipyPost
function generateZipypostAuthToken(timestamp) {
  const publicKey = process.env.ZIPYPOST_PUBLIC_KEY;
  const privateKey = process.env.ZIPYPOST_PRIVATE_KEY;
  const sellerId = process.env.ZIPYPOST_SELLER_ID;
  if (!publicKey || !privateKey || !sellerId) return null;
  const dataToHash = `public_key=${publicKey}&private_key=${privateKey}&seller_id=${sellerId}&time_stamp=${timestamp}`;
  return crypto.createHmac('sha256', privateKey).update(dataToHash).digest('hex');
}

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
        cod_received_in_bank: 0,
        remittances_schedule: [],
        error: null
      },
      zipypost: {
        connected: false,
        wallet_balance: 0,
        upcoming_remittance_total: 0,
        next_due_cod: 0,
        cod_received_in_bank: 0,
        remittances_schedule: [],
        error: null
      },
      courier_combined: {
        cod_received_in_bank: 0,
        cod_pending_payout: 0,
        remittances_schedule: [],
        pending_schedule: []
      },
      razorpay: {
        connected: false,
        total_captured: 0,
        total_settled: 0,
        unsettled_balance: 0,
        settlements_schedule: [],
        pending_schedule: [],
        error: null
      },
      local_metrics: {
        offline_sales_total: 0,
        offline_orders_count: 0,
        total_cod_revenue: 0,
        total_cod_orders_count: 0,
        offline_portion: 0,
        courier_cod_portion: 0,
        offline_orders_list: [],
        total_cod_orders_list: [],
        cod_delivered_unremitted_estimate: 0,
        prepaid_razorpay_total: 0
      }
    };

    // Calculate DB estimates from Supabase orders
    let offlineOrders = [];
    let offlineSum = 0;
    let codOrders = [];
    let codShipped = [];
    let codShippedSum = 0;
    let codDelivered = [];
    let codDeliveredSum = 0;
    let codDeliveredRemittedSum = 0;
    let codDeliveredPendingSum = 0;
    let codProcessing = [];
    let codProcessingSum = 0;
    let prepaidOrders = [];
    let prepaidTotalSum = 0;
    let prepaidDelivered = [];
    let prepaidDeliveredSum = 0;
    let prepaidShipped = [];
    let prepaidShippedSum = 0;
    let prepaidProcessing = [];
    let prepaidProcessingSum = 0;
    let fullCodFuture = 0;

    const { data: allOrders } = await supabase.from('orders').select('*');
    if (allOrders && Array.isArray(allOrders)) {
      const nonCancelled = allOrders.filter(o => o.status !== 'Cancelled');

      // 1. Offline / Self Handover Sales
      const isHandDelivered = (o) => {
        const pm = String(o.payment_method || '').toLowerCase();
        if (pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid')) return false;
        const courier = String(o.shiprocket_courier_name || '').toLowerCase();
        const id = String(o.id || '');
        return pm.includes('offline') || pm.includes('cash (offline)') || courier.includes('hand delivered') || courier.includes('direct') || courier.includes('self handover') || id.startsWith('ORD-OFFLINE');
      };

      offlineOrders = nonCancelled.filter(isHandDelivered);
      offlineSum = offlineOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      // 2. COD Orders (Courier Shipped)
      codOrders = nonCancelled.filter(o => {
        const pm = String(o.payment_method || '').toLowerCase();
        return (pm.includes('cod') || pm.includes('cash on delivery')) && !isHandDelivered(o);
      });

      codDelivered = codOrders.filter(o => o.status === 'Delivered');

      const codDeliveredRemitted = codDelivered.filter(o => 
        Boolean(o.is_paid) ||
        Boolean(o.cod_remitted) ||
        String(o.payment_status || '').toLowerCase() === 'paid' ||
        Boolean(o.shipment_details?.cod_remitted) ||
        Boolean(o.shipment_details?.is_paid)
      );

      const codDeliveredPending = codDelivered.filter(o => 
        !Boolean(o.is_paid) &&
        !Boolean(o.cod_remitted) &&
        String(o.payment_status || '').toLowerCase() !== 'paid' &&
        !Boolean(o.shipment_details?.cod_remitted) &&
        !Boolean(o.shipment_details?.is_paid)
      );

      codDeliveredRemittedSum = codDeliveredRemitted.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      codDeliveredPendingSum = codDeliveredPending.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      codDeliveredSum = codDelivered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      codShipped = codOrders.filter(o => o.status === 'Shipped');
      codShippedSum = codShipped.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      codProcessing = codOrders.filter(o => o.status === 'Processing' || o.status === 'Placed');
      codProcessingSum = codProcessing.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      fullCodFuture = codDeliveredPendingSum + codShippedSum + codProcessingSum;

      // 3. Prepaid Orders
      prepaidOrders = nonCancelled.filter(o => {
        const pm = String(o.payment_method || '').toLowerCase();
        return pm.includes('razorpay') || pm.includes('payment id') || pm.includes('prepaid');
      });
      prepaidTotalSum = prepaidOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      prepaidDelivered = prepaidOrders.filter(o => o.status === 'Delivered');
      prepaidDeliveredSum = prepaidDelivered.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      prepaidShipped = prepaidOrders.filter(o => o.status === 'Shipped');
      prepaidShippedSum = prepaidShipped.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      prepaidProcessing = prepaidOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Shipped');
      prepaidProcessingSum = prepaidProcessing.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

      const formatOrderSummary = (o, type) => ({
        id: o.id,
        order_type: type,
        customer_name: o.customer_name || 'Customer',
        phone: o.phone || '',
        payment_method: o.payment_method || 'N/A',
        total_amount: parseFloat(o.total_amount || 0),
        status: o.status,
        date: o.created_at,
        courier_name: o.shipping_partner === 'zipypost' ? (o.zipypost_courier_name || 'ZipyPost') : (o.shiprocket_courier_name || o.shipping_partner || 'Courier'),
        awb: o.zipypost_awb || o.shiprocket_awb || o.shipment_details?.awb || 'Pending'
      });

      const offlineList = offlineOrders.map(o => formatOrderSummary(o, 'Offline Sales'));
      const codList = codOrders.map(o => formatOrderSummary(o, 'Courier COD'));
      const combinedCodList = [...offlineList, ...codList];

      responseData.local_metrics = {
        offline_sales_total: Number(offlineSum.toFixed(2)),
        offline_orders_count: offlineOrders.length,
        total_cod_revenue: Number((offlineSum + codOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)).toFixed(2)),
        total_cod_orders_count: offlineOrders.length + codOrders.length,
        offline_portion: Number(offlineSum.toFixed(2)),
        courier_cod_portion: Number(codOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0).toFixed(2)),
        offline_orders_list: offlineList,
        total_cod_orders_list: combinedCodList,
        cod_delivered_total: Number(codDeliveredSum.toFixed(2)),
        cod_delivered_remitted_total: Number(codDeliveredRemittedSum.toFixed(2)),
        cod_delivered_pending_total: Number(codDeliveredPendingSum.toFixed(2)),
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
        cod_delivered_unremitted_estimate: Number(codDeliveredPendingSum.toFixed(2)),
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
          const testPaymentIds = new Set([
            'pay_TCygNbBeXIxZ3Z', 'pay_TCyc0rLGHe8ThB', 'pay_TCmLbONd0E1GAD',
            'pay_TChggKKdNKO3Lx', 'pay_TChaDDjwZOXF1s', 'pay_TChUchwabk8OAZ', 'pay_TCgB20WCcZO1pK'
          ]);
          const testSettlementIds = new Set(['setl_TDhKzqD09r2zek', 'setl_TDIw4LsZatHDnF']);

          const capturedItems = (pData.items || []).filter(p => 
            p.status === 'captured' && 
            !testPaymentIds.has(p.id) && 
            (parseFloat(p.amount) / 100) > 2
          );
          const grossCaptured = capturedItems.reduce((sum, p) => sum + (parseFloat(p.amount) / 100), 0);
          responseData.razorpay.total_captured = Number(grossCaptured.toFixed(2));

          const sRes = await fetch('https://api.razorpay.com/v1/settlements?count=100', {
            headers: { 'Authorization': authHeaderRzp },
            cache: 'no-store'
          });

          if (sRes.ok) {
            const sData = await sRes.json();
            const items = (sData.items || []).filter(item => !testSettlementIds.has(item.id));
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

            // Build pending schedule for captured payments awaiting bank settlement
            const pendingRzpItems = [];
            if (unsettled > 0) {
              let rem = unsettled;
              for (const p of capturedItems) {
                if (rem <= 0) break;
                const pAmt = parseFloat(p.amount) / 100;
                pendingRzpItems.push({
                  id: p.id,
                  order_id: p.order_id || p.notes?.order_id || 'Online Checkout',
                  date: new Date(p.created_at * 1000).toISOString(),
                  amount: pAmt,
                  method: p.method ? p.method.toUpperCase() : 'UPI',
                  customer_email: p.email || 'N/A',
                  customer_contact: p.contact || 'N/A',
                  status: 'Captured - Payout Pending'
                });
                rem -= pAmt;
              }
            }
            responseData.razorpay.pending_schedule = pendingRzpItems;
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
                String(s.payment_method || '').toLowerCase() === 'cod'
              );

              let codPendingSum = 0;
              let codReceivedSum = 0;
              const schedule = [];

              for (const s of codDelivered) {
                let amt = 0;
                let channelOrdId = '';
                let srRemittanceStatus = '';
                let srRemittanceUtr = '';
                let srRemittanceDate = '';

                const matchInDb = (allOrders || []).find(o => 
                  o.shiprocket_order_id == s.order_id || 
                  o.shiprocket_awb == s.awb ||
                  (o.id && s.order_id && o.id.includes(s.order_id.toString()))
                );

                if (matchInDb && parseFloat(matchInDb.total_amount)) {
                  amt = parseFloat(matchInDb.total_amount);
                  channelOrdId = matchInDb.id;
                }

                try {
                  const oRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/show/${s.order_id}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    cache: 'no-store'
                  });
                  if (oRes.ok) {
                    const oData = await oRes.json();
                    const d = oData.data || {};
                    if (!amt) amt = parseFloat(d.total || 0);
                    if (!channelOrdId) channelOrdId = d.channel_order_id || `SR-${s.order_id}`;
                    srRemittanceStatus = String(d.remittance_status || '').trim();
                    srRemittanceUtr = String(d.remittance_utr || '').trim();
                    srRemittanceDate = String(d.remittance_date || '').trim();
                  }
                } catch (_) {}

                const normalizedSrRemStatus = srRemittanceStatus.toLowerCase();
                const isRemitted = 
                  normalizedSrRemStatus.includes('success') || 
                  normalizedSrRemStatus.includes('remitted') || 
                  normalizedSrRemStatus.includes('paid') || 
                  normalizedSrRemStatus.includes('completed') || 
                  normalizedSrRemStatus.includes('settled') ||
                  Boolean(matchInDb?.is_paid) ||
                  Boolean(matchInDb?.cod_remitted) ||
                  String(matchInDb?.payment_status || '').toLowerCase() === 'paid' ||
                  Boolean(matchInDb?.shipment_details?.cod_remitted) ||
                  Boolean(matchInDb?.shipment_details?.is_paid);

                const finalUtr = srRemittanceUtr || matchInDb?.shipment_details?.remittance_utr || (s.awb ? `AWB: ${s.awb}` : 'Remitted');
                const finalDate = srRemittanceDate || s.created_at || new Date().toISOString();

                if (isRemitted) {
                  codReceivedSum += amt;
                  schedule.push({
                    id: channelOrdId || `AWB-${s.awb}`,
                    date: finalDate,
                    status: 'Received in Bank',
                    utr: finalUtr,
                    amount: Number(amt.toFixed(2))
                  });

                  if (matchInDb && !matchInDb.shipment_details?.cod_remitted && srRemittanceStatus) {
                    try {
                      const updatedDetails = {
                        ...(matchInDb.shipment_details || {}),
                        cod_remitted: true,
                        remittance_utr: finalUtr,
                        remittance_date: finalDate,
                        remittance_status: srRemittanceStatus
                      };
                      await supabase.from('orders').update({
                        shipment_details: updatedDetails
                      }).eq('id', matchInDb.id);
                    } catch (_) {}
                  }
                } else {
                  codPendingSum += amt;
                  schedule.push({
                    id: channelOrdId || `AWB-${s.awb}`,
                    date: s.created_at || new Date().toISOString(),
                    status: 'Pending Payout',
                    utr: s.awb ? `AWB: ${s.awb}` : 'Processing',
                    amount: Number(amt.toFixed(2))
                  });
                }
              }

              responseData.shiprocket.upcoming_remittance_total = Number(codPendingSum.toFixed(2));
              responseData.shiprocket.cod_received_in_bank = Number(codReceivedSum.toFixed(2));
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

    // 3. ZipyPost Live Data
    try {
      const sellerId = (process.env.ZIPYPOST_SELLER_ID || '').trim();
      const publicKey = (process.env.ZIPYPOST_PUBLIC_KEY || '').trim();
      const privateKey = (process.env.ZIPYPOST_PRIVATE_KEY || '').trim();
      const zipyApiBase = process.env.ZIPYPOST_API_BASE || 'https://api.zipypost.com';

      if (sellerId && publicKey && privateKey) {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const token = generateZipypostAuthToken(timestamp);

        if (token) {
          const zRes = await fetch(`${zipyApiBase}/cod/remittance?page=1&limit=100&include_summary=1`, {
            headers: {
              'authorization': token,
              'timestamp': timestamp,
              'sellerid': sellerId
            },
            cache: 'no-store'
          });

          if (zRes.ok) {
            const zData = await zRes.json();
            responseData.zipypost.connected = true;
            const records = zData.records || [];
            const summary = zData.summary || {};

            responseData.zipypost.cod_received_in_bank = parseFloat(summary.remittance_till_date || 0);
            responseData.zipypost.upcoming_remittance_total = parseFloat(summary.total_due_cod || 0);
            responseData.zipypost.next_due_cod = parseFloat(summary.next_due_cod || 0);

            const zipySchedule = [];
            for (const r of records) {
              let orderDetails = [];
              try {
                const detailTimestamp = Math.floor(Date.now() / 1000).toString();
                const detailToken = generateZipypostAuthToken(detailTimestamp);
                const dRes = await fetch(`${zipyApiBase}/cod/remittance/${r.id}/detail?page=1&limit=100`, {
                  headers: {
                    'authorization': detailToken,
                    'timestamp': detailTimestamp,
                    'sellerid': sellerId
                  },
                  cache: 'no-store'
                });
                if (dRes.ok) {
                  const dData = await dRes.json();
                  orderDetails = dData.records || [];
                }
              } catch (_) {}

              if (orderDetails.length > 0) {
                for (const od of orderDetails) {
                  zipySchedule.push({
                    partner: 'ZipyPost',
                    id: od.order_number || `ZP-${od.order_id}`,
                    awb: od.awb_number,
                    courier: od.courier || 'Delhivery',
                    date: od.remittance_date || r.created,
                    status: 'Received in Bank',
                    utr: r.utr_number || od.utr_number || 'Remitted',
                    amount: parseFloat(od.amount || 0)
                  });
                }
              } else {
                zipySchedule.push({
                  partner: 'ZipyPost',
                  id: `UTR-${r.id}`,
                  awb: r.utr_number,
                  courier: 'ZipyPost Partner',
                  date: r.created,
                  status: 'Received in Bank',
                  utr: r.utr_number,
                  amount: parseFloat(r.total_amount || 0)
                });
              }
            }

            responseData.zipypost.remittances_schedule = zipySchedule;
          }
        }
      }
    } catch (zipyErr) {
      responseData.zipypost.error = zipyErr.message;
    }

    // 4. Combined Courier (Shiprocket + ZipyPost) Calculations
    const srReceived = responseData.shiprocket.connected ? (responseData.shiprocket.cod_received_in_bank || 0) : (responseData.local_metrics.cod_delivered_remitted_total || 0);
    const zpReceived = responseData.zipypost.connected ? (responseData.zipypost.cod_received_in_bank || 0) : 0;
    const combinedCodReceived = Number((srReceived + zpReceived).toFixed(2));

    const srPending = responseData.shiprocket.connected ? (responseData.shiprocket.upcoming_remittance_total || 0) : (responseData.local_metrics.cod_delivered_pending_total || 0);
    const zpPending = responseData.zipypost.connected ? (responseData.zipypost.upcoming_remittance_total || 0) : 0;
    const inTransitPending = responseData.local_metrics.cod_shipped_total || 0;
    const combinedCodPending = Number((srPending + zpPending + inTransitPending).toFixed(2));

    // Combine schedules
    const combinedRemittancesList = [
      ...(responseData.shiprocket.remittances_schedule || []).map(r => ({
        partner: 'Shiprocket',
        ...r
      })),
      ...(responseData.zipypost.remittances_schedule || [])
    ];

    // Build comprehensive pending schedule
    const combinedPendingList = [];

    // From Shiprocket delivered pending
    if (responseData.shiprocket.connected && Array.isArray(responseData.shiprocket.remittances_schedule)) {
      for (const item of responseData.shiprocket.remittances_schedule) {
        if (item.status === 'Pending Payout') {
          combinedPendingList.push({
            partner: 'Shiprocket',
            ...item,
            delivery_status: 'Delivered (Pending Remittance)'
          });
        }
      }
    }

    // From In-Transit COD orders (DB)
    for (const o of codShipped) {
      combinedPendingList.push({
        partner: o.shipping_partner === 'zipypost' ? 'ZipyPost' : (o.shiprocket_awb ? 'Shiprocket' : 'Courier'),
        id: o.id,
        awb: o.zipypost_awb || o.shiprocket_awb || 'In Transit',
        courier: o.zipypost_courier_name || o.shiprocket_courier_name || 'Courier Partner',
        date: o.created_at,
        status: 'In Transit (Shipped)',
        delivery_status: 'Shipped (In Transit)',
        utr: 'Pending Delivery',
        amount: parseFloat(o.total_amount || 0)
      });
    }

    // From ZipyPost if any additional pending note
    if (zpPending > 0 && combinedPendingList.filter(p => p.partner === 'ZipyPost').length === 0) {
      combinedPendingList.push({
        partner: 'ZipyPost',
        id: 'ZipyPost COD Due',
        awb: 'Live Portal Balance',
        courier: 'Delhivery / Ekart / Shadowfax',
        date: new Date().toISOString(),
        status: 'Pending Remittance Cycle',
        delivery_status: `Total Due COD: ₹${zpPending}`,
        utr: responseData.zipypost.next_due_cod ? `Next Due: ₹${responseData.zipypost.next_due_cod}` : 'Pending Payout',
        amount: zpPending
      });
    }

    responseData.courier_combined = {
      cod_received_in_bank: combinedCodReceived,
      cod_pending_payout: combinedCodPending,
      remittances_schedule: combinedRemittancesList,
      pending_schedule: combinedPendingList
    };

    const prepaidUnsettled = responseData.razorpay.unsettled_balance || 0;
    const totalSettled = (responseData.razorpay.total_settled || 0);
    const offlineTotal = responseData.local_metrics.offline_sales_total || 0;
    const codTotalSum = responseData.local_metrics.total_cod_revenue || 0;

    responseData.combined_summary = {
      offline_self_handover_total: Number(offlineTotal.toFixed(2)),
      offline_sales_total: Number(offlineTotal.toFixed(2)),
      offline_orders_count: offlineOrders.length,
      total_cod_revenue: Number(codTotalSum.toFixed(2)),
      total_cod_orders_count: offlineOrders.length + codOrders.length,
      offline_portion: Number(offlineTotal.toFixed(2)),
      courier_cod_portion: Number((codTotalSum - offlineTotal).toFixed(2)),
      cod_delivered_pending: Number(combinedCodPending.toFixed(2)),
      cod_already_received_in_bank: Number(combinedCodReceived.toFixed(2)),
      cod_shipped_in_transit: Number((responseData.local_metrics.cod_shipped_total || 0).toFixed(2)),
      cod_pipeline_total: Number((responseData.local_metrics.cod_pipeline_total || 0).toFixed(2)),
      prepaid_unsettled_balance: Number(prepaidUnsettled.toFixed(2)),
      prepaid_shipped_in_transit: Number((responseData.local_metrics.prepaid_shipped_total || 0).toFixed(2)),
      prepaid_pipeline_total: Number((responseData.local_metrics.prepaid_pipeline_total || 0).toFixed(2)),
      razorpay_settled_in_bank: Number(totalSettled.toFixed(2)),
      razorpay_pending_payout: Number(prepaidUnsettled.toFixed(2)),
      courier_cod_received_in_bank: combinedCodReceived,
      courier_cod_pending_payout: combinedCodPending,
      shiprocket_cod_received: srReceived,
      zipypost_cod_received: zpReceived,
      shiprocket_cod_pending: srPending,
      zipypost_cod_pending: zpPending,
      total_pending_bank_payout: Number((combinedCodPending + prepaidUnsettled).toFixed(2)),
      total_already_received_in_bank: Number((totalSettled + combinedCodReceived).toFixed(2))
    };

    return NextResponse.json(responseData, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
