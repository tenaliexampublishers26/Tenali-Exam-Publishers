'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product } from '@/types';
import { useProduct } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import { formatPrice, getLanguageDisplay } from '@/lib/utils';
import { Truck, ShieldCheck, PackageCheck, Mail, ArrowLeft, BookOpen, FileText } from 'lucide-react';
import SyllabusModal from '@/components/ui/SyllabusModal';
import styles from './product-detail.module.css';

interface ProductDetailClientProps {
  initialProduct?: Product | null;
  slug: string;
}

export default function ProductDetailClient({ initialProduct, slug }: ProductDetailClientProps) {
  const router = useRouter();
  const { product: fetchedProduct, loading } = useProduct(slug);
  const product = initialProduct || fetchedProduct;

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();

  const [selectedLang, setSelectedLang] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [langError, setLangError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const mediumSectionRef = useRef<HTMLDivElement | null>(null);

  if (loading && !product) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <div style={{ fontSize: '1.5rem', color: 'var(--color-text-muted)' }}>Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', position: 'relative' }}>
        <Link
          href="/"
          style={{
            position: 'absolute',
            left: '20px',
            top: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-text-muted)',
            fontSize: '0.9rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Home
        </Link>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📖</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '8px' }}>
          Product Not Found
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          The product you are looking for does not exist.
        </p>
        <Link href="/study-materials" className="btn btn-primary">
          Browse Study Materials
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const imageList = product.images && product.images.length > 0 ? product.images : [product.image];

  const handleScroll = () => {
    if (galleryRef.current) {
      const scrollLeft = galleryRef.current.scrollLeft;
      const width = galleryRef.current.offsetWidth;
      if (width > 0) {
        const newIndex = Math.round(scrollLeft / width);
        if (newIndex >= 0 && newIndex < imageList.length && newIndex !== currentSlide) {
          setCurrentSlide(newIndex);
        }
      }
    }
  };

  const scrollToSlide = (index: number) => {
    if (galleryRef.current) {
      const width = galleryRef.current.offsetWidth;
      galleryRef.current.scrollTo({ left: width * index, behavior: 'smooth' });
      setCurrentSlide(index);
    }
  };

  const getProductLanguages = () => {
    let raw: any = product?.languages;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
        if (typeof raw === 'string') raw = JSON.parse(raw);
      } catch (e) {
        raw = [];
      }
    }
    return Array.isArray(raw) ? raw : [];
  };

  const productLangs = getProductLanguages();

  const handleAddToCart = () => {
    if (productLangs.length > 0 && !selectedLang) {
      setLangError(true);
      mediumSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLangError(false);
    addItem(product, selectedLang, quantity);
    setAddedToCartSuccess(true);
    setTimeout(() => setAddedToCartSuccess(false), 3000);
    toast.success(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    if (productLangs.length > 0 && !selectedLang) {
      setLangError(true);
      mediumSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLangError(false);
    addItem(product, selectedLang, quantity);
    router.push('/cart');
  };

  const handleWishlist = () => {
    const added = toggleWishlist(product);
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb Bar */}
      <div className={styles.breadcrumbWrap}>
        <div className={`container ${styles.breadcrumbInner}`}>
          <button type="button" onClick={() => router.push('/')} className={styles.backBtn}>
            <ArrowLeft size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>Back to Home</span>
          </button>

          <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/study-materials" className={styles.breadcrumbLink}>
              Study Materials
            </Link>
            <span aria-hidden="true">/</span>
            <span className={styles.breadcrumbCurrent} aria-current="page">
              {product.name}
            </span>
          </nav>
        </div>
      </div>

      <div className="container">
        <article className={styles.productLayout}>
          {/* Gallery Column */}
          <div className={styles.imageCol}>
            <div className={styles.galleryContainer}>
              <div ref={galleryRef} onScroll={handleScroll} className={styles.galleryScrollTrack}>
                {imageList.map((imgSrc, idx) => (
                  <div key={idx} className={styles.gallerySlide}>
                    <img
                      src={imgSrc}
                      alt={`${product.name} - India Post LDCE Exam Preparation Guide Book Cover ${idx + 1}`}
                      className={styles.galleryProductImg}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                ))}
              </div>

              {imageList.length > 1 && (
                <>
                  <span className={styles.galleryCounterBadge}>
                    {currentSlide + 1}/{imageList.length}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      scrollToSlide(currentSlide > 0 ? currentSlide - 1 : imageList.length - 1)
                    }
                    className={`${styles.galleryNavBtn} ${styles.galleryPrevBtn}`}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      scrollToSlide(currentSlide < imageList.length - 1 ? currentSlide + 1 : 0)
                    }
                    className={`${styles.galleryNavBtn} ${styles.galleryNextBtn}`}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className={styles.productInfo}>
            {/* Badge */}
            {product.badge && (
              <span className={`badge badge-blue ${styles.badge}`}>{product.badge}</span>
            )}

            <h1 className={styles.productTitle}>{product.name}</h1>

            <p className={styles.category}>{product.bundleTitle || product.category}</p>

            {/* Price */}
            <div className={styles.price}>{formatPrice(product.price)}</div>

            {/* Bundle Summary */}
            <div className={styles.bundleSummaryBox}>
              <div className={styles.bundleSummaryGrid}>
                <div className={styles.bundleSummaryItem}>
                  <span className={styles.bundleSummaryLabel}>Bundle Details</span>
                  <span className={styles.bundleSummaryValue}>
                    Includes {product.booksIncluded || 2} Books
                  </span>
                </div>
                <div className={styles.bundleSummaryItem}>
                  <span className={styles.bundleSummaryLabel}>Edition</span>
                  <span className={styles.bundleSummaryValue}>
                    {product.edition || 'First Edition'}
                  </span>
                </div>
                {product.examCoverage && (
                  <div className={styles.bundleSummaryItem} style={{ gridColumn: '1 / -1' }}>
                    <span className={styles.bundleSummaryLabel}>Exam Coverage</span>
                    <span className={styles.bundleSummaryValue}>{product.examCoverage}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className={styles.description}>{product.description}</p>

            {/* Features */}
            {product.features && (
              <div className={styles.featuresWrap}>
                <h3 className={styles.featuresTitle}>
                  What&apos;s Included in This {product.booksIncluded || 2}-Book Bundle
                </h3>
                <ul className={styles.featuresList}>
                  {product.features
                    .filter((f) => !/previous/i.test(f))
                    .map((f, i) => (
                      <li key={i} className={styles.featureItem}>
                        <span className={styles.featureBullet}>•</span> {f}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* Exam Syllabus Coverage Banner */}
            <div className={styles.syllabusBanner}>
              <div className={styles.syllabusInfo}>
                <div className={styles.syllabusIconBox}>
                  <BookOpen size={20} />
                </div>
                <div className={styles.syllabusTextBlock}>
                  <div className={styles.syllabusTitle}>Exam Syllabus Coverage</div>
                  <div className={styles.syllabusSubtitle}>
                    Complete Official India Post LDCE Syllabus & Topics
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSyllabusOpen(true)}
                className={styles.syllabusViewBtn}
              >
                <FileText size={15} />
                <span>View Details</span>
              </button>
            </div>

            <hr className="divider" />

            {/* Language Selection */}
            <div className={styles.sectionBlock} ref={mediumSectionRef}>
              <h3
                className={styles.sectionLabel}
                style={{
                  color: langError ? 'var(--color-error)' : 'var(--color-text-primary)',
                }}
              >
                Select Medium <span style={{ color: 'var(--color-error)' }}>*</span>
              </h3>
              <div className={styles.langButtons}>
                {(productLangs.length > 0 ? productLangs : [{ code: 'en', name: 'English' }]).map(
                  (lang) => {
                    return (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLang(lang.code);
                          setLangError(false);
                        }}
                        className={styles.langBtn}
                        style={{
                          border: `2px solid ${
                            selectedLang === lang.code
                              ? 'var(--color-text-primary)'
                              : langError
                              ? 'var(--color-error)'
                              : 'var(--color-border)'
                          }`,
                          background:
                            selectedLang === lang.code
                              ? 'var(--color-text-primary)'
                              : 'var(--color-white)',
                          color:
                            selectedLang === lang.code
                              ? 'var(--color-text-inverse)'
                              : 'var(--color-text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{getLanguageDisplay(lang.code)}</span>
                      </button>
                    );
                  }
                )}
              </div>
              {langError && (
                <p className={styles.langErrorText}>Please select a medium to continue</p>
              )}
            </div>

            {/* Quantity */}
            <div className={styles.sectionBlock}>
              <h3 className={styles.sectionLabel}>Quantity</h3>
              <div className={styles.quantityWrap}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className={styles.qtyBtn}
                  style={{ opacity: quantity <= 1 ? 0.4 : 1 }}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className={styles.qtyVal}>{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className={styles.qtyBtn}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actionRow}>
              <button
                onClick={handleAddToCart}
                className={`btn btn-primary btn-lg ${styles.actionBtn}`}
                style={{
                  background: addedToCartSuccess ? '#10b981' : undefined,
                  borderColor: addedToCartSuccess ? '#10b981' : undefined,
                  transition: 'all 0.2s ease',
                }}
              >
                {addedToCartSuccess ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
              <button onClick={handleBuyNow} className={`btn btn-accent btn-lg ${styles.actionBtn}`}>
                Buy Now
              </button>
            </div>

            <button onClick={handleWishlist} className={`btn btn-ghost ${styles.wishlistBtn}`}>
              {inWishlist ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#E53935" stroke="#E53935" strokeWidth="1">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  Remove from Wishlist
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                  Add to Wishlist
                </>
              )}
            </button>

            {/* Trust Strip */}
            <div className={styles.trustStrip}>
              <div className={styles.trustItem}>
                <Truck size={18} color="var(--color-primary)" />
                <span>Speed Post Delivery across India</span>
              </div>
              <div className={styles.trustItem}>
                <ShieldCheck size={18} color="#10B981" />
                <span>100% Secure UPI / Card Payment</span>
              </div>
              <div className={styles.trustItem}>
                <PackageCheck size={18} color="var(--color-primary)" />
                <span>Transit Damage Replacement</span>
              </div>
            </div>

            {/* Support */}
            <div className={styles.supportBox}>
              <Mail size={18} color="var(--color-pastel-blue-deeper)" style={{ flexShrink: 0 }} />
              <div>
                <strong>Need help?</strong>{' '}
                <a
                  href="mailto:tenaliexampublishers@gmail.com"
                  style={{ color: 'var(--color-pastel-blue-deeper)', fontWeight: 500 }}
                >
                  tenaliexampublishers@gmail.com
                </a>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Mobile Sticky Buy Bar */}
      <div className={styles.mobileStickyBar}>
        <div className={styles.stickyPriceGroup}>
          <div className={styles.stickyPrice}>{formatPrice(product.price)}</div>
          <div className={styles.stickyMediumTag}>
            {selectedLang ? `Medium: ${getLanguageDisplay(selectedLang)}` : 'Select Medium'}
          </div>
        </div>

        <div className={styles.stickyActions}>
          <button
            onClick={handleAddToCart}
            className={`btn btn-secondary ${styles.stickyCartBtn}`}
            style={{
              background: addedToCartSuccess ? '#10b981' : undefined,
              color: addedToCartSuccess ? '#ffffff' : undefined,
              borderColor: addedToCartSuccess ? '#10b981' : undefined,
              transition: 'all 0.2s ease',
            }}
          >
            {addedToCartSuccess ? '✓ Added!' : '+ Cart'}
          </button>
          <button onClick={handleBuyNow} className={`btn btn-accent ${styles.stickyBuyBtn}`}>
            Buy Now
          </button>
        </div>
      </div>

      {/* Syllabus Modal */}
      <SyllabusModal
        productSlug={product.slug}
        isOpen={isSyllabusOpen}
        onClose={() => setIsSyllabusOpen(false)}
      />
    </div>
  );
}
