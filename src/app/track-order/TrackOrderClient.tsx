'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import OrderTimeline from '@/components/ui/OrderTimeline';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { SUPPORT_EMAIL } from '@/lib/data';
import { Truck, Copy, Check, ExternalLink, Package } from 'lucide-react';

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
  items: Array<{ productName: string; language: string; quantity: number }>;
  cancellable: boolean;
  cancelDeadline: string;
}

const INDIA_POST_TRACKING_URL = 'https://www.indiapost.gov.in/';

export default function TrackOrderClient(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [tracking, setTracking] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTrack = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter your Order ID');
      return;
    }
    if (!contact.trim()) {
      setError('Please enter your email or mobile number');
      return;
    }

    setLoading(true);
    setError('');
    setTracking(null);

    try {
      const params = new URLSearchParams({ orderId: orderId.trim(), contact: contact.trim() });
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

  const handleCopyTracking = () => {
    if (!tracking?.trackingNumber) return;
    navigator.clipboard.writeText(tracking.trackingNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container-narrow" style={{ maxWidth: '600px' }}>
      {/* Track Form */}
      <div className="card p-6 md:p-8">
        <form onSubmit={handleTrack}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" htmlFor="orderId">
              Order ID
            </label>
            <input
              id="orderId"
              type="text"
              className="form-input"
              placeholder="e.g. TEP-M1A2B3-X4Y5"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setError('');
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="contact">
              Email Address or Mobile Number
            </label>
            <input
              id="contact"
              type="text"
              className="form-input"
              placeholder="Enter the email or mobile used while ordering"
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
            {loading ? 'Tracking...' : 'Track Order'}
          </button>
        </form>
      </div>

      {/* Tracking Result */}
      {tracking && (
        <div className="card p-6 md:p-8 mt-6">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700 }}>
                Order #{tracking.orderNumber}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                Placed on {formatDateTime(tracking.createdAt)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total</div>
              <div style={{ fontWeight: 800 }}>{formatPrice(tracking.total)}</div>
            </div>
          </div>

          {/* Items summary */}
          {tracking.items.length > 0 && (
            <div
              style={{
                margin: '16px 0 24px',
                padding: '12px 16px',
                background: 'var(--color-bg-hover)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              {tracking.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>
                    {item.quantity}x {item.productName} <span style={{ color: 'var(--color-text-muted)' }}>({item.language})</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Speed Post tracking ID panel */}
          {tracking.trackingNumber ? (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg-card)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <Truck size={15} /> {tracking.carrier || 'India Post Speed Post'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem' }}>{tracking.trackingNumber}</span>
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
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '10px' }}>
                Paste this consignment number into the &quot;Track N Trace&quot; box on the India Post website for the latest live delivery scans.
              </p>
              {tracking.dispatchedAt && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
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
              <Package size={16} />
              A Speed Post tracking ID will appear here once your order is dispatched.
            </div>
          )}

          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.95rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            Order Status
          </h3>
          <OrderTimeline currentStatus={tracking.status} statusHistory={[]} />
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
          <Link href="/login" style={{ color: 'var(--color-pastel-blue-deeper)', fontWeight: 600 }}>
            Log in
          </Link>{' '}
          to see all your orders and manage cancellations in one place
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
          For order tracking, delivery, payment, product, or general queries, contact:
        </p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-secondary">
          Contact Support
        </a>
      </div>
    </div>
  );
}
