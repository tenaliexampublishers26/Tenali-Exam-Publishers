import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientLayout from './ClientLayout';
import JsonLd from '@/components/seo/JsonLd';
import GoogleAnalytics from '@/components/seo/GoogleAnalytics';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  PRIMARY_KEYWORDS,
  getOrganizationSchema,
} from '@/lib/seo';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#1a2b4c',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — India Post LDCE Exam Books (MTS, Postman, Mail Guard, PA/SA)`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Official exam preparation books and study materials for India Post LDCE examinations — MTS, Postman, Mail Guard (MG), PA/SA & LGO. Available in English, Telugu (తెలుగు), and Hindi (हिंदी). Fast Speed Post delivery across India.',
  keywords: PRIMARY_KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'Education & Exam Preparation',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/languages',
      'te-IN': '/languages',
      'hi-IN': '/languages',
    },
  },
  openGraph: {
    title: `${SITE_NAME} | Quality India Post LDCE Exam Preparation Books`,
    description:
      'Prepare with confidence for Postal Department examinations — MTS, Postman, Mail Guard, PA/SA. Comprehensive syllabus coverage in English, Telugu & Hindi.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_IN',
    alternateLocale: ['te_IN', 'hi_IN'],
    type: 'website',
    images: [
      {
        url: '/images/hero-graduates-books.jpg',
        width: 1200,
        height: 630,
        alt: 'Tenali Exam Publishers - India Post Departmental Exam Preparation Guides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} | India Post LDCE Exam Books`,
    description:
      'Official syllabus-aligned guides for Postal MTS, Postman, Mail Guard & PA/SA exams in English, Telugu & Hindi.',
    images: ['/images/hero-graduates-books.jpg'],
    creator: '@TenaliExams',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const orgSchema = getOrganizationSchema();

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* ── Structured Data ─────────────────────────────────────── */}
        <JsonLd data={orgSchema} />

        {/* ── Google Fonts — non-blocking preconnect strategy ──────
            Step 1: Open connection to fonts.googleapis.com early
            Step 2: Open crossorigin connection to fonts.gstatic.com (where the font files live)
            Step 3: Load the CSS (async, non-blocking — does NOT delay page paint)
            This replaces the CSS @import which was render-blocking.        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
        />

        {/* ── LCP Hero Image Preload ────────────────────────────────
            Tells the browser to start downloading the above-fold hero image
            BEFORE it finishes parsing the HTML body.
            Critical for Largest Contentful Paint score.               */}
        <link
          rel="preload"
          as="image"
          href="/images/hero-graduates-books.jpg"
          fetchPriority="high"
        />

        {/* ── DNS Prefetch for third-party origins ─────────────────
            Reduces DNS lookup latency for Razorpay and analytics     */}
        <link rel="dns-prefetch" href="//checkout.razorpay.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
      </head>
      <body>
        <ClientLayout>{children}</ClientLayout>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
