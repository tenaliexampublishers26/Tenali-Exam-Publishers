import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const orderId = params.id;
    if (!orderId) {
       return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const cleanOrderId = orderId.replace(/^#/, '').trim();
    // Check if orderId is a valid UUID format
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrderId);

    const orderResult = isUUID
      ? await sql`
        SELECT id, order_number as "orderNumber", subtotal, delivery_charge as "deliveryCharge", total,
               status, payment_status as "paymentStatus", tracking_number as "trackingNumber",
               carrier, dispatched_at as "dispatchedAt", created_at as "createdAt", delivery_address as "deliveryAddress"
        FROM orders
        WHERE id = ${cleanOrderId}::uuid OR LOWER(order_number) = LOWER(${cleanOrderId})
        LIMIT 1
      `
      : await sql`
        SELECT id, order_number as "orderNumber", subtotal, delivery_charge as "deliveryCharge", total,
               status, payment_status as "paymentStatus", tracking_number as "trackingNumber",
               carrier, dispatched_at as "dispatchedAt", created_at as "createdAt", delivery_address as "deliveryAddress"
        FROM orders
        WHERE LOWER(order_number) = LOWER(${cleanOrderId})
        LIMIT 1
      `;

    if (orderResult.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult[0];

    const itemsResult = await sql`
      SELECT id, product_id as "productId", product_name as "productName", product_slug as "productSlug",
             product_image as "productImage", price, language, quantity, bundle_title as "bundleTitle",
             books_included as "booksIncluded"
      FROM order_items
      WHERE order_id = ${order.id}
    `;

    order.items = itemsResult;

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
