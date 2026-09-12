'use client';
import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/contexts/ToastContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SearchOverlay from '@/components/ui/SearchOverlay';
import FloatingSupport from '@/components/ui/FloatingSupport';
import SplashScreen from '@/components/ui/SplashScreen';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function MaintenanceGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [maintenanceActive, setMaintenanceActive] = useState(false);

  const isAdminOrAuth = pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/api') || pathname.startsWith('/demo');
  const isMaintenancePage = pathname === '/maintenance';

  useEffect(() => {
    // Fast initial check: inspect cookie
    if (typeof document !== 'undefined') {
      const cookies = document.cookie;
      if (cookies.includes('tep_maintenance=true')) {
        setMaintenanceActive(true);
      } else if (cookies.includes('tep_maintenance=false')) {
        setMaintenanceActive(false);
      }
    }

    // Always fetch latest status from DB
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/settings/maintenance');
        if (res.ok) {
          const data = await res.json();
          setMaintenanceActive(Boolean(data.maintenanceMode));
        }
      } catch {
        // Safe fallback
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 15_000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Handle redirects
  useEffect(() => {
    // Logged-in admin can browse anywhere
    if (user?.role === 'admin') return;

    if (maintenanceActive) {
      if (!isAdminOrAuth && !isMaintenancePage) {
        router.replace('/maintenance');
      }
    } else if (isMaintenancePage) {
      router.replace('/');
    }
  }, [maintenanceActive, pathname, user, isAdminOrAuth, isMaintenancePage, router]);

  // If maintenance is active and user is not admin, prevent public store from displaying
  if (maintenanceActive && !isAdminOrAuth && !isMaintenancePage && user?.role !== 'admin') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 dark:bg-[#1a1b1e] p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-[#25262b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center">
          <div className="mb-6 relative w-24 h-24 sm:w-32 sm:h-32 drop-shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.png" alt="Tenali Exam Publisher" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
            Maintenance Mode
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed font-medium">
            Currently the application is on maintenance mode please try again later
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isAdminOrDemo = pathname.startsWith('/admin') || pathname.startsWith('/demo') || pathname.startsWith('/login');
  const isCheckout = pathname.startsWith('/checkout');
  const isCart = pathname.startsWith('/cart');
  const isStudyMaterials = pathname.startsWith('/study-materials');
  const isOrderConfirmation = pathname.startsWith('/order-confirmation');
  const isMaintenance = pathname.startsWith('/maintenance');
  
  const hideNavbarAndFooter = isAdminOrDemo || isCheckout || isCart || isStudyMaterials || isOrderConfirmation || isMaintenance;

  const isHome = pathname === '/';
  const isPrivacyPolicy = pathname.startsWith('/privacy-policy');
  const isTerms = pathname.startsWith('/terms');
  const showFooter = isHome || isPrivacyPolicy || isTerms;

  return (
    <AuthProvider>
      <MaintenanceGuard>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <SplashScreen />
              {!hideNavbarAndFooter && <Navbar onSearchOpen={() => setSearchOpen(true)} />}
              {!hideNavbarAndFooter && <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
              <main style={isAdminOrDemo ? {} : { minHeight: 'calc(100dvh - var(--navbar-height))' }}>
                {children}
              </main>
              {showFooter && <Footer />}
              {!hideNavbarAndFooter && <FloatingSupport />}
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </MaintenanceGuard>
    </AuthProvider>
  );
}
