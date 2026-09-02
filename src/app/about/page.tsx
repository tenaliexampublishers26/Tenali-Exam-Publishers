import type { Metadata } from 'next';
import { Target, Compass, UserCheck, BookOpen, Languages, Truck } from 'lucide-react';
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
  icon: React.ReactNode;
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

  const offerItems: OfferItem[] = [
    {
      icon: <BookOpen size={30} color="var(--color-primary)" />,
      title: 'Latest Syllabus Guides',
      desc: 'Aligned with official India Post LDCE exam patterns and updated administrative rules.',
    },
    {
      icon: <Languages size={30} color="var(--color-primary)" />,
      title: 'Multilingual Study Books',
      desc: 'Comprehensive materials available in English, Telugu (తెలుగు), and Hindi (हिंदी).',
    },
    {
      icon: <Truck size={30} color="var(--color-primary)" />,
      title: 'Doorstep Speed Post Delivery',
      desc: 'Secure dispatch across India to every district, city, and rural branch post office.',
    },
  ];

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
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(26, 43, 76, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Target size={28} color="var(--color-primary)" />
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
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(26, 43, 76, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <Compass size={28} color="var(--color-primary)" />
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
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'var(--color-pastel-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              border: '4px solid var(--color-white)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <UserCheck size={44} color="var(--color-primary)" />
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
            {offerItems.map((item, i) => (
              <div key={i} className="card p-6 text-center">
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'rgba(26, 43, 76, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 14px',
                  }}
                >
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
