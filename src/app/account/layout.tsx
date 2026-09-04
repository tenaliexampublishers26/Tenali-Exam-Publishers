'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';
import s from './profile.module.css';

export default function AccountLayout({ children }: { children: ReactNode }): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className={s.authGate}>
        <div className={s.authGateCard}>
          <div className={s.authGateIcon}>
            <Lock size={36} strokeWidth={1.75} />
          </div>
          <h1 className={s.authGateTitle}>Please Sign In</h1>
          <p className={s.authGateSub}>
            Sign in to your Tenali Exams account to view orders, address book, and saved study materials.
          </p>
          <Link
            href="/login"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', borderRadius: '14px', fontWeight: 700 }}
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.pageWrap}>
      <div className="container px-4 md:px-6">
        <main style={{ minWidth: 0, maxWidth: "860px", margin: "0 auto" }} aria-label="Account content">
          {children}
        </main>
      </div>
    </div>
  );
}
