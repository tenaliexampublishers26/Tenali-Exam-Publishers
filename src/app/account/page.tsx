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
  X as XIcon, 
  Loader2,
  ArrowUpRight
} from 'lucide-react';

import { fetchWithCache, getCachedData } from '@/lib/api-cache';

export default function AccountPage(): React.JSX.Element {
  const { user, login } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const toast = useToast();

  const cachedOrders = user?.id ? getCachedData<{ orders: any[] }>(`/api/user/orders?userId=${user.id}`) : null;
  const cachedAddresses = user?.id ? getCachedData<{ addresses: any[] }>(`/api/user/addresses?userId=${user.id}`) : null;

  const [ordersCount, setOrdersCount] = useState<number>(cachedOrders?.orders?.length || 0);
  const [addressesCount, setAddressesCount] = useState<number>(cachedAddresses?.addresses?.length || 0);
  const [loadingStats, setLoadingStats] = useState<boolean>(!cachedOrders || !cachedAddresses);

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
        body: JSON.stringify({ userId: user.id, name: editName, phone: editPhone })
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
          fetchWithCache<{ orders: any[] }>(`/api/user/orders?userId=${user.id}`, { ttl: 20000 }),
          fetchWithCache<{ addresses: any[] }>(`/api/user/addresses?userId=${user.id}`, { ttl: 20000 })
        ]);

        if (ordersData?.orders) {
          setOrdersCount(ordersData.orders.length);
        }
        if (addressesData?.addresses) {
          setAddressesCount(addressesData.addresses.length);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user?.id]);

  const firstLetter = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="space-y-6">
      
      {/* Sleek Soft Grey Welcome Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-5">
          
          {/* Avatar Container */}
          <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
            {firstLetter}
          </div>

          <div className="flex-1 min-w-55">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 inline-flex items-center gap-1">
                <Shield size={11} className="text-blue-600 dark:text-blue-400" /> {user?.role || 'Customer'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Manage your orders, addresses, wishlist, and profile information from your personal dashboard.
            </p>
          </div>

        </div>
      </div>

      {/* Live Dashboard Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Total Orders */}
        <Link href="/account/orders" className="group block p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package size={18} />
            </div>
            <ArrowUpRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {loadingStats ? <Loader2 size={18} className="animate-spin text-slate-400" /> : ordersCount}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Total Orders</div>
        </Link>

        {/* Stat 2: Saved Wishlist */}
        <Link href="/account/wishlist" className="group block p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Heart size={18} />
            </div>
            <ArrowUpRight size={16} className="text-slate-400 group-hover:text-pink-600 transition-colors" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {wishlistItems.length}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Wishlist Items</div>
        </Link>

        {/* Stat 3: Saved Addresses */}
        <Link href="/account/addresses" className="group block p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-400 transition-all shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MapPin size={18} />
            </div>
            <ArrowUpRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {loadingStats ? <Loader2 size={18} className="animate-spin text-slate-400" /> : addressesCount}
          </div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Saved Addresses</div>
        </Link>
      </div>

      {/* Two Column Section: Profile Details & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Profile Details Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon size={16} className="text-blue-600 dark:text-blue-400" />
              Profile Details
            </h2>
            
            {isEditingProfile ? (
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  disabled={isSavingProfile}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1"
                >
                  {isSavingProfile ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all flex items-center gap-1"
              >
                <Edit2 size={12} /> Edit Profile
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {/* Name */}
            <div className="py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <UserIcon size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</div>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full mt-1 px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                    {user?.name || '—'}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Mail size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                  {user?.email || '—'}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Phone size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</div>
                {isEditingProfile ? (
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="Enter mobile number"
                  />
                ) : (
                  <div className="font-semibold text-xs text-slate-900 dark:text-white truncate mt-0.5">
                    {user?.phone || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Shortcuts */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-slate-800">
            Quick Actions
          </h2>

          <div className="space-y-2.5">
            <Link
              href="/account/orders"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Package size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">My Orders</div>
                  <div className="text-[11px] text-slate-500">View history, tracking numbers & order details</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/account/wishlist"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                  <Heart size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Saved Wishlist</div>
                  <div className="text-[11px] text-slate-500">Check saved study materials and books</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/account/addresses"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Shipping Addresses</div>
                  <div className="text-[11px] text-slate-500">Manage delivery addresses for faster checkout</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/track-order"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Truck size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Track Active Shipment</div>
                  <div className="text-[11px] text-slate-500">Get live postal delivery status updates</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
