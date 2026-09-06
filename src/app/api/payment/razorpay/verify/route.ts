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
      items,
      subtotal,
      deliveryCharge = 0,
      total,
      deliveryAddress,
      idempotencyKey,
    } = body;

    // ─── 1. Signature Verification ──────────────────────────────────────────
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification fields' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      console.warn('Invalid Razorpay signature:', { razorpayOrderId, razorpayPaymentId });
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    if (!items || !items.length || !deliveryAddress) {
      return NextResponse.json(
        { success: false, error: 'Items and delivery address are required' },
        { status: 400 }
      );
    }

    // ─── 2. Duplicate Payment Guard ──────────────────────────────────────────
    // Prevent double-order if Razorpay webhook fires twice or user double-submits.
    // razorpay_payment_id is globally unique — use it as the dedup key.
    const duplicateCheck = await sql`
      SELECT order_number FROM orders WHERE payment_id = ${razorpayPaymentId} LIMIT 1
    `;
    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        { success: true, orderId: duplicateCheck[0].order_number, message: 'Order already exists (idempotent)' },
        { status: 200 }
      );
    }

    // Also check idempotency key if provided
    if (idempotencyKey) {
      const existing = await sql`
        SELECT order_number FROM orders WHERE idempotency_key = ${idempotencyKey} LIMIT 1
      `;
      if (existing.length > 0) {
        return NextResponse.json(
          { success: true, orderId: existing[0].order_number, message: 'Order already exists (idempotent)' },
          { status: 200 }
        );
      }
    }

    // ─── 3. Fetch all product prices server-side in ONE query ─────────────────
    // Previously: one SELECT per item in a sequential loop.
    // Now: single IN() query fetches all products at once.
    const productIds: (string | number)[] = Array.from(
      new Set(items.map((item: any) => item.productId || item.id).filter(Boolean))
    );
    const productRows = productIds.length > 0
      ? await sql`
          SELECT id, price, languages, stock FROM products WHERE id IN ${sql(productIds)}
        `
      : [];
    const productMap = new Map<string, any>(
      productRows.map((p: any) => [String(p.id), p] as [string, any])
    );

    // ─── 4. Insert Order Row ─────────────────────────────────────────────────
    let validUserId = null;
    if (userId) {
      try {
        const userCheck = await sql`SELECT id FROM users WHERE id = ${userId} LIMIT 1`;
        if (userCheck.length > 0) {
          validUserId = userId;
        }
      } catch (userErr) {
        console.warn('Could not verify userId for foreign key:', userErr);
      }
    }

    const orderId = generateOrderId();
    const addressJson = typeof deliveryAddress === 'string'
      ? deliveryAddress
      : JSON.stringify(deliveryAddress);

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
    const dbOrderId = orderResult[0]?.id;

    // ─── 5. Auto-Save Address (fire-and-forget background task) ──────────────
    if (userId && deliveryAddress) {
      (async () => {
        try {
          const existingAddresses = await sql`
            SELECT id FROM user_addresses WHERE user_id = ${userId} LIMIT 1
          `;
          if (existingAddresses.length === 0) {
            await sql`
              INSERT INTO user_addresses (
                user_id, full_name, mobile, email, house_or_flat, street, area, city, state, pin_code, is_default
              ) VALUES (
                ${userId}, ${deliveryAddress.fullName || ''},
                ${deliveryAddress.mobile || ''}, ${deliveryAddress.email || null},
                ${deliveryAddress.houseOrFlat || ''}, ${deliveryAddress.street || ''},
                ${deliveryAddress.area || null}, ${deliveryAddress.city || ''},
                ${deliveryAddress.state || ''}, ${deliveryAddress.pinCode || ''}, true
              )
            `;
            if (deliveryAddress.mobile) {
              await sql`
                UPDATE users SET phone = COALESCE(phone, ${deliveryAddress.mobile}) WHERE id = ${userId}
              `;
            }
          }
        } catch (err) {
          console.warn('Could not auto-save address:', err);
        }
      })();
    }

    // ─── 6. Parallel Item Inserts + Atomic Stock Decrements ──────────────────
    await Promise.all(
      items.map(async (item: any) => {
        const productId = String(item.productId || item.id);
        const quantity = item.quantity || 1;
        // Use server-side price — never trust client-submitted price
        const product = productMap.get(productId);
        const chargedPrice = product ? parseFloat(product.price) : item.price;
        const itemLangName = (item.language || 'English').toLowerCase();

        // Insert order item
        await sql`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_slug,
            product_image, price, language, quantity, bundle_title, books_included
          ) VALUES (
            ${dbOrderId}, ${productId},
            ${item.productName || item.name},
            ${item.productSlug || item.slug || 'mts-postman-mg'},
            ${item.productImage || item.image || '/images/book-mts-postman.jpg'},
            ${chargedPrice}, ${item.language || 'English'}, ${quantity},
            ${item.bundleTitle || null}, ${item.booksIncluded || 2}
          )
        `;

        // Atomic stock decrement — single UPDATE replaces the old SELECT→mutate→UPDATE
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

    return NextResponse.json({
      success: true,
      orderId,
      message: 'Payment verified and order created successfully',
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
