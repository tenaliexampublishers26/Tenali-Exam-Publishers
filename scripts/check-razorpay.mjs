import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  try {
    console.log('Fetching recent Razorpay payments...');
    const payments = await razorpay.payments.all({ count: 10 });
    console.log('Total fetched payments:', payments.items.length);
    for (const p of payments.items) {
      console.log({
        id: p.id,
        order_id: p.order_id,
        amount: p.amount / 100,
        status: p.status,
        method: p.method,
        email: p.email,
        contact: p.contact,
        notes: p.notes,
        created_at: new Date(p.created_at * 1000).toISOString()
      });
    }

    console.log('\nFetching recent Razorpay orders...');
    const orders = await razorpay.orders.all({ count: 10 });
    console.log('Total fetched orders:', orders.items.length);
    for (const o of orders.items) {
      console.log({
        id: o.id,
        amount: o.amount / 100,
        amount_paid: o.amount_paid / 100,
        status: o.status,
        receipt: o.receipt,
        notes: o.notes,
        created_at: new Date(o.created_at * 1000).toISOString()
      });
    }
  } catch (err) {
    console.error('Razorpay fetch error:', err);
  }
}

run();
