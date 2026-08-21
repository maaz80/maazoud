import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with service role key if available to bypass RLS (if configured),
// otherwise fallback to anon key.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Shiprocket Base URL
const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in';

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

// Helper function to authenticate and get Shiprocket Token
async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error("Shiprocket credentials (SHIPROCKET_EMAIL/SHIPROCKET_PASSWORD) are not configured in environment variables.");
  }

  try {
    const res = await fetch(`${SHIPROCKET_API_BASE}/v1/external/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      throw new Error(data.message || "Failed to retrieve authentication token from Shiprocket.");
    }
    return data.token;
  } catch (err) {
    throw new Error(`Shiprocket Auth Error: ${err.message}`);
  }
}

// Helper to parse detailed error messages from Shiprocket responses
function parseShiprocketError(data, fallbackMsg) {
  if (!data) return fallbackMsg;

  // 1. Check package remarks from courier partner API (e.g. Delhivery ER0005)
  const pkgRemark = data?.response?.data?.packages?.[0]?.remarks?.[0];
  if (pkgRemark && typeof pkgRemark === 'string') {
    return pkgRemark;
  }

  // 2. Check awb_assign_error or rmk
  const awbErr = data?.awb_assign_error || data?.data?.awb_assign_error || data?.response?.data?.rmk;
  if (awbErr && typeof awbErr === 'string') {
    return awbErr;
  }

  let rawMsg = data.message || data.response || fallbackMsg;
  let msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
  if (data.errors) {
    if (typeof data.errors === 'string') {
      msg += ` (${data.errors})`;
    } else if (typeof data.errors === 'object') {
      const details = Object.entries(data.errors)
        .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : JSON.stringify(errs)}`)
        .join('; ');
      if (details) {
        msg += ` [Details: ${details}]`;
      }
    }
  }
  return msg;
}

