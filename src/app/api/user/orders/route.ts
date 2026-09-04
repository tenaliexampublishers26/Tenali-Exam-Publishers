import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const orders = await sql`
      SELECT id, order_number as "orderNumber", subtotal, delivery_charge as "deliveryCharge", total,
             status, payment_status as "paymentStatus", tracking_number as "trackingNumber",
             carrier, dispatched_at as "dispatchedAt", created_at as "createdAt"
      FROM orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
