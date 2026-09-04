import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const orderId = params.id;
    const body = await request.json();
    const status: string | undefined = body.status ?? undefined;
    const trackingNumber: string | undefined = body.trackingNumber !== undefined ? String(body.trackingNumber).trim() : undefined;
    const carrier: string | undefined = body.carrier !== undefined ? String(body.carrier).trim() : undefined;

    if (status === undefined && trackingNumber === undefined && carrier === undefined) {
      return NextResponse.json({ error: 'Nothing to update — provide status, trackingNumber, or carrier' }, { status: 400 });
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const trackingValue = trackingNumber || null;

    // dispatched_at is stamped the first time a tracking number is entered
    // (and only then — it stays put on later edits/corrections to the ID).
    const result = isUUID
      ? await sql`
        UPDATE orders
        SET status = COALESCE(${status ?? null}, status),
            tracking_number = COALESCE(${trackingValue}, tracking_number),
            carrier = COALESCE(${carrier || null}, carrier),
            dispatched_at = CASE
              WHEN ${trackingValue}::text IS NOT NULL AND dispatched_at IS NULL THEN NOW()
              ELSE dispatched_at
            END,
            updated_at = NOW()
        WHERE id = ${orderId}::uuid OR order_number = ${orderId}
        RETURNING id, status, tracking_number as "trackingNumber", carrier, dispatched_at as "dispatchedAt"
      `
      : await sql`
        UPDATE orders
        SET status = COALESCE(${status ?? null}, status),
            tracking_number = COALESCE(${trackingValue}, tracking_number),
            carrier = COALESCE(${carrier || null}, carrier),
            dispatched_at = CASE
              WHEN ${trackingValue}::text IS NOT NULL AND dispatched_at IS NULL THEN NOW()
              ELSE dispatched_at
            END,
            updated_at = NOW()
        WHERE order_number = ${orderId}
        RETURNING id, status, tracking_number as "trackingNumber", carrier, dispatched_at as "dispatchedAt"
      `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: result[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
