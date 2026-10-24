import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdfvzzqiyyhxowftegpl.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    // 1. Verify Webhook Secret Token to prevent unauthorized status updates
    const webhookToken = request.headers.get('x-api-key');
    const expectedToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (expectedToken && webhookToken !== expectedToken) {
      console.warn("Unauthorized webhook attempt detected. Invalid x-api-key header.");
      return NextResponse.json({ error: "Unauthorized: Invalid Webhook Secret Token" }, { status: 401 });
    }

    const payload = await request.json();
    console.log("Courier Webhook received:", payload);

    const awb = payload?.awb || payload?.awb_code;
    const shipmentId = payload?.shipment_id;
    const currentStatus = payload?.current_status || payload?.status;

    if (!awb && !shipmentId) {
      return NextResponse.json({ error: "Missing tracking identifier (awb/shipment_id)" }, { status: 400 });
    }

    // Find the order in our database
    let query = supabase.from('orders').select('id, status, shipment_details');
    if (awb) {
      query = query.eq('shiprocket_awb', awb.toString());
    } else {
      query = query.eq('shiprocket_shipment_id', shipmentId.toString());
    }

    const { data: order, error: fetchError } = await query.maybeSingle();

    if (fetchError) {
      console.error("Database error looking up order:", fetchError);
      return NextResponse.json({ error: "Internal database error" }, { status: 500 });
    }

    if (!order) {
      console.warn(`No matching order found for AWB: ${awb}, Shipment ID: ${shipmentId}`);
      return NextResponse.json({ message: "Order not found locally" }, { status: 200 });
    }

    // Map webhook status to internal status
    let newInternalStatus = order.status;
    const normalizedStatus = currentStatus ? currentStatus.toString().toLowerCase().trim() : '';
    const isDeliveryException = /\b(exception|delivery attempt|attempted|undelivered|not delivered|failed delivery|ndr|out for delivery)\b/.test(normalizedStatus);

    if (normalizedStatus.includes('cancel') || normalizedStatus.includes('return') || normalizedStatus.includes('rto')) {
      newInternalStatus = 'Cancelled';
    } else if (isDeliveryException) {
      newInternalStatus = 'Shipped';
    } else if (/\bdelivered\b/.test(normalizedStatus)) {
      newInternalStatus = 'Delivered';
    } else if (normalizedStatus.includes('pick') || normalizedStatus.includes('transit') || normalizedStatus.includes('shipped') || normalizedStatus.includes('out for delivery')) {
      newInternalStatus = 'Shipped';
    }

    const currentDetails = order.shipment_details || {};
    const updatedDetails = {
      ...currentDetails,
      last_webhook_payload: payload,
      webhook_history: [
        ...(currentDetails.webhook_history || []),
        {
          timestamp: new Date().toISOString(),
          status: currentStatus,
          payload: payload
        }
      ]
    };

    const updatePayload = {
      status: newInternalStatus,
      shiprocket_status: currentStatus || 'Updated via webhook',
      shipment_details: updatedDetails
    };
    if (newInternalStatus === 'Delivered') {
      const deliveredAt = payload.delivered_date || payload.delivery_date || payload.delivered_at || payload.status_date || payload.updated_at || new Date().toISOString();
      updatePayload.delivery_date = deliveredAt;
      updatePayload.shipment_details = { ...updatedDetails, delivered_date: deliveredAt };
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id);

    if (updateError) {
      console.error(`Failed to update order ${order.id} via webhook:`, updateError);
      return NextResponse.json({ error: "Failed to update order in database" }, { status: 500 });
    }

    console.log(`Successfully updated order ${order.id} to status ${newInternalStatus} (${currentStatus})`);
    return NextResponse.json({ success: true, order_id: order.id, new_status: newInternalStatus });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
