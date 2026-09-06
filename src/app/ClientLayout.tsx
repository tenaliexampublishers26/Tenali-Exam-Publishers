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

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isAdminOrDemo = pathname.startsWith('/admin') || pathname.startsWith('/demo') || pathname.startsWith('/login');
  const isAccount = pathname.startsWith('/account');
  const isCheckout = pathname.startsWith('/checkout');
  const isCart = pathname.startsWith('/cart');
  const isStudyMaterials = pathname.startsWith('/study-materials');
  const isOrderConfirmation = pathname.startsWith('/order-confirmation');
  const isMaintenance = pathname.startsWith('/maintenance');
  
  const hideNavbarAndFooter = isAdminOrDemo || isCheckout || isCart || isStudyMaterials || isOrderConfirmation || isMaintenance;

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ToastProvider>
            <SplashScreen />
            {!hideNavbarAndFooter && <Navbar onSearchOpen={() => setSearchOpen(true)} />}
            {!hideNavbarAndFooter && <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
            <main style={isAdminOrDemo ? {} : { minHeight: 'calc(100dvh - var(--navbar-height))' }}>
              {children}
            </main>
            {!hideNavbarAndFooter && !isAccount && <Footer />}
            {!hideNavbarAndFooter && <FloatingSupport />}
          </ToastProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
