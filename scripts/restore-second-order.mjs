import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function restoreOrder() {
  console.log('--- Restoring Order for Vitapu Rajasekhar reddy ---');

  // Check if order already exists
  const existing = await sql`
    SELECT * FROM orders 
    WHERE payment_id = 'pay_Tb3zpM44DrjMgq' 
       OR razorpay_order_id = 'order_Tb3zifwfZZcwPm'
  `;

  if (existing.length > 0) {
    console.log('Order already exists:', existing[0]);
    await sql.end();
    return;
  }

  const orderNumber = 'TEP-202561-7142';
  const userId = '247670bc-0a7b-4b5c-87c0-c0af9b9ae5cd';
  const deliveryAddress = JSON.stringify({
    fullName: 'Vitapu Rajasekhar reddy',
    mobile: '9052376032',
    email: 'v.r.s.reddy1985@gmail.com',
    houseOrFlat: '9/215',
    street: 'Odiveedu ',
    area: 'Odiveedu ',
    city: 'Rayachoty ',
    state: 'Andhra Pradesh',
    pinCode: '516269'
  });

  const createdAt = new Date('2026-09-12T08:42:50.000Z');

  // 1. Insert order
  const [order] = await sql`
    INSERT INTO orders (
      order_number,
      user_id,
      subtotal,
      delivery_charge,
      total,
      delivery_address,
      status,
      payment_status,
      carrier,
      payment_id,
      razorpay_order_id,
      idempotency_key,
      created_at,
      updated_at
    ) VALUES (
      ${orderNumber},
      ${userId},
      1200,
      0,
      1200,
      ${deliveryAddress}::jsonb,
      'placed',
      'paid',
      'India Post Speed Post',
      'pay_Tb3zpM44DrjMgq',
      'order_Tb3zifwfZZcwPm',
      'idem_tep_1789202561901',
      ${createdAt},
      ${createdAt}
    )
    RETURNING id, order_number, total, status, payment_status, created_at
  `;

  console.log('✅ Created Order:', order);

  // 2. Insert order item
  const [item] = await sql`
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_slug,
      product_image,
      price,
      language,
      quantity,
      bundle_title,
      books_included
    ) VALUES (
      ${order.id},
      'p2',
      'PA / SA',
      'pa-sa',
      '/images/book-pa-sa.jpg',
      1200,
      'te',
      1,
      '3-Book Preparation Set',
      3
    )
    RETURNING id, product_name, language, quantity, price
  `;

  console.log('✅ Created Order Item:', item);

  // 3. Upsert payment_session
  const sessionItems = JSON.stringify([{
    productId: 'p2',
    productName: 'PA / SA',
    productSlug: 'pa-sa',
    productImage: '/images/book-pa-sa.jpg',
    language: 'te',
    quantity: 1,
    price: 1200,
    bundleTitle: '3-Book Preparation Set',
    booksIncluded: 3
  }]);

  await sql`
    INSERT INTO payment_sessions (
      razorpay_order_id,
      user_id,
      items,
      subtotal,
      delivery_charge,
      total,
      delivery_address,
      idempotency_key,
      status,
      created_at,
      expires_at
    ) VALUES (
      'order_Tb3zifwfZZcwPm',
      ${userId},
      ${sessionItems}::jsonb,
      1200,
      0,
      1200,
      ${deliveryAddress}::jsonb,
      'idem_tep_1789202561901',
      'completed',
      ${createdAt},
      ${new Date(createdAt.getTime() + 2 * 60 * 60 * 1000)}
    )
    ON CONFLICT (razorpay_order_id) DO UPDATE SET
      status = 'completed'
  `;
  console.log('✅ Created/Updated Payment Session');

  // 4. Adjust stock
  await sql`
    UPDATE products
    SET
      stock = GREATEST(0, stock - 1),
      languages = (
        SELECT jsonb_agg(
          CASE
            WHEN (LOWER(lang->>'code') = 'te' OR LOWER(lang->>'name') = 'telugu')
            THEN jsonb_set(lang, '{stock}', to_jsonb(GREATEST(0, COALESCE((lang->>'stock')::int, 0) - 1)))
            ELSE lang
          END
        )
        FROM jsonb_array_elements(COALESCE(languages, '[]'::jsonb)) AS lang
      )
    WHERE id = 'p2'
  `;
  console.log('✅ Updated Product Stock for PA / SA');

  await sql.end();
  console.log('🎉 Restoration complete successfully!');
}

restoreOrder().catch((err) => {
  console.error('❌ Error restoring order:', err);
  process.exit(1);
});
