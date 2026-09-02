'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Switch } from '@/components/ui/switch-button';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  User, 
  Users, 
  LogOut, 
  ShieldAlert, 
  ChevronsRight, 
  ChevronDown,
  Sun,
  Moon,
  Home,
  ShieldCheck,
  Menu,
  X,
  Settings,
} from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const MENU: MenuItem[] = [
  { href: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
  { href: '/admin/products', label: 'Products', icon: <Package size={18} /> },
  { href: '/admin/profile', label: 'Profile', icon: <User size={18} /> },
  { href: '/admin/users', label: 'Users', icon: <Users size={18} /> },
  { href: '/admin/settings', label: 'Settings', icon: <Settings size={18} /> },
];

export default function AdminLayout({ children }: { children: ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [isDark]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && mounted) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin');
      } else if (user?.role !== 'admin') {
        router.push('/account');
      }
    }
  }, [isAuthenticated, isLoading, user, router, mounted]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-(--color-bg-page) text-(--color-text-muted)">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Loading Admin Panel...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-(--color-bg-page) p-6 text-center">
        <div className="inline-flex p-6 bg-(--color-error-bg) rounded-full mb-6 text-(--color-error) animate-bounce">
          <ShieldAlert size={48} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-black text-(--color-text-primary) mb-2">Access Denied</h1>
        <p className="text-(--color-text-secondary) mb-6 max-w-sm text-sm leading-relaxed">
          You do not have administrative permissions to access the control panel.
        </p>
        <Link href="/" className="px-6 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105">
          Return to Home
        </Link>
      </div>
    );
  }

  const firstLetter = user.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <div className={`flex h-screen h-dvh max-h-dvh w-full overflow-hidden ${isDark ? 'dark' : ''}`}>
      <div className="flex w-full h-full overflow-hidden bg-(--color-bg-page) text-(--color-text-primary)">
        
        {/* Mobile Sidebar Backdrop Overlay */}
        {mobileOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-all duration-300"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Locked Admin Sidebar */}
        <aside
          className={`fixed md:relative top-0 left-0 h-full max-h-dvh shrink-0 border-r transition-all duration-300 ease-in-out z-40 border-(--color-border) bg-(--color-bg-card) p-3 shadow-sm flex flex-col overscroll-contain select-none ${
            mobileOpen ? 'w-64 translate-x-0' : (open ? 'w-64' : 'w-20')
          } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          {/* Logo & Profile section */}
          <div className="mb-6 border-b border-(--color-border) pb-4 shrink-0">
            <div className="flex items-center justify-between rounded-2xl p-2 hover:bg-(--color-bg-hover) transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-10 shrink-0 place-content-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white">
                  <span className="font-extrabold text-lg">{firstLetter}</span>
                </div>
                {(open || mobileOpen) && (
                  <div className="transition-opacity duration-200 opacity-100 min-w-0">
                    <span className="block text-sm font-bold text-(--color-text-primary) truncate max-w-30">
                      {user.name}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-(--color-success) font-bold uppercase tracking-wider mt-0.5">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  </div>
                )}
              </div>

              {/* Mobile Close Button inside sidebar header */}
              {mobileOpen && (
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="p-1.5 rounded-lg hover:bg-(--color-bg-hover) text-(--color-text-secondary) md:hidden"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Options (Independent scroll if needed, with scroll lock to prevent parent page movement) */}
          <div className="space-y-1.5 flex-1 overflow-y-auto overscroll-contain pr-0.5">
            {MENU.map(item => {
              const isSelected = pathname === item.href;
              const isOpenState = open || mobileOpen;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`relative flex h-11 w-full items-center rounded-xl transition-all duration-200 ${
                    isSelected 
                      ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 font-bold" 
                      : "text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)"
                  }`}
                >
                  <div className={`grid h-full w-14 place-content-center shrink-0 ${isSelected ? 'text-white' : 'text-(--color-text-secondary)'}`}>
                    {item.icon}
                  </div>
                  {isOpenState && (
                    <span className="text-sm font-semibold transition-opacity duration-200 opacity-100 truncate">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Footer Controls (Theme & Logout) */}
          <div className="border-t border-(--color-border) pt-4 space-y-1.5 mb-12 shrink-0">
            
            {/* Store Front Link */}
            <Link
              href="/"
              className="flex h-11 w-full items-center rounded-xl text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) transition-colors"
            >
              <div className="grid h-full w-14 place-content-center shrink-0 text-(--color-text-secondary)">
                <Home size={18} />
              </div>
              {(open || mobileOpen) && (
                <span className="text-sm font-semibold truncate">
                  Main Store
                </span>
              )}
            </Link>

            {/* Logout Option */}
            <button
              onClick={logout}
              className="flex h-11 w-full items-center rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 transition-colors"
            >
              <div className="grid h-full w-14 place-content-center shrink-0 text-rose-500">
                <LogOut size={18} />
              </div>
              {(open || mobileOpen) && <span className="text-sm font-bold truncate">Logout</span>}
            </button>
          </div>

          {/* Toggle Close Button (Hidden on Mobile) */}
          <button
            onClick={() => setOpen(!open)}
            className="absolute bottom-0 left-0 right-0 border-t border-(--color-border) hover:bg-(--color-bg-hover) transition-colors bg-(--color-bg-card) text-(--color-text-muted) hidden md:block"
          >
            <div className="flex items-center p-3.5">
              <div className="grid size-10 place-content-center">
                <ChevronsRight
                  className={`h-4 w-4 transition-transform duration-300 text-(--color-text-muted) ${
                    open ? "rotate-180" : ""
                  }`}
                />
              </div>
              {open && (
                <span className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">
                  Collapse Menu
                </span>
              )}
            </div>
          </button>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-(--color-bg-page) text-(--color-text-primary)">
          
          {/* Top Admin Navbar */}
          <header className="h-16 border-b border-(--color-border) bg-(--color-bg-card) px-4 md:px-8 flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex size-11 items-center justify-center -ml-3 text-(--color-text-secondary) hover:text-(--color-text-primary) md:hidden rounded-lg hover:bg-(--color-bg-hover)"
                aria-label="Toggle Sidebar Menu"
              >
                <Menu size={22} />
              </button>

              <h1 className="text-lg font-medium tracking-tight text-(--color-text-primary) mr-2 hidden md:block truncate">
                {pathname === '/admin' ? 'TENALI EXAMS PUBLISHERS' : 
                 pathname.startsWith('/admin/orders') ? 'Orders Management' :
                 pathname.startsWith('/admin/products') ? 'Products Management' :
                 pathname.startsWith('/admin/profile') ? 'Admin Profile' :
                 pathname.startsWith('/admin/users') ? 'Users Management' :
                 pathname.startsWith('/admin/settings') ? 'System Settings' : 'Admin Panel'}
              </h1>

              <div className="h-4 w-px bg-(--color-border) hidden md:block mr-2 shrink-0" />

              <span className="text-xs font-extrabold uppercase tracking-wider text-(--color-text-muted) hidden sm:inline-block shrink-0">
                System Status:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold text-(--color-success) bg-(--color-success-bg) rounded-full shrink-0">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <Sun size={14} className={isDark ? "text-slate-400" : "text-amber-500"} />
                <Switch
                  value={isDark}
                  onToggle={() => setIsDark(!isDark)}
                  iconOn={<Moon className="size-3.5 text-blue-500" />}
                  iconOff={<Sun className="size-3.5 text-amber-500" />}
                />
                <Moon size={14} className={isDark ? "text-blue-500" : "text-slate-400"} />
              </div>
            </div>
          </header>

          {/* Scrollable Main Content Container */}
          <main className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-8 bg-(--color-bg-page) text-(--color-text-primary)">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>

        </div>

      </div>
    </div>
  );
}
