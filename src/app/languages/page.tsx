import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Languages, BookMarked } from 'lucide-react';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Study Materials by Language (English, Telugu, Hindi) | Tenali Exam Publishers',
  description:
    'Select your examination medium — English, Telugu (తెలుగు), or Hindi (हिंदी). Comprehensive India Post LDCE study guides and book sets tailored for your regional language preference.',
  keywords: [
    'India Post exam books Telugu medium',
    'Postal LDCE study materials Telugu',
    'Postman MTS book in Hindi',
    'PA SA exam preparation book English',
    'Department of Posts books regional languages',
    'Tenali Exam Publishers languages',
  ],
  alternates: {
    canonical: '/languages',
  },
  openGraph: {
    title: 'Study Materials by Language | Tenali Exam Publishers',
    description:
      'Explore India Post LDCE preparation books available in English, Telugu & Hindi mediums.',
    url: `${SITE_URL}/languages`,
    type: 'website',
  },
};

interface LanguageOption {
  code: string;
  name: string;
  native: string;
  desc: string;
  bg: string;
  icon: React.ReactNode;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English Medium',
    native: 'English',
    desc: 'Official syllabus-aligned study guides with concept notes & MCQs in English medium',
    bg: '#D4E4F7',
    icon: <BookOpen size={32} color="#1e40af" />,
  },
  {
    code: 'te',
    name: 'Telugu Medium (తెలుగు)',
    native: 'తెలుగు మాధ్యమం',
    desc: 'తపాలా శాఖ పరీక్షల కోసం సమగ్ర స్టడీ మెటీరియల్స్ మరియు గైడ్లు',
    bg: '#E8E0F0',
    icon: <Languages size={32} color="#6b21a8" />,
  },
  {
    code: 'hi',
    name: 'Hindi Medium (हिंदी)',
    native: 'हिंदी माध्यम',
    desc: 'डाक विभाग प्रतियोगी परीक्षाओं हेतु संपूर्ण अध्ययन सामग्री एवं गाइड',
    bg: '#FDDEC0',
    icon: <BookMarked size={32} color="#c2410c" />,
  },
];

export default function LanguagesPage(): React.JSX.Element {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Languages', url: '/languages' },
  ]);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'India Post LDCE Study Materials by Medium / Language',
    description:
      'Educational exam materials organized by English, Telugu, and Hindi language mediums.',
    url: `${SITE_URL}/languages`,
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={collectionSchema} />

      <header className="page-header">
        <h1 className="page-title">Choose Your Medium</h1>
        <p className="page-subtitle">
          Our India Post LDCE study materials are published in your preferred language
        </p>
      </header>

      <main className="container px-4" style={{ maxWidth: '860px' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LANGUAGES.map((lang) => (
            <Link
              key={lang.code}
              href={`/study-materials?lang=${lang.code}`}
              className="card card-interactive"
              style={{
                padding: '40px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
              }}
              aria-label={`Browse ${lang.name} study materials`}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: lang.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {lang.icon}
              </div>

              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {lang.name}
              </h2>

              <div style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                {lang.native}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {lang.desc}
              </p>

              <span className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                Browse {lang.name} Books →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
