'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, getLanguageDisplay } from '@/lib/utils';
import { DELIVERY_CHARGE, ORIGINAL_DELIVERY_CHARGE } from '@/lib/data';
import { ShoppingBag, Sparkles, ArrowLeft } from 'lucide-react';
import styles from './cart.module.css';

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, totalItems, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const total = subtotal + (items.length > 0 ? DELIVERY_CHARGE : 0);

  const handleRemove = (itemId: string, name: string) => {
    removeItem(itemId);
    toast.info(`${name} removed from cart`);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      // If referrer is checkout or cart, go to home
      if (referrer && (referrer.includes('/checkout') || referrer.includes('/cart'))) {
        router.push('/');
        return;
      }
      // If there is browser history from this domain, go back
      if (window.history.length > 1 && referrer && referrer.includes(window.location.host)) {
        router.back();
        return;
      }
    }
    router.push('/');
  };

  const handleProceedToCheckout = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info('Please log in or create an account to proceed with checkout.');
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', position: 'relative' }}>
        <button 
          onClick={handleBack} 
          style={{ position: 'absolute', left: '20px', top: '24px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--color-bg-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--color-text-muted)'
        }}>
          <ShoppingBag size={36} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '8px' }}>Your Cart is Empty</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Add study materials to your cart to get started
        </p>
        <Link href="/study-materials" className="btn btn-primary btn-lg">
          Browse Study Materials
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <div className="page-header" style={{ position: 'relative' }}>
        <button 
          onClick={handleBack} 
          style={{ position: 'absolute', left: '20px', top: '24px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Go back"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="page-title">Shopping Cart</h1>
        <p className="page-subtitle">{totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart</p>
      </div>

      <div className="container">
        <div className={styles.cartLayout}>
          {/* Cart Items */}
          <div className={styles.itemsList}>
            {items.map(item => (
              <div key={item.id} className={`card ${styles.cartItem}`}>
                <Link href={`/study-materials/${item.productSlug}`} className={styles.itemImageLink}>
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className={styles.itemImage}
                    width={90}
                    height={120}
                  />
                </Link>

                <div className={styles.itemInfo}>
                  <div className={styles.itemHeader}>
                    <div>
                      <Link href={`/study-materials/${item.productSlug}`} className={styles.itemTitle}>
                        {item.productName}
                      </Link>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, marginTop: '2px' }}>
                        {item.bundleTitle || (item.productId === 'p1' ? '2-Book Preparation Set' : '3-Book Preparation Set')}
                      </div>
                    </div>
                    <div className={styles.itemPrice}>
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.78rem', background: 'var(--color-bg-page)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontWeight: 600 }}>
                      Includes: {item.booksIncluded || (item.productId === 'p1' ? 2 : 3)} Books
                    </span>
                    {item.quantity > 1 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        ({(item.booksIncluded || (item.productId === 'p1' ? 2 : 3)) * item.quantity} physical books total)
                      </span>
                    )}
                  </div>

                  {item.badge && (
                    <span className={`badge badge-blue ${styles.itemBadge}`}>{item.badge}</span>
                  )}

                  <span className={styles.itemMedium}>
                    Medium: <strong>{getLanguageDisplay(item.language)}</strong>
                  </span>

                  <div className={styles.itemFooter}>
                    {/* Quantity */}
                    <div className={styles.qtyControl}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className={styles.qtyBtn}
                        style={{ opacity: item.quantity <= 1 ? 0.4 : 1 }}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className={styles.qtyCount}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={styles.qtyBtn}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id, item.productName)}
                      className={styles.removeBtn}
                      aria-label={`Remove ${item.productName} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className={`card ${styles.summaryCard}`}>
            <h2 className={styles.summaryTitle}>
              Order Summary
            </h2>

            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Delivery Charges</span>
                <div className={styles.deliveryFeeCol}>
                  <span className={styles.strikethroughFee}>{formatPrice(ORIGINAL_DELIVERY_CHARGE)}</span>
                  <span className={styles.freeFee}>FREE</span>
                </div>
              </div>
              <div className={styles.freeDeliveryBanner} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--color-primary)" />
                <span><strong>Special Offer:</strong> Free Postal Delivery Applied!</span>
              </div>
              <hr className="divider" style={{ margin: '4px 0' }} />
              <div className={styles.summaryTotal}>
                <span>Total Amount</span>
                <span style={{ fontFamily: 'var(--font-heading)' }}>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className={`btn btn-primary btn-lg ${styles.checkoutBtn}`}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {isAuthenticated ? 'Proceed to Checkout →' : 'Sign In & Proceed to Checkout 🔒'}
            </button>

            <Link href="/study-materials" className={`btn btn-ghost ${styles.continueBtn}`}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
