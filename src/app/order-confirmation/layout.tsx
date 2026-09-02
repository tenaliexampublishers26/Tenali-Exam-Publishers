import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Order Confirmation',
  robots: { index: false, follow: false, noarchive: true },
};

export default function OrderConfirmationLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
