import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sql } from '@/lib/db';
import { generateOrderId } from '@/lib/utils';

/**
 * Razorpay Webhook Handler
 *
 * Handles server-side payment events so orders are created reliably even if
 * the user closes the browser tab before the frontend verify call completes.
 *
 * Setup: In Razorpay Dashboard → Settings → Webhooks, point to:
 *   https://<your-domain>/api/payment/razorpay/webhook
 * Events to subscribe: payment.captured, payment.failed
 *
 * Set RAZORPAY_WEBHOOK_SECRET in your environment variables.
 */

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  const signature = request.headers.get('x-razorpay-signature') || '';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

  // If no webhook secret is configured, skip signature verification (dev mode only)
  if (webhookSecret) {
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.warn('[webhook] Invalid Razorpay webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } else {
    console.warn('[webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature verification (set this in production!)');
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const eventType: string = event?.event || '';
  const payment = event?.payload?.payment?.entity;

  // Only handle payment.captured events (money confirmed received)
  if (eventType !== 'payment.captured' || !payment) {
    // Return 200 for unhandled events so Razorpay doesn't retry
    return NextResponse.json({ received: true, skipped: true });
  }

  const razorpayPaymentId: string = payment.id;
  const razorpayOrderId: string = payment.order_id;

  if (!razorpayPaymentId || !razorpayOrderId) {
    console.error('[webhook] Missing payment or order id in payload');
    return NextResponse.json({ error: 'Missing payment identifiers' }, { status: 400 });
  }

  try {
    // ─── Idempotency: Check if order already exists ───────────────────────
    const existing = await sql`
      SELECT order_number FROM orders WHERE payment_id = ${razorpayPaymentId} LIMIT 1
    `;
    if (existing.length > 0) {
      // Already created — acknowledge webhook without duplicating
      return NextResponse.json({ received: true, orderId: existing[0].order_number, status: 'already_exists' });
    }

    // ─── Load Payment Session ─────────────────────────────────────────────
    const sessionRows = await sql`
      SELECT items, subtotal, delivery_charge, total, delivery_address, user_id, idempotency_key
      FROM payment_sessions
      WHERE razorpay_order_id = ${razorpayOrderId} AND status = 'pending'
      LIMIT 1
    `;

    if (sessionRows.length === 0) {
      // No session found — the order was likely already created by the frontend verify path.
      // Return 200 to prevent Razorpay from retrying.
      console.warn('[webhook] No pending payment session for order:', razorpayOrderId);
      return NextResponse.json({ received: true, status: 'no_pending_session' });
    }

    const session = sessionRows[0];
    const items: any[] = Array.isArray(session.items)
      ? session.items
      : (typeof session.items === 'string' ? JSON.parse(session.items) : []);
    const subtotal = parseFloat(session.subtotal);
    const deliveryCharge = parseFloat(session.delivery_charge || 0);
    const total = parseFloat(session.total);
    const deliveryAddress = session.delivery_address;
    const sessionUserId = session.user_id || null;
    const idempotencyKey = session.idempotency_key || null;

    if (!items.length || !deliveryAddress) {
      console.error('[webhook] Incomplete session data for order:', razorpayOrderId);
      return NextResponse.json({ received: true, status: 'incomplete_session' });
    }

    // ─── Check idempotency key again (concurrent frontend + webhook race) ─
    if (idempotencyKey) {
      const dupByKey = await sql`
        SELECT order_number FROM orders WHERE idempotency_key = ${idempotencyKey} LIMIT 1
      `;
      if (dupByKey.length > 0) {
        await sql`UPDATE payment_sessions SET status = 'completed' WHERE razorpay_order_id = ${razorpayOrderId}`;
        return NextResponse.json({ received: true, orderId: dupByKey[0].order_number, status: 'already_exists_by_key' });
      }
    }

    // ─── Validate user FK ─────────────────────────────────────────────────
    let validUserId: string | null = null;
    if (sessionUserId) {
      try {
        const userCheck = await sql`SELECT id FROM users WHERE id = ${sessionUserId} LIMIT 1`;
        if (userCheck.length > 0) validUserId = sessionUserId;
      } catch { /* non-fatal */ }
    }

    // ─── Create Order Row ─────────────────────────────────────────────────
    const orderId = generateOrderId();
    const addressJson = typeof deliveryAddress === 'string'
      ? deliveryAddress
      : JSON.stringify(deliveryAddress);

    let dbOrderId: string;
    try {
      const orderResult = await sql`
        INSERT INTO orders (
          order_number, user_id, subtotal, delivery_charge, total,
          delivery_address, status, payment_status, carrier,
          payment_id, razorpay_order_id, idempotency_key
        ) VALUES (
          ${orderId}, ${validUserId}, ${subtotal}, ${deliveryCharge}, ${total},
          ${addressJson}::jsonb, 'placed', 'paid', 'India Post Speed Post',
          ${razorpayPaymentId}, ${razorpayOrderId}, ${idempotencyKey}
        ) RETURNING id
      `;
      dbOrderId = orderResult[0]?.id;
    } catch (insertErr: any) {
      if (insertErr?.code === '23505') {
        // Race condition: concurrent verify already created it
        const dupRows = await sql`
          SELECT order_number FROM orders
          WHERE payment_id = ${razorpayPaymentId} OR razorpay_order_id = ${razorpayOrderId}
          LIMIT 1
        `;
        if (dupRows.length > 0) {
          return NextResponse.json({ received: true, orderId: dupRows[0].order_number, status: 'race_resolved' });
        }
      }
      throw insertErr;
    }

    // ─── Insert Order Items + Decrement Stock ─────────────────────────────
    await Promise.all(
      items.map(async (item: any) => {
        const productId = String(item.productId || item.id);
        const quantity = item.quantity || 1;
        const chargedPrice = item.price ?? 0;
        const itemLangName = (item.language || 'English').toLowerCase();

        await sql`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_slug,
            product_image, price, language, quantity, bundle_title, books_included
          ) VALUES (
            ${dbOrderId}, ${productId},
            ${item.productName || 'Study Material'},
            ${item.productSlug || productId},
            ${item.productImage || '/images/book-mts-postman.jpg'},
            ${chargedPrice}, ${item.language || 'English'}, ${quantity},
            ${item.bundleTitle || null}, ${item.booksIncluded || 1}
          )
        `;

        await sql`
          UPDATE products
          SET
            stock = GREATEST(0, stock - ${quantity}),
            languages = (
              SELECT jsonb_agg(
                CASE
                  WHEN (LOWER(lang->>'code') = ${itemLangName} OR LOWER(lang->>'name') = ${itemLangName})
                  THEN jsonb_set(lang, '{stock}', to_jsonb(GREATEST(0, COALESCE((lang->>'stock')::int, 0) - ${quantity})))
                  ELSE lang
                END
              )
              FROM jsonb_array_elements(COALESCE(languages, '[]'::jsonb)) AS lang
            )
          WHERE id = ${productId}
        `;
      })
    );

    // ─── Mark session as completed ────────────────────────────────────────
    await sql`
      UPDATE payment_sessions SET status = 'completed' WHERE razorpay_order_id = ${razorpayOrderId}
    `;

    console.log(`[webhook] Order created via webhook: ${orderId} (payment: ${razorpayPaymentId})`);
    return NextResponse.json({ received: true, orderId, status: 'created' });
  } catch (error: any) {
    console.error('[webhook] Error processing payment.captured:', error);
    // Return 500 so Razorpay retries the webhook
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
