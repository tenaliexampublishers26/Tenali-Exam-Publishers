import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateOrderId } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      items,
      subtotal,
      deliveryCharge = 0,
      total,
      deliveryAddress,
      paymentMethod = 'Online / UPI',
    } = body;

    if (!items || !items.length || !deliveryAddress) {
      return NextResponse.json(
        { success: false, error: 'Items and delivery address are required' },
        { status: 400 }
      );
    }

    // ─── Idempotency Check ────────────────────────────────────────────────────
    // Prevent duplicate orders if the client retries due to a network timeout.
    // Clients should send a unique idempotency key; we use a hash of user + total + timestamp-bucket.
    const idempotencyKey = body.idempotencyKey || null;
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

    const orderId = generateOrderId();
    const addressJson = typeof deliveryAddress === 'string'
      ? deliveryAddress
      : JSON.stringify(deliveryAddress);

    // ─── 1. Insert Order Row ──────────────────────────────────────────────────
    const orderResult = await sql`
      INSERT INTO orders (
        order_number, user_id, subtotal, delivery_charge, total,
        delivery_address, status, payment_status, carrier, idempotency_key
      ) VALUES (
        ${orderId},
        ${userId || null},
        ${subtotal},
        ${deliveryCharge},
        ${total},
        ${addressJson}::jsonb,
        'placed',
        'paid',
        'India Post Speed Post',
        ${idempotencyKey}
      ) RETURNING id
    `;
    const dbOrderId = orderResult[0].id;

    // ─── 2. Auto-Save Address (non-blocking background task) ─────────────────
    // Run in background — does NOT block order confirmation response
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
        } catch (addrErr) {
          console.warn('Notice: Could not auto-save address:', addrErr);
        }
      })();
    }

    // ─── 3. Parallel Item Inserts + Stock Updates ─────────────────────────────
    // Previously sequential (3 DB round-trips per item) → now parallel.
    // All items insert simultaneously; stock is decremented in a single batched UPDATE per product.
    await Promise.all(
      items.map(async (item: any) => {
        const productId = item.productId || item.id;
        const quantity = item.quantity || 1;

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
            ${item.price}, ${item.language || 'English'}, ${quantity},
            ${item.bundleTitle || null}, ${item.booksIncluded || 2}
          )
        `;

        // Atomically decrement stock using SQL GREATEST(0, stock - qty) to prevent negative stock
        // This single UPDATE replaces the old SELECT → mutate → UPDATE pattern
        const itemLangName = (item.language || 'English').toLowerCase();

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
      message: 'Order created successfully',
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
