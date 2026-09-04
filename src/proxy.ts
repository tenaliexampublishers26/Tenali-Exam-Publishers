import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * Next.js 16 Proxy Convention
 * Handles Supabase session updates for page routes.
 * CRITICAL: Excludes /api routes so Route Handlers are never intercepted.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Completely bypass API routes and internal assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Refresh Supabase auth session for client pages
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
