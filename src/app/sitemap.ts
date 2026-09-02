import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { products as fallbackProducts } from '@/lib/data';
import { sql } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // 1. Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/study-materials`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/languages`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/track-order`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
  ];

  // 2. Dynamic Product Routes
  let productSlugs: string[] = fallbackProducts.map((p) => p.slug);
  try {
    const dbProducts = await sql`SELECT slug, updated_at FROM products WHERE is_active = true OR is_active IS NULL`;
    if (dbProducts && dbProducts.length > 0) {
      productSlugs = Array.from(new Set([...productSlugs, ...dbProducts.map((p: any) => p.slug)]));
    }
  } catch {
    // If DB is unreachable during build, fallback to standard catalog
  }

  const productRoutes: MetadataRoute.Sitemap = productSlugs.map((slug) => ({
    url: `${SITE_URL}/study-materials/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}
