import type { Metadata } from 'next';
import { SUPPORT_EMAIL } from '@/lib/data';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Privacy Policy | Tenali Exam Publishers',
  description:
    'Our privacy policy explains how Tenali Exam Publishers protects user data, contact details, payment information, and delivery addresses.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

export default function PrivacyPolicyPage(): React.JSX.Element {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Privacy Policy', url: '/privacy-policy' },
  ]);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <JsonLd data={breadcrumbSchema} />
      <header className="page-header">
        <h1 className="page-title">Privacy Policy</h1>
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
            1. Information We Collect
          </h2>
          <p style={{ marginBottom: '20px' }}>
            We collect information you provide directly to us, including your name, email address, mobile
            number, postal delivery address, and order details when purchasing examination materials. We
            use this information strictly to dispatch orders and communicate tracking updates.
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
            2. How We Use Your Information
          </h2>
          <p style={{ marginBottom: '20px' }}>
            Your information is used solely to: process and fulfill book orders, send Speed Post
            tracking numbers and WhatsApp dispatch notifications, provide customer support, and improve
            our educational offerings.
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
            3. Payment Security
          </h2>
          <p style={{ marginBottom: '20px' }}>
            All online payments are securely processed via Razorpay. We do not store or process your
            credit card, debit card, or UPI PIN credentials on our servers. Razorpay complies with PCI-DSS
            standards.
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
            4. Data Protection
          </h2>
          <p style={{ marginBottom: '20px' }}>
            We adopt strict security protocols to prevent unauthorized access or disclosure of customer
            records. We never sell or share user data with third-party advertising brokers.
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
            5. Contact
          </h2>
          <p>
            For privacy-related queries, please contact us at{' '}
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
