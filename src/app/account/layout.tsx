'use client';
import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import { User, Package, Heart, MapPin, LogOut, Lock, ChevronRight } from 'lucide-react';

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
      <div style={{ minHeight: 'calc(100vh - 140px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px', width: '100%', padding: '40px 28px', borderRadius: '28px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(226, 232, 240, 0.8)', boxShadow: '0 20px 48px -12px rgba(15, 23, 42, 0.08)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Lock size={36} strokeWidth={2} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px', color: '#0f172a' }}>Please Sign In</h1>
          <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '0.95rem', lineHeight: 1.5 }}>Sign in to your Tenali Exams account to view orders, address book, and saved study materials.</p>
          <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', borderRadius: '12px', fontWeight: 700 }}>
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div style={{ paddingBottom: '80px', paddingTop: '20px' }}>
      <div className="container px-4 md:px-6">
        
        {/* Mobile & Tablet Tab Navigation Bar */}
        <div className="md:hidden mb-6 overflow-x-auto no-scrollbar flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          {MENU.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 items-start">
          
          {/* Desktop Sidebar */}
          <div className="hidden md:block card md:sticky" style={{ 
            padding: '24px 18px', 
            top: 'calc(var(--navbar-height) + 24px)',
            borderRadius: '24px',
            border: '1px solid var(--color-border-light)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
          }}>
            {/* Sidebar User Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '14px', 
              padding: '4px 8px 18px 8px',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.2rem',
                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.25)',
                flexShrink: 0,
              }}>
                {firstLetter}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 750, fontSize: '0.98rem', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'User'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {user?.email || user?.phone || 'Customer Account'}
                </div>
              </div>
            </div>

            <hr className="divider" style={{ margin: '0 0 16px 0', borderTop: '1px solid var(--color-border-light)' }} />
            
            {/* Sidebar Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {MENU.map(item => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '12px 16px', 
                      borderRadius: '14px',
                      fontSize: '0.925rem', 
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : 'var(--color-text-secondary)',
                      background: isActive 
                        ? 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' 
                        : 'transparent',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? '0 6px 16px rgba(37, 99, 235, 0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--color-bg-page)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.75 }}>
                        {item.icon}
                      </span> 
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight size={16} />}
                  </Link>
                );
              })}
            </div>

            <hr className="divider" style={{ margin: '18px 0 14px 0', borderTop: '1px solid var(--color-border-light)' }} />
            
            {/* Logout Button */}
            <button
              onClick={logout}
              style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                padding: '12px 16px', 
                borderRadius: '14px',
                fontSize: '0.925rem', 
                fontWeight: 650, 
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.06)', 
                border: 'none', 
                cursor: 'pointer',
                width: '100%', 
                textAlign: 'left', 
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
              }}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          {/* Main View Area */}
          <div style={{ minWidth: 0 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
