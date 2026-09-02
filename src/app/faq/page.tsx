import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema, getFaqSchema } from '@/lib/seo';
import { FAQ_DATA } from '@/lib/faqData';
import JsonLd from '@/components/seo/JsonLd';
import FAQClient from './FAQClient';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | Tenali Exam Publishers',
  description:
    'Find answers to common questions about India Post LDCE study materials, exam syllabus coverage, English/Telugu/Hindi mediums, payment security, Speed Post delivery, and order tracking.',
  keywords: [
    'India Post exam books FAQ',
    'Tenali Exam Publishers questions',
    'Postal LDCE book delivery time',
    'Postal study material languages',
    'MTS Postman PA SA book order queries',
  ],
  alternates: {
    canonical: '/faq',
  },
  openGraph: {
    title: 'Frequently Asked Questions (FAQ) | Tenali Exam Publishers',
    description:
      'Everything you need to know about ordering India Post departmental LDCE books, delivery, mediums, and payment options.',
    url: `${SITE_URL}/faq`,
    type: 'website',
  },
};

export default function FAQPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]);

  const faqSchema = getFaqSchema(FAQ_DATA);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <header className="page-header">
        <h1 className="page-title">Frequently Asked Questions</h1>
        <p className="page-subtitle">
          Everything you need to know about our India Post LDCE exam materials, delivery &amp; ordering
        </p>
      </header>

      <main>
        <FAQClient />
      </main>
    </div>
  );
}
