import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { withServerCache } from '@/lib/server-cache';

// ─── ISR-style: Next.js will revalidate this route every 30 seconds
// on Vercel. Means all users get cached responses until the 30s window elapses.
export const revalidate = 30;

export async function GET() {
  try {
    // withServerCache: serves stale data instantly while background-refreshing.
    // At 30K users, only ONE DB query runs per 30-second window — not one per user.
    const products = await withServerCache(
      'all-products',
      () =>
        sql`
          SELECT id, slug, name, bundle_title as "bundleTitle", books_included as "booksIncluded",
                 edition, short_description as "shortDescription", description, price,
                 image, images, category, exam_coverage as "examCoverage", features,
                 brand, badge, stock, languages
          FROM products
          ORDER BY id ASC
        `,
      {
        ttl: 30_000,                    // 30 seconds server-side TTL
        tags: ['products'],              // Tagged for admin invalidation
        staleWhileRevalidate: true,      // Serve stale instantly, refresh in background
      }
    );

    return NextResponse.json(
      { products },
      {
        status: 200,
        headers: {
          // Edge CDN (Vercel/Cloudflare) caches for 30s; serves stale for up to 60s
          // while revalidating in background — zero latency for users during refresh
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          // Vary on nothing — products are the same for all users
          Vary: 'Accept-Encoding',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
