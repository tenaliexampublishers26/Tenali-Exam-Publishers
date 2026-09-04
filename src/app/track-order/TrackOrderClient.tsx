'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import OrderTimeline from '@/components/ui/OrderTimeline';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { SUPPORT_EMAIL } from '@/lib/data';
import { Truck, Copy, Check, ExternalLink, Package, ArrowRight, MapPin, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface TrackedItem {
  productName: string;
  language: string;
  quantity: number;
  productImage?: string;
  price?: number;
  bundleTitle?: string;
  booksIncluded?: number;
}

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  trackingNumber: string | null;
  carrier: string | null;
  dispatchedAt: string | null;
  total: number;
  createdAt: string;
  deliveryAddress?: any;
  items: TrackedItem[];
  cancellable: boolean;
  cancelDeadline: string;
}

const INDIA_POST_TRACKING_URL = 'https://www.indiapost.gov.in/';

export default function TrackOrderClient(): React.JSX.Element {
  const { user, isAuthenticated } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [tracking, setTracking] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  // 1. Check query parameters on mount & auto-fill contact
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const paramOrderId = urlParams.get('orderId') || '';
    const paramContact = urlParams.get('contact') || '';

    if (paramOrderId) {
      setOrderId(paramOrderId);
    }

    const defaultContact = paramContact || user?.phone || user?.email || '';
    if (defaultContact && !contact) {
      setContact(defaultContact);
    }

    // Auto-track if both orderId and contact are available
    if (paramOrderId && defaultContact) {
      performTrack(paramOrderId, defaultContact);
    }
  }, [user]);

  // 2. Fetch recent orders for logged-in users so they can 1-click track
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/user/orders?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data?.orders && data.orders.length > 0) {
            setRecentOrders(data.orders.slice(0, 3));
          }
        })
        .catch(() => {});
    } else {
      // Check localStorage for offline/guest orders
      try {
        const local = localStorage.getItem('tep_orders');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentOrders(parsed.slice(0, 3));
          }
        }
      } catch {}
    }
  }, [user]);

  const performTrack = async (searchOrderId: string, searchContact: string) => {
    if (!searchOrderId.trim()) {
      setError('Please enter your Order ID');
      return;
    }
    if (!searchContact.trim()) {
      setError('Please enter your email address or 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');
    setTracking(null);

    try {
      const params = new URLSearchParams({ 
        orderId: searchOrderId.trim(), 
        contact: searchContact.trim() 
      });
      const res = await fetch(`/api/track-order?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Order not found. Please check your Order ID and contact details.');
        return;
      }

      setTracking(data.order);
    } catch (err) {
      setError('Something went wrong while tracking your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await performTrack(orderId, contact);
  };

  const handleQuickTrack = (ord: any) => {
    const oId = ord.orderNumber || ord.id;
    const cont = ord.deliveryAddress?.mobile || ord.deliveryAddress?.email || user?.phone || user?.email || contact;
    setOrderId(oId);
    if (cont) {
      setContact(cont);
      performTrack(oId, cont);
    }
  };

  const handleCopyTracking = () => {
    if (!tracking?.trackingNumber) return;
    navigator.clipboard.writeText(tracking.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container-narrow" style={{ maxWidth: '640px' }}>

      {/* Quick 1-Click Track Recent Orders Banner (if orders exist) */}
      {recentOrders.length > 0 && !tracking && (
        <div className="card p-4 sm:p-5 mb-5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/60 rounded-2xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-xs font-bold text-(--color-text-primary) uppercase tracking-wider flex items-center gap-1.5">
              <Package size={15} className="text-blue-600" />
              Your Recent Placed Orders
            </h2>
            <Link href="/account/orders" className="text-[11px] font-bold text-blue-600 hover:underline">
              All Orders ({recentOrders.length}) →
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.map((ord: any) => {
              const itemTitle = ord.items?.[0]?.productName || 'Books Order';
              return (
                <div 
                  key={ord.id || ord.orderNumber}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400 transition-all gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-(--color-text-primary)">#{ord.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {ord.status || 'placed'}
                      </span>
                    </div>
                    <div className="text-xs text-(--color-text-secondary) truncate mt-0.5 font-medium">
                      {itemTitle} · {formatPrice(ord.total)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickTrack(ord)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 shadow-xs transition-colors"
                  >
                    <Truck size={13} /> Track
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Track Form (only shown when not viewing a tracked order) */}
      {!tracking && (
        <div className="card p-6 md:p-8">
          <form onSubmit={handleTrack}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label font-bold text-xs text-(--color-text-primary)" htmlFor="orderId">
                Order ID
              </label>
              <input
                id="orderId"
                type="text"
                className="form-input font-mono"
                placeholder="e.g. TEP-309681-6559"
                value={orderId}
                onChange={(e) => {
                  setOrderId(e.target.value);
                  setError('');
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <div className="flex items-center justify-between mb-1">
                <label className="form-label font-bold text-xs text-(--color-text-primary) m-0" htmlFor="contact">
                  Email Address or 10-Digit Mobile Number
                </label>
                {user && (
                  <span className="text-[11px] text-blue-600 cursor-pointer font-medium hover:underline" onClick={() => setContact(user.phone || user.email || '')}>
                    Use My Profile
                  </span>
                )}
              </div>
              <input
                id="contact"
                type="text"
                className="form-input"
                placeholder="e.g. 9398845947 or your@email.com"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  setError('');
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '12px 16px',
                  background: 'var(--color-error-bg)',
                  color: 'var(--color-error)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  lineHeight: 1.4,
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Truck size={18} className="animate-bounce" /> Checking Postal Tracking...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Truck size={18} /> Track Order Status
                </span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Track Another Order Button when order is tracked */}
      {tracking && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setTracking(null);
              setError('');
              if (typeof window !== 'undefined' && window.history.pushState) {
                window.history.pushState(null, '', window.location.pathname);
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-3.5 py-2 rounded-xl transition-all shadow-2xs"
          >
            ← Track Another Order
          </button>
        </div>
      )}

      {/* Tracking Result */}
      {tracking && (
        <div className="card p-6 md:p-8 animate-fadeIn">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-light)' }}>
            <div>
              <div className="text-[11px] font-bold text-(--color-text-muted) uppercase tracking-wider">Confirmed Order</div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
                #{tracking.orderNumber}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Placed on {formatDateTime(tracking.createdAt)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Amount Paid</div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10b981' }}>{formatPrice(tracking.total)}</div>
            </div>
          </div>

          {/* Items Summary with Images */}
          {tracking.items && tracking.items.length > 0 && (
            <div className="space-y-2 mb-5">
              <div className="text-xs font-bold text-(--color-text-primary) uppercase tracking-wider mb-1">
                Ordered Items ({tracking.items.length})
              </div>
              {tracking.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-(--color-bg-hover) border border-(--color-border-light)">
                  {item.productImage ? (
                    <img 
                      src={item.productImage} 
                      alt={item.productName} 
                      className="w-12 h-14 object-cover rounded-lg shrink-0 border border-(--color-border-light)"
                    />
                  ) : (
                    <div className="w-12 h-14 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                      <Package size={20} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-(--color-text-primary) truncate">
                      {item.productName}
                    </div>
                    <div className="text-[11px] text-(--color-text-muted) mt-0.5">
                      Medium: <span className="font-semibold text-(--color-text-secondary) uppercase">{item.language}</span>
                      {item.bundleTitle && <span> · {item.bundleTitle}</span>}
                    </div>
                    <div className="text-[11px] text-(--color-text-muted) mt-0.5">
                      Quantity: <span className="font-bold text-(--color-text-primary)">{item.quantity}</span> {item.booksIncluded ? `(${item.booksIncluded * item.quantity} books total)` : ''}
                    </div>
                  </div>
                  {item.price && (
                    <div className="font-bold text-xs text-(--color-text-primary) shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Delivery Address Details */}
          {tracking.deliveryAddress && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-(--color-border-light) mb-5 text-xs">
              <div className="font-bold text-(--color-text-primary) flex items-center gap-1.5 mb-1">
                <MapPin size={14} className="text-blue-600" />
                Delivery Address
              </div>
              <div className="text-(--color-text-secondary) leading-relaxed">
                <strong>{tracking.deliveryAddress.fullName}</strong> — {tracking.deliveryAddress.mobile}<br />
                {tracking.deliveryAddress.houseOrFlat}, {tracking.deliveryAddress.street}
                {tracking.deliveryAddress.area && `, ${tracking.deliveryAddress.area}`}<br />
                {tracking.deliveryAddress.city}, {tracking.deliveryAddress.state} — {tracking.deliveryAddress.pinCode}
              </div>
            </div>
          )}

          {/* Speed Post Tracking ID Panel */}
          {tracking.trackingNumber ? (
            <div
              style={{
                marginBottom: '24px',
                padding: '18px',
                border: '1.5px solid #3b82f6',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(59, 130, 246, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Truck size={17} /> {tracking.carrier || 'India Post Speed Post'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span className="text-[11px] text-(--color-text-muted) block">Consignment Tracking Number</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>{tracking.trackingNumber}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={handleCopyTracking} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy ID'}
                  </button>
                  <a
                    href={INDIA_POST_TRACKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    Track on India Post <ExternalLink size={13} />
                  </a>
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '12px', lineHeight: 1.4 }}>
                Enter this consignment number in the &quot;Track N Trace&quot; portal on the official India Post portal for live scan checkpoints.
              </p>
              {tracking.dispatchedAt && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '6px', fontWeight: 600 }}>
                  Dispatched on {formatDateTime(tracking.dispatchedAt)}
                </p>
              )}
            </div>
          ) : (
            <div
              style={{
                marginBottom: '24px',
                padding: '14px 16px',
                border: '1px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Package size={18} className="text-blue-500 shrink-0" />
              <div>
                <strong className="text-(--color-text-primary) block">Order Placed & In Preparation</strong>
                Your India Post Speed Post consignment tracking number will be assigned as soon as the book package is dispatched.
              </div>
            </div>
          )}

          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            Order Progress
          </h3>
          <OrderTimeline currentStatus={tracking.status} statusHistory={[]} />

          {/* Quick links */}
          <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-(--color-border-light) flex-wrap">
            <Link 
              href="/account/orders" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              <Package size={14} /> View All My Orders →
            </Link>
            <Link 
              href={`/invoice/${tracking.orderNumber}`} 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600"
            >
              <FileText size={14} /> Download Tax Invoice
            </Link>
          </div>
        </div>
      )}

      {/* Logged in prompt */}
      {!isAuthenticated && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            padding: '20px',
            fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <Link href="/login" style={{ color: '#2563eb', fontWeight: 700 }}>
            Log in to your account
          </Link>{' '}
          to see all past orders and track parcels in 1 click.
        </div>
      )}

      {/* Support */}
      <div className="p-6 md:p-8 mt-10 text-center bg-(--color-bg-card) border border-(--color-border-light) rounded-2xl">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>
          Need Help With Your Order?
        </h3>
        <p
          style={{
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '16px',
          }}
        >
          For postal dispatch, tracking, payment, or delivery questions, reach out to us:
        </p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-secondary">
          Contact Support
        </a>
      </div>
    </div>
  );
}

