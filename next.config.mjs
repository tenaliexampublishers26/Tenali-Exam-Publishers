/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Dev ─────────────────────────────────────────────────────────────────
  devIndicators: false,

  // ─── Compression ─────────────────────────────────────────────────────────
  // Enable Brotli/Gzip compression on all responses (reduces transfer size ~60-70%)
  compress: true,

  // ─── Image Optimization ───────────────────────────────────────────────────
  images: {
    // Serve modern formats (WebP → AVIF) automatically
    formats: ['image/avif', 'image/webp'],
    // Aggressive CDN caching: images are immutable once generated
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow local /public images and any external image hosts used by products
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth avatars
      },
    ],
    // Dangerously allow SVG for icon usage (safe here, no user-uploaded SVGs)
    dangerouslyAllowSVG: false,
  },

  // ─── HTTP Security & Performance Headers ──────────────────────────────────
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // XSS protection (legacy browsers)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy — don't leak full URL to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy — disable unnecessary browser APIs
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS — force HTTPS for 1 year once deployed
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Static assets: cache for 1 year (immutable)
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // ─── Build Output ─────────────────────────────────────────────────────────
  // PoweredByHeader: false removes "X-Powered-By: Next.js" (minor security hygiene)
  poweredByHeader: false,

  // ─── Trailing Slash Normalization ─────────────────────────────────────────
  trailingSlash: false,

  // ─── React Strict Mode ────────────────────────────────────────────────────
  // Helps catch side effects in development; has zero effect on production perf
  reactStrictMode: true,

  // ─── Bundle Size ──────────────────────────────────────────────────────────
  // Tree-shake unused lucide-react icons (large library if imported carelessly)
  // This is handled automatically by Next.js via SWC when using named imports
};

export default nextConfig;
