import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * Next.js 16 Proxy Convention
 * Replaces deprecated `middleware.ts` with `proxy.ts`.
 * Handles maintenance mode redirects and Supabase session refreshes.
 */
// In-memory cache for maintenance mode with 15s TTL to prevent loopback request slowdowns
let cachedMaintenanceMode: boolean | null = null;
let lastMaintenanceCheck = 0;
const MAINTENANCE_CACHE_TTL = 15000; // 15 seconds

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define paths that should ALWAYS bypass maintenance check
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname === '/maintenance' ||
    pathname.startsWith('/_next') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|webp|woff2|woff|ttf)$/)
  ) {
    return await updateSession(request);
  }

  // 2. Check maintenance mode from cache or cached API fetch
  const now = Date.now();
  if (cachedMaintenanceMode === null || now - lastMaintenanceCheck > MAINTENANCE_CACHE_TTL) {
    try {
      const baseUrl = request.nextUrl.origin;
      const res = await fetch(`${baseUrl}/api/settings/maintenance`, {
        next: { revalidate: 15 },
      });

      if (res.ok) {
        const data = await res.json();
        cachedMaintenanceMode = data.maintenanceMode === true;
        lastMaintenanceCheck = now;
      }
    } catch {
      // Fail open on error
      cachedMaintenanceMode = false;
    }
  }

  // 3. If maintenance mode is ON, rewrite to maintenance page
  if (cachedMaintenanceMode === true) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  // 4. Refresh session and continue
  return await updateSession(request);
}

// Ensure proxy runs on all paths to properly intercept
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
