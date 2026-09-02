'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import { X, FileText, BookOpen, Info, Check } from 'lucide-react';
import styles from './InstantPreviewModal.module.css';

interface InstantPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InstantPreviewModal({ product, isOpen, onClose }: InstantPreviewModalProps): React.JSX.Element | null {
  const [activeTab, setActiveTab] = useState<'toc' | 'sample'>('toc');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.modalBadge}>Instant Sample Preview</span>
            <h2 className={styles.title}>{product.name} — {product.bundleTitle}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabRow}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'toc' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('toc')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <FileText size={16} />
            <span>Table of Contents &amp; Syllabus</span>
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'sample' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('sample')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <BookOpen size={16} />
            <span>Sample Concept Pages &amp; MCQs</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className={styles.body}>
          {activeTab === 'toc' ? (
            <div className={styles.tocContainer}>
              <div className={styles.tocIntro}>
                <p>
                  This preparation bundle is officially aligned with the latest syllabus and departmental guidelines issued by India Post. Below is the comprehensive topic-wise breakdown included across the books:
                </p>
              </div>

              {product.tableOfContents && product.tableOfContents.map((book, idx) => (
                <div key={idx} className={styles.bookSection}>
                  <h3 className={styles.bookSectionTitle}>{book.bookTitle}</h3>
                  <ul className={styles.chapterList}>
                    {book.chapters.map((ch, cIdx) => (
                      <li key={cIdx} className={styles.chapterItem}>
                        <span className={styles.checkIcon}>
                          <Check size={14} color="#10b981" />
                        </span>
                        <span>{ch}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.sampleContainer}>
              <div className={styles.sampleNotice}>
                <span className={styles.noticeIcon}>
                  <Info size={20} color="#2563eb" />
                </span>
                <div>
                  <strong>Concept-Based Visual Format</strong>
                  <p>All chapters feature structured comparison tables, rule summaries, bilingual Telugu/English terminology notes, and key exam question callouts.</p>
                </div>
              </div>

              <div className={styles.sampleCard}>
                <h4 className={styles.sampleCardTitle}>Sample Concept Note: Postal Manual Vol V</h4>
                <div className={styles.sampleCardBody}>
                  <p className={styles.sampleText}>
                    <strong>Rule 3: Head Post Office &amp; Transit Mail Offices</strong><br />
                    A Head Post Office is the primary accounting and administrative office for a Postal Division. All Sub Post Offices (SOs) and Branch Post Offices (BOs) in the jurisdiction render daily accounts to the designated HPO.
                  </p>
                  <div className={styles.mcqPreview}>
                    <span className={styles.mcqTag}>Model Examination MCQ</span>
                    <p className={styles.mcqQuestion}>Q. Which postal official is primarily responsible for the overall maintenance of the sorting case in a Transit Mail Section?</p>
                    <ul className={styles.mcqOptions}>
                      <li>(A) Sorting Assistant</li>
                      <li>(B) Head Sorting Assistant (HSA)</li>
                      <li>(C) Mail Guard</li>
                      <li>(D) Inspector of Posts</li>
                    </ul>
                    <div className={styles.mcqAnswer}>
                      <strong>Answer: (B)</strong> — <em>As per Postal Manual Vol VII Rule 14.</em>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.footer}>
          <div className={styles.priceInfo}>
            <span className={styles.priceVal}>{formatPrice(product.price)}</span>
            <span className={styles.priceSub}>Complete Set</span>
          </div>
          <div className={styles.footerActions}>
            <Link
              href={`/study-materials/${product.slug}`}
              className={styles.orderNowBtn}
              onClick={onClose}
            >
              Order Now ({formatPrice(product.price)}) →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
