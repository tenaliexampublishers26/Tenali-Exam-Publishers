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
      // Order details to save after payment verification
      userId,
      items,
      subtotal,
      deliveryCharge = 0,
      total,
      deliveryAddress,
    } = body;

    // --- 1. Verify signature ---
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment verification fields' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      console.warn('Invalid Razorpay signature received:', {
        razorpayOrderId,
        razorpayPaymentId,
      });
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed' },
        { status: 400 }
      );
    }

    // --- 2. Create the order in the database ---
    if (!items || !items.length || !deliveryAddress) {
      return NextResponse.json(
        { success: false, error: 'Items and delivery address are required' },
        { status: 400 }
      );
    }

    const orderId = generateOrderId();

    const orderResult = await sql`
      INSERT INTO orders (
        order_number, user_id, subtotal, delivery_charge, total,
        delivery_address, status, payment_status, carrier,
        payment_id, razorpay_order_id
      ) VALUES (
        ${orderId},
        ${userId || null},
        ${subtotal},
        ${deliveryCharge},
        ${total},
        ${JSON.stringify(deliveryAddress)}::jsonb,
        'placed',
        'paid',
        'India Post Speed Post',
        ${razorpayPaymentId},
        ${razorpayOrderId}
      ) RETURNING id
    `;
    const dbOrderId = orderResult[0]?.id;

    // --- 3. Auto-save address for logged-in users ---
    if (userId && deliveryAddress) {
      try {
        const existingAddresses = await sql`
          SELECT id FROM user_addresses WHERE user_id = ${userId}
        `;
        if (existingAddresses.length === 0) {
          await sql`
            INSERT INTO user_addresses (
              user_id, full_name, mobile, email, house_or_flat, street, area, city, state, pin_code, is_default
            ) VALUES (
              ${userId},
              ${deliveryAddress.fullName || ''},
              ${deliveryAddress.mobile || ''},
              ${deliveryAddress.email || null},
              ${deliveryAddress.houseOrFlat || ''},
              ${deliveryAddress.street || ''},
              ${deliveryAddress.area || null},
              ${deliveryAddress.city || ''},
              ${deliveryAddress.state || ''},
              ${deliveryAddress.pinCode || ''},
              true
            )
          `;
          if (deliveryAddress.mobile) {
            await sql`
              UPDATE users
              SET phone = COALESCE(phone, ${deliveryAddress.mobile})
              WHERE id = ${userId}
            `;
          }
        }
      } catch (addrErr) {
        console.warn('Notice: Could not auto-save address to user_addresses:', addrErr);
      }
    }

    // --- 4. Insert order items & update stock ---
    for (const item of items) {
      const productId = item.productId || item.id;
      const quantity = item.quantity || 1;

      await sql`
        INSERT INTO order_items (
          order_id, product_id, product_name, product_slug,
          product_image, price, language, quantity, bundle_title, books_included
        ) VALUES (
          ${dbOrderId},
          ${productId},
          ${item.productName || item.name},
          ${item.productSlug || item.slug || 'mts-postman-mg'},
          ${item.productImage || item.image || '/images/book-mts-postman.jpg'},
          ${item.price},
          ${item.language || 'English'},
          ${quantity},
          ${item.bundleTitle || null},
          ${item.booksIncluded || 2}
        )
      `;

      // Decrement stock
      const productRows = await sql`SELECT languages, stock FROM products WHERE id = ${productId}`;
      if (productRows.length > 0) {
        let currentLanguages = productRows[0].languages;
        let currentStock = parseInt(productRows[0].stock || '0');

        if (typeof currentLanguages === 'string') {
          try { currentLanguages = JSON.parse(currentLanguages); } catch { currentLanguages = []; }
        }

        if (Array.isArray(currentLanguages)) {
          const itemLangLower = (item.language || 'English').toLowerCase();
          const targetLang = currentLanguages.find((l: any) =>
            l.code === itemLangLower || l.name.toLowerCase() === itemLangLower
          );
          if (targetLang) {
            targetLang.stock = Math.max(0, (targetLang.stock || 0) - quantity);
          }
        }

        const newStock = Math.max(0, currentStock - quantity);
        await sql`
          UPDATE products
          SET stock = ${newStock},
              languages = ${sql.json(currentLanguages)}
          WHERE id = ${productId}
        `;
      }
    }

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
