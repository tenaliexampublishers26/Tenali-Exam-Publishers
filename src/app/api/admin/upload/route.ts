import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xsidvgynolsenmdnudqm.supabase.co';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_5MxH0Dpe3Ndj_r4abj9LPA_37VGnYZJ';

  return createClient(supabaseUrl, supabaseKey);
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Support both multiple files ('files') and single/multiple ('file')
    const rawFiles = formData.getAll('files') as File[];
    const singleFiles = formData.getAll('file') as File[];
    const filesToProcess = (rawFiles.length > 0 ? rawFiles : singleFiles).filter(
      (f) => f && typeof f === 'object' && 'size' in f && f.size > 0
    );

    if (filesToProcess.length === 0) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate all files first
    for (const file of filesToProcess) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid format for "${file.name}". Please upload a PNG, JPG, JPEG, WEBP, or GIF image.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 10MB limit. Please upload smaller images.` },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseClient();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

    // Ensure uploads directory exists on disk for fallback or primary storage
    if (!fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (dirErr) {
        console.warn('Could not create uploads directory:', dirErr);
      }
    }

    // Upload files concurrently
    const uploadPromises = filesToProcess.map(async (file, idx) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileExt = sanitizedName.split('.').pop() || 'png';
      const baseName = sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) || 'product';
      const fileName = `${baseName}-${Date.now()}-${idx}.${fileExt}`;

      // 1. Try Supabase Storage first
      try {
        const { data, error } = await supabase.storage
          .from('products')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!error && data?.path) {
          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(data.path);

          if (urlData?.publicUrl) {
            return {
              url: urlData.publicUrl,
              fileName: data.path,
              originalName: file.name,
            };
          }
        }
      } catch (supabaseErr) {
        console.warn('Supabase storage upload unsuccessful, saving locally:', (supabaseErr as any)?.message);
      }

      // 2. Reliable Fallback: Save directly to public/uploads/products/
      const localFilePath = path.join(uploadsDir, fileName);
      await fs.promises.writeFile(localFilePath, buffer);

      return {
        url: `/uploads/products/${fileName}`,
        fileName: fileName,
        originalName: file.name,
      };
    });

    const results = await Promise.all(uploadPromises);
    const urls = results.map((r) => r.url);

    return NextResponse.json(
      {
        success: true,
        url: urls[0] || '',
        urls: urls,
        files: results,
        uploadedCount: urls.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: error.message || 'Server error while processing image upload' },
      { status: 500 }
    );
  }
}