// POST endpoint to handle actions
export async function POST(request) {
  try {
    // 1. Authenticate Request using Supabase JWT
    const authHeader = request.headers.get('Authorization');
    const userToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!userToken) {
      return NextResponse.json({ error: "Authentication required. Please log in as Admin." }, { status: 401, headers: corsHeaders });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(userToken);
    if (authError || !user || user.email !== 'maazforlap@gmail.com') {
      return NextResponse.json({ error: "Access Denied: Only the store Administrator is authorized to perform this action." }, { status: 403, headers: corsHeaders });
    }

    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400, headers: corsHeaders });
    }

    // ACTION 1: Get Courier Rates
    if (action === 'get_rates') {
      const { delivery_pincode, weight, length, width, height, is_cod, pickup_date, order_id } = body;

      if (!delivery_pincode) {
        return NextResponse.json({ error: "Delivery pincode is required." }, { status: 400, headers: corsHeaders });
      }

      const pickup_pincode = process.env.SHIPROCKET_PICKUP_PINCODE || '273001'; // Default backup
      const parsedWeight = parseFloat(weight) || 0.5;
      const parsedLength = parseFloat(length) || 10;
      const parsedWidth = parseFloat(width) || 10;
      const parsedHeight = parseFloat(height) || 10;

      const token = await getShiprocketToken();

      // Check if order already exists in Supabase to pass shiprocket_order_id
      let srOrderId = null;
      if (order_id) {
        const { data: ord } = await supabase
          .from('orders')
          .select('shiprocket_order_id')
          .eq('id', order_id)
          .maybeSingle();
        if (ord?.shiprocket_order_id) {
          srOrderId = ord.shiprocket_order_id;
        }
      }

      // Call Shiprocket Courier Serviceability API
      const queryParams = new URLSearchParams({
        pickup_postcode: pickup_pincode,
        delivery_postcode: delivery_pincode,
        weight: parsedWeight.toString(),
        cod: is_cod ? '1' : '0',
        length: parsedLength.toString(),
        width: parsedWidth.toString(),
        height: parsedHeight.toString(),
        ...(pickup_date ? { pickup_date: pickup_date } : {}),
        ...(srOrderId ? { order_id: srOrderId } : {})
      });

      const res = await fetch(`${SHIPROCKET_API_BASE}/v1/external/courier/serviceability/?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle low balance or subscription errors gracefully
        const msgStr = typeof data?.message === 'string' ? data.message : JSON.stringify(data?.message || '');
        if (msgStr && (msgStr.toLowerCase().includes('wallet') || msgStr.toLowerCase().includes('balance'))) {
          return NextResponse.json({ error: "Shiprocket Error: Insufficient wallet balance. Please recharge your Shiprocket account." }, { status: 400, headers: corsHeaders });
        }
        return NextResponse.json({ error: parseShiprocketError(data, "Failed to calculate courier rates.") }, { status: res.status, headers: corsHeaders });
      }

      const availableCouriers = data?.data?.available_courier_companies || [];
      
      // Filter out blocked/disabled couriers
      const validCouriers = availableCouriers.filter(courier => 
        courier.blocked !== 1 && 
        courier.blocked !== true && 
        courier.status !== 0 && 
        courier.status !== "0"
      );

      if (validCouriers.length === 0) {
        return NextResponse.json({ error: "Pincode is not serviceable by any active courier partner currently." }, { status: 400, headers: corsHeaders });
      }

      // Sort couriers by price (lowest first)
      const sortedCouriers = validCouriers.map(courier => ({
        courier_company_id: courier.courier_company_id,
        courier_name: courier.courier_name,
        rate: courier.rate,
        etd: courier.etd || 'N/A',
        rating: courier.rating || 'N/A',
        min_weight: courier.min_weight || 0.5
      })).sort((a, b) => a.rate - b.rate);

      return NextResponse.json({ couriers: sortedCouriers }, { headers: corsHeaders });
    }

    // ACTION 2: Create Order & Assign AWB
    if (action === 'create_shipment') {
      const { order_id, courier_id, courier_rate, weight, length, width, height, pickup_date } = body;

      if (!order_id || !courier_id) {
        return NextResponse.json({ error: "Order ID and Courier ID are required." }, { status: 400, headers: corsHeaders });
      }

      // 1. Fetch Order Details from Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: `Order not found in database: ${orderError?.message || ''}` }, { status: 404, headers: corsHeaders });
      }

      // Format weights and dimensions
      const parsedWeight = parseFloat(weight) || 0.5;
      const parsedLength = parseFloat(length) || 10;
      const parsedWidth = parseFloat(width) || 10;
      const parsedHeight = parseFloat(height) || 10;

      // Extract details
      const pickup_location = process.env.SHIPROCKET_PICKUP_LOCATION || 'Home';
      const isCod = String(order?.payment_method || '').toLowerCase().includes('cod') || String(order?.payment_method || '').toLowerCase().includes('cash on delivery');

      const token = await getShiprocketToken();

      // Format order items safely according to Shiprocket schema
      const orderItems = (order.items || []).map(item => ({
        name: (item.product?.name || item.name || "Attar Scent").trim(),
        sku: String(item.cartItemId || item.product?.id || item.id || "attar-generic").trim().replace(/[^a-zA-Z0-9_-]/g, ''),
        units: Math.max(1, parseInt(item.quantity) || 1),
        selling_price: Math.max(0, parseFloat(item.price) || 0),
        discount: 0,
        tax: 0
      }));

      if (orderItems.length === 0) {
        orderItems.push({
          name: "Premium Pure Attar Formulation",
          sku: "attar-generic",
          units: 1,
          selling_price: Math.max(0, parseFloat(order.total_amount) || 0),
          discount: 0,
          tax: 0
        });
      }

      // Customer name splitting
      const fullName = (order.customer_name || 'Customer').trim();
      const nameParts = fullName.split(' ').filter(Boolean);
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(' ') || "";

      // Address formatting (Shiprocket requires minimum 10 characters for address)
      let formattedAddress = (order.address || '').trim();
      if (formattedAddress.length < 10) {
        formattedAddress = `${formattedAddress}, ${order.city || ''}, ${order.state || ''}`.trim();
      }
      if (formattedAddress.length < 10) {
        formattedAddress = `${formattedAddress} - Pin ${order.pincode || ''}`.trim();
      }

      // Phone formatting (10 digits)
      let formattedPhone = String(order.phone || '').replace(/\D/g, '');
      if (formattedPhone.length > 10) formattedPhone = formattedPhone.slice(-10);
      if (formattedPhone.length < 10) formattedPhone = formattedPhone.padStart(10, '0');

      // Email formatting
      let formattedEmail = (order.email || '').trim();
      if (!formattedEmail || !formattedEmail.includes('@')) {
        formattedEmail = `${formattedPhone}@maazoud-customer.in`;
      }

      // Date formatting: YYYY-MM-DD HH:mm
      const orderDateStr = order.created_at ? new Date(order.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, '') : new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

      // Calculate subtotal of items and shipping charge collected from customer
      const itemsSubtotal = (order.items || []).reduce((acc, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQty = parseInt(item.quantity) || 1;
        return acc + (itemPrice * itemQty);
      }, 0);

      const totalAmount = parseFloat(order.total_amount) || 0;
      let customerShippingCharge = 0;

      if (order.shipping_charge !== undefined && order.shipping_charge !== null) {
        customerShippingCharge = parseFloat(order.shipping_charge) || 0;
      } else if (order.delivery_charge !== undefined && order.delivery_charge !== null) {
        customerShippingCharge = parseFloat(order.delivery_charge) || 0;
      } else if (totalAmount > itemsSubtotal && itemsSubtotal > 0) {
        customerShippingCharge = totalAmount - itemsSubtotal;
      }

      const calcSubTotal = itemsSubtotal > 0 ? itemsSubtotal : Math.max(0, totalAmount - customerShippingCharge);

      const shiprocketOrderIdSuffix = Date.now();
      const shiprocketOrderPayload = {
        order_id: `${order.id}-${shiprocketOrderIdSuffix}`,
        order_date: orderDateStr,
        pickup_location: pickup_location,
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: formattedAddress,
        billing_city: (order.city || 'Gorakhpur').trim(),
        billing_pincode: String(order.pincode || '').trim(),
        billing_state: (order.state || 'Uttar Pradesh').trim(),
        billing_country: "India",
        billing_email: formattedEmail,
        billing_phone: formattedPhone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: isCod ? "COD" : "Prepaid",
        sub_total: calcSubTotal,
        shipping_charges: customerShippingCharge,
        length: parsedLength,
        breadth: parsedWidth,
        width: parsedWidth,
        height: parsedHeight,
        weight: parsedWeight,
        ...(pickup_date ? { pickup_date: pickup_date } : {})
      };

      console.log("Creating Shiprocket Order Payload:", JSON.stringify(shiprocketOrderPayload, null, 2));

      // 2. Register Order on Shiprocket
      let createOrderRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shiprocketOrderPayload),
        cache: 'no-store'
      });

      let createOrderData = await createOrderRes.json();
      console.log("Shiprocket Create Order Response:", JSON.stringify(createOrderData, null, 2));

      // Auto-recovery: If pickup location is invalid, pick valid location returned in response and retry
      const createMsgStr = typeof createOrderData?.message === 'string' ? createOrderData.message : JSON.stringify(createOrderData?.message || '');
      if (createMsgStr && createMsgStr.toLowerCase().includes('pickup location')) {
        const locations = createOrderData.data?.data || createOrderData.data || [];
        if (Array.isArray(locations) && locations.length > 0 && locations[0].pickup_location) {
          const autoLocation = locations[0].pickup_location;
          console.log(`Auto-recovering pickup_location to '${autoLocation}'`);
          shiprocketOrderPayload.pickup_location = autoLocation;
          
          createOrderRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/create/adhoc`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(shiprocketOrderPayload),
            cache: 'no-store'
          });
          createOrderData = await createOrderRes.json();
          console.log("Shiprocket Retry Create Order Response:", JSON.stringify(createOrderData, null, 2));
        }
      }

      if (!createOrderRes.ok || createOrderData.status_code === 400 || (createOrderData.status_code && createOrderData.status_code !== 1 && !createOrderData.order_id)) {
        const retryMsgStr = typeof createOrderData?.message === 'string' ? createOrderData.message : JSON.stringify(createOrderData?.message || '');
        if (retryMsgStr && (retryMsgStr.toLowerCase().includes('wallet') || retryMsgStr.toLowerCase().includes('balance'))) {
          return NextResponse.json({ error: "Shiprocket Error: Insufficient wallet balance. Please recharge your Shiprocket account." }, { status: 400, headers: corsHeaders });
        }
        const detailedErr = parseShiprocketError(createOrderData, "Failed to create shipment order in Shiprocket.");
        return NextResponse.json({ error: detailedErr }, { status: createOrderRes.status || 400, headers: corsHeaders });
      }

      const shiprocketOrderId = createOrderData.order_id || createOrderData.data?.order_id;
      let shiprocketShipmentId = createOrderData.shipment_id || 
                                 createOrderData.data?.shipment_id || 
                                 (Array.isArray(createOrderData.shipments) && (createOrderData.shipments[0]?.id || createOrderData.shipments[0]?.shipment_id)) ||
                                 (createOrderData.data?.shipments && (createOrderData.data.shipments[0]?.id || createOrderData.data.shipments[0]?.shipment_id));

      // Fallback: If shipment_id is missing from initial creation response, fetch order details by order_id
      if (!shiprocketShipmentId && shiprocketOrderId) {
        try {
          const showOrderRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/show/${shiprocketOrderId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store'
          });
          const showOrderData = await showOrderRes.json();
          console.log("Shiprocket Show Order Response:", JSON.stringify(showOrderData, null, 2));

          shiprocketShipmentId = showOrderData.data?.shipment_id || 
                                 showOrderData.data?.shipments?.[0]?.id || 
                                 showOrderData.shipment_id || 
                                 (Array.isArray(showOrderData.shipments) && showOrderData.shipments[0]?.id);
        } catch (fetchErr) {
          console.error("Failed to fetch order details fallback from Shiprocket:", fetchErr);
        }
      }

      if (!shiprocketShipmentId) {
        return NextResponse.json({ 
          error: `Shiprocket created order (ID: ${shiprocketOrderId || 'Unknown'}), but did not return a Shipment ID. Response: ${JSON.stringify(createOrderData)}`,
          shiprocket_order_id: shiprocketOrderId
        }, { status: 500, headers: corsHeaders });
      }

      // 3. Assign selected courier and generate AWB
      const assignAwbPayload = {
        shipment_id: shiprocketShipmentId.toString(),
        courier_id: courier_id.toString()
      };
      console.log("Assigning AWB Payload:", JSON.stringify(assignAwbPayload, null, 2));

      let assignAwbRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignAwbPayload),
        cache: 'no-store'
      });

      let assignAwbData = await assignAwbRes.json();
      console.log("Shiprocket Assign AWB Response:", JSON.stringify(assignAwbData, null, 2));

      const isAwbSuccess = assignAwbRes.ok && (assignAwbData.awb_assign_status === 1 || assignAwbData?.data?.response?.awb_code);

      if (!isAwbSuccess) {
        // Fallback: Save order ID & shipment ID so admin can retry or manage from Shiprocket dashboard
        await supabase
          .from('orders')
          .update({
            shiprocket_order_id: shiprocketOrderId?.toString(),
            shiprocket_shipment_id: shiprocketShipmentId?.toString(),
            shiprocket_status: "ORDER_CREATED_AWB_PENDING",
            shipment_details: { create_order_response: createOrderData, assign_awb_error: assignAwbData }
          })
          .eq('id', order.id);

        const errorMsg = parseShiprocketError(assignAwbData, "Failed to assign courier and generate AWB.");
        const errStr = String(errorMsg || '');

        if (errStr.toLowerCase().includes('wallet') || errStr.toLowerCase().includes('balance')) {
          return NextResponse.json({
            error: "Order created successfully on Shiprocket, but AWB Assignment failed due to Insufficient wallet balance. Please recharge your Shiprocket wallet.",
            shiprocket_order_id: shiprocketOrderId,
            shiprocket_shipment_id: shiprocketShipmentId
          }, { status: 400, headers: corsHeaders });
        }

        return NextResponse.json({
          error: `Order created (ID: ${shiprocketOrderId}), but AWB Assignment failed: ${errorMsg}`,
          shiprocket_order_id: shiprocketOrderId,
          shiprocket_shipment_id: shiprocketShipmentId
        }, { status: 400, headers: corsHeaders });
      }

      let awbCode = null;
      let courierName = "Shiprocket Courier";
      let shipmentCharge = 0;

      // Deep search helper for AWB details inside assignAwbData
      const findAwbInObj = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.awb_code) return obj;
        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'object') {
            const found = findAwbInObj(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };

      const awbObj = findAwbInObj(assignAwbData);
      if (awbObj) {
        awbCode = awbObj.awb_code;
        courierName = awbObj.courier_name || courierName;
        const codFee = isCod ? (parseFloat(awbObj.cod_charges) || parseFloat(awbObj.cod_charge) || 50.00) : 0;
        const baseFreight = parseFloat(awbObj.freight_charges) || parseFloat(awbObj.rate) || 0;
        if (baseFreight > 0) {
          shipmentCharge = baseFreight + codFee;
        }
      }

      // Fallback: If AWB code is missing, query order/shipment details directly from Shiprocket
      if (!awbCode && (shiprocketOrderId || shiprocketShipmentId)) {
        try {
          const checkRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/show/${shiprocketOrderId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store'
          });
          const checkData = await checkRes.json();
          console.log("Shiprocket Order Check for AWB:", JSON.stringify(checkData, null, 2));

          const orderAwbObj = findAwbInObj(checkData);
          if (orderAwbObj) {
            awbCode = orderAwbObj.awb_code;
            courierName = orderAwbObj.courier_name || courierName;
            const codFee = isCod ? (parseFloat(orderAwbObj.cod_charges) || parseFloat(orderAwbObj.cod_charge) || 50.00) : 0;
            const baseFreight = parseFloat(orderAwbObj.freight_charges) || parseFloat(orderAwbObj.rate) || 0;
            if (baseFreight > 0) {
              shipmentCharge = baseFreight + codFee;
            }
          }
        } catch (checkErr) {
          console.error("Error fetching order AWB fallback:", checkErr);
        }
      }

      if (!awbCode) {
        return NextResponse.json({ 
          error: `Shiprocket assigned shipment but did not return an AWB Code. Raw Assign Response: ${JSON.stringify(assignAwbData)}`,
          shiprocket_order_id: shiprocketOrderId,
          shiprocket_shipment_id: shiprocketShipmentId
        }, { status: 500, headers: corsHeaders });
      }

      // 4. Update order details in Supabase
      const fallbackRate = parseFloat(courier_rate) || 0;
      const msgFee = 5.90;
      const baseCharge = parseFloat(shipmentCharge) > 0 
        ? parseFloat(shipmentCharge) 
        : (isCod ? fallbackRate + 50.00 : fallbackRate);
      const finalShiprocketCharge = Number((baseCharge + msgFee).toFixed(2));

      const updatePayload = {
        status: "Shipped",
        shiprocket_order_id: shiprocketOrderId.toString(),
        shiprocket_shipment_id: shiprocketShipmentId.toString(),
        shiprocket_awb: awbCode.toString(),
        shiprocket_courier_name: courierName,
        shiprocket_charge: finalShiprocketCharge,
        shiprocket_status: "AWB Assigned",
        shipment_details: {
          create_order_response: createOrderData,
          assign_awb_response: assignAwbData
        }
      };

      const { error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (updateError) {
        return NextResponse.json({
          warning: "Shipment initialized on Shiprocket but failed to update local database.",
          shiprocket_order_id: shiprocketOrderId,
          shiprocket_shipment_id: shiprocketShipmentId,
          shiprocket_awb: awbCode,
          db_error: updateError.message
        }, { headers: corsHeaders });
      }

      return NextResponse.json({
        success: true,
        shiprocket_order_id: shiprocketOrderId,
        shiprocket_shipment_id: shiprocketShipmentId,
        shiprocket_awb: awbCode,
        courier_name: courierName,
        rate: shipmentCharge
      }, { headers: corsHeaders });
    }

    // ACTION 3: Generate Shipping Label
    if (action === 'generate_label') {
      const { shipment_id } = body;

      if (!shipment_id) {
        return NextResponse.json({ error: "Shipment ID is required to generate a label." }, { status: 400, headers: corsHeaders });
      }

      const token = await getShiprocketToken();
      const parsedShipmentId = parseInt(shipment_id);

      // Helper to find any URL in response object
      const findUrlInObj = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string' && (obj.startsWith('http://') || obj.startsWith('https://'))) {
          return obj;
        }
        if (typeof obj === 'object') {
          if (obj.label_url) return obj.label_url;
          if (obj.url) return obj.url;
          for (const key of Object.keys(obj)) {
            const found = findUrlInObj(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };

      let labelRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/courier/generate/label`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipment_id: [parsedShipmentId] }),
        cache: 'no-store'
      });

      let labelData = await labelRes.json();
      console.log("Shiprocket Label Response:", JSON.stringify(labelData, null, 2));

      let labelUrl = findUrlInObj(labelData);

      // Retry once after 1.5s if label URL is not returned immediately
      if (!labelUrl) {
        await new Promise(r => setTimeout(r, 1500));
        labelRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/courier/generate/label`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ shipment_id: [parsedShipmentId] }),
          cache: 'no-store'
        });
        labelData = await labelRes.json();
        labelUrl = findUrlInObj(labelData);
      }

      if (!labelUrl) {
        return NextResponse.json({ error: labelData?.message || "Shiprocket is still compiling the shipping label PDF. Please try clicking 'Download Label' again in 5 seconds." }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, label_url: labelUrl }, { headers: corsHeaders });
    }

    // ACTION 4: Generate Manifest
    if (action === 'generate_manifest') {
      const { shipment_id } = body;

      if (!shipment_id) {
        return NextResponse.json({ error: "Shipment ID is required to generate a manifest." }, { status: 400, headers: corsHeaders });
      }

      const token = await getShiprocketToken();
      const parsedShipmentId = parseInt(shipment_id);

      // Helper to find any URL in response object
      const findUrlInObj = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string' && (obj.startsWith('http://') || obj.startsWith('https://'))) {
          return obj;
        }
        if (typeof obj === 'object') {
          if (obj.manifest_url) return obj.manifest_url;
          if (obj.url) return obj.url;
          for (const key of Object.keys(obj)) {
            const found = findUrlInObj(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };

      // 0. Trigger Pickup Generation (Shiprocket requires pickup to be requested before manifest can be generated)
      try {
        console.log("Triggering Shiprocket Pickup Request for shipment:", parsedShipmentId);
        const pickupPayload = { shipment_id: [parsedShipmentId] };
        if (body.pickup_date) {
          pickupPayload.pickup_date = [body.pickup_date];
        }
        await fetch(`${SHIPROCKET_API_BASE}/v1/external/courier/generate/pickup`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pickupPayload),
          cache: 'no-store'
        });
      } catch (pickupErr) {
        console.error("Pickup trigger error:", pickupErr);
      }

      // 1. Try generate endpoint
      let manifestRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/manifests/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipment_id: [parsedShipmentId] }),
        cache: 'no-store'
      });

      let manifestData = await manifestRes.json();
      console.log("Shiprocket Generate Manifest Response:", JSON.stringify(manifestData, null, 2));

      let manifestUrl = findUrlInObj(manifestData);

      const checkIds = manifestData.check_ids || manifestData.data?.check_ids;
      const checkIdsStr = Array.isArray(checkIds) ? checkIds.join(',') : checkIds;

      // Endpoint Fallback 1: POST /v1/external/manifests/print with shipment_id
      if (!manifestUrl) {
        try {
          const res1 = await fetch(`${SHIPROCKET_API_BASE}/v1/external/manifests/print`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipment_id: [parsedShipmentId] }),
            cache: 'no-store'
          });
          const d1 = await res1.json();
          manifestUrl = findUrlInObj(d1);
        } catch (e) { console.error("Manifest check 1 failed:", e); }
      }

      // Endpoint Fallback 2: Wait 2s and retry print endpoint if enqueued
      if (!manifestUrl && checkIdsStr) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const res2 = await fetch(`${SHIPROCKET_API_BASE}/v1/external/manifests/print`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipment_id: [parsedShipmentId] }),
            cache: 'no-store'
          });
          const d2 = await res2.json();
          manifestUrl = findUrlInObj(d2);
        } catch (e) { console.error("Manifest check 2 failed:", e); }
      }

      if (!manifestUrl) {
        return NextResponse.json({ 
          error: `Shiprocket has requested pickup for shipment #${parsedShipmentId}. Manifest PDFs are generated once the courier partner confirms pickup. Please try clicking 'Download Manifest' again in a few moments.`
        }, { status: 400, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, manifest_url: manifestUrl }, { headers: corsHeaders });
    }

    // ACTION 5: Sync Order / AWB Status from Shiprocket
    if (action === 'sync_shipment') {
      const { order_id } = body;

      if (!order_id) {
        return NextResponse.json({ error: "Order ID is required to sync shipment." }, { status: 400, headers: corsHeaders });
      }

      // Fetch order from DB
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order_id)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: `Order not found in database: ${orderError?.message || ''}` }, { status: 404, headers: corsHeaders });
      }

      const srOrderId = order.shiprocket_order_id || order.shipment_details?.create_order_response?.order_id || order.shipment_details?.create_order_response?.data?.order_id;

      if (!srOrderId) {
        return NextResponse.json({ error: "No Shiprocket Order ID found in database for this order." }, { status: 400, headers: corsHeaders });
      }

      const token = await getShiprocketToken();

      // Fetch order details from Shiprocket
      const showRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/show/${srOrderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      const showData = await showRes.json();
      console.log("Shiprocket Sync Order Response:", JSON.stringify(showData, null, 2));

      if (!showRes.ok) {
        return NextResponse.json({ error: showData.message || "Failed to fetch order details from Shiprocket." }, { status: showRes.status, headers: corsHeaders });
      }

      const srData = showData.data || showData;

      // Helper function to extract AWB, courier name, and status
      const findAwbInObj = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj.awb_code || obj.awb) return obj;
        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'object') {
            const found = findAwbInObj(obj[key]);
            if (found) return found;
          }
        }
        return null;
      };

      const awbObj = findAwbInObj(srData);
      const awbCode = awbObj?.awb_code || awbObj?.awb || srData?.awb_code || srData?.shipments?.[0]?.awb;
      const courierName = awbObj?.courier_name || srData?.courier_name || srData?.shipments?.[0]?.courier_name || order.shiprocket_courier_name || "Shiprocket Courier";
      const shipmentId = srData?.shipment_id || srData?.shipments?.[0]?.id || order.shiprocket_shipment_id;
      const srStatus = srData?.status || srData?.shipment_status || "AWB Assigned";

      if (!awbCode) {
        return NextResponse.json({
          error: `Order found on Shiprocket (ID: ${srOrderId}), but AWB is not yet assigned on Shiprocket. Current Status: ${srStatus}`,
          shiprocket_order_id: srOrderId,
          shiprocket_shipment_id: shipmentId,
          shiprocket_status: srStatus
        }, { status: 400, headers: corsHeaders });
      }

      const isCod = String(order?.payment_method || '').toLowerCase().includes('cod') || String(order?.payment_method || '').toLowerCase().includes('cash on delivery');
      const codFee = isCod ? (parseFloat(awbObj?.cod_charges || awbObj?.cod_charge || 50.00)) : 0;
      const baseFreight = parseFloat(awbObj?.freight_charges || awbObj?.rate || 0);
      const msgFee = 5.90;
      let finalCharge = order.shiprocket_charge || 0;
      if (baseFreight > 0) {
        finalCharge = Number((baseFreight + codFee + msgFee).toFixed(2));
      }

      const updatePayload = {
        status: String(srStatus || '').toLowerCase().includes('cancel') ? 'Cancelled' : 'Shipped',
        shiprocket_order_id: srOrderId.toString(),
        shiprocket_shipment_id: shipmentId ? shipmentId.toString() : order.shiprocket_shipment_id,
        shiprocket_awb: awbCode.toString(),
        shiprocket_courier_name: courierName,
        shiprocket_charge: finalCharge,
        shiprocket_status: srStatus,
        shipment_details: {
          ...order.shipment_details,
          sync_response: showData
        }
      };

      const { error: updateError } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (updateError) {
        return NextResponse.json({ error: `Failed to update database: ${updateError.message}` }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({
        success: true,
        order: {
          ...order,
          ...updatePayload
        }
      }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
