'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import OrderTimeline from '@/components/ui/OrderTimeline';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { FileText } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps): React.JSX.Element {
  const { id } = use(params);
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link href="/account/orders" style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>← Back to Orders</Link>
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

      <div className="card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>
          Order Timeline
        </h3>
        <OrderTimeline currentStatus={order.status} statusHistory={[]} />
      </div>
    </div>
  );
}
