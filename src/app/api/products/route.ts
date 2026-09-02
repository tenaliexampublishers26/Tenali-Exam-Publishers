import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const products = await sql`
      SELECT id, slug, name, bundle_title as "bundleTitle", books_included as "booksIncluded", 
             edition, short_description as "shortDescription", description, price, 
             image, images, category, exam_coverage as "examCoverage", features, 
             brand, badge, stock, languages
      FROM products
      ORDER BY id ASC
    `;
    return NextResponse.json(
      { products },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
