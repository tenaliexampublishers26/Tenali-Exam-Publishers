import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xsidvgynolsenmdnudqm.supabase.co';
  // IMPORTANT: Storage writes are governed by Supabase Row Level Security (RLS)
  // policies on the bucket. The anon/publishable key is subject to those
  // policies and will be rejected unless the bucket explicitly allows public
  // inserts. For admin uploads to be reliable in production, set
  // SUPABASE_SERVICE_ROLE_KEY in the environment (Vercel Project Settings ->
  // Environment Variables). The service role key bypasses RLS entirely and
  // is safe to use here because this code only runs server-side.
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_5MxH0Dpe3Ndj_r4abj9LPA_37VGnYZJ';

  const usingServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return { client: createClient(supabaseUrl, supabaseKey), usingServiceRole };
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Serverless platforms (Vercel, AWS Lambda) ship a read-only filesystem
// except for /tmp, which is NOT served publicly. Writing to public/uploads
// works only in local/dev or on a traditional persistent server. Detect this
// so we never try (and silently crash the whole batch) on a doomed write.
const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

interface UploadResult {
  originalName: string;
  url?: string;
  fileName?: string;
  error?: string;
}

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

    const { client: supabase, usingServiceRole } = getSupabaseClient();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');

    // Only attempt to prepare/use the local fallback directory when we're on
    // a runtime that actually has a writable, publicly-served filesystem.
    let localFallbackAvailable = !isServerlessRuntime;
    if (localFallbackAvailable && !fs.existsSync(uploadsDir)) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
      } catch (dirErr) {
        console.warn('Could not create uploads directory, disabling local fallback:', dirErr);
        localFallbackAvailable = false;
      }
    }

    // Upload files concurrently. Each file is fully isolated: a failure on
    // one file (Supabase Storage rejected + no local fallback available)
    // must never take down the other files in the same batch.
    const uploadPromises: Promise<UploadResult>[] = filesToProcess.map(async (file, idx) => {
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileExt = sanitizedName.split('.').pop() || 'png';
      const baseName = sanitizedName.substring(0, sanitizedName.lastIndexOf('.')) || 'product';
      const fileName = `${baseName}-${Date.now()}-${idx}.${fileExt}`;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 1. Try Supabase Storage first (preferred, CDN-backed, persistent)
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
                originalName: file.name,
                url: urlData.publicUrl,
                fileName: data.path,
              };
            }
          } else if (error) {
            console.warn(`Supabase storage upload rejected for "${file.name}":`, error.message);
          }
        } catch (supabaseErr: any) {
          console.warn(`Supabase storage upload threw for "${file.name}":`, supabaseErr?.message);
        }

        // 2. Fallback: save directly to public/uploads/products/ — only when
        // the runtime can actually persist and serve that file.
        if (localFallbackAvailable) {
          try {
            const localFilePath = path.join(uploadsDir, fileName);
            await fs.promises.writeFile(localFilePath, buffer);
            return {
              originalName: file.name,
              url: `/uploads/products/${fileName}`,
              fileName,
            };
          } catch (fsErr: any) {
            console.warn(`Local fallback write failed for "${file.name}":`, fsErr?.message);
          }
        }

        // Both paths failed for this file — report a clear, actionable error
        // instead of crashing the whole request.
        return {
          originalName: file.name,
          error: usingServiceRole
            ? 'Upload to Supabase Storage failed and no local fallback is available on this server.'
            : 'Upload to Supabase Storage was rejected (likely a Storage RLS policy on the "products" bucket), and no local fallback is available on this server. Set SUPABASE_SERVICE_ROLE_KEY in the environment to fix this.',
        };
      } catch (fileErr: any) {
        console.error(`Unexpected error processing "${file.name}":`, fileErr);
        return { originalName: file.name, error: fileErr?.message || 'Unexpected upload error' };
      }
    });

    const results = await Promise.all(uploadPromises);
    const succeeded = results.filter((r) => r.url);
    const failed = results.filter((r) => r.error);

    if (succeeded.length === 0) {
      return NextResponse.json(
        {
          error: failed[0]?.error || 'Failed to upload images',
          files: results,
        },
        { status: 502 }
      );
    }

    const urls = succeeded.map((r) => r.url as string);

    return NextResponse.json(
      {
        success: true,
        url: urls[0] || '',
        urls,
        files: results,
        uploadedCount: urls.length,
        // Present when some files in a multi-file batch failed while others succeeded
        errors: failed.length > 0 ? failed.map((f) => `${f.originalName}: ${f.error}`) : undefined,
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
