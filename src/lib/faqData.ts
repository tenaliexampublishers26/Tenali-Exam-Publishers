import { SUPPORT_EMAIL } from './data';

export interface FAQItem {
  q: string;
  a: string;
}

export interface FAQSection {
  category: string;
  items: FAQItem[];
}

export const FAQ_DATA: FAQSection[] = [
  {
    category: 'Purchasing & Book Formats',
    items: [
      {
        q: 'How can I purchase books from Tenali Exam Publishers?',
        a: 'You can browse our Study Materials catalog, select the books you need (MTS, Postman, Mail Guard, or PA/SA), choose your preferred medium (English, Telugu, or Hindi), add them to your cart, and proceed to checkout with our secure Razorpay payment gateway.',
      },
      {
        q: 'What languages/mediums are available for Postal LDCE books?',
        a: 'Our study materials are meticulously prepared in three languages: English, Telugu (తెలుగు), and Hindi (हिंदी). You can choose your preferred language on the product page before ordering.',
      },
      {
        q: 'Are the books updated as per the latest India Post syllabus?',
        a: 'Yes! All our book bundles are 100% updated with the latest Department of Posts syllabus, Postal Manual Volumes V, VI & VII, PO Guide Part I & II, SB Orders, and administrative instructions.',
      },
    ],
  },
  {
    category: 'Payment & Security',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Credit Cards, Debit Cards, and Net Banking through our bank-grade secure Razorpay gateway.',
      },
      {
        q: 'Is the payment process safe and secure?',
        a: 'Yes, all payments are 100% encrypted and processed via RBI-authorized Razorpay payment gateways with bank-grade security. We never store your card or bank credentials.',
      },
      {
        q: 'What should I do if my payment fails or is deducted without order confirmation?',
        a: `If amount was deducted but order was not confirmed due to network error, the bank automatically refunds it within 5-7 business days. You can also email us at ${SUPPORT_EMAIL} with your payment screenshot for immediate assistance.`,
      },
    ],
  },
  {
    category: 'Shipping & Delivery',
    items: [
      {
        q: 'How long does delivery take across India?',
        a: 'Orders are dispatched via India Post Speed Post / registered parcel service and typically reach within 3-7 business days depending on your postal PIN code.',
      },
      {
        q: 'Do you deliver to all locations and rural post offices across India?',
        a: 'Yes! We deliver pan-India to every State, District, Taluk, and Pin Code, including remote branch post offices.',
      },
      {
        q: 'What are the delivery charges?',
        a: 'We offer free or subsidized flat delivery via Speed Post across India on all official exam guide bundles.',
      },
    ],
  },
  {
    category: 'Order Tracking & Support',
    items: [
      {
        q: 'How can I track my book parcel?',
        a: 'You can track your parcel anytime from our Track Order page using your Order ID and phone number/email. You will also receive Speed Post tracking numbers via SMS/WhatsApp upon dispatch.',
      },
      {
        q: 'What is your return or replacement policy for damaged books?',
        a: `If your package arrives damaged in transit, simply contact us at ${SUPPORT_EMAIL} within 7 days with photos, and we will dispatch a brand new replacement free of charge.`,
      },
      {
        q: 'How can I contact customer support?',
        a: `You can reach our dedicated support team via WhatsApp or email at ${SUPPORT_EMAIL}. We respond to all queries promptly.`,
      },
    ],
  },
];
