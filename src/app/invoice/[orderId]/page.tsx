'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, formatDate } from '@/lib/utils';
import { COMPANY_ADDRESS, SUPPORT_EMAIL, COMPANY_PHONE } from '@/lib/data';
import { downloadInvoicePDF, numberToWordsInRupees } from '@/utils/invoicePdf';
import {
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Printer,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  FileText,
  Globe
} from 'lucide-react';

interface OrderItem {
  id: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number | string;
  language: string;
  quantity: number;
  bundleTitle?: string;
  booksIncluded?: number;
}

interface DeliveryAddress {
  fullName: string;
  mobile: string;
  email: string;
  houseOrFlat: string;
  street: string;
  area?: string;
  city: string;
  state: string;
  pinCode: string;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number | string;
  deliveryCharge: number | string;
  total: number | string;
  status: string;
  paymentStatus: string;
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  deliveryAddress: DeliveryAddress;
  items: OrderItem[];
}

export default function InvoicePage(): React.JSX.Element {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/user/orders/${orderId}`);
        if (!res.ok) throw new Error('Order not found');
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleDownloadPDF = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      await downloadInvoicePDF('invoice-printable', `Tenali_Invoice_${order.orderNumber}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <Loader2 className="animate-spin text-blue-600" size={28} />
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Generating official invoice...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px', padding: '20px' }}>
        <AlertCircle size={44} className="text-red-500" />
        <p style={{ color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>{error || 'Order not found'}</p>
        <Link href="/account/orders" className="btn btn-primary btn-sm">Back to Orders</Link>
      </div>
    );
  }

  const addr = order.deliveryAddress;
  const invoiceNumber = `INV-${order.orderNumber}`;
  const orderDate = new Date(order.createdAt);
  const formattedDate = formatDate(order.createdAt);
  const formattedTime = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const totalNum = typeof order.total === 'string' ? parseFloat(order.total) : order.total;
  const amountInWords = numberToWordsInRupees(totalNum);

  return (
    <>
      {/* High-Definition Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoice-printable, #invoice-printable * { visibility: visible !important; }
          #invoice-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print { display: none !important; }
          #invoice-printable {
            background: white !important;
            color: #0f172a !important;
          }
          @page {
            margin: 10mm;
            size: A4;
          }
        }
      `}</style>

      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '24px 16px 80px 16px' }}>
        
        {/* Action Top Bar */}
        <div className="no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}>
          <Link href={`/order-confirmation/${order.orderNumber}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            color: 'var(--color-text-secondary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none'
          }}>
            <ArrowLeft size={16} /> Back to Order Confirmation
          </Link>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '9px 20px', fontWeight: 700 }}
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {isDownloading ? 'Generating High-Res PDF...' : 'Download PDF'}
            </button>
            
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '9px 18px', fontWeight: 700 }}
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </div>

        {/* ======== REAL-WORLD CORPORATE TAX INVOICE DOCUMENT ======== */}
        <div
          id="invoice-printable"
          ref={invoiceRef}
          style={{
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px -12px rgba(15, 23, 42, 0.08)',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '36px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px',
            borderBottom: '4px solid #2563eb',
          }}>
            {/* Publisher Brand Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#ffffff',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.8)'
                }}>
                  <img src="/images/logo.png" alt="Tenali Exams Publishers Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>

                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.3px', color: '#ffffff' }}>
                    TENALI EXAMS PUBLISHERS
                  </h1>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>
                    Excellence in Every Page
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.65 }}>
                <div>Main Road, Near Head Post Office</div>
                <div>Tenali, Guntur District, Andhra Pradesh - 522201</div>
                <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} /> Phone: {COMPANY_PHONE}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} /> Email: {SUPPORT_EMAIL}
                  </span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                  GSTIN / HSN STATUS: <span style={{ color: '#60a5fa' }}>EXEMPTED (Educational Printed Books under HSN 4901)</span>
                </div>
              </div>
            </div>

            {/* Document Details Column */}
            <div style={{ textAlign: 'right', minWidth: '220px' }}>
              <div style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.25)',
                border: '1px solid rgba(96, 165, 250, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#93c5fd',
                marginBottom: '12px'
              }}>
                TAX INVOICE / BILL OF SUPPLY
              </div>

              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '4px', fontFamily: 'monospace' }}>
                {invoiceNumber}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                <div><strong>Invoice Date:</strong> {formattedDate}</div>
                <div><strong>Invoice Time:</strong> {formattedTime}</div>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '12px',
                padding: '5px 14px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                background: order.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: order.paymentStatus === 'paid' ? '#34d399' : '#fca5a5',
                border: `1px solid ${order.paymentStatus === 'paid' ? '#10b981' : '#ef4444'}`,
              }}>
                <CheckCircle2 size={13} /> {order.paymentStatus === 'paid' ? 'PAYMENT RECEIVED' : order.paymentStatus.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Billed To & Supplier Information Box */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            padding: '28px 40px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
          }}>
            {/* Customer Information */}
            <div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#64748b',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <FileText size={13} className="text-blue-600" /> Billed To & Delivery Address
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                {addr.fullName}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.6 }}>
                <div>{addr.houseOrFlat}, {addr.street}</div>
                {addr.area && <div>{addr.area}</div>}
                <div>{addr.city}, {addr.state} - <strong style={{ color: '#0f172a' }}>{addr.pinCode}</strong></div>
                <div style={{ marginTop: '6px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} /> Phone: {addr.mobile}
                </div>
                {addr.email && (
                  <div style={{ fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Mail size={13} /> Email: {addr.email}
                  </div>
                )}
              </div>
            </div>

            {/* Order & Shipment Information */}
            <div>
              <div style={{
                fontSize: '0.68rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                color: '#64748b',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Building2 size={13} className="text-blue-600" /> Order & Shipping Details
              </div>
              <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.8 }}>
                <div><strong style={{ color: '#0f172a' }}>Order Reference:</strong> #{order.orderNumber}</div>
                <div><strong style={{ color: '#0f172a' }}>Order Date:</strong> {formattedDate}</div>
                <div><strong style={{ color: '#0f172a' }}>Fulfillment Status:</strong>{' '}
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                  }}>
                    {order.status}
                  </span>
                </div>
                <div><strong style={{ color: '#0f172a' }}>Shipping Carrier:</strong> {order.carrier || 'India Post (Speed Post Parcel)'}</div>
                {order.trackingNumber && (
                  <div><strong style={{ color: '#0f172a' }}>Tracking ID:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>{order.trackingNumber}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Itemized Goods Table */}
          <div style={{ padding: '32px 40px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.85rem',
            }}>
              <thead>
                <tr style={{
                  borderBottom: '2px solid #0f172a',
                  background: '#f1f5f9',
                }}>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Item Description & Details</th>
                  <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>HSN Code</th>
                  <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Language</th>
                  <th style={{ textAlign: 'center', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Unit Rate (₹)</th>
                  <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Taxable Amt</th>
                  <th style={{ textAlign: 'right', padding: '12px 10px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#334155' }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const unitPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <tr key={item.id} style={{
                      borderBottom: '1px solid #e2e8f0',
                    }}>
                      <td style={{ padding: '16px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '16px 10px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', marginBottom: '2px' }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Tenali Exams Publications • Departmental Postal Exam Guide
                        </div>
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                        4901
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          textTransform: 'capitalize',
                        }}>
                          {item.language}
                        </span>
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                        {formatPrice(unitPrice)}
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: 700, color: '#475569' }}>
                        {formatPrice(lineTotal)}
                      </td>
                      <td style={{ padding: '16px 10px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                        {formatPrice(lineTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Amount in Words & Totals Box */}
          <div style={{
            padding: '0 40px 32px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'flex-start',
          }}>
            
            {/* Left Column: Amount in Words & Payment Note */}
            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '4px' }}>
                Total Amount In Words
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', fontStyle: 'italic' }}>
                {amountInWords}
              </div>

              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
                <div><strong style={{ color: '#0f172a' }}>Payment Method:</strong> Online Payment (Razorpay / UPI)</div>
                <div><strong style={{ color: '#0f172a' }}>Tax Status:</strong> Exempted (0% GST on HSN 4901 Educational Books)</div>
              </div>
            </div>

            {/* Right Column: Calculation Summary */}
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '20px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '0.88rem',
              }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Subtotal (Taxable Value)</span>
                <span style={{ color: '#0f172a', fontWeight: 700 }}>{formatPrice(order.subtotal)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
                fontSize: '0.88rem',
              }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Shipping & Delivery Fee</span>
                <span style={{
                  fontWeight: 800,
                  color: parseFloat(String(order.deliveryCharge)) === 0 ? '#10b981' : '#0f172a',
                }}>
                  {parseFloat(String(order.deliveryCharge)) === 0 ? 'FREE DELIVERY' : formatPrice(order.deliveryCharge)}
                </span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #cbd5e1',
                fontSize: '0.88rem',
              }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Integrated Tax / GST (0%)</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>₹0.00 (Exempt)</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '14px 0 6px 0',
                fontSize: '1.15rem',
              }}>
                <span style={{ fontWeight: 900, color: '#0f172a' }}>Grand Total</span>
                <span style={{ fontWeight: 900, color: '#2563eb', fontSize: '1.3rem', letterSpacing: '-0.5px' }}>
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

          </div>

          {/* Footer & Digital Signatory Seal */}
          <div style={{
            borderTop: '2px solid #e2e8f0',
            padding: '28px 40px',
            background: '#f8fafc',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px',
              fontSize: '0.78rem',
              color: '#64748b',
              lineHeight: 1.6,
            }}>
              <div>
                <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.68rem', marginBottom: '6px', color: '#334155' }}>
                  Terms & Conditions
                </div>
                <div>• This is an official computer-generated Tax Invoice / Bill of Supply.</div>
                <div>• Printed books are exempt from GST under HSN Code 4901.</div>
                <div>• Express Postal dispatch via India Post Speed Post.</div>
              </div>

              <div>
                <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.68rem', marginBottom: '6px', color: '#334155' }}>
                  Customer Support
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={12} /> Phone: {COMPANY_PHONE}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={12} /> Email: {SUPPORT_EMAIL}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={12} /> www.tenaliexamspublishers.com
                </div>
              </div>

              {/* Digital Seal Stamp Box */}
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'inline-block',
                  textAlign: 'center',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  border: '2px dashed #94a3b8',
                  background: '#ffffff',
                }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#1e293b' }}>
                    Tenali Exams Publishers
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#16a34a', fontWeight: 800, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <ShieldCheck size={14} /> DIGITAL SEAL VERIFIED
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px', fontWeight: 700 }}>
                    Authorized Signatory
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              textAlign: 'center',
              fontSize: '0.75rem',
              color: '#475569',
              fontWeight: 700,
            }}>
              Thank you for ordering with Tenali Exams Publishers! Wish you all the best for your competitive examinations.
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
