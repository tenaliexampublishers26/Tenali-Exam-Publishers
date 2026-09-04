'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react';
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

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'TENALI EXAMS PUBLISHERS',
  '/admin/orders': 'Orders Management',
  '/admin/products': 'Products Management',
  '/admin/profile': 'Admin Profile',
  '/admin/users': 'Users Management',
  '/admin/settings': 'System Settings',
};

// Critically damped default -- graceful, no bounce (skill section on motion)
const SPRING_UI = { type: 'spring' as const, bounce: 0, duration: 0.4 };
// Slight bounce reserved for the drag-to-dismiss drawer, which carries real gesture momentum
const SPRING_MOMENTUM = { type: 'spring' as const, bounce: 0.22, duration: 0.35 };

function resolveTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  const match = Object.keys(PAGE_TITLES).find((p) => p !== '/admin' && pathname.startsWith(p));
  return match ? PAGE_TITLES[match] : 'Admin Panel';
}

export default function AdminLayout({ children }: { children: ReactNode }): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Drag position for the mobile drawer -- drives 1:1 tracking + rubber-band + fling-to-dismiss
  const dragX = useMotionValue(0);

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

  /** Nav item, shared between desktop rail and mobile drawer. */
  function NavItem({ item, isOpenState, indicatorId }: { item: MenuItem; isOpenState: boolean; indicatorId: string }) {
    const isSelected = pathname === item.href;
    return (
      <Link
        href={item.href}
        prefetch={true}
        className="relative flex h-11 w-full items-center rounded-xl outline-none"
      >
        {isSelected && (
          <motion.div
            layoutId={indicatorId}
            transition={SPRING_UI}
            className="absolute inset-0 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25"
          />
        )}
        <motion.div
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
          className={`relative z-10 flex h-full w-full items-center rounded-xl ${
            isSelected ? 'text-white font-bold' : 'text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary)'
          }`}
        >
          <div className="grid h-full w-14 place-content-center shrink-0">
            {item.icon}
          </div>
          {isOpenState && (
            <span className="text-sm font-semibold truncate">
              {item.label}
            </span>
          )}
        </motion.div>
      </Link>
    );
  }

  return (
    <div className={`flex h-screen h-dvh max-h-dvh w-full overflow-hidden ${isDark ? 'dark' : ''}`}>
      <div className="flex w-full h-full overflow-hidden bg-(--color-bg-page) text-(--color-text-primary)">

        {/* Mobile Sidebar Backdrop Overlay -- dims to focus */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Desktop Sidebar -- spring width collapse, translucent material */}
        <motion.aside
          animate={{ width: open ? 256 : 80 }}
          transition={SPRING_UI}
          className="hidden md:flex relative shrink-0 h-full max-h-dvh border-r admin-sidebar-glass p-3 shadow-sm flex-col overscroll-contain select-none z-40"
        >
          <SidebarContent
            isOpenState={open}
            firstLetter={firstLetter}
            userName={user.name}
            logout={logout}
            indicatorId="admin-nav-indicator-desktop"
            NavItem={NavItem}
          />

          {/* Collapse toggle -- instant feedback on press */}
          <motion.button
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 border-t border-(--color-border) hover:bg-(--color-bg-hover) transition-colors bg-transparent text-(--color-text-muted)"
          >
            <div className="flex items-center p-3.5">
              <div className="grid size-10 place-content-center">
                <motion.span
                  animate={{ rotate: open ? 180 : 0 }}
                  transition={SPRING_UI}
                  className="flex"
                >
                  <ChevronsRight className="h-4 w-4 text-(--color-text-muted)" />
                </motion.span>
              </div>
              {open && (
                <span className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">
                  Collapse Menu
                </span>
              )}
            </div>
          </motion.button>
        </motion.aside>

        {/* Mobile Drawer -- draggable, 1:1 tracking, rubber-band + velocity-projected dismiss */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={SPRING_MOMENTUM}
              style={{ x: dragX }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.5, right: 0 }}
              onDragEnd={(_, info) => {
                // Project where the flick is going; dismiss if the gesture is
                // heading left with any real intent, else settle back.
                const projected = info.offset.x + info.velocity.x * 0.15;
                if (projected < -80) {
                  setMobileOpen(false);
                } else {
                  animate(dragX, 0, SPRING_MOMENTUM);
                }
              }}
              className="fixed md:hidden top-0 left-0 h-full max-h-dvh w-64 admin-sidebar-glass border-r p-3 shadow-2xl flex flex-col overscroll-contain select-none z-50"
            >
              <SidebarContent
                isOpenState={true}
                firstLetter={firstLetter}
                userName={user.name}
                logout={logout}
                indicatorId="admin-nav-indicator-mobile"
                NavItem={NavItem}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden bg-(--color-bg-page) text-(--color-text-primary)">

          {/* Top Admin Navbar -- translucent, scroll-edge shadow instead of hard divider */}
          <header
            className={`relative h-16 admin-glass border-b px-4 md:px-8 flex items-center justify-between shrink-0 z-30 transition-shadow duration-300 ${
              scrolled ? 'shadow-sm' : ''
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger menu toggle -- instant press feedback */}
              <motion.button
                onClick={() => setMobileOpen(!mobileOpen)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
                className="flex size-11 items-center justify-center -ml-3 text-(--color-text-secondary) hover:text-(--color-text-primary) md:hidden rounded-lg hover:bg-(--color-bg-hover)"
                aria-label="Toggle Sidebar Menu"
              >
                <Menu size={22} />
              </motion.button>

              <h1 className="text-lg font-bold tracking-tight text-(--color-text-primary) mr-2 hidden md:block truncate">
                {resolveTitle(pathname)}
              </h1>

              <div className="h-4 w-px bg-(--color-border) hidden md:block mr-2 shrink-0" />

              <span className="text-xs font-extrabold uppercase tracking-wider text-(--color-text-muted) hidden sm:inline-block shrink-0">
                System Status:
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold text-(--color-success) bg-(--color-success-bg) rounded-full shrink-0">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
                </span>
                Operational
              </span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <Sun size={14} className={isDark ? 'text-slate-400' : 'text-amber-500'} />
                <Switch
                  value={isDark}
                  onToggle={() => setIsDark(!isDark)}
                  iconOn={<Moon className="size-3.5 text-blue-500" />}
                  iconOff={<Sun className="size-3.5 text-amber-500" />}
                />
                <Moon size={14} className={isDark ? 'text-blue-500' : 'text-slate-400'} />
              </div>
            </div>
          </header>

          {/* Scrollable Main Content Container */}
          <main
            className="flex-1 overflow-y-auto overscroll-contain p-4 md:p-8 bg-(--color-bg-page) text-(--color-text-primary)"
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 4)}
          >
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={SPRING_UI}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

        </div>

      </div>
    </div>
  );
}

function SidebarContent({
  isOpenState,
  firstLetter,
  userName,
  logout,
  indicatorId,
  NavItem,
  onClose,
}: {
  isOpenState: boolean;
  firstLetter: string;
  userName: string;
  logout: () => void;
  indicatorId: string;
  NavItem: (props: { item: MenuItem; isOpenState: boolean; indicatorId: string }) => React.JSX.Element;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Logo & Profile section */}
      <div className="mb-6 border-b border-(--color-border) pb-4 shrink-0">
        <div className="flex items-center justify-between rounded-2xl p-2 hover:bg-(--color-bg-hover) transition-colors duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid size-10 shrink-0 place-content-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 text-white">
              <span className="font-extrabold text-lg">{firstLetter}</span>
            </div>
            {isOpenState && (
              <div className="min-w-0">
                <span className="block text-sm font-bold text-(--color-text-primary) truncate max-w-30">
                  {userName}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-(--color-success) font-bold uppercase tracking-wider mt-0.5">
                  <ShieldCheck size={10} /> Admin
                </span>
              </div>
            )}
          </div>

          {onClose && (
            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
              className="p-1.5 rounded-lg hover:bg-(--color-bg-hover) text-(--color-text-secondary) md:hidden"
            >
              <X size={18} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-1.5 flex-1 overflow-y-auto overscroll-contain pr-0.5">
        {MENU.map((item) => (
          <NavItem key={item.href} item={item} isOpenState={isOpenState} indicatorId={indicatorId} />
        ))}
      </div>

      {/* Footer Controls (Home & Logout) */}
      <div className="border-t border-(--color-border) pt-4 space-y-1.5 mb-12 shrink-0">
        <Link
          href="/"
          className="flex h-11 w-full items-center rounded-xl text-(--color-text-secondary) hover:bg-(--color-bg-hover) hover:text-(--color-text-primary) transition-colors duration-200"
        >
          <div className="grid h-full w-14 place-content-center shrink-0 text-(--color-text-secondary)">
            <Home size={18} />
          </div>
          {isOpenState && <span className="text-sm font-semibold truncate">Main Store</span>}
        </Link>

        <motion.button
          onClick={logout}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.15 }}
          className="flex h-11 w-full items-center rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-500 transition-colors duration-200"
        >
          <div className="grid h-full w-14 place-content-center shrink-0 text-rose-500">
            <LogOut size={18} />
          </div>
          {isOpenState && <span className="text-sm font-bold truncate">Logout</span>}
        </motion.button>
      </div>
    </>
  );
}
