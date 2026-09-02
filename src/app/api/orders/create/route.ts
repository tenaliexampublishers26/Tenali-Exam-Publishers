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
      return NextResponse.json({ success: false, error: 'Items and delivery address are required' }, { status: 400 });
    }

    // Generate unique order ID
    const orderId = generateOrderId();

    // 1. Insert order into Database
    const orderResult = await sql`
      INSERT INTO orders (
        order_number, user_id, subtotal, delivery_charge, total,
        delivery_address, status, payment_status, carrier
      ) VALUES (
        ${orderId},
        ${userId || null},
        ${subtotal},
        ${deliveryCharge},
        ${total},
        ${JSON.stringify(deliveryAddress)}::jsonb,
        'placed',
        'paid',
        'India Post Speed Post'
      ) RETURNING id
    `;
    const dbOrderId = orderResult[0].id;

    // 1b. If user is logged in, automatically save address to user_addresses as default
    if (userId && deliveryAddress) {
      try {
        const existingAddresses = await sql`
          SELECT id, is_default FROM user_addresses WHERE user_id = ${userId}
        `;

        if (existingAddresses.length === 0) {
          // First time ordering — save as DEFAULT address
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

          // Also update user's phone in users profile if not already set
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

    // 2. Insert items into order_items table and decrement product stock
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

      // Decrement the stock in products table
      const productRows = await sql`SELECT languages, stock FROM products WHERE id = ${productId}`;
      if (productRows.length > 0) {
        let currentLanguages = productRows[0].languages;
        let currentStock = parseInt(productRows[0].stock || '0');
        
        // Ensure languages is parsed if it's a string
        if (typeof currentLanguages === 'string') {
          try {
            currentLanguages = JSON.parse(currentLanguages);
          } catch (e) {
            currentLanguages = [];
          }
        }
        
        // Update language-specific stock
        if (Array.isArray(currentLanguages)) {
          // Normalize language string (e.g. 'Telugu' -> 'te')
          const itemLangLower = (item.language || 'English').toLowerCase();
          const targetLang = currentLanguages.find((l: any) => 
            l.code === itemLangLower || l.name.toLowerCase() === itemLangLower
          );
          
          if (targetLang) {
            targetLang.stock = Math.max(0, (targetLang.stock || 0) - quantity);
          }
        }
        
        // Update total stock
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
      message: 'Order created successfully in database',
    });
  } catch (error: any) {
    console.error('Error creating order in DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
