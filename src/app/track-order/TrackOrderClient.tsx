'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import OrderTimeline from '@/components/ui/OrderTimeline';
import { SUPPORT_EMAIL } from '@/lib/data';

interface TrackingResult {
  id: string;
  status: string;
  history: Array<{ status: string; date: string }>;
}

export default function TrackOrderClient(): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [tracking, setTracking] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Simulated - will call API in production
    setTimeout(() => {
      setLoading(false);
      setError('Order not found. Please check your Order ID and contact details.');
    }, 1200);
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
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.1rem',
              fontWeight: 700,
              marginBottom: '24px',
            }}
          >
            Order #{tracking.id}
          </h2>
          <OrderTimeline currentStatus={tracking.status} statusHistory={tracking.history} />
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
          to automatically see your orders
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
