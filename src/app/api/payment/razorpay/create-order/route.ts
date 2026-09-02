import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid amount is required' },
        { status: 400 }
      );
    }

    // Razorpay expects amount in smallest currency unit (paise for INR)
    const amountInPaise = Math.round(amount * 100);

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
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
