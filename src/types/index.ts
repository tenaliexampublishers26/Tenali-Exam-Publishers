export type LanguageCode = 'en' | 'te' | 'hi' | string;

export interface ProductLanguage {
  code: string;
  name: string;
  stock?: number;
}

export interface TableOfContentSection {
  bookTitle: string;
  chapters: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  bundleTitle?: string;
  booksIncluded?: number;
  edition?: string;
  shortDescription?: string;
  description: string;
  price: number;
  languages: ProductLanguage[];
  image: string;
  images?: string[];
  category: string;
  examCoverage?: string;
  badges?: string[];
  features?: string[];
  tableOfContents?: TableOfContentSection[];
  brand?: string;
  badge?: string;
  stock: number;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
  language: LanguageCode | string;
  quantity: number;
  badge?: string;
  bundleTitle?: string;
  booksIncluded?: number;
  edition?: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
  badge?: string;
  languages?: ProductLanguage[];
  addedAt: string;
}

export interface Address {
  fullName: string;
  mobile: string;
  email: string;
  houseOrFlat: string;
  street: string;
  area?: string;
  city: string;
  state: string;
  pinCode: string;
}

export type OrderStatus =
  | 'placed'
  | 'processing'
  | 'dispatched'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refund_pending'
  | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
  language: string;
  quantity: number;
  bundleTitle?: string;
  booksIncluded?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  deliveryAddress: Address;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundedAt?: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  image?: string | null;
  avatar_url?: string;
  role?: 'customer' | 'admin';
  address?: Address;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}
