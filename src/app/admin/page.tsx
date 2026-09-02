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
  RefreshCw
} from 'lucide-react';

import RevenueChart from '@/components/ui/RevenueChart';
import { fetchWithCache, getCachedData } from '@/lib/api-cache';

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
      return date.toLocaleDateString();
    } catch {
      return '';
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
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900 p-6 sm:p-8 shadow-xs border border-gray-200 dark:border-slate-700/50">
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
      </div>
      
      {/* Metric Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        
        {/* Stat Card 1: Total Revenue */}
        <div className="group relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-bg-card) p-6 md:p-7 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-500/20">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3 bg-(--color-success-bg) text-(--color-success) rounded-xl transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-success) bg-(--color-success-bg) px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> Live
            </div>
          </div>
          <h3 className="font-bold text-(--color-text-muted) text-[10px] uppercase tracking-wider mb-1">Total Sales</h3>
          <p className="text-3xl font-black text-(--color-text-primary) tracking-tight">{formatPrice(data.totalRevenue)}</p>
          <p className="text-xs text-(--color-text-muted) mt-2">Paid orders revenue accumulated</p>
        </div>
        
        {/* Stat Card 2: Active Users */}
        <div className="group relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-bg-card) p-6 md:p-7 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-500/20">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3 bg-(--color-info-bg) text-(--color-info) rounded-xl transition-colors group-hover:bg-blue-500 group-hover:text-white">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-info) bg-(--color-info-bg) px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> Growth
            </div>
          </div>
          <h3 className="font-bold text-(--color-text-muted) text-[10px] uppercase tracking-wider mb-1">Active Users</h3>
          <p className="text-3xl font-black text-(--color-text-primary) tracking-tight">{data.totalUsers}</p>
          <p className="text-xs text-(--color-text-muted) mt-2">Registered study portal customers</p>
        </div>
        
        {/* Stat Card 3: Total Orders */}
        <div className="group relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-bg-card) p-6 md:p-7 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-indigo-500/20">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3 bg-(--color-indigo-bg) text-(--color-indigo) rounded-xl transition-colors group-hover:bg-indigo-500 group-hover:text-white">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-indigo) bg-(--color-indigo-bg) px-2 py-0.5 rounded-full">
              <TrendingUp className="h-3 w-3" /> Volume
            </div>
          </div>
          <h3 className="font-bold text-(--color-text-muted) text-[10px] uppercase tracking-wider mb-1">Checkouts</h3>
          <p className="text-3xl font-black text-(--color-text-primary) tracking-tight">{data.totalOrders}</p>
          <p className="text-xs text-(--color-text-muted) mt-2">Total order packets created</p>
        </div>

        {/* Stat Card 4: Product Count */}
        <div className="group relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-bg-card) p-6 md:p-7 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-amber-500/20">
          <div className="flex items-center justify-between mb-5">
            <div className="p-3 bg-(--color-warning-bg) text-(--color-warning) rounded-xl transition-colors group-hover:bg-amber-500 group-hover:text-white">
              <Package className="h-5 w-5" />
            </div>
            {data.lowStockProducts > 0 ? (
              <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-error) bg-(--color-error-bg) px-2.5 py-0.5 rounded-full animate-pulse">
                <AlertCircle className="h-3 w-3" /> Low Stock
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs font-extrabold text-(--color-success) bg-(--color-success-bg) px-2 py-0.5 rounded-full">
                Safe
              </div>
            )}
          </div>
          <h3 className="font-bold text-(--color-text-muted) text-[10px] uppercase tracking-wider mb-1">Products</h3>
          <p className="text-3xl font-black text-(--color-text-primary) tracking-tight">{data.totalProducts}</p>
          <p className={`text-xs mt-2 font-semibold ${data.lowStockProducts === 0 ? 'text-green-600 dark:text-green-400' : 'text-(--color-error)'}`}>
            {data.lowStockProducts} items require replenishment
          </p>
        </div>
      </div>

      {/* Revenue Intelligence Card */}
      <div className="admin-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-(--color-text-primary) flex items-center gap-2.5">
              <div className="p-1.5 bg-(--color-info-bg) text-(--color-info) rounded-lg">
                <TrendingUp size={18} />
              </div>
              Revenue Intelligence
            </h3>
            <p className="text-xs text-(--color-text-muted) mt-1">Track financial trends, transaction volume, and growth patterns</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Range Preset Filter */}
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="form-select text-xs py-1.5 px-3 min-w-32"
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

            {/* Period Segmented Control */}
            <div className="flex border border-(--color-border) rounded-xl overflow-hidden p-0.5 bg-(--color-bg-hover)">
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs font-bold capitalize transition-colors ${
                    period === p
                      ? 'bg-blue-500 text-white rounded-lg shadow-xs'
                      : 'text-(--color-text-secondary) hover:text-(--color-text-primary)'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom date range fields if 'custom' is selected */}
        {range === 'custom' && (
          <div className="flex flex-wrap gap-4 items-end p-4 bg-(--color-bg-hover) rounded-2xl border border-(--color-border)">
            <div className="form-group">
              <label className="form-label text-[10px] uppercase font-bold text-(--color-text-muted)">Start Date</label>
              <input
                type="date"
                value={customDates.start}
                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                className="form-input text-xs py-1.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label text-[10px] uppercase font-bold text-(--color-text-muted)">End Date</label>
              <input
                type="date"
                value={customDates.end}
                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                className="form-input text-xs py-1.5"
              />
            </div>
          </div>
        )}

        {revenueError ? (
          <div className="p-6 text-(--color-error) bg-(--color-error-bg) rounded-2xl border border-(--color-border) flex items-center justify-between">
            <span>{revenueError}</span>
            <button onClick={() => fetchRevenueAnalytics(true)} className="btn btn-danger btn-sm">Try Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Summaries Column */}
            <div className="flex flex-col gap-6 p-5 bg-(--color-bg-hover) border border-(--color-border) rounded-2xl h-fit">
              <div>
                <span className="block text-[10px] uppercase font-extrabold text-(--color-text-muted) tracking-wider">Total Revenue</span>
                <span className="block text-2xl font-black text-(--color-text-primary) mt-1">
                  {revenueLoading ? '...' : formatPrice(revenueData?.summary?.totalRevenue || 0)}
                </span>
                {!revenueLoading && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold mt-2 ${
                    (revenueData?.summary?.revenueGrowth || 0) >= 0 ? 'text-(--color-success)' : 'text-(--color-error)'
                  }`}>
                    {(revenueData?.summary?.revenueGrowth || 0) >= 0 ? '↑' : '↓'}{' '}
                    {Math.abs(revenueData?.summary?.revenueGrowth || 0).toFixed(1)}%
                    <span className="text-(--color-text-muted) font-medium"> vs previous</span>
                  </span>
                )}
              </div>

              <div className="h-px bg-(--color-border)" />

              <div>
                <span className="block text-[10px] uppercase font-extrabold text-(--color-text-muted) tracking-wider">Paid Transactions</span>
                <span className="block text-xl font-black text-(--color-text-primary) mt-1">
                  {revenueLoading ? '...' : `${revenueData?.summary?.orderCount || 0} orders`}
                </span>
              </div>

            </div>

            {/* Graph Column */}
            <div className="lg:col-span-3">
              <RevenueChart data={revenueData?.chartData || []} loading={revenueLoading} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Orders Table & Activity List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Recent Orders Widget */}
          <div className="admin-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-extrabold text-(--color-text-primary) flex items-center gap-2.5">
                <div className="p-1.5 bg-(--color-info-bg) rounded-lg text-(--color-info)">
                  <ShoppingBag size={18} />
                </div>
                Recent Shipments
              </h3>
              <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-bold text-(--color-info) hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Manage Orders <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            
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
                  {data.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-(--color-text-muted)">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.recentOrders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="col-primary">{order.orderNumber}</td>
                        <td>{order.userName || 'Guest'}</td>
                        <td>
                          <span className={`status-badge ${
                            order.status === 'delivered'
                              ? 'status-badge--success'
                              : 'status-badge--indigo'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="col-bold col-right">{formatPrice(order.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity Timeline Widget */}
          <div className="admin-card">
            <h3 className="text-lg font-extrabold text-(--color-text-primary) mb-6 flex items-center gap-2.5">
              <div className="p-1.5 bg-(--color-success-bg) rounded-lg text-(--color-success)">
                <Activity size={18} />
              </div>
              Real-time Activity Stream
            </h3>
            
            <div className="relative pl-6 border-l-2 border-(--color-border) flex flex-col gap-6 ml-3">
              {data.recentActivity.length === 0 ? (
                <p className="text-center py-6 text-(--color-text-muted)">No activity recorded yet.</p>
              ) : (
                data.recentActivity.map((activity: any, i: number) => {
                  const Icon = activity.type === 'sale' ? IndianRupee : User;
                  const isSale = activity.type === 'sale';
                  return (
                    <div key={i} className="relative flex items-start space-x-4 p-4 rounded-2xl bg-(--color-bg-hover) hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all border border-(--color-border)">
                      
                      {/* Timeline Bullet Anchor Indicator */}
                      <span className={`absolute -left-6.25 top-7 size-4 rounded-full border-4 border-(--color-bg-card) ${
                        isSale ? 'bg-emerald-500' : 'bg-blue-500'
                      }`} />

                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isSale 
                          ? 'bg-(--color-success-bg) text-(--color-success)' 
                          : 'bg-(--color-info-bg) text-(--color-info)'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-(--color-text-primary)">
                          {activity.title}
                        </p>
                        <p className="text-xs text-(--color-text-secondary) mt-1 leading-relaxed">
                          {activity.desc}
                        </p>
                      </div>
                      
                      <div className="text-[10px] font-bold uppercase tracking-wider text-(--color-text-muted) shrink-0 ml-4">
                        {formatActivityTime(activity.time)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Performance Indicators & Top Products */}
        <div className="flex flex-col gap-6">
          
          {/* Performance Quick Stats panel */}
          <div className="admin-card">
            <h3 className="text-lg font-extrabold text-(--color-text-primary) mb-6 flex items-center gap-2.5">
              <div className="p-1.5 bg-(--color-indigo-bg) rounded-lg text-(--color-indigo)">
                <Percent size={18} />
              </div>
              Performance Metrics
            </h3>
            
            <div className="space-y-6">
              
              {/* Stat 1: Dispatch rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-(--color-text-secondary)">Order Dispatch Rate</span>
                  <span className="font-bold text-(--color-text-primary)">85%</span>
                </div>
                <div className="w-full bg-(--color-pastel-blue) rounded-full h-2 overflow-hidden">
                  <div className="bg-linear-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              {/* Stat 2: Low Stock Warning */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-(--color-text-secondary)">Low Stock ratio</span>
                  <span className="font-bold text-(--color-error)">
                    {Math.round((data.lowStockProducts / (data.totalProducts || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-(--color-pastel-blue) rounded-full h-2 overflow-hidden">
                  <div className="bg-linear-to-r from-orange-500 to-rose-500 h-2 rounded-full" style={{ width: `${Math.round((data.lowStockProducts / (data.totalProducts || 1)) * 100)}%` }}></div>
                </div>
              </div>
              
              {/* Stat 3: Conversion Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-(--color-text-secondary)">Checkout Conversion</span>
                  <span className="font-bold text-(--color-text-primary)">92%</span>
                </div>
                <div className="w-full bg-(--color-pastel-blue) rounded-full h-2 overflow-hidden">
                  <div className="bg-linear-to-r from-emerald-500 to-teal-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products List Widget */}
          <div className="admin-card">
            <h3 className="text-lg font-extrabold text-(--color-text-primary) mb-6 flex items-center gap-2.5">
              <div className="p-1.5 bg-(--color-warning-bg) rounded-lg text-(--color-warning)">
                <Layers size={18} />
              </div>
              Stock Management
            </h3>
            
            <div className="flex flex-col gap-3">
              {data.topProducts.length === 0 ? (
                <p className="text-center py-6 text-(--color-text-muted) text-sm">No items sold yet.</p>
              ) : (
                data.topProducts.map((prod: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-(--color-bg-hover) border border-(--color-border) transition-colors">
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-(--color-text-primary) truncate pr-2">
                        {prod.name}
                      </span>
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold text-(--color-text-muted) mt-1 uppercase tracking-wider">
                        <span>{prod.sold} units sold</span>
                        {prod.stock !== undefined && prod.stock !== null && (
                          <>
                            <span>•</span>
                            <span className={prod.stock < 10 ? 'text-rose-500' : 'text-emerald-500'}>
                              {prod.languages ? (
                                (() => {
                                  try {
                                    const langs = typeof prod.languages === 'string' ? JSON.parse(prod.languages) : prod.languages;
                                    return langs.map((l: any) => `${l.code.toUpperCase()}: ${l.stock || 0}`).join(' | ') + ' stock left';
                                  } catch (e) {
                                    return `${prod.stock} in stock`;
                                  }
                                })()
                              ) : (
                                `${prod.stock} in stock`
                              )}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <span className="text-sm font-black text-(--color-text-primary) shrink-0 ml-4 bg-(--color-bg-hover) px-3 py-1 rounded-lg">
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
  );
}
