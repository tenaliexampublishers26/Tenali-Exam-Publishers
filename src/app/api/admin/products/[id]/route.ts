import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { serverCache } from '@/lib/server-cache';
import { revalidatePath } from 'next/cache';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const productId = params.id;
    const body = await request.json();
    const { name, price, stockEn, stockTe, stockHi, languages, description, image, images, category, bundleTitle, booksIncluded, badge } = body;

    let imagesArr: string[] | null = null;
    let primaryImage: string | null = null;

    if (Array.isArray(images)) {
      imagesArr = images
        .map((img: any) => String(img).trim())
        .filter((img: string) => img.length > 0);
      primaryImage = imagesArr[0] || (image ? String(image).trim() : null);
    } else if (image !== undefined) {
      primaryImage = String(image).trim();
      imagesArr = primaryImage ? [primaryImage] : [];
    }

    const sanitizedPrimaryImage = primaryImage && primaryImage.trim() ? primaryImage.trim() : null;
    const sanitizedImagesJson = imagesArr && imagesArr.length > 0 ? sql.json(imagesArr) : null;

    let languagesArr: Array<{ code: string; name: string; stock: number }> | null = null;
    let totalStock: number | null = null;

    if (Array.isArray(languages)) {
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
      totalStock = languagesArr.reduce((sum, l) => sum + (l.stock || 0), 0);
    } else {
      const en = parseInt(stockEn) !== undefined && !isNaN(parseInt(stockEn)) ? parseInt(stockEn) : null;
      const te = parseInt(stockTe) !== undefined && !isNaN(parseInt(stockTe)) ? parseInt(stockTe) : null;
      const hi = parseInt(stockHi) !== undefined && !isNaN(parseInt(stockHi)) ? parseInt(stockHi) : null;

      if (en !== null && te !== null && hi !== null) {
        totalStock = en + te + hi;
        languagesArr = [
          { code: 'en', name: 'English', stock: en },
          { code: 'te', name: 'Telugu', stock: te },
          { code: 'hi', name: 'Hindi', stock: hi },
        ];
      }
    }

    const result = await sql`
      UPDATE products
      SET 
        name = COALESCE(${name}, name),
        price = COALESCE(${price}, price),
        stock = COALESCE(${totalStock}, stock),
        description = COALESCE(${description}, description),
        image = COALESCE(${sanitizedPrimaryImage}, image),
        images = COALESCE(${sanitizedImagesJson}, images),
        category = COALESCE(${category}, category),
        bundle_title = COALESCE(${bundleTitle}, bundle_title),
        books_included = COALESCE(${booksIncluded}, books_included),
        badge = COALESCE(${badge}, badge),
        languages = COALESCE(${languagesArr ? sql.json(languagesArr) : null}, languages),
        updated_at = NOW()
      WHERE id = ${productId}
      RETURNING id, slug, name, stock, image, images
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Immediately purge caches so customer-facing catalog reflects changes instantly
    serverCache.invalidateByTag('products');
    serverCache.invalidate('all-products');
    serverCache.invalidate(`product-${productId}`);
    if (result[0]?.slug) {
      serverCache.invalidate(`product-${result[0].slug}`);
    }

    try {
      revalidatePath('/');
      revalidatePath('/study-materials');
      if (result[0]?.slug) {
        revalidatePath(`/study-materials/${result[0].slug}`);
      }
      revalidatePath('/api/products');
      revalidatePath('/api/admin/products');
    } catch (revalidateErr) {
      console.warn('Notice: revalidatePath in API:', revalidateErr);
    }

    return NextResponse.json({ success: true, product: result[0] }, { status: 200 });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const productId = params.id;

    const result = await sql`
      DELETE FROM products WHERE id = ${productId} RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
