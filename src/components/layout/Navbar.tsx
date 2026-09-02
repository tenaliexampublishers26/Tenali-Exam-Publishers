'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { ShoppingBag, Heart, Menu, X, ChevronDown, User, LogOut, Package, Shield } from 'lucide-react';
import styles from './Navbar.module.css';

interface NavLinkItem {
  href: string;
  targetId?: string;
  label: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/', targetId: 'top', label: 'Home' },
  { href: '/#books', targetId: 'books', label: 'Books' },
  { href: '/about', label: 'About Us' },
  { href: '/#contact', targetId: 'contact', label: 'Contact' },
];

interface NavbarProps {
  onSearchOpen?: () => void;
}

export default function Navbar({ onSearchOpen }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems ? wishlistItems.length : 0;
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userDropdownOpen]);

  const handleNavClick = (e: React.MouseEvent, link: NavLinkItem) => {
    setMobileMenuOpen(false);
    if (link.targetId) {
      if (pathname === '/') {
        e.preventDefault();
        if (link.targetId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const element = document.getElementById(link.targetId);
        if (element) {
          const yOffset = -90; // Navbar height offset
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    }
  };

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <nav className={styles.navbar} role="navigation" aria-label="Main navigation">
      <div className={styles.navInner}>
        {/* Left Side: Logo */}
        <Link href="/" className={styles.logo} aria-label="Tenali Exams Publishers Home" onClick={() => setMobileMenuOpen(false)}>
          <img src="/images/logo.png" alt="" className={styles.logoImg} width={42} height={42} />
          <div className={styles.logoTextWrap}>
            <div className={styles.logoText}>TENALI EXAMS PUBLISHERS</div>
            <div className={styles.logoSub}>Excellence in Every Page</div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className={styles.desktopNav}>
          <div className={styles.navLinks}>
            {NAV_LINKS.map(link => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link)}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className={styles.divider}></div>

          {/* Persistent Wishlist Icon with Badge */}
          <Link href="/wishlist" className={styles.wishlistNavBtn} aria-label={`Wishlist with ${wishlistCount} items`}>
            <Heart
              size={20}
              color={wishlistCount > 0 ? 'var(--color-primary)' : 'currentColor'}
              fill={wishlistCount > 0 ? 'var(--color-primary)' : 'none'}
              strokeWidth={2}
              className={styles.wishlistSvg}
            />
            {wishlistCount > 0 && <span className={styles.wishlistBadge}>{wishlistCount}</span>}
          </Link>

          {/* Persistent Modern Shopping Bag Cart Icon with Badge */}
          <Link href="/cart" className={styles.cartBtn} aria-label={`Shopping Cart with ${totalItems} items`}>
            <ShoppingBag size={21} strokeWidth={2} className={styles.cartSvg} />
            <span className={styles.cartBadge}>{totalItems}</span>
          </Link>

          {/* Admin Shield Logo Link if Admin */}
          {isAuthenticated && user?.role === 'admin' && (
            <Link href="/admin" className={styles.adminNavBtn} aria-label="Admin Panel" title="Admin Panel">
              <Shield size={20} strokeWidth={2} />
            </Link>
          )}

          {/* User Authentication & Profile Menu */}
          {isAuthenticated && user ? (
            <div className={styles.userMenuContainer} ref={userMenuRef}>
              <button
                className={styles.userProfileBtn}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
              >
                <div className={styles.userAvatar}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className={styles.userNameText}>{user.name || 'My Account'}</span>
                <ChevronDown size={14} className={`${styles.dropdownChevron} ${userDropdownOpen ? styles.rotated : ''}`} />
              </button>

              {userDropdownOpen && (
                <div className={styles.userDropdownMenu}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownUserName}>{user.name}</div>
                    {user.email && <div className={styles.dropdownUserEmail}>{user.email}</div>}
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <Link href="/account" className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                    <User size={16} />
                    <span>My Account</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                      <Shield size={16} />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <Link href="/account/orders" className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                    <Package size={16} />
                    <span>Order History</span>
                  </Link>
                  <Link href="/wishlist" className={styles.dropdownItem} onClick={() => setUserDropdownOpen(false)}>
                    <Heart size={16} />
                    <span>Wishlist</span>
                  </Link>
                  <div className={styles.dropdownDivider}></div>
                  <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutItem}`}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className={styles.loginBtn}>
              <span className={styles.userIconWrap}>
                <User size={16} />
                <span className={styles.liveBeacon} />
              </span>
              <span>Login / Sign Up</span>
            </Link>
          )}
        </div>

        {/* Mobile Right Controls: Cart + Hamburger */}
        <div className={styles.mobileRightControls}>
          <Link href="/cart" className={styles.mobileCartBtn} aria-label={`Shopping Cart with ${totalItems} items`}>
            <ShoppingBag size={22} strokeWidth={2} />
            <span className={styles.cartBadge}>{totalItems}</span>
          </Link>

          <button
            className={styles.hamburgerBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      {mobileMenuOpen && (
        <div className={styles.mobileDrawer}>
          <div className={styles.mobileLinks}>
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link)}
                className={`${styles.mobileNavLink} ${pathname === link.href ? styles.mobileActive : ''}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Wishlist in Mobile Sidebar */}
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className={`${styles.mobileNavLink} ${pathname === '/wishlist' ? styles.mobileActive : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Heart size={18} color={wishlistCount > 0 ? 'var(--color-primary)' : 'currentColor'} fill={wishlistCount > 0 ? 'var(--color-primary)' : 'none'} />
                My Wishlist
              </span>
              {wishlistCount > 0 && (
                <span style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            <div className={styles.mobileDivider}></div>

            {isAuthenticated && user ? (
              <>
                <div className={styles.mobileUserInfo}>
                  <div className={styles.userAvatar}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className={styles.mobileUserName}>{user.name}</div>
                    <div className={styles.mobileUserEmail}>{user.email || ''}</div>
                  </div>
                </div>
                <Link href="/account" onClick={() => setMobileMenuOpen(false)} className={styles.mobileNavLink}>
                  My Account
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className={styles.mobileNavLink} style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    Admin Panel
                  </Link>
                )}
                <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)} className={styles.mobileNavLink}>
                  My Orders
                </Link>
                <Link href="/account/wishlist" onClick={() => setMobileMenuOpen(false)} className={styles.mobileNavLink}>
                  Wishlist
                </Link>
                <Link href="/account/addresses" onClick={() => setMobileMenuOpen(false)} className={styles.mobileNavLink}>
                  Addresses
                </Link>
                <button onClick={handleLogout} className={styles.mobileLogoutBtn}>
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={styles.mobileLoginBtn}
              >
                <span className={styles.userIconWrap}>
                  <User size={16} />
                  <span className={styles.liveBeacon} />
                </span>
                <span>Login / Sign Up</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
