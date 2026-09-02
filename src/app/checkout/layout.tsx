import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  robots: { index: false, follow: false, noarchive: true },
};

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
