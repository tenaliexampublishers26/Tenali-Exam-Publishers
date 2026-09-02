import Razorpay from 'razorpay';
import crypto from 'crypto';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn('⚠️ Razorpay API keys are not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
}

// Razorpay server-side instance (reused across requests in dev)
const globalForRazorpay = globalThis as unknown as {
  razorpay: Razorpay | undefined;
};

export const razorpay =
  globalForRazorpay.razorpay ??
  new Razorpay({
    key_id: keyId || '',
    key_secret: keySecret || '',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRazorpay.razorpay = razorpay;
}

/**
 * Verify a Razorpay webhook/checkout signature using HMAC-SHA256.
 * @param razorpayOrderId   - The Razorpay order ID returned by create-order
 * @param razorpayPaymentId - The payment ID from the checkout handler callback
 * @param razorpaySignature - The signature from the checkout handler callback
 * @returns true if the signature is valid
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret || '')
    .update(body)
    .digest('hex');
  return expectedSignature === razorpaySignature;
}
