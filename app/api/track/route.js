import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Generate ZipyPost HMAC-SHA256 Auth Token
function generateZipypostAuthToken(timestamp) {
  const publicKey = process.env.ZIPYPOST_PUBLIC_KEY;
  const privateKey = process.env.ZIPYPOST_PRIVATE_KEY;
  const sellerId = process.env.ZIPYPOST_SELLER_ID;

  if (!publicKey || !privateKey || !sellerId) return null;
  const dataToHash = `public_key=${publicKey}&private_key=${privateKey}&seller_id=${sellerId}&time_stamp=${timestamp}`;
  return crypto.createHmac('sha256', privateKey).update(dataToHash).digest('hex');
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const awbParam = searchParams.get('awb');

    if (!orderId && !awbParam) {
      return NextResponse.json({ error: "orderId or awb is required." }, { status: 400, headers: corsHeaders });
    }

    // 1. Fetch order details from Supabase
    let order = null;
    if (orderId) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();
      order = data;
    } else if (awbParam) {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .or(`shiprocket_awb.eq.${awbParam},shipment_details->>zipypost_awb.eq.${awbParam}`)
        .maybeSingle();
      order = data;
    }

    if (!order && !awbParam) {
      return NextResponse.json({ error: "Order not found." }, { status: 404, headers: corsHeaders });
    }

    const shipmentDetails = typeof order?.shipment_details === 'string'
      ? (() => { try { return JSON.parse(order.shipment_details); } catch(e) { return {}; } })()
      : (order?.shipment_details || {});

    const orderStatus = order?.status || 'Processing';
    const carrier = shipmentDetails?.carrier || (order?.shiprocket_awb ? 'shiprocket' : (shipmentDetails?.zipypost_awb ? 'zipypost' : 'standard'));
    const zipyAwb = shipmentDetails?.zipypost_awb || (carrier === 'zipypost' ? order?.shiprocket_awb : null) || awbParam;
    const srAwb = order?.shiprocket_awb;
    let courierName = shipmentDetails?.zipypost_courier_name || order?.shiprocket_courier_name || 'Courier Partner';

    // Estimated delivery date calculation (+7 days from created_at)
    const baseDate = order?.created_at ? new Date(order.created_at) : new Date();
    const estDelivery = new Date(baseDate);
    estDelivery.setDate(estDelivery.getDate() + 7);
    const formattedEstDelivery = estDelivery.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const placedDateFormatted = baseDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // 2. If Order is shipped via ZipyPost, fetch real-time tracking from ZipyPost
    let liveTracking = null;
    let scans = [];
    let currentStatusText = orderStatus;
    let currentLocation = order?.city || '';

    if ((carrier === 'zipypost' || zipyAwb) && process.env.ZIPYPOST_SELLER_ID) {
      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const authToken = generateZipypostAuthToken(timestamp);
        const baseUrl = process.env.ZIPYPOST_API_BASE || 'https://api.zipypost.com';

        if (authToken && zipyAwb) {
          const zipyRes = await fetch(`${baseUrl}/track/${zipyAwb}`, {
            headers: {
              'authorization': authToken,
              'timestamp': timestamp,
              'sellerid': process.env.ZIPYPOST_SELLER_ID
            },
            cache: 'no-store'
          });

          if (zipyRes.ok) {
            const zipyData = await zipyRes.json();
            if (zipyData?.success && zipyData?.result) {
              liveTracking = zipyData.result;
              currentStatusText = liveTracking.status || liveTracking.tracking_status_text || currentStatusText;
              currentLocation = liveTracking.location || liveTracking.current_location || currentLocation;

              if (liveTracking.courier) {
                courierName = liveTracking.courier;
              }

              // Format scans if available
              if (Array.isArray(liveTracking.scans)) {
                scans = liveTracking.scans.map(s => ({
                  date: s.date || s.scan_datetime || '',
                  time: s.time || '',
                  location: s.location || s.scan_location || '',
                  activity: s.activity || s.status_description || s.status || 'Package in transit',
                  status: s.status || ''
                }));
              } else if (Array.isArray(liveTracking.activities)) {
                scans = liveTracking.activities.map(s => ({
                  date: s.date || '',
                  time: s.time || '',
                  location: s.location || '',
                  activity: s.activity || 'Package in transit',
                  status: s.status || ''
                }));
              } else if (Array.isArray(liveTracking.events)) {
                scans = liveTracking.events.map(s => {
                  const dt = s.scan_time ? new Date(s.scan_time) : null;
                  return {
                    date: dt ? dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
                    time: dt ? dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
                    location: s.location && s.location !== 'null' ? s.location : '',
                    activity: s.remark && s.remark !== 'InTransit' ? s.remark : (s.scan || 'Package in transit'),
                    status: s.scan || ''
                  };
                });
                const validLocs = liveTracking.events.filter(e => e.location && e.location !== 'null');
                if (validLocs.length > 0) {
                  currentLocation = validLocs[validLocs.length - 1].location;
                }
              }
            }
          }
        }
      } catch (trackErr) {
        console.warn("ZipyPost live track API call error:", trackErr.message);
      }
    } else if (carrier === 'shiprocket' || srAwb) {
      // Check last webhook scans if available
      const webhookScans = order?.shipment_details?.last_webhook_payload?.scans;
      if (Array.isArray(webhookScans)) {
        scans = webhookScans.map(s => ({
          date: s.date || '',
          time: '',
          location: s.location || '',
          activity: s.activity || s['sr-status-label'] || 'Package updated',
          status: s.status || ''
        }));
        if (scans.length > 0) {
          const latest = scans[scans.length - 1];
          currentStatusText = latest.activity;
          currentLocation = latest.location;
        }
      }
    }

    // 3. Construct Flipkart-style 4-Step Tracking Stepper
    // Steps: 1. Order Confirmed, 2. Shipped, 3. Out for Delivery, 4. Delivered
    const normalizedStatus = (orderStatus || '').toLowerCase();
    const isCancelled = normalizedStatus === 'cancelled';
    const isDelivered = normalizedStatus === 'delivered' || (liveTracking && String(liveTracking.status).toLowerCase() === 'delivered');
    const isOutForDelivery = normalizedStatus === 'out for delivery' || (liveTracking && (String(liveTracking.status).toLowerCase().includes('out for delivery') || String(liveTracking.status).toLowerCase().includes('ofd')));
    const isShipped = normalizedStatus === 'shipped' || isOutForDelivery || isDelivered || (liveTracking && (String(liveTracking.status).toLowerCase().includes('transit') || String(liveTracking.status).toLowerCase().includes('booked')));

    const stepper = [
      {
        id: 'confirmed',
        title: 'Order Confirmed',
        description: `Order verified & confirmed on ${placedDateFormatted}`,
        completed: true,
        current: !isShipped && !isDelivered && !isCancelled,
        date: placedDateFormatted
      },
      {
        id: 'shipped',
        title: 'Shipped',
        description: isShipped 
          ? `Dispatched via ${courierName}${zipyAwb || srAwb ? ` (AWB: ${zipyAwb || srAwb})` : ''}`
          : 'Seller is preparing your package for handover',
        completed: isShipped,
        current: isShipped && !isOutForDelivery && !isDelivered && !isCancelled,
        courier: courierName,
        awb: zipyAwb || srAwb || null
      },
      {
        id: 'out_for_delivery',
        title: 'Out for Delivery',
        description: isOutForDelivery 
          ? 'Courier executive is out for delivery in your area' 
          : 'Package will reach your nearest delivery hub',
        completed: isOutForDelivery || isDelivered,
        current: isOutForDelivery && !isDelivered && !isCancelled
      },
      {
        id: 'delivered',
        title: isCancelled ? 'Cancelled' : 'Delivered',
        description: isCancelled 
          ? 'This order was cancelled' 
          : isDelivered 
            ? 'Item delivered successfully to your address' 
            : `Expected by ${formattedEstDelivery}`,
        completed: isDelivered,
        current: isDelivered,
        isCancelled: isCancelled
      }
    ];

    return NextResponse.json({
      success: true,
      orderId: order?.id || orderId,
      status: isCancelled ? 'Cancelled' : (isDelivered ? 'Delivered' : (isShipped ? 'Shipped' : 'Processing')),
      currentStatusText: isCancelled ? 'Cancelled' : currentStatusText,
      currentLocation: currentLocation,
      expectedDelivery: formattedEstDelivery,
      carrier: carrier,
      courierName: courierName,
      awb: zipyAwb || srAwb || null,
      stepper: stepper,
      scans: scans.reverse() // show latest scan first
    }, { headers: corsHeaders });

  } catch (err) {
    console.error("Tracking API error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch tracking details" }, { status: 500, headers: corsHeaders });
  }
}
