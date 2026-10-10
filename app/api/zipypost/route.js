import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS Headers for Admin Panel compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Generate ZipyPost HMAC-SHA256 Auth Token
function generateZipypostAuthToken(timestamp) {
  const publicKey = process.env.ZIPYPOST_PUBLIC_KEY;
  const privateKey = process.env.ZIPYPOST_PRIVATE_KEY;
  const sellerId = process.env.ZIPYPOST_SELLER_ID;

  if (!publicKey || !privateKey || !sellerId) {
    throw new Error("ZipyPost credentials (ZIPYPOST_SELLER_ID, ZIPYPOST_PUBLIC_KEY, ZIPYPOST_PRIVATE_KEY) are not configured.");
  }

  const dataToHash = `public_key=${publicKey}&private_key=${privateKey}&seller_id=${sellerId}&time_stamp=${timestamp}`;
  return crypto.createHmac('sha256', privateKey).update(dataToHash).digest('hex');
}

// Helper to make authenticated requests to ZipyPost API
async function callZipypost(endpoint, method = 'GET', body = null) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const authToken = generateZipypostAuthToken(timestamp);
  const sellerId = process.env.ZIPYPOST_SELLER_ID;
  const baseUrl = process.env.ZIPYPOST_API_BASE || 'https://api.zipypost.com';

  const headers = {
    'authorization': authToken,
    'timestamp': timestamp,
    'sellerid': sellerId,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });

  const responseText = await res.text();
  let responseData = null;
  try {
    responseData = JSON.parse(responseText);
  } catch (e) {
    responseData = { message: responseText };
  }

  return { ok: res.ok, status: res.status, data: responseData };
}

// Format error message from ZipyPost response
function parseZipypostError(data, fallback = 'ZipyPost API Error') {
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.message) {
    if (typeof data.message === 'string') return data.message;
    return JSON.stringify(data.message);
  }
  if (data.error) {
    if (typeof data.error === 'string') return data.error;
    return JSON.stringify(data.error);
  }
  return fallback;
}

