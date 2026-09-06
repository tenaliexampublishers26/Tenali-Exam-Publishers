import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const products = await sql`
      SELECT 
        p.id, 
        p.slug, 
        p.name, 
        p.price, 
        p.stock, 
        p.category, 
        p.languages,
        p.created_at as "createdAt",
        COALESCE(SUM(oi.quantity), 0)::int as "totalSold"
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      GROUP BY p.id, p.slug, p.name, p.price, p.stock, p.category, p.languages, p.created_at
      ORDER BY p.created_at DESC
    `;
    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, slug, name, price, stockEn, stockTe, stockHi, languages, category, description, image, bundleTitle, booksIncluded, badge } = body;

    const cleanSlug = (slug || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');

    if (!id || !cleanSlug || !name || price === undefined || !description || !image || !category) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    let languagesArr: Array<{ code: string; name: string; stock: number }> = [];

    if (Array.isArray(languages) && languages.length > 0) {
      languagesArr = languages
        .map((l: any) => {
          const rawName = String(l.name || '').trim();
          const rawCode = String(l.code || rawName.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'en')
            .trim()
            .toLowerCase();
          const stock = Math.max(0, parseInt(String(l.stock), 10) || 0);
          return {
            code: rawCode || 'en',
            name: rawName || rawCode.toUpperCase(),
            stock,
          };
        })
        .filter((l) => l.name.length > 0);
    }

    // If languages was not provided or empty, fallback to legacy fields
    if (languagesArr.length === 0) {
      const en = parseInt(stockEn) || 0;
      const te = parseInt(stockTe) || 0;
      const hi = parseInt(stockHi) || 0;
      languagesArr = [
        { code: 'en', name: 'English', stock: en },
        { code: 'te', name: 'Telugu', stock: te },
        { code: 'hi', name: 'Hindi', stock: hi },
      ];
    }

    const totalStock = languagesArr.reduce((sum, l) => sum + (l.stock || 0), 0);

    const result = await sql`
      INSERT INTO products (
        id, slug, name, price, stock, category, description, image, bundle_title, books_included, badge, languages
      ) VALUES (
        ${id}, ${cleanSlug}, ${name}, ${price}, ${totalStock}, ${category}, ${description}, ${image},
        ${bundleTitle || null}, ${booksIncluded || 1}, ${badge || null}, ${sql.json(languagesArr)}
      )
      RETURNING id, name
    `;

    return NextResponse.json({ success: true, product: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
