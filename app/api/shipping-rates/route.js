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
      const { delivery_pincode, weight, length, width, height, is_cod } = body;

      if (!delivery_pincode) {
        return NextResponse.json({ error: "Delivery pincode is required." }, { status: 400, headers: corsHeaders });
      }

      const pickup_pincode = process.env.SHIPROCKET_PICKUP_PINCODE || '273001'; // Default backup
      const parsedWeight = parseFloat(weight) || 0.5;
      const parsedLength = parseFloat(length) || 10;
      const parsedWidth = parseFloat(width) || 10;
      const parsedHeight = parseFloat(height) || 10;

      const token = await getShiprocketToken();

      // Call Shiprocket Courier Serviceability API
      const queryParams = new URLSearchParams({
        pickup_postcode: pickup_pincode,
        delivery_postcode: delivery_pincode,
        weight: parsedWeight.toString(),
        cod: is_cod ? '1' : '0',
        length: parsedLength.toString(),
        width: parsedWidth.toString(),
        height: parsedHeight.toString(),
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
        if (data.message && (data.message.toLowerCase().includes('wallet') || data.message.toLowerCase().includes('balance'))) {
          return NextResponse.json({ error: "Shiprocket Error: Insufficient wallet balance. Please recharge your Shiprocket account." }, { status: 400, headers: corsHeaders });
        }
        return NextResponse.json({ error: data.message || "Failed to calculate courier rates." }, { status: res.status, headers: corsHeaders });
      }

      const availableCouriers = data?.data?.available_courier_companies || [];
      if (availableCouriers.length === 0) {
        return NextResponse.json({ error: "Pincode is not serviceable by any courier partner currently." }, { status: 400, headers: corsHeaders });
      }

      // Sort couriers by price (lowest first)
      const sortedCouriers = availableCouriers.map(courier => ({
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
      const { order_id, courier_id, weight, length, width, height } = body;

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
      const pickup_location = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
      const isCod = order.payment_method.toLowerCase().includes('cod') || order.payment_method.toLowerCase().includes('cash on delivery');

      const token = await getShiprocketToken();

      // Create Order payload for Shiprocket
      // Order items mapping
      const orderItems = (order.items || []).map(item => ({
        name: item.product?.name || "Attar Scent",
        sku: item.cartItemId || item.product?.id || "attar-generic",
        units: parseInt(item.quantity) || 1,
        selling_price: parseFloat(item.price) || 0,
        discount: 0,
        tax: 0
      }));

      if (orderItems.length === 0) {
        orderItems.push({
          name: "Premium Pure Attar Formulation",
          sku: "attar-generic",
          units: 1,
          selling_price: parseFloat(order.total_amount) || 0,
          discount: 0,
          tax: 0
        });
      }

      const shiprocketOrderPayload = {
        order_id: order.id,
        order_date: new Date(order.created_at).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        pickup_location: pickup_location,
        billing_customer_name: order.customer_name.split(' ')[0] || "Customer",
        billing_last_name: order.customer_name.split(' ').slice(1).join(' ') || "",
        billing_address: order.address,
        billing_city: order.city,
        billing_pincode: order.pincode,
        billing_state: order.state,
        billing_country: "India",
        billing_email: `${order.phone}@maazoud-customer.in`, // Fallback dummy email
        billing_phone: order.phone,
        shipping_is_billing: true,
        order_items: orderItems,
        payment_method: isCod ? "COD" : "Prepaid",
        sub_total: parseFloat(order.total_amount),
        length: parsedLength,
        width: parsedWidth,
        height: parsedHeight,
        weight: parsedWeight
      };

      // 2. Register Order on Shiprocket
      const createOrderRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/orders/create/adhoc`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shiprocketOrderPayload),
        cache: 'no-store'
      });

      const createOrderData = await createOrderRes.json();

      if (!createOrderRes.ok) {
        if (createOrderData.message && (createOrderData.message.toLowerCase().includes('wallet') || createOrderData.message.toLowerCase().includes('balance'))) {
          return NextResponse.json({ error: "Shiprocket Error: Insufficient wallet balance. Please recharge your Shiprocket account." }, { status: 400, headers: corsHeaders });
        }
        return NextResponse.json({ error: createOrderData.message || "Failed to create shipment order in Shiprocket." }, { status: createOrderRes.status, headers: corsHeaders });
      }

      const shiprocketOrderId = createOrderData.order_id;
      const shiprocketShipmentId = createOrderData.shipment_id;

      if (!shiprocketShipmentId) {
        return NextResponse.json({ error: "Shiprocket created the order but did not return a Shipment ID." }, { status: 500, headers: corsHeaders });
      }

      // 3. Assign selected courier and generate AWB
      const assignAwbRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/courier/assign/awb`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipment_id: shiprocketShipmentId.toString(),
          courier_id: courier_id.toString()
        }),
        cache: 'no-store'
      });

      const assignAwbData = await assignAwbRes.json();

      if (!assignAwbRes.ok) {
        // Fallback: If AWB assignment fails (e.g. low balance or temporary issue), we save the order ID/shipment ID so the admin doesn't lose progress and can retry assignment later.
        await supabase
          .from('orders')
          .update({
            shiprocket_order_id: shiprocketOrderId?.toString(),
            shiprocket_shipment_id: shiprocketShipmentId?.toString(),
            shiprocket_status: "ORDER_CREATED_AWB_PENDING",
            shipment_details: { create_order_response: createOrderData, assign_awb_error: assignAwbData }
          })
          .eq('id', order.id);

        if (assignAwbData.message && (assignAwbData.message.toLowerCase().includes('wallet') || assignAwbData.message.toLowerCase().includes('balance'))) {
          return NextResponse.json({
            error: "Order created successfully on Shiprocket, but AWB Assignment failed due to Insufficient wallet balance. Please recharge your Shiprocket wallet to assign courier.",
            shiprocket_order_id: shiprocketOrderId,
            shiprocket_shipment_id: shiprocketShipmentId
          }, { status: 400, headers: corsHeaders });
        }

        return NextResponse.json({
          error: assignAwbData.message || "Failed to assign courier and generate AWB.",
          shiprocket_order_id: shiprocketOrderId,
          shiprocket_shipment_id: shiprocketShipmentId
        }, { status: assignAwbRes.status, headers: corsHeaders });
      }

      const awbResponse = assignAwbData?.data?.response;
      const awbCode = awbResponse?.awb_code;
      const courierName = awbResponse?.courier_name || "Shiprocket Courier";
      const shipmentCharge = parseFloat(awbResponse?.rate) || 0;

      if (!awbCode) {
        return NextResponse.json({ error: "Shiprocket did not return an AWB Code. Please try assigning courier manually in Shiprocket Dashboard." }, { status: 500, headers: corsHeaders });
      }

      // 4. Update order details in Supabase
      const updatePayload = {
        status: "Shipped",
        shiprocket_order_id: shiprocketOrderId.toString(),
        shiprocket_shipment_id: shiprocketShipmentId.toString(),
        shiprocket_awb: awbCode.toString(),
        shiprocket_courier_name: courierName,
        shiprocket_charge: shipmentCharge,
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

      const labelRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/courier/generate/label`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipment_id: [parseInt(shipment_id)] }),
        cache: 'no-store'
      });

      const labelData = await labelRes.json();

      if (!labelRes.ok) {
        return NextResponse.json({ error: labelData.message || "Failed to generate shipping label." }, { status: labelRes.status, headers: corsHeaders });
      }

      const labelUrl = labelData?.label_url || labelData?.data?.label_url;

      if (!labelUrl) {
        return NextResponse.json({ error: "Shiprocket did not return a label URL. The label may not be ready yet — please try again in a moment." }, { status: 500, headers: corsHeaders });
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

      const manifestRes = await fetch(`${SHIPROCKET_API_BASE}/v1/external/manifests/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipment_id: [parseInt(shipment_id)] }),
        cache: 'no-store'
      });

      const manifestData = await manifestRes.json();

      if (!manifestRes.ok) {
        return NextResponse.json({ error: manifestData.message || "Failed to generate manifest." }, { status: manifestRes.status, headers: corsHeaders });
      }

      const manifestUrl = manifestData?.manifest_url || manifestData?.data?.manifest_url;

      if (!manifestUrl) {
        return NextResponse.json({ error: "Shiprocket did not return a manifest URL. Please try again in a moment." }, { status: 500, headers: corsHeaders });
      }

      return NextResponse.json({ success: true, manifest_url: manifestUrl }, { headers: corsHeaders });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
