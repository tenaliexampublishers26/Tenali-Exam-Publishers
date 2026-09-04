import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { sql } from '@/lib/db';
import { DELIVERY_CHARGE } from '@/lib/data';

interface IncomingCartItem {
  productId: string;
  language?: string;
  quantity: number;
}

/**
 * Recomputes the order total from live database prices and validates stock,
 * rather than trusting whatever amount the client sends. This is the
 * authoritative checkpoint: even if a browser has a stale/tampered price or
 * an out-of-stock item sitting in its cart, this is where it gets caught —
 * before any money moves.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: IncomingCartItem[] = Array.isArray(body.items) ? body.items : [];
    const currency = body.currency || 'INR';
    const receipt = body.receipt;

    if (items.length === 0) {
      return NextResponse.json({ success: false, error: 'Your cart is empty' }, { status: 400 });
    }

    let subtotal = 0;
    const priceUpdates: Array<{ productId: string; language: string; oldPrice: number; newPrice: number }> = [];
    const stockIssues: Array<{ productId: string; productName: string; language: string; requested: number; available: number }> = [];

    for (const item of items) {
      const quantity = Math.max(1, parseInt(String(item.quantity)) || 1);
      const rows = await sql`SELECT id, name, price, stock, languages FROM products WHERE id = ${item.productId} LIMIT 1`;

      if (rows.length === 0) {
        return NextResponse.json(
          { success: false, error: `One of the items in your cart is no longer available. Please refresh your cart.` },
          { status: 409 }
        );
      }

      const dbProduct = rows[0];
      const currentPrice = parseFloat(dbProduct.price);

      // Resolve per-language stock if the product tracks it that way, else fall back to overall stock.
      let languages = dbProduct.languages;
      if (typeof languages === 'string') {
        try { languages = JSON.parse(languages); } catch { languages = []; }
      }
      const requestedLang = (item.language || 'en').toLowerCase();
      let availableStock = parseInt(dbProduct.stock || '0');
      if (Array.isArray(languages) && languages.length > 0) {
        const langEntry = languages.find(
          (l: any) => l.code === requestedLang || (l.name && l.name.toLowerCase() === requestedLang)
        );
        if (langEntry && typeof langEntry.stock === 'number') {
          availableStock = langEntry.stock;
        }
      }

      if (availableStock < quantity) {
        stockIssues.push({
          productId: item.productId,
          productName: dbProduct.name,
          language: item.language || 'en',
          requested: quantity,
          available: Math.max(0, availableStock),
        });
        continue;
      }

      subtotal += currentPrice * quantity;
    }

    if (stockIssues.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Some items in your cart are out of stock or have limited quantity available.',
          stockIssues,
        },
        { status: 409 }
      );
    }

    const total = subtotal + DELIVERY_CHARGE;

    if (total <= 0) {
      return NextResponse.json({ success: false, error: 'A valid amount is required' }, { status: 400 });
    }

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(total * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: true,
    } as any);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      subtotal,
      deliveryCharge: DELIVERY_CHARGE,
      total,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
