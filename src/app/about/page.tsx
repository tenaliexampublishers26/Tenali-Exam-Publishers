import type { Metadata } from 'next';
import { SUPPORT_EMAIL, COMPANY_ADDRESS } from '@/lib/data';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'About Us — Mission & Vision | Tenali Exam Publishers',
  description:
    'Learn about Tenali Exam Publishers — our mission to empower India Post aspirants with syllabus-aligned departmental LDCE books, conceptual notes, and multilingual study materials.',
  keywords: [
    'About Tenali Exam Publishers',
    'India Post exam books publisher',
    'Postal study materials publishing house',
    'MTS Postman PA SA book author',
    'Department of posts exam guides Andhra Pradesh',
  ],
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Us | Tenali Exam Publishers',
    description:
      'Empowering India Post aspirants with dedicated departmental exam preparation materials in English, Telugu & Hindi.',
    url: `${SITE_URL}/about`,
    type: 'website',
  },
};

interface OfferItem {
  icon: string;
  title: string;
  desc: string;
}

export default function AboutPage(): React.JSX.Element {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About Us', url: '/about' },
  ]);

  const aboutSchema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Tenali Exam Publishers',
    description:
      'Dedicated publishing company providing comprehensive study materials and question banks for India Post LDCE examinations.',
    url: `${SITE_URL}/about`,
    mainEntity: {
      '@type': 'EducationalOrganization',
      name: SITE_NAME,
      url: SITE_URL,
      email: SUPPORT_EMAIL,
      address: {
        '@type': 'PostalAddress',
        streetAddress: COMPANY_ADDRESS.line1,
        addressLocality: COMPANY_ADDRESS.line2,
        addressRegion: 'Andhra Pradesh',
        postalCode: '522508',
        addressCountry: 'IN',
      },
    },
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={aboutSchema} />

      <header className="page-header">
        <h1 className="page-title">About Tenali Exam Publishers</h1>
        <p className="page-subtitle">
          Your trusted educational partner for India Post LDCE departmental exam preparation
        </p>
      </header>

      <main className="container-narrow">
        {/* Mission & Vision */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12" aria-label="Mission and Vision">
          <div className="card p-6 md:p-8">
            <div style={{ fontSize: '2rem', marginBottom: '16px' }} aria-hidden="true">
              🎯
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              Our Mission
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                fontSize: '0.95rem',
              }}
            >
              To provide accessible, meticulously structured, and high-quality exam preparation materials
              that help India Post aspirants clear their departmental examinations with absolute confidence.
            </p>
          </div>
          <div className="card p-6 md:p-8">
            <div style={{ fontSize: '2rem', marginBottom: '16px' }} aria-hidden="true">
              🌟
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              Our Vision
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 1.7,
                fontSize: '0.95rem',
              }}
            >
              To be India&apos;s most trusted publishing platform supporting departmental promotion aspirants
              through updated postal manuals, concept tables, and multilingual study guides.
            </p>
          </div>
        </section>

        {/* Founder Section */}
        <article className="card p-6 md:p-12 mb-12 text-center" aria-label="Founder and Publisher Information">
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--color-pastel-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: '3rem',
              border: '4px solid var(--color-white)',
              boxShadow: 'var(--shadow-md)',
            }}
            aria-hidden="true"
          >
            👨‍💼
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.4rem',
              fontWeight: 700,
              marginBottom: '4px',
            }}
          >
            Founder &amp; Publisher
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Tenali Exam Publishers
          </p>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
              fontSize: '0.95rem',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            Driven by a passion for quality education and deep expertise in Postal Department competitive
            examinations, Tenali Exam Publishers was founded to bridge the gap between aspirants and
            high-scoring study materials. We deliver maximum exam value through concept-based notes,
            illustrated tables, and multilingual editions in English, Telugu, and Hindi.
          </p>
        </article>

        {/* What We Offer */}
        <section style={{ marginBottom: '48px' }} aria-label="What We Offer">
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.5rem',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '28px',
            }}
          >
            What We Offer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {(
              [
                {
                  icon: '📚',
                  title: 'Latest Syllabus Guides',
                  desc: 'Aligned with official India Post LDCE exam patterns and updated administrative rules.',
                },
                {
                  icon: '🌐',
                  title: 'Multilingual Study Books',
                  desc: 'Comprehensive materials available in English, Telugu (తెలుగు), and Hindi (हिंदी).',
                },
                {
                  icon: '📦',
                  title: 'Doorstep Speed Post Delivery',
                  desc: 'Secure dispatch across India to every district, city, and rural branch post office.',
                },
              ] as OfferItem[]
            ).map((item, i) => (
              <div key={i} className="card p-6 text-center">
                <div style={{ fontSize: '1.8rem', marginBottom: '12px' }} aria-hidden="true">
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    marginBottom: '8px',
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section
          className="p-6 md:p-8 text-center bg-(--color-bg-card) border border-(--color-border-light) rounded-2xl"
          aria-label="Support and Contact Information"
        >
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
            Get in Touch With Us
          </h3>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)',
              marginBottom: '16px',
            }}
          >
            Have questions about book editions or bulk orders? Reach out to our team anytime.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {SUPPORT_EMAIL}
          </a>
        </section>
      </main>
    </div>
  );
}
