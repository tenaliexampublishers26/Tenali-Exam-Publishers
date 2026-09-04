'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import OrderTimeline from '@/components/ui/OrderTimeline';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { invalidateCache } from '@/lib/api-cache';
import { FileText, Truck, Copy, Check, ExternalLink, Ban } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

const CANCELLABLE_STATUSES = ['placed', 'processing'];
const CANCEL_WINDOW_HOURS = 24;
const INDIA_POST_TRACKING_URL = 'https://www.indiapost.gov.in/';

function isOrderCancellable(order: any): boolean {
  if (!order) return false;
  if (!CANCELLABLE_STATUSES.includes(order.status)) return false;
  const hoursSinceOrder = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  return hoursSinceOrder <= CANCEL_WINDOW_HOURS;
}

export default function OrderDetailPage({ params }: PageProps): React.JSX.Element {
  const { id } = use(params);
  const { user } = useAuth();
  const toast = useToast();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/user/orders/${id}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, user]);

  const handleCancelOrder = async () => {
    if (!user?.id || !order) return;
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/user/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to cancel order');
        return;
      }

      setOrder((prev: any) => ({ ...prev, status: 'cancelled' }));
      invalidateCache(`/api/user/orders?userId=${user.id}`);
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const handleCopyTracking = () => {
    if (!order?.trackingNumber) return;
    navigator.clipboard.writeText(order.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        Loading order details...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-error)' }}>{error || 'Order not found'}</p>
        <Link href="/account/orders" style={{ display: 'inline-block', marginTop: '16px' }}>Back to Orders</Link>
      </div>
    );
  }

  const cancellable = isOrderCancellable(order);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link href="/account/orders" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>← Back to Orders</Link>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {cancellable && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="btn btn-sm"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48',
                fontWeight: 700, border: '1px solid rgba(225, 29, 72, 0.25)', borderRadius: '10px',
                padding: '6px 14px', fontSize: '0.8rem', cursor: cancelling ? 'not-allowed' : 'pointer',
                opacity: cancelling ? 0.6 : 1,
              }}
            >
              <Ban size={14} />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
            </button>
          )}
          <Link href={`/invoice/${order?.orderNumber || id}`} className="btn btn-sm" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
            color: '#ffffff', fontWeight: 700, border: 'none', borderRadius: '10px', padding: '6px 14px', fontSize: '0.8rem',
            textDecoration: 'none',
          }}>
            <FileText size={14} />
            <span>Download Invoice</span>
          </Link>
        </div>
      </div>

      {cancellable && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'var(--color-warning-bg, rgba(245, 158, 11, 0.1))',
            color: 'var(--color-warning, #b45309)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          Free cancellation available until {formatDateTime(new Date(new Date(order.createdAt).getTime() + CANCEL_WINDOW_HOURS * 60 * 60 * 1000).toISOString())}
        </div>
      )}

      <div className="card" style={{ padding: '28px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
          Order #{order.orderNumber}
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Placed on {new Date(order.createdAt).toLocaleDateString()}
        </p>
        
        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '16px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Items</h3>
          {order.items.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img src={item.productImage} alt={item.productName} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.productName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Qty: {item.quantity} | {formatPrice(item.price)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 600 }}>Total</span>
          <span style={{ fontWeight: 700 }}>{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Speed Post tracking ID panel */}
      {order.trackingNumber && order.status !== 'cancelled' && (
        <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <Truck size={15} /> {order.carrier || 'India Post Speed Post'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>{order.trackingNumber}</span>
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
          {order.dispatchedAt && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Dispatched on {formatDateTime(order.dispatchedAt)}
            </p>
          )}
        </div>
      )}

      <div className="card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
          Order Timeline
        </h3>
        <OrderTimeline currentStatus={order.status} statusHistory={[]} />
      </div>
    </div>
  );
}
