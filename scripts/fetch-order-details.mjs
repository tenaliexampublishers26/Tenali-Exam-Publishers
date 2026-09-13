import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  const payment = await razorpay.payments.fetch('pay_Tb3zpM44DrjMgq');
  console.log('Payment details:', JSON.stringify(payment, null, 2));

  const order = await razorpay.orders.fetch('order_Tb3zifwfZZcwPm');
  console.log('Order details:', JSON.stringify(order, null, 2));

  const orderPayments = await razorpay.orders.fetchPayments('order_Tb3zifwfZZcwPm');
  console.log('Order payments:', JSON.stringify(orderPayments, null, 2));
}

run().catch(console.error);
