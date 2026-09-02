import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/study-materials/',
          '/languages',
          '/about',
          '/contact',
          '/faq',
          '/privacy-policy',
          '/terms',
          '/track-order',
          '/images/',
        ],
        disallow: [
          '/admin/',
          '/admin/*',
          '/api/',
          '/cart',
          '/checkout',
          '/account/',
          '/account/*',
          '/order-confirmation/',
          '/order-confirmation/*',
          '/login',
          '/maintenance',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/study-materials/',
          '/languages',
          '/about',
          '/contact',
          '/faq',
          '/privacy-policy',
          '/terms',
          '/track-order',
          '/images/',
        ],
        disallow: [
          '/admin/',
          '/admin/*',
          '/api/',
          '/cart',
          '/checkout',
          '/account/',
          '/order-confirmation/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
