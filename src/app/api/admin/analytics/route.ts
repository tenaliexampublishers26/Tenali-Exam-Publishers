import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Run all database queries in parallel
    const [
      revenueResult,
      ordersResult,
      usersResult,
      stockResult,
      productsCountResult,
      recentOrders,
      topProducts,
      recentSignups,
      recentSales,
    ] = await Promise.all([
      sql`SELECT SUM(total) as total_revenue FROM orders WHERE payment_status = 'paid'`,
      sql`SELECT COUNT(id) as total_orders FROM orders`,
      sql`SELECT COUNT(id) as total_users FROM users WHERE role = 'customer'`,
      sql`SELECT COUNT(id) as low_stock FROM products WHERE stock < 10`,
      sql`SELECT COUNT(id) as total_products FROM products`,
      sql`
        SELECT o.id, o.order_number as "orderNumber", o.total, o.status, o.created_at as "createdAt", u.name as "userName"
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `,
      sql`
        SELECT oi.product_name as "name", SUM(oi.quantity) as "sold", SUM(oi.price * oi.quantity) as "revenue", p.stock, p.languages
        FROM order_items oi
        INNER JOIN products p ON oi.product_id = p.id
        GROUP BY oi.product_name, p.stock, p.languages
        ORDER BY sold DESC
        LIMIT 4
      `,
      sql`
        SELECT name, email, created_at as "createdAt"
        FROM users
        WHERE role = 'customer'
        ORDER BY created_at DESC
        LIMIT 3
      `,
      sql`
        SELECT o.order_number as "orderNumber", o.total, o.created_at as "createdAt", u.name as "userName"
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 3
      `,
    ]);

    const totalRevenue = parseFloat(revenueResult[0]?.total_revenue || '0');
    const totalOrders = parseInt(ordersResult[0]?.total_orders || '0');
    const totalUsers = parseInt(usersResult[0]?.total_users || '0');
    const lowStockProducts = parseInt(stockResult[0]?.low_stock || '0');
    const totalProducts = parseInt(productsCountResult[0]?.total_products || '0');

    const recentActivity: any[] = [];
    
    recentSales.forEach(s => {
      recentActivity.push({
        type: 'sale',
        title: 'New sale recorded',
        desc: `Order #${s.orderNumber} placed by ${s.userName || 'Guest'}`,
        time: s.createdAt,
        color: 'green'
      });
    });

    recentSignups.forEach(u => {
      recentActivity.push({
        type: 'user',
        title: 'New user registered',
        desc: `${u.name} (${u.email}) joined`,
        time: u.createdAt,
        color: 'blue'
      });
    });

    // Sort combined activity by date descending
    recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalUsers,
        lowStockProducts,
        totalProducts,
        recentOrders,
        topProducts,
        recentActivity: recentActivity.slice(0, 5)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
