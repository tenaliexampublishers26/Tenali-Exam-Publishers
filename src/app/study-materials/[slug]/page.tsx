import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, products as staticProducts } from '@/lib/data';
import { sql } from '@/lib/db';
import { Product } from '@/types';
import { SITE_NAME, SITE_URL, getProductSchema, getBreadcrumbSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import ProductDetailClient from './ProductDetailClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchProductData(slug: string): Promise<Product | null> {
  const querySlug = slug === 'pa-sa-lgo' ? 'pa-sa' : slug;

  try {
    const dbProducts = await sql`
      SELECT id, slug, name, bundle_title as "bundleTitle", books_included as "booksIncluded", 
             edition, short_description as "shortDescription", description, price, 
             image, images, category, exam_coverage as "examCoverage", features, 
             brand, badge, stock, languages
      FROM products
      WHERE slug = ${querySlug} OR id = ${querySlug}
      LIMIT 1
    `;

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts[0] as Product;
    }
  } catch (error) {
    // Fallback to static data
  }

  const staticProduct = getProductBySlug(querySlug);
  return staticProduct || null;
}

export async function generateStaticParams() {
  return staticProducts.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductData(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Tenali Exam Publishers',
      description: 'The requested exam study material or book set was not found.',
      robots: { index: false, follow: false },
    };
  }

  const pageTitle = `${product.name} — ${product.bundleTitle || 'Complete Book Set'} (${product.edition || '2026 Edition'})`;
  const pageDescription =
    product.shortDescription ||
    `${product.name} preparation book for India Post LDCE examinations. Covers ${product.examCoverage || 'full syllabus'}. Available in English, Telugu, and Hindi mediums. Order online at Tenali Exam Publishers.`;

  const ogImage = product.image.startsWith('http')
    ? product.image
    : `${SITE_URL}${product.image}`;

  const productLanguages = Array.isArray(product.languages)
    ? product.languages.map((l: any) => (typeof l === 'string' ? l : l.name)).join(', ')
    : 'English, Telugu, Hindi';

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      product.name,
      `${product.name} book`,
      `${product.name} Telugu medium`,
      `${product.name} English medium`,
      `${product.name} Hindi medium`,
      product.bundleTitle || '',
      product.category || '',
      'India Post LDCE exam study guide',
      'Tenali Exam Publishers',
      'Postal Department competitive books',
      'Speed Post delivery',
    ].filter(Boolean),
    alternates: {
      canonical: `/study-materials/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | Tenali Exam Publishers`,
      description: `Buy ${product.name} (${product.bundleTitle || 'Study Set'}) - Price: ₹${product.price}. Mediums: ${productLanguages}. Official India Post LDCE study guide.`,
      url: `${SITE_URL}/study-materials/${product.slug}`,
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 800,
          height: 1000,
          alt: `${product.name} Book Cover - Tenali Exam Publishers`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | Tenali Exam Publishers`,
      description: `Buy ${product.name} book set for India Post LDCE exam preparation. Available in English, Telugu & Hindi.`,
      images: [ogImage],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchProductData(slug);

  if (!product) {
    return <ProductDetailClient initialProduct={null} slug={slug} />;
  }

  const productSchema = getProductSchema(product);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Study Materials', url: '/study-materials' },
    { name: product.name, url: `/study-materials/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd data={productSchema} />
      <JsonLd data={breadcrumbSchema} />
      <ProductDetailClient initialProduct={product} slug={slug} />
    </>
  );
}