// POST Handler
export async function POST(request) {
  try {
    // 1. Authenticate Request using Supabase JWT
    const authHeader = request.headers.get('Authorization');
    const userToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!userToken) {
      return NextResponse.json(
        { error: "Authentication required. Please log in as Admin." },
        { status: 401, headers: corsHeaders }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    if (authError || !user || user.email !== 'maazforlap@gmail.com') {
      return NextResponse.json(
        { error: "Access Denied: Only the store Administrator is authorized to perform this action." },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400, headers: corsHeaders });
    }

    // ==========================================
    // ACTION 1: Get Pricing & Serviceability
    // ==========================================
    if (action === 'get_rates') {
      const {
        delivery_pincode,
        weight,
        length,
        width,
        height,
        is_cod,
        purchase_amount
      } = body;

      if (!delivery_pincode) {
        return NextResponse.json({ error: "Delivery pincode is required." }, { status: 400, headers: corsHeaders });
      }

      const pickupPincode = parseInt(process.env.ZIPYPOST_PICKUP_PINCODE || '222001', 10);
      const dropPincode = parseInt(delivery_pincode, 10);
      const parsedWeight = parseFloat(weight) || 0.5;
      const parsedLength = parseFloat(length) || 10;
      const parsedWidth = parseFloat(width) || 10;
      const parsedHeight = parseFloat(height) || 5;
      const parsedAmount = parseFloat(purchase_amount) || 500;
      const paymentType = is_cod ? '2' : '1';

      const pricingPayload = {
        pickup_pincode: pickupPincode,
        drop_pincode: dropPincode,
        payment_type: paymentType,
        purchase_amount: parsedAmount,
        length: parsedLength,
        width: parsedWidth,
        height: parsedHeight,
        weight: parsedWeight
      };

      const result = await callZipypost('/getservicepricing', 'POST', pricingPayload);

      if (!result.ok || !result.data?.success) {
        const errorMsg = parseZipypostError(result.data, "Failed to calculate courier rates with ZipyPost.");
        return NextResponse.json({ error: errorMsg }, { status: result.status || 400, headers: corsHeaders });
      }

      const couriersList = result.data?.result || [];
      if (!Array.isArray(couriersList) || couriersList.length === 0) {
        return NextResponse.json({ error: "Pincode is not serviceable by ZipyPost courier partners." }, { status: 400, headers: corsHeaders });
      }

      // User requirement: ONLY Delhivery, Ekart, and Shadowfax
      // Sequence: 1. Delhivery (with best price first), 2. Ekart (with best price first), 3. Shadowfax (with best price first)
      const allowedOrder = {
        'delhivery': 1,
        'ekart': 2,
        'shadowfax': 3
      };

      const getCourierGroup = (name) => {
        const lower = (name || '').toLowerCase();
        if (lower.includes('delhivery')) return 'delhivery';
        if (lower.includes('ekart')) return 'ekart';
        if (lower.includes('shadowfax')) return 'shadowfax';
        return null;
      };

      // Filter couriers: ONLY Delhivery, Ekart, and Shadowfax
      const filteredCouriers = couriersList.filter(c => {
        const group = getCourierGroup(c.courier_name);
        if (!group) return false;
        const mode = (c.mode_name || '').toLowerCase();
        // Exclude prepaid-only flat mode for COD orders
        if (is_cod && (mode === 'ppd_flat' || mode.includes('ppd'))) return false;
        return true;
      });

      if (filteredCouriers.length === 0) {
        return NextResponse.json({ error: "None of Delhivery, Ekart, or Shadowfax are serviceable for this pincode." }, { status: 400, headers: corsHeaders });
      }

      // Deduplicate exact duplicate items if any and map to clean courier objects
      const seenKeys = new Set();
      const cleanCouriers = [];

      for (const c of filteredCouriers) {
        const group = getCourierGroup(c.courier_name);
        const key = `${c.courier_id}_${c.mode_id}_${c.slab}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);

        const totalShipping = Number(c.total_shipping || (c.shipping_charge + (c.cod_charge || 0) + (c.applied_gstin || 0))).toFixed(2);
        cleanCouriers.push({
          courier_id: c.courier_id,
          courier_name: c.courier_name,
          mode_id: c.mode_id,
          mode_name: c.mode_name,
          rate: totalShipping,
          base_rate: c.shipping_charge,
          cod_charge: c.cod_charge || 0,
          gst: c.applied_gstin,
          slab: c.slab,
          additional_slab: c.additional_slab,
          zone: c.zone_name,
          applied_weight: c.applied_weight,
          group: group,
          priority: allowedOrder[group] || 99
        });
      }

      // Sort: First by Group Sequence (1. Delhivery, 2. Ekart, 3. Shadowfax), then by Rate ascending (lowest/best price first)
      cleanCouriers.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return parseFloat(a.rate) - parseFloat(b.rate);
      });

      return NextResponse.json({ couriers: cleanCouriers }, { headers: corsHeaders });
    }

    // ==========================================
    // ACTION 2: Create Shipment
    // ==========================================
    if (action === 'create_shipment') {
      const {
        order_id,
        courier_id,
        mode_id,
        courier_name,
        courier_rate,
        weight,
        length,
        width,
        height
      } = body;

      if (!order_id) {
        return NextResponse.json({ error: "order_id is required." }, { status: 400, headers: corsHeaders });
      }

      // Fetch full order data from Supabase
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .maybeSingle();

      if (orderErr || !order) {
        return NextResponse.json({ error: `Order ${order_id} not found.` }, { status: 404, headers: corsHeaders });
      }

      // Format customer phone
      let rawPhone = (order.phone || '').replace(/[^0-9]/g, '');
      if (rawPhone.length > 10 && rawPhone.startsWith('91')) {
        rawPhone = rawPhone.slice(2);
      }
      if (rawPhone.length !== 10) {
        return NextResponse.json({ error: `Invalid contact number (${order.phone}). 10-digit mobile number required.` }, { status: 400, headers: corsHeaders });
      }

      // Format address lines (ZipyPost requires line 1: 3-45 chars, line 2: 3-45 chars)
      const fullAddress = (order.address || '').trim();
      let addr1 = fullAddress.slice(0, 45).trim();
      if (addr1.length < 3) addr1 = "Delivery Address";
      let addr2 = fullAddress.length > 45 ? fullAddress.slice(45, 90).trim() : (order.city || "Nearby Area");
      if (addr2.length < 3) addr2 = order.city || "City Center";

      // Detect COD vs Prepaid
      const isCod = String(order.payment_method || '').toLowerCase().includes('cod') ||
                    String(order.payment_method || '').toLowerCase().includes('cash on delivery');
      const paymentType = isCod ? 2 : 1;
      const totalAmount = parseFloat(order.total_amount) || 0;

      // Package weight and dimensions
      const parsedWeight = parseFloat(weight) || 0.5;
      const parsedLength = parseFloat(length) || 10.0;
      const parsedWidth = parseFloat(width) || 10.0;
      const parsedHeight = parseFloat(height) || 5.0;

      // Format order items and calculate items subtotal
      const rawItems = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
        { product: { name: 'Attar Fragrance' }, quantity: 1, price: totalAmount }
      ];

      const itemsSubtotal = rawItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price || 0);
        const qty = parseInt(item.quantity, 10) || 1;
        return sum + (itemPrice * qty);
      }, 0);

      // Calculate exact Shipping and COD charges breakdown:
      // Prepaid: shipping_charge = 40, cod_charge = 0
      // COD: shipping_charge = 40, cod_charge = 30 (Total delivery & handling = 70)
      let shippingCharge = 0;
      let codCharge = 0;
      const diff = Math.round(totalAmount - itemsSubtotal);

      if (isCod) {
        if (diff >= 70) {
          shippingCharge = 40;
          codCharge = diff - 40; // Default ₹30 for ₹70 total
        } else if (diff > 0) {
          shippingCharge = Math.min(40, diff);
          codCharge = Math.max(0, diff - shippingCharge);
        } else {
          // If items subtotal was stored equal to total amount
          shippingCharge = 40;
          codCharge = 30;
        }
      } else {
        // Prepaid order
        codCharge = 0;
        shippingCharge = diff > 0 ? diff : 40;
      }

      // Base purchase amount (items total)
      let purchaseAmount = itemsSubtotal > 0 ? itemsSubtotal : parseFloat((totalAmount - (shippingCharge + codCharge)).toFixed(2));
      if (purchaseAmount <= 0) purchaseAmount = totalAmount;

      const formattedItems = rawItems.map((item, idx) => {
        const prodName = item.product?.name || item.name || "Attar";
        const size = item.selectedSize ? ` ${item.selectedSize}` : "";
        const itemWeight = (parsedWeight / rawItems.length);
        const itemPrice = parseFloat(item.price || (purchaseAmount / rawItems.length)) || 0;

        return {
          sku: item.product?.id || item.cartItemId || `SKU-${idx + 1}`,
          item_name: `${prodName}${size}`.trim().slice(0, 50),
          quantity: parseInt(item.quantity, 10) || 1,
          item_weight: parseFloat(itemWeight.toFixed(2)),
          item_price: parseFloat(itemPrice.toFixed(2))
        };
      });

      const warehouseId = parseInt(process.env.ZIPYPOST_WAREHOUSE_ID || '4507', 10);

      const shipmentPayload = {
        order_number: order.id,
        purchase_amount: purchaseAmount,
        purchase_date: new Date(order.created_at || Date.now()).toISOString().split('T')[0],
        billing_details_same_as_shipping: true,
        shipping_details: {
          full_name: (order.customer_name || "Valued Customer").slice(0, 40),
          contact_number: rawPhone,
          customer_email: order.email || "customer@maazoud.com",
          address_line_one: addr1,
          address_line_two: addr2,
          landmark: (order.city || "Landmark").slice(0, 40),
          pincode: (order.pincode || '').toString(),
          city: (order.city || "City").slice(0, 35)
        },
        items: formattedItems,
        package_length: parsedLength,
        package_width: parsedWidth,
        package_height: parsedHeight,
        package_weight: parsedWeight,
        shipping_charge: shippingCharge,
        cod_charge: codCharge,
        purchase_tax: 0,
        purchase_discount: 0,
        collectable_cod: isCod ? totalAmount : 0,
        warehouse_id: warehouseId,
        payment_type: paymentType
      };

      // Add courier_id and mode_id if explicitly selected by Admin
      if (courier_id && mode_id) {
        shipmentPayload.courier_id = parseInt(courier_id, 10);
        shipmentPayload.mode_id = parseInt(mode_id, 10);
      }

      console.log("Calling ZipyPost Create Shipment for:", order.id, "Payload:", JSON.stringify(shipmentPayload));

      const result = await callZipypost('/create/shipment', 'POST', shipmentPayload);

      if (!result.ok || !result.data?.success) {
        const errorMsg = parseZipypostError(result.data, "Failed to create shipment on ZipyPost.");
        return NextResponse.json({ error: errorMsg }, { status: result.status || 400, headers: corsHeaders });
      }

      const rawData = result.data || {};
      const resData = rawData.RESULT || rawData.result || rawData.data || rawData.DATA || rawData;
      const awbNumber = resData.awb || resData.awb_number || resData.tracking_number || resData.trackingNumber || rawData.awb || rawData.awb_number || rawData.RESULT?.awb || rawData.result?.awb;
      const zipyOrderId = resData.order_id || resData.id || resData.orderNumber || rawData.order_id || rawData.order_number;
      const partnerName = courier_name || resData.courier || resData.courier_name || resData.courierName || "ZipyPost Partner";
      const finalCharge = parseFloat(courier_rate || resData.shipping_charge || 0);

      // Update Order in Supabase
      const existingDetails = order.shipment_details || {};
      const updatedDetails = {
        ...existingDetails,
        carrier: 'zipypost',
        zipypost_awb: awbNumber ? String(awbNumber) : null,
        zipypost_order_id: zipyOrderId ? String(zipyOrderId) : null,
        zipypost_courier_name: partnerName,
        zipypost_charge: finalCharge,
        zipypost_status: 'AWB Assigned',
        zipypost_response: rawData,
        shipped_at: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          status: 'Shipped',
          shipment_details: updatedDetails,
          // Set shipping charge for store financials
          shiprocket_charge: finalCharge > 0 ? finalCharge : (order.shiprocket_charge || 0),
          shiprocket_courier_name: `ZipyPost (${partnerName})`
        })
        .eq('id', order.id);

      if (updateErr) {
        console.error("Failed to update Supabase order with ZipyPost details:", updateErr);
      }

      return NextResponse.json({
        success: true,
        order_id: order.id,
        zipypost_order_id: zipyOrderId,
        awb_number: awbNumber,
        courier_name: partnerName,
        rate: finalCharge,
        message: "Shipment successfully booked with ZipyPost!"
      }, { headers: corsHeaders });
    }

    // ==========================================
    // ACTION 3: Generate / Download Label
    // ==========================================
    if (action === 'generate_label') {
      const { awb_number, order_id } = body;
      let awb = awb_number;

      if (!awb && order_id) {
        const { data: ord } = await supabase.from('orders').select('shipment_details').eq('id', order_id).maybeSingle();
        awb = ord?.shipment_details?.zipypost_awb || 
              ord?.shipment_details?.zipypost_response?.RESULT?.awb ||
              ord?.shipment_details?.zipypost_response?.result?.awb;
      }

      if (!awb) {
        return NextResponse.json({ error: "AWB Number is required to fetch shipping label." }, { status: 400, headers: corsHeaders });
      }

      const result = await callZipypost(`/label/${awb}`, 'GET');

      if (!result.ok) {
        if (result.status === 422) {
          return NextResponse.json({
            error: "ZipyPost can only generate labels before the parcel is picked up by courier. Once in transit, label generation is restricted."
          }, { status: 422, headers: corsHeaders });
        }
        const errorMsg = parseZipypostError(result.data, "Failed to retrieve shipping label from ZipyPost.");
        return NextResponse.json({ error: errorMsg }, { status: result.status || 400, headers: corsHeaders });
      }

      const labelData = result.data;
      const labelUrl = labelData?.path || 
                       labelData?.PATH || 
                       labelData?.label_url || 
                       labelData?.url || 
                       labelData?.pdf_url || 
                       labelData?.label || 
                       labelData?.result?.path || 
                       labelData?.result?.label_url || 
                       labelData?.result?.url || 
                       labelData?.RESULT?.path || 
                       labelData?.RESULT?.label;

      if (!labelUrl) {
        return NextResponse.json({ error: "Label URL was not returned by ZipyPost." }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, label_url: labelUrl }, { headers: corsHeaders });
    }

    // ==========================================
    // ACTION 4: Track Shipment
    // ==========================================
    if (action === 'track_shipment') {
      const { awb_number, order_id } = body;
      let awb = awb_number;

      if (!awb && order_id) {
        const { data: ord } = await supabase.from('orders').select('shipment_details').eq('id', order_id).maybeSingle();
        awb = ord?.shipment_details?.zipypost_awb;
      }

      if (!awb) {
        return NextResponse.json({ error: "AWB Number is required to track shipment." }, { status: 400, headers: corsHeaders });
      }

      const result = await callZipypost(`/track/${awb}`, 'GET');

      if (!result.ok || !result.data?.success) {
        const errorMsg = parseZipypostError(result.data, "Failed to track shipment.");
        return NextResponse.json({ error: errorMsg }, { status: result.status || 400, headers: corsHeaders });
      }

      return NextResponse.json({
        success: true,
        tracking: result.data?.result || result.data
      }, { headers: corsHeaders });
    }

    // ==========================================
    // ACTION 5: Sync Shipment from ZipyPost
    // ==========================================
    if (action === 'sync_shipment') {
      const { order_id } = body;
      if (!order_id) {
        return NextResponse.json({ error: "order_id is required." }, { status: 400, headers: corsHeaders });
      }

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .maybeSingle();

      if (orderErr || !order) {
        return NextResponse.json({ error: `Order ${order_id} not found.` }, { status: 404, headers: corsHeaders });
      }

      const awb = order.shipment_details?.zipypost_awb;
      if (!awb) {
        return NextResponse.json({ error: "No ZipyPost AWB found on this order to sync." }, { status: 400, headers: corsHeaders });
      }

      const result = await callZipypost(`/track/${awb}`, 'GET');
      if (!result.ok || !result.data?.success) {
        const errorMsg = parseZipypostError(result.data, "Failed to fetch status from ZipyPost.");
        return NextResponse.json({ error: errorMsg }, { status: result.status || 400, headers: corsHeaders });
      }

      const trackInfo = result.data?.result || {};
      const statusText = trackInfo.status || 'Shipped';
      const courierName = trackInfo.courier || order.shipment_details?.zipypost_courier_name;

      const isDelivered = statusText.toLowerCase() === 'delivered' || trackInfo.tracking_status === 11 || trackInfo.tracking_status === 5;
      const newOrderStatus = isDelivered ? 'Delivered' : order.status;

      const updatedDetails = {
        ...(order.shipment_details || {}),
        carrier: 'zipypost',
        zipypost_status: statusText,
        zipypost_courier_name: courierName,
        zipypost_tracking_info: trackInfo,
        last_synced_at: new Date().toISOString()
      };

      await supabase.from('orders').update({
        status: newOrderStatus,
        shipment_details: updatedDetails
      }).eq('id', order.id);

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          status: newOrderStatus,
          zipypost_status: statusText,
          zipypost_awb: awb,
          zipypost_courier_name: courierName
        }
      }, { headers: corsHeaders });
    }

    // ==========================================
    // ACTION 6: Cancel Shipment
    // ==========================================
    if (action === 'cancel_shipment') {
      const { awb_number, order_id } = body;
      let awb = awb_number;

      if (!awb && order_id) {
        const { data: ord } = await supabase.from('orders').select('shipment_details').eq('id', order_id).maybeSingle();
        awb = ord?.shipment_details?.zipypost_awb;
      }

      if (!awb) {
        return NextResponse.json({ error: "AWB Number is required to cancel shipment." }, { status: 400, headers: corsHeaders });
      }

      const result = await callZipypost(`/cancel/shipment/${awb}`, 'GET');

      if (!result.ok || !result.data?.success) {
        const errorMsg = parseZipypostError(result.data, "Failed to cancel shipment on ZipyPost.");
        return NextResponse.json({ error: errorMsg }, { status: result.status || 400, headers: corsHeaders });
      }

      if (order_id) {
        const { data: ord } = await supabase.from('orders').select('shipment_details').eq('id', order_id).maybeSingle();
        const updatedDetails = {
          ...(ord?.shipment_details || {}),
          zipypost_status: 'Cancelled',
          cancelled_at: new Date().toISOString()
        };
        await supabase.from('orders').update({
          status: 'Cancelled',
          shipment_details: updatedDetails
        }).eq('id', order_id);
      }

      return NextResponse.json({ success: true, message: "Shipment cancelled successfully on ZipyPost." }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error("ZipyPost API Route Internal Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error occurred." },
      { status: 500, headers: corsHeaders }
    );
  }
}
