import { Product, OrderStatus, PaymentStatus } from '@/types';

// Static product data for the frontend (will be replaced by Supabase later)
export const SUPPORT_EMAIL = 'tenaliexamspublishers@gmail.com';
export const COMPANY_PHONE = '7396977544';
export const WHATSAPP_NUMBER = '917396977544';
export const WHATSAPP_DEFAULT_MSG = 'Hello Tenali Exams Publishers, I need assistance regarding your books.';
export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MSG)}`;
export const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Va5gy9Z96H4IdxcRLF2L';
export const COMPANY_ADDRESS = {
  line1: 'D.No. 19-308, Namburu',
  line2: 'Guntur District – 522508',
  line3: 'Andhra Pradesh, India'
};

export const products: Product[] = [
  {
    id: 'p1',
    slug: 'mts-postman-mg',
    name: 'MTS + POSTMAN / MG',
    bundleTitle: '2-Book Preparation Set',
    booksIncluded: 2,
    edition: 'First Edition',
    shortDescription: 'Comprehensive 2-book preparation bundle covering MTS, Postman, and Mail Guard syllabi. Updated with latest department rules.',
    description: 'Prepare for MTS, Postman, and Mail Guard (MG) examinations with this complete 2-book preparation set. This bundle combines essential exam-focused study material covering the key subjects, concepts, rules, and postal-related topics required for your preparation.\n\nThe content is presented in a simple and easy-to-understand format, helping you learn important concepts, revise efficiently, and practice key topics.',
    price: 800,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'te', name: 'Telugu' },
      { code: 'hi', name: 'Hindi' }
    ],
    image: '/images/book-mts-postman.jpg',
    images: [
      '/images/book-mts-postman.jpg',
      '/images/common-guide-2027.jpg'
    ],
    category: 'Combo Pack',
    examCoverage: 'MTS, Postman & Mail Guard (MG) Examinations',
    features: [
      'Exam-focused coverage for MTS, Postman & Mail Guard (MG)',
      'Coverage of relevant postal subjects, rules, and concepts',
      'Concept-based notes, tables, and important rules',
      'Useful study material for revision and exam preparation'
    ],
    brand: 'Tenali Exams Publishers',
    badge: 'Best Seller',
    stock: 100
  },
  {
    id: 'p2',
    slug: 'pa-sa',
    name: 'PA / SA (LGO)',
    bundleTitle: 'PA/SA (LGO) Guide Set',
    booksIncluded: 3,
    edition: 'First Edition',
    shortDescription: 'Complete 3-book preparation bundle for PA / SA examination.',
    description: 'Prepare for the Postal Assistant (PA) and Sorting Assistant (SA) examinations with this complete 3-book preparation set. The bundle brings together essential study material covering the subjects and concepts required for your exam preparation, presented in a simple and easy-to-understand format.',
    price: 1200,
    languages: [
      { code: 'en', name: 'English' },
      { code: 'te', name: 'Telugu' },
      { code: 'hi', name: 'Hindi' }
    ],
    image: '/images/book-pa-sa.jpg',
    images: [
      '/images/book-pa-sa.jpg'
    ],
    category: 'Study Guide',
    examCoverage: 'Postal Assistant (PA) & Sorting Assistant (SA) Examinations',
    features: [
      'PA / SA exam-focused study material',
      'Coverage of relevant postal subjects, manuals, and concepts',
      'Topic-wise practice questions and MCQs',
      'Concept-based explanations for easier preparation',
      'Useful revision material for exam preparation'
    ],
    brand: 'Tenali Exams Publishers',
    stock: 100
  }
];

export const getProductBySlug = (slug: string): Product | undefined => {
  if (slug === 'pa-sa-lgo') return products.find(p => p.slug === 'pa-sa') || products.find(p => p.slug === 'pa-sa-lgo');
  return products.find(p => p.slug === slug);
};

export const getProductById = (id: string): Product | undefined => products.find(p => p.id === id);

export const popularSearches: string[] = ['MTS', 'Postman', 'MG', 'PA', 'SA'];

export const DELIVERY_CHARGE = 0;
export const ORIGINAL_DELIVERY_CHARGE = 70;

export const ORDER_STATUSES: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'placed', label: 'Order Placed', icon: 'Package' },
  { key: 'dispatched', label: 'Dispatched', icon: 'Truck' },
];

export const PAYMENT_STATUSES: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'warning' },
  processing: { label: 'Processing', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'error' },
  refunded: { label: 'Refunded', color: 'info' },
};

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const CONTACT_CATEGORIES: string[] = [
  'General Query',
  'Order Related Query',
  'Order Tracking',
  'Payment Issue',
  'Delivery Issue',
  'Product Query',
  'Other',
];
