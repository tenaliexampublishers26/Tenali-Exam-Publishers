'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import { Search } from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const CADRE_SHORTCUTS = [
  { label: 'MTS Guide', query: 'MTS' },
  { label: 'Postman / MG', query: 'Postman' },
  { label: 'PA / SA 3-Book Set', query: 'PA / SA' },
  { label: 'Telugu Medium', query: 'Telugu' },
  { label: 'English Medium', query: 'English' },
];

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const { products } = useProducts();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSearch = (searchQuery: string) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) { setResults([]); return; }
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.languages || []).some(l => l.name.toLowerCase().includes(q))
    );
    setResults(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    handleSearch(e.target.value);
  };

  const handleShortcutClick = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  const handleProductClick = (slug: string) => {
    onClose();
    router.push(`/study-materials/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/study-materials?category=${encodeURIComponent(query.trim())}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh',
      animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-white)',
        borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '580px',
        boxShadow: 'var(--shadow-xl)',
        animation: 'scaleIn 0.2s ease',
        margin: '0 16px',
        overflow: 'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Search Input */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid var(--color-border-light)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search books, exams (MTS, Postman, PA/SA), or mediums..."
            value={query}
            onChange={handleInputChange}
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: '1rem', background: 'transparent',
              fontFamily: 'inherit', color: 'var(--color-text-primary)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-muted)', fontSize: '1.2rem', padding: '4px',
              }}
            >
              ×
            </button>
          )}
        </form>

        {/* Quick Cadre Filter Shortcuts (#5) */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-bg-page)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
            Quick Filter:
          </span>
          {CADRE_SHORTCUTS.map(sc => (
            <button
              key={sc.label}
              type="button"
              onClick={() => handleShortcutClick(sc.query)}
              style={{
                background: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                padding: '3px 9px',
                borderRadius: '12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px 0' }}>
          {results.length > 0 ? (
            results.map(product => (
              <div
                key={product.id}
                onClick={() => handleProductClick(product.slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 20px', cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: '42px', height: '56px', objectFit: 'cover',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text-primary)' }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    {product.bundleTitle || product.category} · {formatPrice(product.price)}
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                  View →
                </span>
              </div>
            ))
          ) : query ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                <Search size={32} color="var(--color-text-muted)" />
              </div>
              <p style={{ fontSize: '0.9rem' }}>No study materials found for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Type an exam cadre name above or select a quick filter chip.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
