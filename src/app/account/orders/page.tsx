'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice } from '@/lib/utils';
import { PackageOpen, Package, Calendar, ChevronRight, Truck, CheckCircle2, Clock, XCircle, ArrowLeft, Ban } from 'lucide-react';

import { fetchWithCache, getCachedData, invalidateCache } from '@/lib/api-cache';

const CANCELLABLE_STATUSES = ['placed', 'processing'];
const CANCEL_WINDOW_HOURS = 24;

function isOrderCancellable(order: any): boolean {
  if (!CANCELLABLE_STATUSES.includes(order.status)) return false;
  const hoursSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  return hoursSinceOrder <= CANCEL_WINDOW_HOURS;
}

export default function OrdersPage(): React.JSX.Element {
  const { user } = useAuth();
  const toast = useToast();
  const url = user?.id ? `/api/user/orders?userId=${user.id}` : '';
  const cached = url ? getCachedData<{ orders: any[] }>(url) : null;
  const [orders, setOrders] = useState<any[]>(cached ? cached.orders || [] : []);
  const [loading, setLoading] = useState(Boolean(!cached && user));
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchOrders = async () => {
      try {
        const data = await fetchWithCache<{ orders: any[] }>(`/api/user/orders?userId=${user.id}`, { ttl: 20000 });
        setOrders(data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId: string) => {
    if (!user?.id) return;
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;

    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/user/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to cancel order');
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o)));
      invalidateCache(`/api/user/orders?userId=${user.id}`);
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', icon: <CheckCircle2 size={13} /> };
      case 'dispatched':
      case 'out_for_delivery':
        return { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', icon: <Truck size={13} /> };
      case 'cancelled':
      case 'returned':
        return { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', icon: <XCircle size={13} /> };
      default:
        return { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', icon: <Clock size={13} /> };
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold">Loading order history...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-12 text-center bg-(--color-bg-card) rounded-2xl border border-dashed border-(--color-border) space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
          <PackageOpen size={36} strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-(--color-text-primary)">No Orders Yet</h2>
          <p className="text-sm text-(--color-text-muted) max-w-sm mx-auto mt-1">
            You haven&apos;t placed any orders yet. Explore our competitive postal exam study guides and books!
          </p>
        </div>
        <Link href="/study-materials" className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md">
          Browse Study Materials
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-xl text-(--color-text-primary) flex items-center gap-2">
            <Package size={22} className="text-blue-500" />
            My Orders ({orders.length})
          </h2>
          <p className="text-xs text-(--color-text-muted) mt-0.5">Track shipment statuses and view order details</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map(order => {
          const badge = getStatusBadgeStyle(order.status);
          const itemCount = order.items ? order.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 1;

          return (
            <div 
              key={order.id} 
              className="p-5 rounded-2xl bg-(--color-bg-card) border border-(--color-border) hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Top Order Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-(--color-border-light)">
                <div>
                  <div className="text-[11px] font-bold text-(--color-text-muted) uppercase tracking-wider">Order ID</div>
                  <div className="font-bold text-sm text-(--color-text-primary) font-mono">{order.orderNumber}</div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-(--color-text-muted) uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={12} /> Placed On
                  </div>
                  <div className="font-medium text-xs text-(--color-text-secondary) mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                <div>
                  <span 
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold capitalize"
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.icon}
                    {order.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Items Summary */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-(--color-text-secondary) font-medium">
                    {order.items && order.items.length > 0 ? (
                      <span className="font-bold text-(--color-text-primary)">
                        {order.items[0]?.productName}
                        {order.items.length > 1 && <span className="text-blue-600 dark:text-blue-400 font-normal"> +{order.items.length - 1} more items</span>}
                      </span>
                    ) : (
                      <span>{itemCount} item(s)</span>
                    )}
                  </div>
                  <div className="text-xs text-(--color-text-muted) mt-0.5">
                    Total Amount: <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm ml-1">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOrderCancellable(order) && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingId === order.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-500/10 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Ban size={14} />
                      {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  )}
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    View Details <ChevronRight size={14} />
                  </Link>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
