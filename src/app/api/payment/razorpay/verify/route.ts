import { NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { sql } from '@/lib/db';
import { generateOrderId } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      userId,
      deliveryAddress,
      idempotencyKey,
    } = body;

    // Client may pass items/subtotal/total but we will prefer server-stored values from payment_session.
    // We still accept them as a fallback in case the session INSERT failed.
    let clientItems = Array.isArray(body.items) ? body.items : [];
    let clientSubtotal: number | null = typeof body.subtotal === 'number' ? body.subtotal : null;
    let clientDeliveryCharge: number = typeof body.deliveryCharge === 'number' ? body.deliveryCharge : 0;
    let clientTotal: number | null = typeof body.total === 'number' ? body.total : null;

    // ─── 1. Signature Verification ──────────────────────────────────────────
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification fields' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      console.warn('[verify] Invalid Razorpay signature:', { razorpayOrderId, razorpayPaymentId });
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    // ─── 2. Duplicate Payment Guard ──────────────────────────────────────────
    // razorpay_payment_id is globally unique — dedup on it first.
    const duplicateByPayment = await sql`
      SELECT order_number FROM orders WHERE payment_id = ${razorpayPaymentId} LIMIT 1
    `;
    if (duplicateByPayment.length > 0) {
      return NextResponse.json(
        { success: true, orderId: duplicateByPayment[0].order_number, message: 'Order already exists (idempotent)' },
        { status: 200 }
      );
    }

    // Also check idempotency key if provided
    if (idempotencyKey) {
      const duplicateByKey = await sql`
        SELECT order_number FROM orders WHERE idempotency_key = ${idempotencyKey} LIMIT 1
      `;
      if (duplicateByKey.length > 0) {
        return NextResponse.json(
          { success: true, orderId: duplicateByKey[0].order_number, message: 'Order already exists (idempotent)' },
          { status: 200 }
        );
      }
    }

    // ─── 3. Load Payment Session (authoritative server-side data) ─────────────
    let sessionItems: any[] = [];
    let sessionSubtotal: number | null = null;
    let sessionDeliveryCharge: number = 0;
    let sessionTotal: number | null = null;
    let sessionDeliveryAddress: any = null;
    let sessionUserId: string | null = null;

    try {
      const sessionRows = await sql`
        SELECT items, subtotal, delivery_charge, total, delivery_address, user_id
        FROM payment_sessions
        WHERE razorpay_order_id = ${razorpayOrderId}
        LIMIT 1
      `;
      if (sessionRows.length > 0) {
        const s = sessionRows[0];
        sessionItems = Array.isArray(s.items) ? s.items : (typeof s.items === 'string' ? JSON.parse(s.items) : []);
        sessionSubtotal = parseFloat(s.subtotal);
        sessionDeliveryCharge = parseFloat(s.delivery_charge || 0);
        sessionTotal = parseFloat(s.total);
        sessionDeliveryAddress = s.delivery_address || null;
        sessionUserId = s.user_id || null;
      }
    } catch (sessionErr) {
      console.warn('[verify] Could not load payment session, falling back to client data:', sessionErr);
    }

    // Merge: prefer server-session values, fall back to client-submitted values
    const items: any[] = sessionItems.length > 0 ? sessionItems : clientItems;
    const subtotal: number = sessionSubtotal ?? clientSubtotal ?? 0;
    const deliveryCharge: number = sessionDeliveryCharge ?? clientDeliveryCharge;
    const total: number = sessionTotal ?? clientTotal ?? (subtotal + deliveryCharge);
    // Delivery address: prefer what the client just sent (most up-to-date), then session, then fail
    const finalAddress = deliveryAddress || sessionDeliveryAddress;
    const finalUserId = userId || sessionUserId;

    if (!items || items.length === 0) {
      console.error('[verify] No items found in session or client payload for order:', razorpayOrderId);
      return NextResponse.json(
        { success: false, error: 'Order items could not be recovered. Please contact support with payment ID: ' + razorpayPaymentId },
        { status: 400 }
      );
    }

    if (!finalAddress) {
      return NextResponse.json(
        { success: false, error: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // ─── 4. Fetch all product prices server-side in ONE query ─────────────────
    const productIds: string[] = Array.from(
      new Set(items.map((item: any) => String(item.productId || item.id)).filter(Boolean))
    );

    let productMap = new Map<string, any>();
    if (productIds.length > 0) {
      try {
        // postgres.js supports array parameters via sql([...]) for IN clauses
        const productRows = await sql`
          SELECT id, price, languages, stock FROM products WHERE id = ANY(${productIds})
        `;
        productMap = new Map<string, any>(
          productRows.map((p: any) => [String(p.id), p] as [string, any])
        );
      } catch (productErr) {
        console.warn('[verify] Could not fetch product prices — will use session prices:', productErr);
      }
    }

    // ─── 5. Validate user_id FK ───────────────────────────────────────────────
    let validUserId: string | null = null;
    if (finalUserId) {
      try {
        const userCheck = await sql`SELECT id FROM users WHERE id = ${finalUserId} LIMIT 1`;
        if (userCheck.length > 0) validUserId = finalUserId;
      } catch (userErr) {
        console.warn('[verify] Could not verify userId for foreign key:', userErr);
      }
    }

    // ─── 6. Insert Order Row ─────────────────────────────────────────────────
    const orderId = generateOrderId();
    const addressJson = typeof finalAddress === 'string'
      ? finalAddress
      : JSON.stringify(finalAddress);

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
          ${razorpayPaymentId}, ${razorpayOrderId}, ${idempotencyKey || null}
        ) RETURNING id
      `;
      dbOrderId = orderResult[0]?.id;
    } catch (insertErr: any) {
      // Handle unique constraint violation — order was already created (race condition)
      if (insertErr?.code === '23505') {
        // Fetch the existing order and return it
        const existingRows = await sql`
          SELECT order_number FROM orders
          WHERE payment_id = ${razorpayPaymentId}
             OR razorpay_order_id = ${razorpayOrderId}
             OR (${idempotencyKey || null}::text IS NOT NULL AND idempotency_key = ${idempotencyKey || null})
          LIMIT 1
        `;
        if (existingRows.length > 0) {
          return NextResponse.json({
            success: true,
            orderId: existingRows[0].order_number,
            message: 'Order already created (concurrent request resolved)',
          });
        }
      }
      console.error('[verify] Failed to insert order row:', insertErr);
      return NextResponse.json(
        { success: false, error: 'Failed to create order record. Please contact support with payment ID: ' + razorpayPaymentId },
        { status: 500 }
      );
    }

    // ─── 7. Auto-Save Address (fire-and-forget) ───────────────────────────────
    if (validUserId && finalAddress && typeof finalAddress === 'object') {
      (async () => {
        try {
          const existingAddresses = await sql`
            SELECT id FROM user_addresses WHERE user_id = ${validUserId} LIMIT 1
          `;
          if (existingAddresses.length === 0) {
            await sql`
              INSERT INTO user_addresses (
                user_id, full_name, mobile, email, house_or_flat, street, area, city, state, pin_code, is_default
              ) VALUES (
                ${validUserId}, ${finalAddress.fullName || ''},
                ${finalAddress.mobile || ''}, ${finalAddress.email || null},
                ${finalAddress.houseOrFlat || ''}, ${finalAddress.street || ''},
                ${finalAddress.area || null}, ${finalAddress.city || ''},
                ${finalAddress.state || ''}, ${finalAddress.pinCode || ''}, true
              )
            `;
            if (finalAddress.mobile) {
              await sql`
                UPDATE users SET phone = COALESCE(phone, ${finalAddress.mobile}) WHERE id = ${validUserId}
              `;
            }
          }
        } catch (err) {
          console.warn('[verify] Could not auto-save address:', err);
        }
      })();
    }

    // ─── 8. Parallel Item Inserts + Atomic Stock Decrements ──────────────────
    try {
      await Promise.all(
        items.map(async (item: any) => {
          const productId = String(item.productId || item.id);
          const quantity = item.quantity || 1;
          // Prefer server-side price from productMap, then session price, then client price
          const product = productMap.get(productId);
          const chargedPrice = product ? parseFloat(product.price) : (item.price ?? 0);
          const itemLangName = (item.language || 'English').toLowerCase();

          await sql`
            INSERT INTO order_items (
              order_id, product_id, product_name, product_slug,
              product_image, price, language, quantity, bundle_title, books_included
            ) VALUES (
              ${dbOrderId}, ${productId},
              ${item.productName || item.name || 'Study Material'},
              ${item.productSlug || item.slug || productId},
              ${item.productImage || item.image || '/images/book-mts-postman.jpg'},
              ${chargedPrice}, ${item.language || 'English'}, ${quantity},
              ${item.bundleTitle || null}, ${item.booksIncluded || 1}
            )
          `;

          // Atomic stock decrement — single UPDATE prevents race conditions
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
    } catch (itemErr) {
      // Items failed to insert — order row exists but is incomplete.
      // Log and still return the order number so user can contact support.
      console.error('[verify] Failed to insert order items:', itemErr);
    }

    // ─── 9. Mark payment session as completed ────────────────────────────────
    try {
      await sql`
        UPDATE payment_sessions SET status = 'completed' WHERE razorpay_order_id = ${razorpayOrderId}
      `;
    } catch { /* non-fatal */ }

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Payment verified and order created successfully',
    });
  } catch (error: any) {
    console.error('[verify] Unhandled error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
