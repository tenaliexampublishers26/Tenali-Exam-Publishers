import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// ─── Rate Limit Store (In-Memory Sliding Window) ───────────────────────────
const rateLimitStore = new Map<string, number[]>();

interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
}

const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  // Auth routes — tight limits to prevent brute-force
  '/api/auth/login':    { windowMs: 60_000, maxRequests: 10 },
  '/api/auth/register': { windowMs: 60_000, maxRequests: 5  },
  '/api/auth/sync':     { windowMs: 60_000, maxRequests: 20 },

  // Payment routes — strict
  '/api/payment':       { windowMs: 10_000, maxRequests: 5  },

  // Order creation — moderate
  '/api/orders/create': { windowMs: 60_000, maxRequests: 15 },

  // Product reads — generous
  '/api/products':      { windowMs: 60_000, maxRequests: 120 },

  // Admin routes — moderate
  '/api/admin':         { windowMs: 60_000, maxRequests: 60 },

  // Default for any other API route
  '/api':               { windowMs: 60_000, maxRequests: 200 },
};

function getRuleForPath(pathname: string): RateLimitRule | null {
  const sortedKeys = Object.keys(RATE_LIMIT_RULES).sort((a, b) => b.length - a.length);
  for (const prefix of sortedKeys) {
    if (pathname.startsWith(prefix)) return RATE_LIMIT_RULES[prefix];
  }
  return null;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function checkRateLimit(ip: string, pathname: string, rule: RateLimitRule): boolean {
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const windowStart = now - rule.windowMs;
  const timestamps = rateLimitStore.get(key) || [];
  const valid = timestamps.filter((t) => t > windowStart);

  if (valid.length >= rule.maxRequests) {
    rateLimitStore.set(key, valid);
    return false;
  }

  valid.push(now);
  rateLimitStore.set(key, valid);

  if (Math.random() < 0.001) {
    for (const [k, ts] of rateLimitStore) {
      const stillActive = ts.some((t) => t > Date.now() - 120_000);
      if (!stillActive) rateLimitStore.delete(k);
    }
  }

  return true;
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return res;
}

/**
 * Next.js 16 Proxy Convention
 * Handles maintenance mode redirection, rate limiting, security headers, and Supabase auth session.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass internal Next.js assets & static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Maintenance Mode Interceptor
  const isMaintenanceCookie = request.cookies.get('tep_maintenance')?.value === 'true';
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/auth');
  const isMaintenancePath = pathname === '/maintenance';
  const isMaintenanceApi = pathname === '/api/settings/maintenance';

  if (isMaintenanceCookie) {
    // If maintenance mode is ON:
    // Non-admin public paths MUST redirect to /maintenance
    if (!isAdminPath && !isAuthPath && !isMaintenancePath && !isMaintenanceApi) {
      // Allow logged-in admins to preview the store
      const userRole = request.cookies.get('tep_user_role')?.value;
      if (userRole !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/maintenance';
        return applySecurityHeaders(NextResponse.redirect(url));
      }
    }
  } else {
    // If maintenance mode is OFF:
    // Anyone on /maintenance should be redirected back to the home page
    if (isMaintenancePath) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  // 3. Rate-limit API routes to protect database at scale
  if (pathname.startsWith('/api')) {
    const rule = getRuleForPath(pathname);
    if (rule) {
      const ip = getClientIP(request);
      if (!checkRateLimit(ip, pathname, rule)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests. Please slow down and try again later.',
            retryAfter: Math.ceil(rule.windowMs / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(Math.ceil(rule.windowMs / 1000)),
              'X-RateLimit-Limit': String(rule.maxRequests),
              'X-RateLimit-Window': String(rule.windowMs),
            },
          }
        );
      }
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Refresh Supabase auth session for client pages
  const response = await updateSession(request);
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
