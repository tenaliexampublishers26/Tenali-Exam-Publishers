import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import StudyMaterialsClient from './StudyMaterialsClient';

export const metadata: Metadata = {
  title: 'India Post LDCE Study Materials & Book Sets | Tenali Exam Publishers',
  description:
    'Browse complete exam preparation books and 2-book / 3-book study material sets for MTS, Postman, Mail Guard (MG), and PA/SA LDCE examinations. Available in English, Telugu, and Hindi mediums with fast delivery across India.',
  keywords: [
    'India Post LDCE books list',
    'MTS exam book buy online',
    'Postman Mail Guard study materials',
    'PA SA LGO exam preparation set',
    'Postal department exam books Telugu',
    'Postal exam book Hindi',
    'Postal exam guide English',
    'Tenali Exam Publishers store',
    'Postal study materials combo sets',
  ],
  alternates: {
    canonical: '/study-materials',
  },
  openGraph: {
    title: 'India Post LDCE Study Materials & Book Sets | Tenali Exam Publishers',
    description:
      'Official syllabus-aligned study guides for MTS, Postman, Mail Guard, and PA/SA examinations in English, Telugu, and Hindi.',
    url: `${SITE_URL}/study-materials`,
    type: 'website',
    images: [
      {
        url: '/images/hero-graduates-books.jpg',
        width: 1200,
        height: 630,
        alt: 'Tenali Exam Publishers Study Materials Catalog',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'India Post LDCE Study Materials | Tenali Exam Publishers',
    description: 'Explore comprehensive exam prep books for MTS, Postman, MG, and PA/SA.',
    images: ['/images/hero-graduates-books.jpg'],
  },
};

export default function StudyMaterialsPage() {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Study Materials', url: '/study-materials' },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'India Post LDCE Study Materials & Examination Books',
    description:
      'Official syllabus-aligned examination books and study sets for India Post Departmental LDCE exams (MTS, Postman, Mail Guard, Postal Assistant / Sorting Assistant).',
    url: `${SITE_URL}/study-materials`,
    publisher: {
      '@type': 'EducationalOrganization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <div>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />

      {/* Page Header */}
      <header className="page-header">
        <h1 className="page-title">India Post LDCE Study Materials</h1>
        <p className="page-subtitle">
          Quality examination preparation books and comprehensive multi-book sets
        </p>
      </header>

      <main>
        <StudyMaterialsClient />
      </main>
    </div>
  );
}
