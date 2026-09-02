import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Sign In / Account Access',
  robots: { index: false, follow: false, noarchive: true },
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
