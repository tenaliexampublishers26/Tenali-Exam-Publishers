'use client';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ui/ProductCard';
import { Check } from 'lucide-react';
import styles from './study-materials.module.css';

interface ExamItem {
  name: string;
  bundleId: string;
}

const EXAM_ITEMS: ExamItem[] = [
  { name: 'MTS', bundleId: 'p1' },
  { name: 'POSTMAN / MG', bundleId: 'p1' },
  { name: 'PA / SA', bundleId: 'p2' },
];

function StudyMaterialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const { products, loading } = useProducts();

  const getInitialExam = (): string | null => {
    if (!initialCategory) return null;
    const cat = initialCategory.toUpperCase();
    if (cat.includes('POSTMAN') || cat.includes('MAIL') || cat.includes('MG')) return 'POSTMAN / MG';
    if (cat.includes('PA') || cat.includes('SA') || cat.includes('SORTING') || cat.includes('ASSISTANT')) return 'PA / SA';
    if (cat.includes('MTS')) return 'MTS';
    return null;
  };

  const [selectedExam, setSelectedExam] = useState<string | null>(getInitialExam);

  const handleExamClick = (examName: string) => {
    if (selectedExam === examName) {
      setSelectedExam(null);
    } else {
      setSelectedExam(examName);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!selectedExam) return products;
    const item = EXAM_ITEMS.find((e) => e.name === selectedExam);
    if (item) {
      return products.filter((p) => p.id === item.bundleId);
    }
    return products;
  }, [selectedExam, products]);

  return (
    <div className="container" style={{ paddingTop: '24px', paddingBottom: '60px' }}>
      {/* Back Navigation */}
      <div className={styles.backRow}>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              const referrer = document.referrer;
              if (referrer && (referrer.includes('/cart') || referrer.includes('/checkout'))) {
                router.push('/');
                return;
              }
              if (window.history.length > 1 && referrer && referrer.includes(window.location.host)) {
                router.back();
                return;
              }
            }
            router.push('/');
          }}
          className={styles.backBtn}
          aria-label="Back to previous page"
        >
          ← Back
        </button>
      </div>

      {/* Exam Filter Chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        {EXAM_ITEMS.map((item) => {
          const isSelected = selectedExam === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => handleExamClick(item.name)}
              style={{
                flex: '0 0 auto',
                background: isSelected ? 'var(--color-primary)' : 'var(--color-white)',
                border: isSelected
                  ? '1.5px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                textAlign: 'center',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.82rem',
                color: isSelected ? 'var(--color-white)' : 'var(--color-text-secondary)',
                boxShadow: isSelected
                  ? '0 2px 6px rgba(26, 43, 76, 0.15)'
                  : '0 1px 2px rgba(0, 0, 0, 0.03)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minHeight: '40px',
                outline: 'none',
                touchAction: 'manipulation',
              }}
              aria-pressed={isSelected}
            >
              {isSelected ? (
                <>
                  <Check size={14} style={{ marginRight: '4px' }} />
                  <span>{item.name}</span>
                </>
              ) : (
                item.name
              )}
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className={styles.resultsHeader}>
        <h2 className={styles.resultsTitle}>
          {selectedExam ? `Books for ${selectedExam} Examination` : 'Available Book Bundles & Study Guides'}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {selectedExam && (
            <button
              onClick={() => setSelectedExam(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '4px 0',
              }}
            >
              Show All
            </button>
          )}
          <span className={styles.resultsBadge}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'Bundle' : 'Bundles'} Available
          </span>
        </div>
      </div>

      {/* Product Grid */}
      <div className={styles.productGrid}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
            Loading study materials...
          </div>
        ) : (
          filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)
        )}
      </div>
    </div>
  );
}

export default function StudyMaterialsClient() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading study materials...</div>
      }
    >
      <StudyMaterialsContent />
    </Suspense>
  );
}
