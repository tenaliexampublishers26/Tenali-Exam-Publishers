'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  AlertCircle, 
  TrendingUp, 
  Package,
  Activity,
  User,
  ArrowUpRight,
  Calendar,
  Layers,
  Percent,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  Clock
} from 'lucide-react';

import RevenueChart from '@/components/ui/RevenueChart';
import { fetchWithCache, getCachedData } from '@/lib/api-cache';
import { motion } from 'motion/react';
import { AdminStatCard, AdminSegmentedControl, AdminTableRow } from '@/components/admin/AdminUI';

export default function AdminDashboardPage() {
  const cachedInitial = getCachedData('/api/admin/analytics');
  const [data, setData] = useState<any>(cachedInitial ? cachedInitial.data : null);
  const [loading, setLoading] = useState(!cachedInitial);
  const [error, setError] = useState('');

  // Revenue Intelligence states
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [range, setRange] = useState<string>('30days');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [revenueData, setRevenueData] = useState<any>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState('');

  const fetchAnalytics = async (force = false) => {
    try {
      const json = await fetchWithCache('/api/admin/analytics', { ttl: 20000, forceRefresh: force });
      setData(json.data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueAnalytics = async (force = false) => {
    try {
      let url = `/api/admin/analytics/revenue?period=${period}&range=${range}`;
      if (range === 'custom' && customDates.start && customDates.end) {
        url += `&startDate=${customDates.start}&endDate=${customDates.end}`;
      }
      
      const cached = getCachedData(url);
      if (cached && !revenueData) {
        setRevenueData(cached.data);
        setRevenueLoading(false);
      }

      const json = await fetchWithCache(url, { ttl: 20000, forceRefresh: force });
      setRevenueData(json.data);
      setRevenueError('');
    } catch (err: any) {
      setRevenueError(err.message);
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchRevenueAnalytics();
  }, [period, range, customDates]);

  const formatActivityTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const parseActivityDesc = (desc: string) => {
    if (!desc) return { name: '', email: '', action: '' };
    // Pattern: "Name (email) joined" or "Customer (email) purchased..."
    const match = desc.match(/^(.+?)\s*\(([^)]+)\)\s*(.*)$/);
    if (match) {
      return {
        name: match[1].trim(),
        email: match[2].trim(),
        action: match[3]?.trim() || 'joined',
      };
    }
    return { name: desc, email: '', action: '' };
  };

  const getStatusBadgeConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'placed':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200/60 dark:border-blue-800/40',
          dot: 'bg-blue-500',
          label: 'Placed'
        };
      case 'processing':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          text: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-200/60 dark:border-purple-800/40',
          dot: 'bg-purple-500',
          label: 'Processing'
        };
      case 'dispatched':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/40',
          text: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-200/60 dark:border-indigo-800/40',
          dot: 'bg-indigo-500',
          label: 'Dispatched'
        };
      case 'delivered':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-200/60 dark:border-emerald-800/40',
          dot: 'bg-emerald-500',
          label: 'Delivered'
        };
      case 'cancelled':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-200/60 dark:border-rose-800/40',
          dot: 'bg-rose-500',
          label: 'Cancelled'
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/40',
          text: 'text-slate-600 dark:text-slate-300',
          border: 'border-slate-200/60 dark:border-slate-700/40',
          dot: 'bg-slate-400',
          label: status || 'Pending'
        };
    }
  };

  const getTodayDateString = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse">
        {/* Banner Skeleton */}
        <div className="h-44 bg-(--color-bg-card) border border-(--color-border) rounded-3xl" />
        
        {/* Metric Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-10">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-36 bg-(--color-bg-card) border border-(--color-border) rounded-2xl p-6" />
          ))}
        </div>

        {/* Revenue Analytics Skeleton */}
        <div className="h-90 bg-(--color-bg-card) border border-(--color-border) rounded-3xl" />
        
        {/* Split widgets skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <div className="h-96 bg-(--color-bg-card) border border-(--color-border) rounded-2xl" />
            <div className="h-96 bg-(--color-bg-card) border border-(--color-border) rounded-2xl" />
          </div>
          <div className="space-y-12">
            <div className="h-64 bg-(--color-bg-card) border border-(--color-border) rounded-2xl" />
            <div className="h-96 bg-(--color-bg-card) border border-(--color-border) rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-(--color-error) bg-(--color-error-bg) rounded-2xl border border-(--color-border) flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="shrink-0 text-(--color-error)" />
          <span className="font-semibold">{error}</span>
        </div>
        <button 
          onClick={() => { setLoading(true); setError(''); fetchAnalytics(); }}
          className="btn btn-danger btn-sm shrink-0 flex items-center gap-2"
        >
          <RefreshCw className="size-4" /> Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fadeIn text-(--color-text-primary)">
      
      {/* Premium Dashboard Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl bg-linear-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 p-6 sm:p-8 shadow-xs border border-gray-200 dark:border-slate-700/50">
        {/* Abstract vector accents */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-gray-300/30 dark:bg-slate-600/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 rounded-full bg-gray-300/30 dark:bg-slate-700/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-50 font-bold text-xs uppercase tracking-widest mb-2">
              <Activity size={14} className="text-slate-500 dark:text-slate-50" />
              Publisher Portal Control Center
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-50 sm:text-4xl">
              Hello, Administrator!
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-50 max-w-xl leading-relaxed">
              Monitor customer activity, review incoming book order packages, manage product stock levels, and track checkout statistics.
            </p>
          </div>
          
          <div className="shrink-0 flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-gray-300/50 dark:border-slate-700/50 px-5 py-3 rounded-2xl">
            <Calendar size={18} className="text-slate-500 dark:text-slate-50" />
            <div className="text-right">
              <span className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-500 dark:text-slate-50">Current Date</span>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-50">{getTodayDateString()}</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Metric Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">

        <AdminStatCard
          index={0}
          icon={<IndianRupee className="h-5 w-5" />}
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success)"
          label="Total Sales"
          value={formatPrice(data.totalRevenue)}
          hint="Paid orders revenue accumulated"
          pill={
            <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-success) bg-(--color-success-bg) px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> Live
            </div>
          }
        />

        <AdminStatCard
          index={1}
          icon={<Users className="h-5 w-5" />}
          iconBg="var(--color-info-bg)"
          iconColor="var(--color-info)"
          label="Active Users"
          value={data.totalUsers}
          hint="Registered study portal customers"
          pill={
            <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-info) bg-(--color-info-bg) px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> Growth
            </div>
          }
        />

        <AdminStatCard
          index={2}
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="var(--color-indigo-bg)"
          iconColor="var(--color-indigo)"
          label="Checkouts"
          value={data.totalOrders}
          hint="Total order packets created"
          pill={
            <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-indigo) bg-(--color-indigo-bg) px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> Volume
            </div>
          }
        />

        <AdminStatCard
          index={3}
          icon={<Package className="h-5 w-5" />}
          iconBg="var(--color-warning-bg)"
          iconColor="var(--color-warning)"
          label="Products"
          value={data.totalProducts}
          hint={`${data.lowStockProducts} items require replenishment`}
          hintTone={data.lowStockProducts === 0 ? 'success' : 'error'}
          pill={
            data.lowStockProducts > 0 ? (
              <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-error) bg-(--color-error-bg) px-2.5 py-0.5 rounded-full animate-pulse">
                <AlertCircle className="h-3 w-3" /> Low Stock
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-success) bg-(--color-success-bg) px-2 py-0.5 rounded-full">
                Safe
              </div>
            )
          }
        />
      </div>

      {/* Revenue Intelligence Card */}
      <div className="admin-card rounded-3xl border border-(--color-border) bg-(--color-bg-card) p-6 sm:p-8 shadow-xs relative overflow-hidden transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-(--color-border)">
          <div className="flex items-center gap-3.5">
            <div className="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-(--color-text-primary) tracking-tight">
                Revenue Intelligence
              </h3>
              <p className="text-xs font-medium text-(--color-text-muted) mt-0.5">
                Financial trends, transaction velocity & seasonal volume overview
              </p>
            </div>
          </div>

          {/* Controls: Date Preset + Segmented Control */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Range Preset Dropdown */}
            <div className="relative inline-block">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-1.5 text-xs font-bold rounded-xl bg-(--color-bg-hover) border border-(--color-border) text-(--color-text-primary) hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer shadow-2xs"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="thisyear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none size-3.5 text-(--color-text-muted)" />
            </div>

            {/* Period Segmented Control */}
            <AdminSegmentedControl<'daily' | 'weekly' | 'monthly'>
              layoutId="dashboard-period-pill"
              value={period}
              onChange={setPeriod}
              options={[
                { label: 'daily', value: 'daily' },
                { label: 'weekly', value: 'weekly' },
                { label: 'monthly', value: 'monthly' },
              ]}
            />
          </div>
        </div>

        {/* Custom date range fields if 'custom' is selected */}
        {range === 'custom' && (
          <div className="flex flex-wrap gap-4 items-end p-4 my-6 bg-(--color-bg-hover) rounded-2xl border border-(--color-border)">
            <div className="form-group">
              <label className="form-label text-[10px] uppercase font-bold text-(--color-text-muted)">Start Date</label>
              <input
                type="date"
                value={customDates.start}
                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                className="form-input text-xs py-1.5 rounded-xl"
              />
            </div>
            <div className="form-group">
              <label className="form-label text-[10px] uppercase font-bold text-(--color-text-muted)">End Date</label>
              <input
                type="date"
                value={customDates.end}
                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                className="form-input text-xs py-1.5 rounded-xl"
              />
            </div>
          </div>
        )}

        {revenueError ? (
          <div className="mt-6 p-6 text-(--color-error) bg-(--color-error-bg) rounded-2xl border border-(--color-border) flex items-center justify-between">
            <span className="text-sm font-semibold">{revenueError}</span>
            <button onClick={() => fetchRevenueAnalytics(true)} className="btn btn-danger btn-sm">Try Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6">
            {/* KPI Summaries Column */}
            <div className="flex flex-col gap-3.5 justify-between">
              {/* Card 1: Total Revenue */}
              <div className="p-4 sm:p-5 rounded-2xl bg-linear-to-br from-blue-500/5 via-(--color-bg-hover) to-transparent border border-(--color-border) relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-700/50 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-extrabold text-(--color-text-muted) tracking-wider">
                    Total Revenue
                  </span>
                  {!revenueLoading && (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      (revenueData?.summary?.revenueGrowth || 0) >= 0 
                        ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'text-rose-700 bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}>
                      {(revenueData?.summary?.revenueGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(revenueData?.summary?.revenueGrowth || 0).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-2xl font-black text-(--color-text-primary) tracking-tight">
                  {revenueLoading ? (
                    <div className="h-7 w-28 bg-(--color-border) rounded-md animate-pulse my-1" />
                  ) : (
                    formatPrice(revenueData?.summary?.totalRevenue || 0)
                  )}
                </div>
                <span className="text-[11px] text-(--color-text-muted) font-medium mt-1 block">
                  Inflow during selected period
                </span>
              </div>

              {/* Card 2: Paid Transactions */}
              <div className="p-4 sm:p-5 rounded-2xl bg-(--color-bg-hover) border border-(--color-border) hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-extrabold text-(--color-text-muted) tracking-wider">
                    Paid Orders
                  </span>
                  <div className="size-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                    <ShoppingBag size={12} />
                  </div>
                </div>
                <div className="text-xl font-black text-(--color-text-primary) tracking-tight">
                  {revenueLoading ? (
                    <div className="h-6 w-20 bg-(--color-border) rounded-md animate-pulse my-1" />
                  ) : (
                    `${revenueData?.summary?.orderCount || 0} orders`
                  )}
                </div>
                <span className="text-[11px] text-(--color-text-muted) font-medium mt-1 block">
                  Verified completed checkouts
                </span>
              </div>

              {/* Card 3: Avg Order Value */}
              <div className="p-4 sm:p-5 rounded-2xl bg-(--color-bg-hover) border border-(--color-border) hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase font-extrabold text-(--color-text-muted) tracking-wider">
                    Avg Order Value
                  </span>
                  <div className="size-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                    <IndianRupee size={12} />
                  </div>
                </div>
                <div className="text-xl font-black text-(--color-text-primary) tracking-tight">
                  {revenueLoading ? (
                    <div className="h-6 w-20 bg-(--color-border) rounded-md animate-pulse my-1" />
                  ) : (
                    formatPrice(
                      revenueData?.summary?.orderCount && revenueData?.summary?.orderCount > 0
                        ? (revenueData?.summary?.totalRevenue || 0) / revenueData?.summary?.orderCount
                        : 0
                    )
                  )}
                </div>
                <span className="text-[11px] text-(--color-text-muted) font-medium mt-1 block">
                  Average spend per customer
                </span>
              </div>
            </div>

            {/* Graph Column */}
            <div className="lg:col-span-3 min-w-0">
              <RevenueChart data={revenueData?.chartData || []} loading={revenueLoading} showMiniCards={false} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Orders Table & Activity List */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Recent Orders Widget */}
          <div className="admin-card rounded-3xl border border-(--color-border) bg-(--color-bg-card) p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-(--color-border)">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-(--color-text-primary) tracking-tight flex items-center gap-2">
                      Recent Shipments
                      {data.recentOrders.length > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/50">
                          {data.recentOrders.length}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      Live order fulfillment & dispatch pipeline
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/orders"
                  className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-(--color-bg-hover) hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-(--color-border) hover:border-indigo-300 dark:hover:border-indigo-700/50 text-xs font-bold text-(--color-text-secondary) hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                >
                  Manage Orders
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
              
              {data.recentOrders.length === 0 ? (
                <div className="admin-empty py-10 my-auto text-center">
                  <div className="size-14 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-(--color-text-primary)">No shipments recorded yet</h4>
                  <p className="text-xs text-(--color-text-muted) max-w-xs mx-auto mt-1 leading-relaxed">
                    Customer book orders and postal dispatch records will appear here as soon as orders are placed.
                  </p>
                  <Link
                    href="/admin/orders"
                    className="inline-block mt-4 px-4 py-2 bg-(--color-bg-hover) hover:bg-slate-200 dark:hover:bg-slate-800 border border-(--color-border) rounded-xl text-xs font-bold text-(--color-text-primary) transition-all"
                  >
                    Go to Orders Catalog
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th className="col-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order: any, idx: number) => {
                        const statusConf = getStatusBadgeConfig(order.status);
                        const customerInitial = (order.userName || 'Guest').charAt(0).toUpperCase();
                        return (
                          <AdminTableRow key={order.id} index={idx}>
                            <td className="col-primary font-mono text-xs">
                              <span className="px-2.5 py-1 rounded-lg bg-(--color-bg-hover) border border-(--color-border)">
                                {order.orderNumber}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <div className="size-7 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                                  {customerInitial}
                                </div>
                                <span className="font-semibold text-xs text-(--color-text-primary) truncate max-w-36">
                                  {order.userName || 'Guest'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                                <span className={`size-1.5 rounded-full ${statusConf.dot}`} />
                                {statusConf.label}
                              </span>
                            </td>
                            <td className="col-bold col-right text-xs">
                              {formatPrice(order.total)}
                            </td>
                          </AdminTableRow>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Timeline Widget */}
          <div className="admin-card rounded-3xl border border-(--color-border) bg-(--color-bg-card) p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-(--color-text-primary) tracking-tight">
                    Real-time Activity Stream
                  </h3>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">
                    Live portal audit events and customer registrations
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-extrabold text-(--color-success) bg-(--color-success-bg) rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                LIVE FEED
              </div>
            </div>
            
            {data.recentActivity.length === 0 ? (
              <div className="admin-empty py-10 text-center">
                <div className="size-14 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center justify-center mx-auto mb-3">
                  <Activity size={24} />
                </div>
                <h4 className="text-sm font-bold text-(--color-text-primary)">No activity recorded yet</h4>
                <p className="text-xs text-(--color-text-muted) max-w-xs mx-auto mt-1 leading-relaxed">
                  Awaiting incoming visitor actions, customer logins, and order checkout webhooks.
                </p>
              </div>
            ) : (
              <div className="relative flex flex-col gap-3">
                {/* Vertical timeline backbone track */}
                <div className="absolute left-5 top-5 bottom-5 w-px bg-(--color-border) -z-0 hidden sm:block" />

                {data.recentActivity.map((activity: any, i: number) => {
                  const isSale = activity.type === 'sale';
                  const parsed = parseActivityDesc(activity.desc);
                  const Icon = isSale ? IndianRupee : User;
                  
                  return (
                    <div
                      key={i}
                      className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-(--color-bg-hover) hover:bg-slate-100 dark:hover:bg-slate-800/40 border border-(--color-border) transition-all duration-200 group"
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        {/* Event icon badge */}
                        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs border ${
                          isSale 
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40' 
                            : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40'
                        }`}>
                          <Icon size={16} />
                        </div>
                        
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-(--color-text-primary)">
                              {activity.title}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                              isSale 
                                ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                : 'bg-blue-100/70 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}>
                              {isSale ? 'Order' : 'User'}
                            </span>
                          </div>

                          {parsed.email ? (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-xs font-bold text-(--color-text-primary)">
                                {parsed.name}
                              </span>
                              <span className="text-[11px] text-(--color-text-muted) font-mono bg-(--color-bg-page) px-1.5 py-0.5 rounded-md border border-(--color-border)">
                                {parsed.email}
                              </span>
                              {parsed.action && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {parsed.action}
                                </span>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-(--color-text-secondary) mt-1 leading-relaxed">
                              {activity.desc}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) shrink-0 self-end sm:self-center px-2 py-1 rounded-lg bg-(--color-bg-page) border border-(--color-border)">
                        <Clock size={11} className="text-(--color-text-muted)" />
                        {formatActivityTime(activity.time)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Performance Indicators & Top Products */}
        <div className="flex flex-col gap-8">
          
          {/* Performance Quick Stats panel */}
          <div className="admin-card rounded-3xl border border-(--color-border) bg-(--color-bg-card) p-6 sm:p-7 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-(--color-border)">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 border border-violet-200/60 dark:border-violet-800/40 flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-xs shrink-0">
                  <Percent size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-(--color-text-primary) tracking-tight">
                    Performance Metrics
                  </h3>
                  <p className="text-xs text-(--color-text-muted) mt-0.5">
                    Operational benchmarks & conversion
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Stat 1: Dispatch rate */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-(--color-bg-hover) border border-(--color-border)">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-(--color-text-secondary)">Order Dispatch Rate</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 border border-blue-200/40">
                      Optimal
                    </span>
                    <span className="font-black text-(--color-text-primary)">85%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200/70 dark:bg-slate-700/40 rounded-full h-2 overflow-hidden">
                  <div className="bg-linear-to-r from-blue-500 to-indigo-600 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              
              {/* Stat 2: Low Stock Warning */}
              {(() => {
                const lowStockPct = Math.round((data.lowStockProducts / (data.totalProducts || 1)) * 100);
                const isSafe = lowStockPct === 0;
                return (
                  <div className="space-y-2 p-3.5 rounded-2xl bg-(--color-bg-hover) border border-(--color-border)">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-(--color-text-secondary)">Low Stock Ratio</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isSafe 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200/40' 
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 border border-rose-200/40'
                        }`}>
                          {isSafe ? 'Healthy' : `${data.lowStockProducts} low`}
                        </span>
                        <span className={`font-black ${isSafe ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {lowStockPct}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/70 dark:bg-slate-700/40 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-linear-to-r from-amber-500 to-rose-500'}`}
                        style={{ width: `${Math.max(isSafe ? 0 : lowStockPct, 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
              
              {/* Stat 3: Conversion Rate */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-(--color-bg-hover) border border-(--color-border)">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-(--color-text-secondary)">Checkout Conversion</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200/40">
                      Strong
                    </span>
                    <span className="font-black text-(--color-text-primary)">92%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200/70 dark:bg-slate-700/40 rounded-full h-2 overflow-hidden">
                  <div className="bg-linear-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products List Widget */}
          <div className="admin-card rounded-3xl border border-(--color-border) bg-(--color-bg-card) p-6 sm:p-7 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-5 mb-5 border-b border-(--color-border)">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs shrink-0">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-(--color-text-primary) tracking-tight">
                      Stock Management
                    </h3>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">
                      Top moving books & catalog inventory
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/products"
                  className="group inline-flex items-center gap-1 text-xs font-bold text-(--color-info) hover:text-blue-600 transition-colors"
                >
                  Catalog <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {data.topProducts.length === 0 ? (
                  <div className="admin-empty py-8 text-center">
                    <div className="size-12 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/40 flex items-center justify-center mx-auto mb-2.5">
                      <Package size={20} />
                    </div>
                    <h4 className="text-xs font-bold text-(--color-text-primary)">Catalog Inventory Steady</h4>
                    <p className="text-[11px] text-(--color-text-muted) max-w-xs mx-auto mt-0.5 leading-relaxed">
                      No items sold yet. High-demand books will rank here automatically.
                    </p>
                  </div>
                ) : (
                  data.topProducts.map((prod: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-2xl bg-(--color-bg-hover) hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-(--color-border) transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`size-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                          i === 0 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60' 
                            : i === 1 
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                        }`}>
                          #{i + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-(--color-text-primary) truncate">
                            {prod.name}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-(--color-text-muted) mt-0.5">
                            <span>{prod.sold} sold</span>
                            {prod.stock !== undefined && prod.stock !== null && (
                              <>
                                <span>•</span>
                                <span className={prod.stock < 10 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                                  {prod.stock} in stock
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-(--color-text-primary) shrink-0 ml-3 bg-(--color-bg-page) px-2.5 py-1 rounded-lg border border-(--color-border)">
                        {formatPrice(prod.revenue)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
