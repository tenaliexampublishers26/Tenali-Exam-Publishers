import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId')?.trim();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    // Look up user details (email and phone) to also match orders placed by email/phone
    let userEmail: string | null = null;
    let userPhone: string | null = null;

    if (isUUID) {
      const userRows = await sql`
        SELECT email, phone FROM users WHERE id = ${userId}::uuid LIMIT 1
      `;
      if (userRows.length > 0) {
        userEmail = userRows[0].email ? userRows[0].email.toLowerCase().trim() : null;
        userPhone = userRows[0].phone ? userRows[0].phone.replace(/\D/g, '').slice(-10) : null;
      }
    }

    const orders = isUUID
      ? await sql`
        SELECT 
          o.id, 
          o.order_number as "orderNumber", 
          o.subtotal, 
          o.delivery_charge as "deliveryCharge", 
          o.total,
          o.status, 
          o.payment_status as "paymentStatus", 
          o.tracking_number as "trackingNumber",
          o.carrier, 
          o.dispatched_at as "dispatchedAt", 
          o.created_at as "createdAt",
          o.delivery_address as "deliveryAddress",
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'productSlug', oi.product_slug,
                'productImage', oi.product_image,
                'price', oi.price,
                'language', oi.language,
                'quantity', oi.quantity,
                'bundleTitle', oi.bundle_title,
                'booksIncluded', oi.books_included
              )
            ) FILTER (WHERE oi.product_name IS NOT NULL), '[]'
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ${userId}::uuid
           OR (${userEmail}::text IS NOT NULL AND LOWER(o.delivery_address->>'email') = ${userEmail})
           OR (${userPhone}::text IS NOT NULL AND RIGHT(REGEXP_REPLACE(COALESCE(o.delivery_address->>'mobile', ''), '\D', '', 'g'), 10) = ${userPhone})
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `
      : await sql`
        SELECT 
          o.id, 
          o.order_number as "orderNumber", 
          o.subtotal, 
          o.delivery_charge as "deliveryCharge", 
          o.total,
          o.status, 
          o.payment_status as "paymentStatus", 
          o.tracking_number as "trackingNumber",
          o.carrier, 
          o.dispatched_at as "dispatchedAt", 
          o.created_at as "createdAt",
          o.delivery_address as "deliveryAddress",
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'productId', oi.product_id,
                'productName', oi.product_name,
                'productSlug', oi.product_slug,
                'productImage', oi.product_image,
                'price', oi.price,
                'language', oi.language,
                'quantity', oi.quantity,
                'bundleTitle', oi.bundle_title,
                'booksIncluded', oi.books_included
              )
            ) FILTER (WHERE oi.product_name IS NOT NULL), '[]'
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE LOWER(o.delivery_address->>'email') = LOWER(${userId})
           OR RIGHT(REGEXP_REPLACE(COALESCE(o.delivery_address->>'mobile', ''), '\D', '', 'g'), 10) = ${userId.replace(/\D/g, '').slice(-10)}
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;

    const mappedOrders = orders.map((o: any) => {
      let addr = o.deliveryAddress;
      if (typeof addr === 'string') {
        try { addr = JSON.parse(addr); } catch { }
      }
      return { ...o, deliveryAddress: addr };
    });

    return NextResponse.json({ orders: mappedOrders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

