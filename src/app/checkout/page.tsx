'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, getLanguageDisplay, isValidEmail, isValidMobile, isValidPinCode, generateOrderId } from '@/lib/utils';
import { DELIVERY_CHARGE, ORIGINAL_DELIVERY_CHARGE, INDIAN_STATES } from '@/lib/data';
import { Address, Order } from '@/types';
import { invalidateCache } from '@/lib/api-cache';
import styles from './checkout.module.css';
import { 
  MapPin, 
  ClipboardList, 
  Check, 
  User, 
  Phone, 
  Mail, 
  Home, 
  Map, 
  Hash, 
  AlertCircle, 
  ArrowLeft, 
  CreditCard,
  Lock,
  ShoppingBag,
  CheckCircle2,
  Copy,
  ArrowRight,
  Truck
} from 'lucide-react';

// ─── Razorpay Types ──────────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: () => void) => void;
}
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = ['Delivery Address', 'Order Review'];

/** Dynamically load the Razorpay checkout.js script */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const total = subtotal + DELIVERY_CHARGE;
  const { user, isAuthenticated, isLoading } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const stepRef = useRef(0); // persist step across re-renders caused by auth state changes
  const [loading, setLoading] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Keep stepRef in sync with step state
  const goToStep = (n: number) => { stepRef.current = n; setStep(n); };

  const [address, setAddress] = useState<Address>({
    fullName: '',
    mobile: '',
    email: '',
    houseOrFlat: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pinCode: '',
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Auto-populate user details and saved default address when authenticated
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
        mobile: prev.mobile || user.phone || '',
      }));

      // Fetch saved address book to auto-populate default address
      if (user.id) {
        fetch(`/api/user/addresses?userId=${user.id}`)
          .then(res => res.json())
          .then(data => {
            if (data?.addresses && data.addresses.length > 0) {
              const def = data.addresses.find((a: any) => a.isDefault) || data.addresses[0];
              if (def) {
                setAddress({
                  fullName: def.fullName || user.name || '',
                  mobile: def.mobile || user.phone || '',
                  email: def.email || user.email || '',
                  houseOrFlat: def.houseOrFlat || '',
                  street: def.street || '',
                  area: def.area || '',
                  city: def.city || '',
                  state: def.state || '',
                  pinCode: def.pinCode || '',
                });
              }
            }
          })
          .catch(err => console.warn('Could not prefill address:', err));
      }
    }
  }, [user]);

  // Auth Protection Gate: Redirect if not logged in
  // NOTE: Do NOT redirect if payment is in progress (loading=true) or step>0
  // because auth tokens may briefly flicker on production causing a false sign-out
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !loading && stepRef.current === 0) {
      toast.info('Please sign in to proceed with checkout');
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, isLoading, loading, router, toast]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Verifying session...</p>
      </div>
    );
  }

  // ─── Order Confirmed Pop-up Modal ──────────────────────────────────────────
  if (isOrderCompleted && completedOrderId) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.3s ease',
      }}>
        <div style={{
          background: 'var(--color-bg-card, #ffffff)',
          border: '1px solid var(--color-border, #e2e8f0)',
          borderRadius: '24px',
          maxWidth: '520px',
          width: '100%',
          padding: '36px 28px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}>
          {/* Animated Success Badge */}
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: '#10B981',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.15)',
          }}>
            <CheckCircle2 size={46} strokeWidth={2.2} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--color-text-primary, #0f172a)',
            marginBottom: '6px',
            letterSpacing: '-0.5px'
          }}>
            Order Confirmed!
          </h2>
          <p style={{
            color: 'var(--color-text-secondary, #475569)',
            fontSize: '0.95rem',
            marginBottom: '20px',
          }}>
            Payment completed successfully! We are preparing your study materials.
          </p>

          {/* Order ID Box */}
          <div style={{
            background: 'var(--color-bg-page, #f8fafc)',
            border: '1px dashed var(--color-border, #cbd5e1)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '22px',
          }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #64748b)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                Order Reference
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.05rem', color: '#2563eb' }}>
                #{completedOrderId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(completedOrderId);
                setCopiedOrderId(true);
                setTimeout(() => setCopiedOrderId(false), 2000);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--color-bg-card, #ffffff)',
                border: '1px solid var(--color-border, #e2e8f0)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: copiedOrderId ? '#10B981' : 'var(--color-text-primary)',
              }}
            >
              {copiedOrderId ? <Check size={14} /> : <Copy size={14} />}
              {copiedOrderId ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Summary Details */}
          <div style={{
            background: 'var(--color-bg-page, #f8fafc)',
            borderRadius: '14px',
            padding: '14px 18px',
            textAlign: 'left',
            marginBottom: '24px',
            fontSize: '0.85rem',
            color: 'var(--color-text-secondary, #475569)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Paid:</span>
              <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>{formatPrice(total)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Delivery Via:</span>
              <span>India Post Speed Post</span>
            </div>
            {address?.fullName && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recipient:</span>
                <span>{address.fullName} ({address.pinCode})</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href={`/order-confirmation/${completedOrderId}`}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
              }}
            >
              View Order Details &amp; Invoice <ArrowRight size={18} />
            </Link>
            <Link
              href={`/track-order?orderNumber=${completedOrderId}`}
              className="btn btn-ghost"
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '0.85rem',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Truck size={16} /> Track Order Progress
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', padding: '24px', background: 'var(--color-bg-page)', borderRadius: '50%', marginBottom: '24px', color: 'var(--color-primary)' }}>
          <Lock size={48} strokeWidth={1.5} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '8px' }}>
          Authentication Required
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Please log in or create an account to proceed with your order.
        </p>
        <Link href="/login?redirect=/checkout" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
          Sign In to Continue Checkout
        </Link>
      </div>
    );
  }

  // Redirect if cart is empty (only when not in middle of successful order placement)
  if (items.length === 0 && !isOrderCompleted) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', maxWidth: '450px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', padding: '24px', background: 'var(--color-bg-page)', borderRadius: '50%', marginBottom: '24px', color: 'var(--color-primary)' }}>
          <ShoppingBag size={48} strokeWidth={1.5} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '8px' }}>Your Cart is Empty</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>Add items to continue with checkout</p>
        <Link href="/study-materials" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>Browse Study Materials</Link>
      </div>
    );
  }

  const validateAddress = (): boolean => {
    const e: Record<string, string> = {};
    if (!address.fullName.trim()) e.fullName = 'Full name is required';
    if (!address.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!isValidMobile(address.mobile)) e.mobile = 'Invalid mobile number';
    if (!address.email.trim()) e.email = 'Email is required';
    else if (!isValidEmail(address.email)) e.email = 'Invalid email address';
    if (!address.houseOrFlat.trim()) e.houseOrFlat = 'House/Flat number is required';
    if (!address.street.trim()) e.street = 'Street is required';
    if (!address.city.trim()) e.city = 'City is required';
    if (!address.state) e.state = 'State is required';
    if (!address.pinCode.trim()) e.pinCode = 'PIN code is required';
    else if (!isValidPinCode(address.pinCode)) e.pinCode = 'Invalid 6-digit PIN code';
    setAddressErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddressContinue = () => {
    if (validateAddress()) goToStep(1);
  };

  // ─── Razorpay Payment Flow ─────────────────────────────────────────────────
  const handlePlaceOrder = async () => {

    setLoading(true);

    try {
      // 1. Load Razorpay checkout.js script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error('Payment gateway failed to load. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }

      // 2. Create a Razorpay order on the server
      const orderRes = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            language: item.language,
            quantity: item.quantity,
          })),
          currency: 'INR',
          receipt: `tep_${Date.now()}`,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        if (orderRes.status === 409 && Array.isArray(orderData.stockIssues) && orderData.stockIssues.length > 0) {
          const names = orderData.stockIssues.map((i: any) => i.productName).join(', ');
          toast.error(`Sorry, some items just went out of stock: ${names}. Please update your cart.`);
          setLoading(false);
          router.push('/cart');
          return;
        }
        toast.error(orderData.error || 'Could not initiate payment. Please try again.');
        setLoading(false);
        return;
      }

      if (typeof orderData.total === 'number' && Math.abs(orderData.total - total) > 0.5) {
        toast.error('Prices were just updated. Please review your cart before paying again.');
        setLoading(false);
        router.push('/cart');
        return;
      }

      if (!orderData.orderId) {
        toast.error('Could not initiate payment. Please try again.');
        setLoading(false);
        return;
      }

      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TX68FfdLjGMVlE';

      const options: RazorpayOptions = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Tenali Exam Publishers',
        description: `Order for ${items.length} item(s)`,
        order_id: orderData.orderId,
        image: '/images/logo.png',
        prefill: {
          name: address.fullName || user?.name || '',
          email: address.email || user?.email || '',
          contact: address.mobile || user?.phone || '',
        },
        theme: {
          color: '#1a2b4c',
        },

        // 4. Handle successful payment
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            // Verify payment signature and create order in database
            const verifyRes = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                userId: user?.id || null,
                items,
                subtotal,
                deliveryCharge: DELIVERY_CHARGE,
                total,
                deliveryAddress: address,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              toast.error('Payment verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id);
              setLoading(false);
              return;
            }

            const finalOrderId = verifyData.orderId;

            // Local cache fallback for orders page
            const newOrder: Order = {
              id: finalOrderId,
              orderNumber: finalOrderId,
              items: items.map(item => ({
                productId: item.productId,
                productName: item.productName,
                productSlug: item.productSlug,
                productImage: item.productImage,
                price: item.price,
                language: item.language,
                quantity: item.quantity,
                bundleTitle: item.bundleTitle,
                booksIncluded: item.booksIncluded,
              })),
              subtotal,
              deliveryCharge: DELIVERY_CHARGE,
              total,
              deliveryAddress: address,
              status: 'placed',
              paymentStatus: 'paid',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            try {
              const existing = localStorage.getItem('tep_orders');
              const ordersList: Order[] = existing ? JSON.parse(existing) : [];
              ordersList.unshift(newOrder);
              localStorage.setItem('tep_orders', JSON.stringify(ordersList));
            } catch {}

            setCompletedOrderId(finalOrderId);
            setIsOrderCompleted(true);
            clearCart();

            if (user?.id) {
              invalidateCache(`/api/user/addresses?userId=${user.id}`);
              invalidateCache(`/api/user/orders?userId=${user.id}`);
              invalidateCache('/api/admin');
            }

            toast.success('Payment successful! Order placed.');
            // Allow user to see the confirmed order popup, then auto-redirect
            setTimeout(() => {
              router.push(`/order-confirmation/${finalOrderId}`);
            }, 4000);
          } catch (err) {
            console.error('Error verifying payment:', err);
            toast.error('An error occurred after payment. Please contact support.');
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            toast.info('Payment was cancelled. Your cart is still saved.');
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      // Handle payment failure inside the modal
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again or use a different payment method.');
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Something went wrong during checkout. Please try again.');
      setLoading(false);
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    if (addressErrors[field]) setAddressErrors(prev => ({ ...prev, [field]: '' }));
  };

  const getFieldIcon = (field: keyof Address) => {
    switch (field) {
      case 'fullName': return <User size={18} />;
      case 'mobile': return <Phone size={18} />;
      case 'email': return <Mail size={18} />;
      case 'houseOrFlat': return <Home size={18} />;
      case 'street': return <MapPin size={18} />;
      case 'area': return <MapPin size={18} />;
      case 'city': return <Map size={18} />;
      case 'state': return <Map size={18} />;
      case 'pinCode': return <Hash size={18} />;
      default: return null;
    }
  };

  const renderField = (
    id: string, 
    label: string, 
    field: keyof Address, 
    type = 'text', 
    placeholder = '', 
    inputMode?: 'text' | 'tel' | 'numeric' | 'email',
    autoComplete?: string,
    maxLength?: number
  ) => {
    const icon = getFieldIcon(field);
    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel} htmlFor={id}>{label} *</label>
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.inputIcon}>{icon}</span>}
          {field === 'state' ? (
            <select 
              id={id} 
              className={`${styles.formSelect} ${addressErrors[field] ? styles.error : ''}`} 
              value={address[field]} 
              onChange={e => handleAddressChange(field, e.target.value)}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input 
              id={id} 
              type={type} 
              inputMode={inputMode}
              autoComplete={autoComplete}
              maxLength={maxLength}
              className={`${styles.formInput} ${addressErrors[field] ? styles.error : ''}`} 
              placeholder={placeholder} 
              value={address[field]} 
              onChange={e => handleAddressChange(field, e.target.value)} 
            />
          )}
        </div>
        {addressErrors[field] && (
          <span className={styles.formError}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            {addressErrors[field]}
          </span>
        )}
      </div>
    );
  };

  const handleBackToProduct = () => {
    const productSlug = items[0]?.productSlug;
    if (productSlug) {
      router.push(`/study-materials/${productSlug}`);
    } else {
      router.push('/study-materials');
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      {/* Responsive Header Bar */}
      <header className={styles.checkoutHeaderBar}>
        <div className={`container ${styles.checkoutHeaderInner}`}>
          <button
            type="button"
            onClick={handleBackToProduct}
            className={styles.backBtnNav}
            aria-label="Back to Product"
          >
            <ArrowLeft size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>Back to Product</span>
          </button>
          
          <h1 className={styles.checkoutTitle}>Checkout</h1>

          <div className={styles.checkoutBadgeSecure}>
            <Lock size={13} />
            <span>Secure 256-bit</span>
          </div>
        </div>
      </header>

      <div className={`container ${styles.checkoutInner}`}>
        {/* Progress Steps */}
        <div className={styles.stepsWrap}>
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isActive = i === step;
            
            const getStepIcon = () => {
              if (isCompleted) return <Check size={18} strokeWidth={3} />;
              return i === 0 ? <MapPin size={18} /> : <ClipboardList size={18} />;
            };

            return (
              <div key={i} className={styles.stepItem}>
                <button
                  type="button"
                  className={`${styles.stepBtn} ${isCompleted ? styles.stepBtnActive : ''}`}
                  onClick={() => isCompleted && goToStep(i)}
                  aria-label={`Step ${i + 1}: ${s}`}
                >
                  <div
                    className={styles.stepNumber}
                    style={{
                      background: isCompleted 
                        ? '#10B981' 
                        : (isActive ? 'linear-gradient(135deg, #1a2b4c 0%, #3b82f6 100%)' : 'var(--color-white)'),
                      border: (!isCompleted && !isActive) ? '1.5px solid var(--color-border)' : 'none',
                      color: (isCompleted || isActive) ? '#ffffff' : 'var(--color-text-muted)',
                      boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.25)' : 'none',
                    }}
                  >
                    {getStepIcon()}
                  </div>
                  <span
                    className={styles.stepLabel}
                    style={{
                      color: (isCompleted || isActive) ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    {s}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={styles.stepDivider}
                    style={{
                      background: isCompleted ? '#10B981' : 'var(--color-border)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Address */}
        {step === 0 && (
          <div className={`card ${styles.card}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 className={styles.cardTitle} style={{ margin: 0 }}>
                Delivery Address
              </h2>
              {user && (
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', background: 'var(--color-bg-page)', padding: '6px 12px', borderRadius: '12px', border: '1px solid var(--color-border-light)', fontWeight: 500 }}>
                  Logged in as <strong style={{ color: 'var(--color-text-primary)' }}>{user.name}</strong>
                </span>
              )}
            </div>

            <div className={styles.formGrid}>
              {renderField('fullName', 'Full Name', 'fullName', 'text', 'Your full name', 'text', 'name')}
              {renderField('mobile', 'Mobile Number', 'mobile', 'tel', '10-digit mobile number', 'tel', 'tel', 10)}
              {renderField('email', 'Email Address', 'email', 'email', 'your@email.com', 'email', 'email')}
              {renderField('houseOrFlat', 'House / Flat Number', 'houseOrFlat', 'text', 'House/Flat number', 'text', 'address-line1')}
              {renderField('street', 'Street', 'street', 'text', 'Street name', 'text', 'address-line2')}
              {renderField('area', 'Area / Locality', 'area', 'text', 'Area / Locality', 'text')}
              {renderField('city', 'City', 'city', 'text', 'City', 'text', 'address-level2')}
              {renderField('state', 'State', 'state')}
              {renderField('pinCode', 'PIN Code', 'pinCode', 'text', '6-digit PIN code', 'numeric', 'postal-code', 6)}
            </div>
            <div className={styles.orderTotalBar}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Order Total ({items.length} item{items.length > 1 ? 's' : ''}): </span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>{formatPrice(total)}</strong>
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#10B981', fontWeight: 650 }}>FREE Postal Delivery</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Secure Razorpay UPI & Cards</span>
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={handleAddressContinue} className={`btn btn-primary btn-lg ${styles.continueBtn}`}>
                Proceed to Payment ({formatPrice(total)}) →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className={`card ${styles.card}`} style={{ marginBottom: '24px' }}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitleInHeader}>
                  Delivery Address
                </h2>
                <button type="button" onClick={() => goToStep(0)} className="btn btn-ghost btn-sm" style={{ minHeight: '36px', borderRadius: '10px' }}>
                  Edit Address
                </button>
              </div>
              <div className={styles.addressReviewText}>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  {address.fullName}
                </div>
                <div style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '0.925rem' }}>
                  {address.houseOrFlat}, {address.street}<br />
                  {address.area && <>{address.area}<br /></>}
                  {address.city}, {address.state} — {address.pinCode}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border-light)', paddingTop: '12px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                    <Phone size={16} color="var(--color-primary)" />
                    <span>{address.mobile}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                    <Mail size={16} color="var(--color-primary)" />
                    <span>{address.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`card ${styles.card}`}>
              <h2 className={styles.cardTitle}>
                Order Summary
              </h2>

              {items.map(item => (
                <div key={item.id} className={styles.reviewItem}>
                  <img src={item.productImage} alt="" className={styles.reviewItemImg} />
                  <div className={styles.reviewItemDetails}>
                    <div className={styles.reviewItemName}>{item.productName}</div>
                    {(item.bundleTitle || (item.booksIncluded && item.booksIncluded > 1)) && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 650, marginTop: '2px' }}>
                        {item.bundleTitle ? item.bundleTitle : ''} {item.booksIncluded && item.booksIncluded > 1 ? `(Includes ${item.booksIncluded} Books)` : ''}
                      </div>
                    )}
                    <div className={styles.reviewItemMeta}>
                      Medium: {getLanguageDisplay(item.language)} · Qty: {item.quantity} {item.quantity > 1 && item.booksIncluded && item.booksIncluded > 1 ? `(${item.booksIncluded * item.quantity} books total)` : ''}
                    </div>
                  </div>
                  <div className={styles.reviewItemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}>
                  <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Delivery Charges</span>
                  <div className={styles.deliveryFeeCol}>
                    <span className={styles.strikethroughFee}>{formatPrice(ORIGINAL_DELIVERY_CHARGE)}</span>
                    <span className={styles.freeFee}>FREE</span>
                  </div>
                </div>
                <div className={styles.freeDeliveryBanner}>
                  <Check size={16} strokeWidth={3} />
                  <span><strong>Special Offer:</strong> Free Postal Delivery Applied!</span>
                </div>
                <hr className="divider" style={{ margin: '4px 0', borderTop: '1px solid var(--color-border-light)' }} />
                <div className={styles.summaryTotal}>
                  <span>Total Amount</span>
                  <span style={{ fontFamily: 'var(--font-heading)' }}>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Payment trust badge */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                marginTop: '16px', 
                padding: '10px 16px',
                background: 'var(--color-bg-page)',
                borderRadius: '10px',
                border: '1px solid var(--color-border-light)',
                fontSize: '0.78rem',
                color: 'var(--color-text-muted)',
              }}>
                <Lock size={13} />
                <span>100% Secure Payment via Razorpay · UPI, Cards, NetBanking accepted</span>
              </div>

              <div className={styles.reviewActions}>
                <button type="button" onClick={() => goToStep(0)} className={`btn btn-secondary btn-lg ${styles.backBtn}`}>
                  <ArrowLeft size={18} style={{ marginRight: '8px' }} />
                  Back
                </button>
                <button type="button" onClick={handlePlaceOrder} disabled={loading} className={`btn btn-primary btn-lg ${styles.payBtn}`}>
                  {loading ? (
                    'Opening Payment Gateway...'
                  ) : (
                    <>
                      <CreditCard size={18} style={{ marginRight: '8px' }} />
                      Pay {formatPrice(total)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
