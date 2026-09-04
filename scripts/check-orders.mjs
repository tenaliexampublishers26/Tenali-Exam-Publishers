import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function check() {
  try {
    const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 10`;
    console.log('Total orders in DB:', orders.length);
    console.log('Orders:', JSON.stringify(orders, null, 2));

    const adminQuery = await sql`
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
    console.log('Admin Query Count:', adminQuery.length);
    console.log('Admin Query Result:', JSON.stringify(adminQuery, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
