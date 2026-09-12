export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withServerCache } from '@/lib/server-cache';

const FALLBACK_ANALYTICS = {
  totalRevenue: 0,
  totalOrders: 0,
  totalUsers: 0,
  lowStockProducts: 0,
  totalProducts: 0,
  recentOrders: [],
  topProducts: [],
  recentActivity: [],
};

export async function GET() {
  try {
    const data = await withServerCache(
      'admin-analytics-summary',
      async () => {
        // Run streamlined queries in parallel:
        // Query 1 consolidates orders, revenue, users count, products count & low stock into a SINGLE fast query
        const [
          consolidatedStats,
          recentOrders,
          topProducts,
          recentSignups,
        ] = await Promise.all([
          // 1. Single consolidated stats query (replaces 3 separate queries, saves 2 pooled connections)
          sql`
            SELECT
              (SELECT COUNT(id)::int FROM orders) as total_orders,
              (SELECT COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN total ELSE 0 END), 0)::float FROM orders) as total_revenue,
              (SELECT COUNT(id)::int FROM users WHERE role = 'customer') as total_users,
              (SELECT COUNT(id)::int FROM products) as total_products,
              (SELECT COUNT(id)::int FROM products WHERE stock < 10) as low_stock;
          `,
          // 2. Recent orders (used for both recent orders table and recent sales activity)
          sql`
            SELECT o.id, o.order_number as "orderNumber", o.total, o.status, o.created_at as "createdAt", u.name as "userName"
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
            LIMIT 5
          `,
          // 3. Top selling products
          sql`
            SELECT oi.product_name as "name", SUM(oi.quantity)::int as "sold", SUM(oi.price * oi.quantity)::float as "revenue", p.stock, p.languages
            FROM order_items oi
            INNER JOIN products p ON oi.product_id = p.id
            GROUP BY oi.product_name, p.stock, p.languages
            ORDER BY sold DESC
            LIMIT 4
          `,
          // 4. Recent customer signups
          sql`
            SELECT name, email, created_at as "createdAt"
            FROM users
            WHERE role = 'customer'
            ORDER BY created_at DESC
            LIMIT 3
          `,
        ]);

        const statsRow = consolidatedStats[0] || {};
        const totalRevenue = statsRow.total_revenue || 0;
        const totalOrders = statsRow.total_orders || 0;
        const totalUsers = statsRow.total_users || 0;
        const lowStockProducts = statsRow.low_stock || 0;
        const totalProducts = statsRow.total_products || 0;

        const recentActivity: any[] = [];

        // Derive recent sales directly from recent orders (no extra DB query)
        (recentOrders || []).slice(0, 3).forEach((s: any) => {
          recentActivity.push({
            type: 'sale',
            title: 'New sale recorded',
            desc: `Order #${s.orderNumber} placed by ${s.userName || 'Guest'}`,
            time: s.createdAt,
            color: 'green',
          });
        });

        (recentSignups || []).forEach((u: any) => {
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
          recentOrders: recentOrders || [],
          topProducts: topProducts || [],
          recentActivity: recentActivity.slice(0, 5),
        };
      },
      {
        ttl: 15_000, // 15 seconds TTL on server
        tags: ['admin-analytics', 'orders', 'products'],
        staleWhileRevalidate: true,
      }
    );

    return NextResponse.json({ success: true, data: data || FALLBACK_ANALYTICS }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    // Graceful degradation: return fallback data instead of 500 so dashboard never crashes or stays stuck in loading
    return NextResponse.json({ success: true, data: FALLBACK_ANALYTICS }, { status: 200 });
  }
}
