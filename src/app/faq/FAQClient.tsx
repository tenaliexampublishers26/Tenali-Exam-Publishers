'use client';
import { useState } from 'react';
import { SUPPORT_EMAIL } from '@/lib/data';
import { FAQ_DATA } from '@/lib/faqData';

export default function FAQClient() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (key: string): void => {
    setOpenItem(openItem === key ? null : key);
  };

  return (
    <div className="container-narrow" style={{ maxWidth: '760px' }}>
      {FAQ_DATA.map((section, si) => (
        <section key={si} style={{ marginBottom: '32px' }} aria-labelledby={`faq-cat-${si}`}>
          <h2
            id={`faq-cat-${si}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.15rem',
              fontWeight: 700,
              marginBottom: '12px',
              color: 'var(--color-text-primary)',
            }}
          >
            {section.category}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {section.items.map((item, qi) => {
              const key = `${si}-${qi}`;
              const isOpen = openItem === key;
              return (
                <div key={key} className="card" style={{ overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      gap: '16px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.92rem',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      {item.q}
                    </span>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        color: 'var(--color-text-muted)',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        flexShrink: 0,
                      }}
                    >
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 16px',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.7,
                      }}
                    >
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Still have questions */}
      <div
        style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '32px',
          background: 'var(--color-white)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-light)',
        }}
      >
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
          Still have questions?
        </h3>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '16px',
          }}
        >
          We&apos;re here to help aspirants with any query regarding exam books, editions, or orders.
        </p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn btn-primary">
          {SUPPORT_EMAIL}
        </a>
      </div>
    </div>
  );
}
