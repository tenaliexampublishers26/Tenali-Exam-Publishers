import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const orders = await sql`
      SELECT 
        o.id, 
        o.order_number as "orderNumber", 
        o.total, 
        o.status, 
        o.payment_status as "paymentStatus", 
        o.tracking_number as "trackingNumber",
        o.dispatched_at as "dispatchedAt",
        o.carrier,
        o.created_at as "createdAt", 
        o.delivery_address as "deliveryAddress", 
        u.name as "userName", 
        u.email as "userEmail",
        COALESCE(
          json_agg(
            json_build_object(
              'productName', oi.product_name,
              'language', oi.language,
              'quantity', oi.quantity
            )
          ) FILTER (WHERE oi.product_name IS NOT NULL), '[]'
        ) as items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, u.name, u.email
      ORDER BY o.created_at DESC
    `;
    
    const mappedOrders = orders.map((o: any) => {
      let addr = o.deliveryAddress;
      while (typeof addr === 'string') {
        try {
          addr = JSON.parse(addr);
        } catch {
          break;
        }
      }
      return { ...o, deliveryAddress: addr };
    });
    
    return NextResponse.json({ success: true, orders: mappedOrders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
