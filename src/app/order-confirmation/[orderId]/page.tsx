'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { SUPPORT_EMAIL } from '@/lib/data';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Truck, 
  Mail, 
  ShieldCheck, 
  ShoppingBag, 
  History,
  ArrowLeft,
  FileText
} from 'lucide-react';

export default function OrderConfirmationPage(): React.JSX.Element {
  const { orderId } = useParams<{ orderId: string }>();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{
      textAlign: 'center',
      padding: '40px 20px 80px 20px',
      maxWidth: '600px',
      margin: '0 auto',
      animation: 'fadeIn 0.4s ease',
      position: 'relative'
    }}>
      <Link href="/" style={{ position: 'absolute', left: '20px', top: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
        <ArrowLeft size={16} /> Home
      </Link>
      <style>{`
        @keyframes successScalePop {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawStroke {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-success-pop {
          animation: successScalePop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .animate-checkmark-draw path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: drawStroke 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
        }
      `}</style>

      {/* Premium Checkmark Badge */}
      <div 
        className="animate-success-pop"
        style={{
          width: '90px', 
          height: '90px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.25)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 28px',
          color: '#10B981',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.08)',
        }}
      >
        <div className="animate-checkmark-draw" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle2 size={46} strokeWidth={1.75} />
        </div>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontSize: '2.1rem',
        fontWeight: 800,
        marginBottom: '12px',
        color: 'var(--color-text-primary)',
        letterSpacing: '-0.5px'
      }}>
        Order Confirmed!
      </h1>

      <p style={{
        color: 'var(--color-text-secondary)',
        fontSize: '1rem',
        marginBottom: '28px',
        lineHeight: 1.5
      }}>
        Thank you for your order. We have verified your payment and our desk is preparing your books.
      </p>

      {/* Copyable Order ID Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 18px',
        background: 'var(--color-bg-page)',
        border: '1px solid var(--color-border-light)',
        borderRadius: '14px',
        marginBottom: '36px',
        fontSize: '0.925rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
      }}>
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Order ID:</span>
        <strong style={{ color: 'var(--color-text-primary)', letterSpacing: '0.5px' }}>{orderId}</strong>
        <button 
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy Order ID"}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            marginLeft: '4px',
            color: copied ? '#10B981' : 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
          }}
        >
          {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} />}
        </button>
      </div>

      {/* Estimated Delivery Promise Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '16px 20px',
        background: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '16px',
        marginBottom: '32px',
        textAlign: 'left',
        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.04)',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: '#3B82F6',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Truck size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 750, fontSize: '0.9rem', color: '#1E3A8A', marginBottom: '2px' }}>
            Estimated Delivery
          </div>
          <div style={{ fontSize: '0.825rem', color: '#1E40AF', fontWeight: 555, lineHeight: 1.4 }}>
            Your product will be received in <strong style={{ fontWeight: 750 }}>5 to 7 working days</strong>.
          </div>
        </div>
      </div>

      {/* Visual Tracking Stepper */}
      <div className="card" style={{ 
        padding: '24px', 
        borderRadius: '20px', 
        border: '1px solid var(--color-border-light)', 
        background: 'var(--color-white)', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)', 
        marginBottom: '32px', 
        textAlign: 'left' 
      }}>
        <h2 style={{ 
          fontSize: '1.05rem', 
          fontWeight: 750, 
          color: 'var(--color-text-primary)', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          fontFamily: 'var(--font-heading)'
        }}>
          <ShieldCheck size={18} color="var(--color-primary)" />
          Order & Payment Status
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10B981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} strokeWidth={3} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Order Placed Successfully</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>We have received your purchase request</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10B981', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} strokeWidth={3} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 650, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Payment Verified</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Verified via Digital Gateways (Paid)</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '50%', 
              background: 'rgba(59, 130, 246, 0.12)', 
              color: '#3b82f6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 650, fontSize: '0.9rem', color: '#3b82f6' }}>Processing & Packaging</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Our team is processing the shipping details</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main & Secondary Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
        <Link href={`/track-order?orderId=${orderId}`} className="btn btn-primary btn-lg" style={{ 
          justifyContent: 'center', 
          borderRadius: '16px', 
          minHeight: '52px',
          boxShadow: '0 4px 14px rgba(26, 43, 76, 0.15)',
          gap: '8px'
        }}>
          <Truck size={18} />
          Track My Order
        </Link>
        <Link href={`/invoice/${orderId}`} className="btn btn-lg" style={{ 
          justifyContent: 'center', 
          borderRadius: '16px', 
          minHeight: '52px',
          gap: '8px',
          background: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
          color: '#ffffff',
          fontWeight: 700,
          border: 'none',
          boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
        }}>
          <FileText size={18} />
          View Invoice & Download PDF
        </Link>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/account/orders" className="btn btn-secondary" style={{ 
            flex: '1 1 200px', 
            justifyContent: 'center', 
            borderRadius: '14px', 
            minHeight: '46px',
            gap: '6px'
          }}>
            <History size={16} />
            View Order History
          </Link>
          <Link href="/study-materials" className="btn btn-secondary" style={{ 
            flex: '1 1 200px', 
            justifyContent: 'center', 
            borderRadius: '14px', 
            minHeight: '46px',
            gap: '6px'
          }}>
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Glassmorphism Help Card */}
      <div style={{
        padding: '28px',
        background: 'var(--color-white)',
        borderRadius: '20px',
        border: '1px solid var(--color-border-light)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(26, 43, 76, 0.08)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Mail size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-primary)' }}>
            Need help with your order?
          </h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '0 0 10px 0' }}>
            Reach out to our support channel for instant resolution.
          </p>
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{
            color: 'var(--color-pastel-blue-deeper)',
            fontWeight: 700, 
            fontSize: '0.925rem',
            textDecoration: 'none'
          }}>
            {SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </div>
  );
}
