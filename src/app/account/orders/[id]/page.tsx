'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import OrderTimeline from '@/components/ui/OrderTimeline';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { invalidateCache } from '@/lib/api-cache';
import { FileText, Truck, Copy, Check, ExternalLink, Ban, MapPin, CreditCard, Clock, AlertCircle, X } from 'lucide-react';

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
  const [showCancelModal, setShowCancelModal] = useState(false);
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

      setOrder((prev: any) => ({
        ...prev,
        status: 'cancelled',
        paymentStatus: data.order?.paymentStatus || (data.refund ? 'refunded' : prev.paymentStatus),
        refundId: data.refund?.refundId || data.order?.refundId || prev.refundId,
        refundAmount: data.refund?.amount || data.order?.refundAmount || prev.total,
        refundStatus: data.refund?.status || data.order?.refundStatus || 'processed',
        refundedAt: data.order?.refundedAt || new Date().toISOString(),
      }));
      setShowCancelModal(false);
      invalidateCache(`/api/user/orders?userId=${user.id}`);
      toast.success(
        `Order cancelled. Full refund of ${formatPrice(order.total)} initiated (credited within 4 to 6 business days).`
      );
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
              onClick={() => setShowCancelModal(true)}
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

      {/* Delivery Address Details */}
      {(() => {
        if (!order.deliveryAddress) return null;
        let addr: any = order.deliveryAddress;
        if (typeof addr === 'string') {
          try { addr = JSON.parse(addr); } catch { return null; }
        }
        if (!addr || typeof addr !== 'object') return null;

        const name = addr.fullName || addr.full_name || addr.name || '';
        const mobile = addr.mobile || addr.phone || '';
        const house = addr.houseOrFlat || addr.house_or_flat || addr.house_flat || '';
        const street = addr.street || '';
        const area = addr.area || '';
        const city = addr.city || '';
        const state = addr.state || '';
        const pin = addr.pinCode || addr.pin_code || addr.pincode || '';

        const streetLine = [house, street].filter(Boolean).join(', ');
        const cityLine = [city, state].filter(Boolean).join(', ');

        if (!name && !streetLine && !cityLine) return null;

        return (
          <div className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              <MapPin size={16} color="var(--color-primary)" />
              <span>Delivery Address</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              {(name || mobile) && (
                <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {name} {mobile && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>({mobile})</span>}
                </div>
              )}
              {streetLine && <div>{streetLine}</div>}
              {area && <div>{area}</div>}
              {(cityLine || pin) && (
                <div>
                  {cityLine}
                  {pin && <> — <strong style={{ color: 'var(--color-text-primary)' }}>{pin}</strong></>}
                </div>
              )}
            </div>
          </div>
        );
      })()}

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

      {/* Refund Information Card for Cancelled / Refunded Orders */}
      {(order.status === 'cancelled' || order.status === 'refunded' || order.paymentStatus === 'refunded' || order.paymentStatus === 'refund_pending') && (
        <div
          className="card"
          style={{
            padding: '24px',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(37, 99, 235, 0.06) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                Full Refund Initiated
              </div>
              <div style={{ fontSize: '0.825rem', color: '#059669', fontWeight: 600 }}>
                100% money back to your original payment method
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--color-bg-card, #ffffff)',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid var(--color-border-light)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                Refund Amount
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {formatPrice(order.refundAmount || order.total)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                Estimated Credit Time
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>
                4 to 6 Business Days
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                Refund Mode
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                Standard Bank Processing
              </span>
            </div>
            {order.refundId && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>
                  Refund Reference ID
                </span>
                <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {order.refundId}
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: 'rgba(37, 99, 235, 0.08)',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '0.825rem',
              color: 'var(--color-text-primary)',
              lineHeight: 1.5,
            }}
          >
            <Clock size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Payment Method Credit:</strong> The refund is credited directly back to the payment method you used (Bank Account, UPI, Debit Card, or Credit Card). As per banking settlement standards, this will reflect in your account within <strong>4 to 6 business days</strong>. Instant refund is not supported.
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
          Order Timeline
        </h3>
        <OrderTimeline currentStatus={order.status} statusHistory={[]} />
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !cancelling && setShowCancelModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(225, 29, 72, 0.12)',
                    color: '#e11d48',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ban size={20} />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Cancel Order</h3>
              </div>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
              Are you sure you want to cancel Order <strong>#{order.orderNumber}</strong>?
            </p>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#059669', fontSize: '0.9rem', marginBottom: '6px' }}>
                <CreditCard size={16} />
                <span>Full Refund: {formatPrice(order.total)}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.45 }}>
                A full 100% refund will be automatically initiated to your original payment method. The refund will be credited to your account within <strong>4 to 6 business days</strong> via standard banking processing. (Instant refund is not supported).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setShowCancelModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 18px', fontWeight: 600 }}
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelOrder}
                className="btn btn-sm"
                style={{
                  padding: '8px 18px',
                  fontWeight: 700,
                  background: '#e11d48',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  opacity: cancelling ? 0.7 : 1,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {cancelling ? (
                  <>
                    <Clock size={14} className="animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <span>Yes, Cancel &amp; Refund</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
