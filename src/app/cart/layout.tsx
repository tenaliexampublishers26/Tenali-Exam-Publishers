import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  robots: { index: false, follow: false, noarchive: true },
};

export default function CartLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
