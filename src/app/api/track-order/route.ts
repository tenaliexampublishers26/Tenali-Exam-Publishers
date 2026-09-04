import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const CANCELLABLE_STATUSES = ['placed', 'processing'];
const CANCEL_WINDOW_HOURS = 24;

function normalizeContact(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeMobile(value: string): string {
  // Keep digits only, then compare last 10 (handles +91 prefixes on either side)
  return value.replace(/\D/g, '').slice(-10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderIdRaw = (searchParams.get('orderId') || '').trim();
    const contactRaw = (searchParams.get('contact') || '').trim();

    if (!orderIdRaw || !contactRaw) {
      return NextResponse.json({ error: 'Order ID and contact details are required' }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdRaw);

    const orderResult = isUUID
      ? await sql`
        SELECT id, order_number as "orderNumber", total, status, payment_status as "paymentStatus",
               tracking_number as "trackingNumber", carrier, dispatched_at as "dispatchedAt", created_at as "createdAt",
               delivery_address as "deliveryAddress"
        FROM orders
        WHERE id = ${orderIdRaw}::uuid OR order_number = ${orderIdRaw}
        LIMIT 1
      `
      : await sql`
        SELECT id, order_number as "orderNumber", total, status, payment_status as "paymentStatus",
               tracking_number as "trackingNumber", carrier, dispatched_at as "dispatchedAt", created_at as "createdAt",
               delivery_address as "deliveryAddress"
        FROM orders
        WHERE order_number = ${orderIdRaw}
        LIMIT 1
      `;

    if (orderResult.length === 0) {
      return NextResponse.json({ error: 'Order not found. Please check your Order ID and try again.' }, { status: 404 });
    }

    const order = orderResult[0];
    const address = order.deliveryAddress || {};

    // Match the entered contact against the email or mobile captured at checkout.
    const enteredContact = normalizeContact(contactRaw);
    const enteredMobile = normalizeMobile(contactRaw);

    const emailMatches = address.email && normalizeContact(address.email) === enteredContact;
    const mobileMatches = address.mobile && normalizeMobile(address.mobile) === enteredMobile && enteredMobile.length === 10;

    if (!emailMatches && !mobileMatches) {
      return NextResponse.json(
        { error: 'Order not found. Please check your Order ID and contact details.' },
        { status: 404 }
      );
    }

    const itemsResult = await sql`
      SELECT product_name as "productName", language, quantity
      FROM order_items
      WHERE order_id = ${order.id}
    `;

    const createdAt = new Date(order.createdAt);
    const hoursSinceOrder = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    const cancellable = CANCELLABLE_STATUSES.includes(order.status) && hoursSinceOrder <= CANCEL_WINDOW_HOURS;
    const cancelDeadline = new Date(createdAt.getTime() + CANCEL_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

    return NextResponse.json(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          trackingNumber: order.trackingNumber,
          dispatchedAt: order.dispatchedAt,
          carrier: order.carrier,
          total: order.total,
          createdAt: order.createdAt,
          items: itemsResult,
          cancellable,
          cancelDeadline,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ error: 'Failed to track order. Please try again shortly.' }, { status: 500 });
  }
}
