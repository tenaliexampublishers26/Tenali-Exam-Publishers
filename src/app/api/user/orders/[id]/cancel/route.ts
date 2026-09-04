import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const CANCELLABLE_STATUSES = ['placed', 'processing'];
const CANCEL_WINDOW_HOURS = 24;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'You must be logged in to cancel an order' }, { status: 401 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);

    const orderResult = isUUID
      ? await sql`
        SELECT id, user_id as "userId", status, payment_status as "paymentStatus", created_at as "createdAt"
        FROM orders
        WHERE id = ${orderId}::uuid OR order_number = ${orderId}
        LIMIT 1
      `
      : await sql`
        SELECT id, user_id as "userId", status, payment_status as "paymentStatus", created_at as "createdAt"
        FROM orders
        WHERE order_number = ${orderId}
        LIMIT 1
      `;

    if (orderResult.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult[0];

    if (!order.userId || order.userId !== userId) {
      return NextResponse.json({ error: 'You do not have permission to cancel this order' }, { status: 403 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'This order has already been cancelled' }, { status: 400 });
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: 'This order has already been dispatched and can no longer be cancelled. Please contact support.' },
        { status: 400 }
      );
    }

    const createdAt = new Date(order.createdAt);
    const hoursSinceOrder = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceOrder > CANCEL_WINDOW_HOURS) {
      return NextResponse.json(
        { error: 'The 24-hour cancellation window for this order has passed. Please contact support for assistance.' },
        { status: 400 }
      );
    }

    const newPaymentStatus = order.paymentStatus === 'paid' ? 'refund_pending' : 'cancelled';

    const updated = await sql`
      UPDATE orders
      SET status = 'cancelled', payment_status = ${newPaymentStatus}, updated_at = NOW()
      WHERE id = ${order.id}
      RETURNING id, status, payment_status as "paymentStatus"
    `;

    // Restock items that were decremented at order time.
    const items = await sql`
      SELECT product_id as "productId", language, quantity
      FROM order_items
      WHERE order_id = ${order.id}
    `;

    for (const item of items) {
      if (!item.productId) continue;
      try {
        const productRows = await sql`SELECT languages, stock FROM products WHERE id = ${item.productId}`;
        if (productRows.length === 0) continue;

        let currentLanguages = productRows[0].languages;
        const currentStock = parseInt(productRows[0].stock || '0');

        if (typeof currentLanguages === 'string') {
          try {
            currentLanguages = JSON.parse(currentLanguages);
          } catch {
            currentLanguages = [];
          }
        }

        if (Array.isArray(currentLanguages)) {
          const itemLangLower = (item.language || 'English').toLowerCase();
          const targetLang = currentLanguages.find(
            (l: any) => l.code === itemLangLower || l.name.toLowerCase() === itemLangLower
          );
          if (targetLang) {
            targetLang.stock = (targetLang.stock || 0) + item.quantity;
          }
        }

        const newStock = currentStock + item.quantity;

        await sql`
          UPDATE products
          SET stock = ${newStock},
              languages = ${sql.json(currentLanguages)}
          WHERE id = ${item.productId}
        `;
      } catch (restockErr) {
        // Don't fail the whole cancellation if a single product's restock hiccups —
        // the order cancellation itself is the priority.
        console.warn('Notice: Could not restock product', item.productId, restockErr);
      }
    }

    return NextResponse.json({ success: true, order: updated[0] }, { status: 200 });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: 'Failed to cancel order. Please try again.' }, { status: 500 });
  }
}
