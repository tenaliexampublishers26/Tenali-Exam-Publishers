import Razorpay from 'razorpay';
import crypto from 'crypto';

const globalForRazorpay = globalThis as unknown as {
  razorpay: Razorpay | undefined;
};

function getRazorpayInstance(): Razorpay {
  if (!globalForRazorpay.razorpay) {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_live_TX68FfdLjGMVlE';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || '64xfm8E1f7qVnRhKm4nFZEUt';

    globalForRazorpay.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return globalForRazorpay.razorpay;
}

// Lazy Proxy: only accesses the Razorpay client when called at runtime, preventing build-time evaluation crash
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    const instance = getRazorpayInstance();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

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
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '64xfm8E1f7qVnRhKm4nFZEUt';
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === razorpaySignature;
}
