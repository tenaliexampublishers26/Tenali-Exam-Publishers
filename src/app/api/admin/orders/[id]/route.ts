import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { razorpay } from '@/lib/razorpay';

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

    // Fetch existing order to inspect payment and refund state
    const existingRows = isUUID
      ? await sql`
        SELECT id, order_number as "orderNumber", status, payment_status as "paymentStatus",
               payment_id as "paymentId", total, refund_id as "refundId"
        FROM orders
        WHERE id = ${orderId}::uuid OR order_number = ${orderId}
        LIMIT 1
      `
      : await sql`
        SELECT id, order_number as "orderNumber", status, payment_status as "paymentStatus",
               payment_id as "paymentId", total, refund_id as "refundId"
        FROM orders
        WHERE order_number = ${orderId}
        LIMIT 1
      `;

    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentOrder = existingRows[0];
    let refundId: string | null = currentOrder.refundId;
    let refundStatus: string | null = null;
    let newPaymentStatus = currentOrder.paymentStatus;
    const refundAmount = Number(currentOrder.total) || 0;

    // When status changes to cancelled, trigger automatic standard refund (speed: 'normal', 4-6 business days)
    if (
      status === 'cancelled' &&
      currentOrder.status !== 'cancelled' &&
      currentOrder.paymentStatus === 'paid' &&
      currentOrder.paymentId &&
      !currentOrder.refundId
    ) {
      try {
        const refundAmountPaise = Math.round(refundAmount * 100);
        const refundResult = await razorpay.payments.refund(currentOrder.paymentId, {
          amount: refundAmountPaise,
          speed: 'normal', // Standard/normal refund mode (4 to 6 business days). NEVER instant.
          notes: {
            reason: 'Order cancelled by admin before dispatch',
            order_id: String(currentOrder.id),
            order_number: String(currentOrder.orderNumber),
            refund_speed: 'normal',
            credit_timeline: '4 to 6 business days',
          },
          receipt: `REF-${currentOrder.orderNumber}`,
        });

        refundId = refundResult?.id || null;
        refundStatus = refundResult?.status || 'processed';
        newPaymentStatus = refundStatus === 'processed' ? 'refunded' : 'refund_pending';
        console.log(`[Admin Refund Success] Order #${currentOrder.orderNumber}: Refund ID ${refundId} initiated in normal speed (4-6 business days).`);
      } catch (refundError: any) {
        console.error('[Admin Refund Warning] Razorpay refund error:', refundError);
        const errorDesc = refundError?.error?.description || refundError?.message || '';
        if (errorDesc.toLowerCase().includes('already been refunded') || errorDesc.toLowerCase().includes('fully refunded')) {
          refundStatus = 'processed';
          newPaymentStatus = 'refunded';
        } else {
          refundStatus = 'pending';
          newPaymentStatus = 'refund_pending';
        }
      }
    } else if (status === 'cancelled' && currentOrder.paymentStatus !== 'paid' && currentOrder.paymentStatus !== 'refunded') {
      newPaymentStatus = 'cancelled';
    }

    const trackingValue = trackingNumber || null;

    // dispatched_at is stamped the first time a tracking number is entered
    const result = isUUID
      ? await sql`
        UPDATE orders
        SET status = COALESCE(${status ?? null}, status),
            payment_status = COALESCE(${newPaymentStatus}, payment_status),
            refund_id = COALESCE(${refundId}, refund_id),
            refund_status = COALESCE(${refundStatus}, refund_status),
            refund_amount = CASE WHEN ${status === 'cancelled' && currentOrder.paymentStatus === 'paid'} THEN ${refundAmount} ELSE refund_amount END,
            refunded_at = CASE WHEN ${refundId}::text IS NOT NULL AND refunded_at IS NULL THEN NOW() ELSE refunded_at END,
            tracking_number = COALESCE(${trackingValue}, tracking_number),
            carrier = COALESCE(${carrier || null}, carrier),
            dispatched_at = CASE
              WHEN ${trackingValue}::text IS NOT NULL AND dispatched_at IS NULL THEN NOW()
              ELSE dispatched_at
            END,
            updated_at = NOW()
        WHERE id = ${orderId}::uuid OR order_number = ${orderId}
        RETURNING id, order_number as "orderNumber", status, payment_status as "paymentStatus",
                  refund_id as "refundId", refund_status as "refundStatus",
                  refund_amount as "refundAmount", refunded_at as "refundedAt",
                  tracking_number as "trackingNumber", carrier, dispatched_at as "dispatchedAt"
      `
      : await sql`
        UPDATE orders
        SET status = COALESCE(${status ?? null}, status),
            payment_status = COALESCE(${newPaymentStatus}, payment_status),
            refund_id = COALESCE(${refundId}, refund_id),
            refund_status = COALESCE(${refundStatus}, refund_status),
            refund_amount = CASE WHEN ${status === 'cancelled' && currentOrder.paymentStatus === 'paid'} THEN ${refundAmount} ELSE refund_amount END,
            refunded_at = CASE WHEN ${refundId}::text IS NOT NULL AND refunded_at IS NULL THEN NOW() ELSE refunded_at END,
            tracking_number = COALESCE(${trackingValue}, tracking_number),
            carrier = COALESCE(${carrier || null}, carrier),
            dispatched_at = CASE
              WHEN ${trackingValue}::text IS NOT NULL AND dispatched_at IS NULL THEN NOW()
              ELSE dispatched_at
            END,
            updated_at = NOW()
        WHERE order_number = ${orderId}
        RETURNING id, order_number as "orderNumber", status, payment_status as "paymentStatus",
                  refund_id as "refundId", refund_status as "refundStatus",
                  refund_amount as "refundAmount", refunded_at as "refundedAt",
                  tracking_number as "trackingNumber", carrier, dispatched_at as "dispatchedAt"
      `;

    return NextResponse.json({ success: true, order: result[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
