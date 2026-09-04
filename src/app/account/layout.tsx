'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, Package, Heart, MapPin, LogOut, Lock, ChevronRight } from 'lucide-react';
import s from './profile.module.css';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const MENU: MenuItem[] = [
  { href: '/account', label: 'Dashboard', icon: <User size={18} /> },
  { href: '/account/orders', label: 'My Orders', icon: <Package size={18} /> },
  { href: '/account/wishlist', label: 'Wishlist', icon: <Heart size={18} /> },
  { href: '/account/addresses', label: 'Addresses', icon: <MapPin size={18} /> },
];

export default function AccountLayout({ children }: { children: ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

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

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={s.pageWrap}>
      <div className="container px-4 md:px-6">



        {/* ── Desktop Grid ────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '24px',
            alignItems: 'start',
          }}
          className="md:grid-cols-[260px_1fr]"
        >

          {/* Desktop Sidebar */}
          <aside className={`${s.sidebar} ${s.desktopOnly}`} aria-label="Account sidebar">
            {/* User Header */}
            <div className={s.sidebarUser}>
              <div className={s.sidebarAvatar}>{firstLetter}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={s.sidebarName}>{user?.name || 'User'}</div>
                <div className={s.sidebarEmail}>
                  {user?.email || user?.phone || 'Customer Account'}
                </div>
              </div>
            </div>

            <div className={s.sidebarDivider} />

            {/* Nav Links */}
            <nav className={s.sidebarMenu}>
              {MENU.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={`${s.sidebarLink} ${isActive ? s.sidebarLinkActive : ''}`}
                  >
                    <div className={s.sidebarLinkLeft}>
                      <span className={s.sidebarLinkIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={15} />}
                  </Link>
                );
              })}
            </nav>

            <div className={s.sidebarDivider} style={{ margin: '14px 0' }} />

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className={s.sidebarLogout}
              aria-label="Sign out of your account"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </aside>

          {/* Main Content */}
          <main style={{ minWidth: 0 }} aria-label="Account content">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
