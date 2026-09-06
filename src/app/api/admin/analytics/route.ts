import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withServerCache } from '@/lib/server-cache';

export async function GET() {
  try {
    const data = await withServerCache(
      'admin-analytics-summary',
      async () => {
        // Run streamlined queries in parallel (reduced from 9 to 5 queries)
        const [
          ordersSummary,
          usersSummary,
          productsSummary,
          recentOrders,
          topProducts,
          recentSignups,
        ] = await Promise.all([
          // 1. Single scan on orders table for both count and revenue
          sql`
            SELECT 
              COUNT(id)::int as total_orders,
              COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0)::float as total_revenue
            FROM orders
          `,
          // 2. Total active customers
          sql`
            SELECT COUNT(id)::int as total_users FROM users WHERE role = 'customer'
          `,
          // 3. Single scan on products table for both total count and low stock count
          sql`
            SELECT 
              COUNT(id)::int as total_products,
              COUNT(CASE WHEN stock < 10 THEN 1 END)::int as low_stock
            FROM products
          `,
          // 4. Recent orders (used for both recent orders table and recent sales activity)
          sql`
            SELECT o.id, o.order_number as "orderNumber", o.total, o.status, o.created_at as "createdAt", u.name as "userName"
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
          `,
          // 5. Top selling products
          sql`
            SELECT oi.product_name as "name", SUM(oi.quantity)::int as "sold", SUM(oi.price * oi.quantity)::float as "revenue", p.stock, p.languages
            FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.id
            GROUP BY oi.product_name, p.stock, p.languages
            ORDER BY sold DESC
            LIMIT 4
          `,
          // 6. Recent customer signups
          sql`
            SELECT name, email, created_at as "createdAt"
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
            LIMIT 3
          `,
        ]);

        const totalRevenue = ordersSummary[0]?.total_revenue || 0;
        const totalOrders = ordersSummary[0]?.total_orders || 0;
        const totalUsers = usersSummary[0]?.total_users || 0;
        const lowStockProducts = productsSummary[0]?.low_stock || 0;
        const totalProducts = productsSummary[0]?.total_products || 0;

        const recentActivity: any[] = [];

        // Derive recent sales directly from recent orders (no extra DB query)
        recentOrders.slice(0, 3).forEach((s: any) => {
          recentActivity.push({
            type: 'sale',
            title: 'New sale recorded',
            desc: `Order #${s.orderNumber} placed by ${s.userName || 'Guest'}`,
            time: s.createdAt,
            color: 'green',
          });
        });

        recentSignups.forEach((u: any) => {
          recentActivity.push({
            type: 'user',
            title: 'New user registered',
            desc: `${u.name} (${u.email}) joined`,
            time: u.createdAt,
            color: 'blue',
          });
        });

        recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return {
          totalRevenue,
          totalOrders,
          totalUsers,
          lowStockProducts,
          totalProducts,
          recentOrders,
          topProducts,
          recentActivity: recentActivity.slice(0, 5),
        };
      },
      {
        ttl: 15_000, // 15 seconds TTL on server
        tags: ['admin-analytics', 'orders', 'products'],
        staleWhileRevalidate: true,
      }
    );

    return NextResponse.json({ success: true, data }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
