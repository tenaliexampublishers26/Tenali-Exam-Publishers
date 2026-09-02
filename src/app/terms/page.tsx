import type { Metadata } from 'next';
import { SUPPORT_EMAIL } from '@/lib/data';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Tenali Exam Publishers',
  description:
    'Terms and conditions regarding product purchases, payments, shipping, speed post delivery, and replacement policies at Tenali Exam Publishers.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage(): React.JSX.Element {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Terms & Conditions', url: '/terms' },
  ]);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <JsonLd data={breadcrumbSchema} />
      <header className="page-header">
        <h1 className="page-title">Terms &amp; Conditions</h1>
        <p className="page-subtitle">Last updated: August 2026</p>
      </header>
      <main className="container-narrow" style={{ maxWidth: '760px' }}>
        <article
          className="card"
          style={{
            padding: '40px',
            lineHeight: 1.8,
            fontSize: '0.95rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
              marginTop: '0',
            }}
          >
            1. General
          </h2>
          <p style={{ marginBottom: '20px' }}>
            By using Tenali Exam Publishers&apos; website and services, you agree to these terms and
            conditions. These terms apply to all users, visitors, and customers purchasing educational
            examination guides from our website.
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
            }}
          >
            2. Products &amp; Pricing
          </h2>
          <p style={{ marginBottom: '20px' }}>
            All prices are displayed in Indian Rupees (₹) and include applicable taxes. We reserve the
            right to modify prices without prior notice. Product availability is subject to stock.
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
            }}
          >
            3. Orders &amp; Payment
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Orders are confirmed only after successful payment verification. We accept payments through
            Razorpay (UPI, Credit/Debit Cards, Net Banking). All transactions are encrypted with bank-level
            security.
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
            }}
          >
            4. Shipping &amp; Delivery
          </h2>
          <p style={{ marginBottom: '20px' }}>
            We deliver across India via India Post Speed Post and registered services. Delivery timelines
            vary based on location and typically take 3-7 business days.
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
            }}
          >
            5. Returns &amp; Cancellations
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Cancellations are accepted before the order is dispatched. Free replacements are provided for
            any book damaged in transit within 7 days of delivery. Contact us at {SUPPORT_EMAIL} for
            support.
          </p>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '16px',
            }}
          >
            6. Contact
          </h2>
          <p>
            For questions about these terms, contact us at{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              style={{ color: 'var(--color-pastel-blue-deeper)', fontWeight: 500 }}
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </article>
      </main>
    </div>
  );
}
