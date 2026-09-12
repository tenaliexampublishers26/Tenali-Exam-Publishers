export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const users = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.role, 
        u.created_at as "createdAt",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', o.id,
                'orderNumber', o.order_number,
                'total', o.total,
                'status', o.status,
                'paymentStatus', o.payment_status,
                'createdAt', o.created_at,
                'items', COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'productName', oi.product_name,
                        'quantity', oi.quantity,
                        'language', oi.language,
                        'price', oi.price
                      )
                    )
                    FROM order_items oi
                    WHERE oi.order_id = o.id
                  ),
                  '[]'
                )
              )
            )
            FROM orders o
            WHERE o.user_id = u.id
          ),
          '[]'
        ) as orders
      FROM users u
      ORDER BY u.created_at DESC
    `;
    
    return NextResponse.json({ success: true, users: users || [] }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ success: true, users: [] }, { status: 200 });
  }
}
