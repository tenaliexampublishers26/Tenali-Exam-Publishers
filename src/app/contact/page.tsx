import type { Metadata } from 'next';
import ContactSection from '@/components/sections/ContactSection';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema, getLocalBusinessSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Contact Us — Tenali Exam Publishers',
  description:
    'Contact Tenali Exam Publishers for order tracking, payment inquiries, book recommendations, and support for India Post LDCE study materials. Located in Guntur District, Andhra Pradesh.',
  keywords: [
    'Contact Tenali Exam Publishers',
    'India Post exam books customer support',
    'Tenali Exam Publishers phone number email',
    'Postal book order inquiry',
  ],
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Us | Tenali Exam Publishers',
    description:
      'Get in touch with Tenali Exam Publishers support team for books, order tracking, and exam preparation queries.',
    url: `${SITE_URL}/contact`,
    type: 'website',
  },
};

export default function ContactPage(): React.JSX.Element {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact Us', url: '/contact' },
  ]);

  const localBusinessSchema = getLocalBusinessSchema();

  const contactSchema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Tenali Exam Publishers',
    description:
      'Customer support and contact portal for India Post LDCE exam study materials and book orders.',
    url: `${SITE_URL}/contact`,
    mainEntity: localBusinessSchema,
  };

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '40px' }}>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={contactSchema} />
      <main>
        <ContactSection />
      </main>
    </div>
  );
}
