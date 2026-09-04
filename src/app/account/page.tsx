'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import {
  Package,
  Heart,
  MapPin,
  Truck,
  ChevronRight,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Edit2,
  Save,
  Loader2,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  X as XIcon,
} from 'lucide-react';
import { fetchWithCache, getCachedData } from '@/lib/api-cache';
import s from './profile.module.css';

export default function AccountPage(): React.JSX.Element {
  const { user, login } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const toast = useToast();

  const cachedOrders = user?.id
    ? getCachedData<{ orders: any[] }>(`/api/user/orders?userId=${user.id}`)
    : null;
  const cachedAddresses = user?.id
    ? getCachedData<{ addresses: any[] }>(`/api/user/addresses?userId=${user.id}`)
    : null;

  const [ordersCount, setOrdersCount] = useState<number>(
    cachedOrders?.orders?.length || 0
  );
  const [addressesCount, setAddressesCount] = useState<number>(
    cachedAddresses?.addresses?.length || 0
  );
  const [loadingStats, setLoadingStats] = useState<boolean>(
    !cachedOrders || !cachedAddresses
  );

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        login({ ...user, name: editName, phone: editPhone });
        setIsEditingProfile(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const fetchStats = async () => {
      try {
        const [ordersData, addressesData] = await Promise.all([
          fetchWithCache<{ orders: any[] }>(`/api/user/orders?userId=${user.id}`, {
            ttl: 20000,
          }),
          fetchWithCache<{ addresses: any[] }>(
            `/api/user/addresses?userId=${user.id}`,
            { ttl: 20000 }
          ),
        ]);
        if (ordersData?.orders) setOrdersCount(ordersData.orders.length);
        if (addressesData?.addresses) setAddressesCount(addressesData.addresses.length);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const quickActions = [
    {
      href: '/account/orders',
      icon: <Package size={18} />,
      iconBg: 'rgba(59,130,246,0.12)',
      iconColor: '#2563eb',
      title: 'My Orders',
      sub: 'View history, tracking & order details',
    },
    {
      href: '/account/wishlist',
      icon: <Heart size={18} />,
      iconBg: 'rgba(236,72,153,0.12)',
      iconColor: '#db2777',
      title: 'Saved Wishlist',
      sub: 'Check saved study materials and books',
    },
    {
      href: '/account/addresses',
      icon: <MapPin size={18} />,
      iconBg: 'rgba(16,185,129,0.12)',
      iconColor: '#059669',
      title: 'Shipping Addresses',
      sub: 'Manage delivery addresses for checkout',
    },
    {
      href: '/track-order',
      icon: <Truck size={18} />,
      iconBg: 'rgba(139,92,246,0.12)',
      iconColor: '#7c3aed',
      title: 'Track Active Shipment',
      sub: 'Get live postal delivery status updates',
    },
  ];

  return (
    <div className={s.contentArea}>

      {/* ── Hero Welcome Banner ────────────────────────────── */}
      <div className={s.heroBanner}>
        <div className={s.heroBannerInner}>
          {/* Avatar */}
          <div className={s.avatarWrap}>
            <div className={s.avatar}>{firstLetter}</div>
            <div className={s.avatarVerified}>
              <CheckCircle2 size={11} strokeWidth={3} />
            </div>
          </div>

          {/* Text */}
          <div className={s.heroText}>
            <div className={s.heroBadge}>
              <Shield size={10} />
              {user?.role || 'Customer'}
            </div>
            <h1 className={s.heroName}>
              Welcome back, {user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className={s.heroSub}>
              {user?.email || user?.phone || 'Manage your Tenali Exams account'}
            </p>
          </div>
        </div>

        {/* Stats Strip inside banner */}
        <div className={s.statsStrip}>
          <Link href="/account/orders" className={s.statItem}>
            <div className={s.statValue}>
              {loadingStats ? (
                <Loader2 size={18} className={s.spinner} />
              ) : (
                ordersCount
              )}
            </div>
            <div className={s.statLabel}>Orders</div>
          </Link>
          <Link href="/account/wishlist" className={s.statItem}>
            <div className={s.statValue}>{wishlistItems.length}</div>
            <div className={s.statLabel}>Wishlist</div>
          </Link>
          <Link href="/account/addresses" className={s.statItem}>
            <div className={s.statValue}>
              {loadingStats ? (
                <Loader2 size={18} className={s.spinner} />
              ) : (
                addressesCount
              )}
            </div>
            <div className={s.statLabel}>Addresses</div>
          </Link>
        </div>
      </div>

      {/* ── Stat Cards Row ─────────────────────────────────── */}
      <div className={s.statsIconRow}>
        {/* Orders */}
        <Link href="/account/orders" className={s.statCard}>
          <div className={s.statCardTop}>
            <div
              className={s.statCardIcon}
              style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb' }}
            >
              <Package size={18} />
            </div>
            <ArrowUpRight size={15} className={s.statCardArrow} style={{ color: '#2563eb' }} />
          </div>
          <div className={s.statCardValue}>
            {loadingStats ? <Loader2 size={20} className={s.spinner} style={{ color: '#94a3b8' }} /> : ordersCount}
          </div>
          <div className={s.statCardLabel}>Total Orders</div>
        </Link>

        {/* Wishlist */}
        <Link href="/account/wishlist" className={s.statCard}>
          <div className={s.statCardTop}>
            <div
              className={s.statCardIcon}
              style={{ background: 'rgba(236,72,153,0.1)', color: '#db2777' }}
            >
              <Heart size={18} />
            </div>
            <ArrowUpRight size={15} className={s.statCardArrow} style={{ color: '#db2777' }} />
          </div>
          <div className={s.statCardValue}>{wishlistItems.length}</div>
          <div className={s.statCardLabel}>Wishlist Items</div>
        </Link>

        {/* Addresses */}
        <Link href="/account/addresses" className={s.statCard}>
          <div className={s.statCardTop}>
            <div
              className={s.statCardIcon}
              style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}
            >
              <MapPin size={18} />
            </div>
            <ArrowUpRight size={15} className={s.statCardArrow} style={{ color: '#059669' }} />
          </div>
          <div className={s.statCardValue}>
            {loadingStats ? <Loader2 size={20} className={s.spinner} style={{ color: '#94a3b8' }} /> : addressesCount}
          </div>
          <div className={s.statCardLabel}>Saved Addresses</div>
        </Link>
      </div>

      {/* ── Two-Column: Profile Details + Quick Actions ──── */}
      <div className={s.twoCol}>

        {/* Profile Details */}
        <div className={s.glassCard}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>
              <div className={s.cardTitleIcon}>
                <UserIcon size={15} />
              </div>
              Profile Details
            </div>

            {isEditingProfile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={isSavingProfile}
                  className={s.cancelBtn}
                >
                  <XIcon size={12} /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className={s.saveBtn}
                >
                  {isSavingProfile ? (
                    <Loader2 size={12} className={s.spinner} />
                  ) : (
                    <Save size={12} />
                  )}{' '}
                  Save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className={s.editBtn}
              >
                <Edit2 size={12} /> Edit Profile
              </button>
            )}
          </div>

          <div className={s.fieldList}>
            {/* Name */}
            <div className={s.fieldRow}>
              <div className={s.fieldIcon}>
                <UserIcon size={16} />
              </div>
              <div className={s.fieldContent}>
                <div className={s.fieldLabel}>Full Name</div>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={s.inlineInput}
                    placeholder="Enter full name"
                    autoFocus
                  />
                ) : (
                  <div className={s.fieldValue}>
                    {user?.name || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className={s.fieldRow}>
              <div className={s.fieldIcon}>
                <Mail size={16} />
              </div>
              <div className={s.fieldContent}>
                <div className={s.fieldLabel}>Email Address</div>
                <div className={s.fieldValue}>
                  {user?.email || 'Not provided'}
                </div>
              </div>
              <div className={s.fieldLocked}>
                <Lock size={9} /> Secured
              </div>
            </div>

            {/* Phone */}
            <div className={s.fieldRow}>
              <div className={s.fieldIcon}>
                <Phone size={16} />
              </div>
              <div className={s.fieldContent}>
                <div className={s.fieldLabel}>Mobile Number</div>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className={s.inlineInput}
                    placeholder="Enter mobile number"
                  />
                ) : (
                  <div className={s.fieldValue}>
                    {user?.phone || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={s.glassCard}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>
              <div
                className={s.cardTitleIcon}
                style={{ background: 'rgba(139,92,246,0.08)', color: '#7c3aed' }}
              >
                <ChevronRight size={15} />
              </div>
              Quick Actions
            </div>
          </div>

          <div className={s.quickActionList}>
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className={s.quickActionItem}>
                <div className={s.quickActionLeft}>
                  <div
                    className={s.quickActionIcon}
                    style={{ background: action.iconBg, color: action.iconColor }}
                  >
                    {action.icon}
                  </div>
                  <div>
                    <div className={s.quickActionTitle}>{action.title}</div>
                    <div className={s.quickActionSub}>{action.sub}</div>
                  </div>
                </div>
                <ChevronRight size={16} className={s.quickActionChevron} />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
