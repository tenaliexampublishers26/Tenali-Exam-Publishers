import { NextRequest, NextResponse } from 'next/server';
import { products as fallbackProducts } from '@/lib/data';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Read request host dynamically to match incoming domain (www or non-www)
  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'tenaliexamspublishers.com';
  
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;
  const currentDate = new Date().toISOString();

  // Core static paths
  const staticPaths = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/study-materials', priority: '0.9', changefreq: 'daily' },
    { path: '/languages', priority: '0.8', changefreq: 'weekly' },
    { path: '/about', priority: '0.7', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    { path: '/faq', priority: '0.8', changefreq: 'weekly' },
    { path: '/track-order', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.4', changefreq: 'yearly' },
    { path: '/terms', priority: '0.4', changefreq: 'yearly' },
  ];

  let productSlugs: string[] = fallbackProducts.map((p) => p.slug);
  try {
    const dbProducts = await sql`SELECT slug FROM products WHERE is_active = true OR is_active IS NULL`;
    if (dbProducts && dbProducts.length > 0) {
      productSlugs = Array.from(new Set([...productSlugs, ...dbProducts.map((p: any) => p.slug)]));
    }
  } catch {
    // Fallback to static catalog
  }

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPaths
  .map(
    (item) => `  <url>
    <loc>${baseUrl}${item.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )
  .join('\n')}
${productSlugs
  .map(
    (slug) => `  <url>
    <loc>${baseUrl}/study-materials/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
