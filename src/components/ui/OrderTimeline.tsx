'use client';
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  Check,
  CreditCard,
  AlertCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface OrderTimelineProps {
  currentStatus: string;
  statusHistory?: any[];
}

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', Icon: Package },
  { key: 'processing', label: 'Processing & Packing', Icon: Clock },
  { key: 'dispatched', label: 'Dispatched via Speed Post', Icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', Icon: Truck },
  { key: 'delivered', label: 'Delivered Successfully', Icon: CheckCircle },
];

const SPECIAL_STATUSES: Record<string, { label: string; color: string; Icon: any }> = {
  payment_pending: { label: 'Payment Pending', color: '#FF9800', Icon: Clock },
  payment_failed: { label: 'Payment Failed', color: '#E53935', Icon: XCircle },
  cancelled: { label: 'Cancelled', color: '#E53935', Icon: XCircle },
  returned: { label: 'Returned', color: '#FF9800', Icon: RotateCcw },
  refunded: { label: 'Refunded', color: '#2196F3', Icon: CreditCard },
};

export default function OrderTimeline({ currentStatus, statusHistory = [] }: OrderTimelineProps) {
  const specialStatus = SPECIAL_STATUSES[currentStatus];
  if (specialStatus) {
    const SpecialIcon = specialStatus.Icon;
    return (
      <div style={{
        padding: '24px',
        background: `${specialStatus.color}11`,
        border: `1px solid ${specialStatus.color}33`,
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: `${specialStatus.color}22`, marginBottom: '10px' }}>
          <SpecialIcon size={28} color={specialStatus.color} />
        </div>
        <div style={{ fontWeight: 700, color: specialStatus.color, fontSize: '1.1rem' }}>
          {specialStatus.label}
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);

  return (
    <div style={{ padding: '8px 0' }}>
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const historyEntry = statusHistory.find(h => h.status === step.key);
        const StepIcon = step.Icon;

        return (
          <div key={step.key} style={{
            display: 'flex',
            gap: '16px',
            minHeight: index < STATUS_STEPS.length - 1 ? '60px' : 'auto',
          }}>
            {/* Step Marker */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '32px',
              flexShrink: 0,
            }}>
              <div style={{
                width: isCurrent ? 32 : 24,
                height: isCurrent ? 32 : 24,
                borderRadius: '50%',
                background: isCompleted ? 'var(--color-primary)' : 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                transition: 'all 0.3s ease',
                boxShadow: isCurrent ? '0 0 0 4px rgba(26, 43, 76, 0.15)' : 'none',
              }}>
                {isCompleted ? (
                  isCurrent ? <StepIcon size={16} /> : <Check size={14} strokeWidth={3} />
                ) : (
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9CA3AF' }} />
                )}
              </div>
              {index < STATUS_STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  width: '2px',
                  background: index < currentIndex ? 'var(--color-primary)' : 'var(--color-border)',
                  marginTop: '4px',
                  marginBottom: '4px',
                }} />
              )}
            </div>

            {/* Step Label & Info */}
            <div style={{ paddingBottom: '16px', flex: 1 }}>
              <div style={{
                fontWeight: isCurrent ? 700 : isCompleted ? 600 : 400,
                fontSize: isCurrent ? '0.95rem' : '0.88rem',
                color: isCompleted ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                marginBottom: '2px',
              }}>
                {step.label}
              </div>
              {historyEntry && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {formatDateTime(historyEntry.created_at)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
