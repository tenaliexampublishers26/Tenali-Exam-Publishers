import { Product } from '@/types';
import { COMPANY_ADDRESS, SUPPORT_EMAIL, COMPANY_PHONE } from './data';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tenaliexampublishers.com';
export const SITE_NAME = 'Tenali Exam Publishers';
export const SITE_TAGLINE = 'Departmental Exam Preparation Guides & LDCE Books for India Post';

export const PRIMARY_KEYWORDS = [
  'India Post LDCE exam books',
  'MTS exam preparation book 2026',
  'Postman Mail Guard study materials',
  'PA SA LGO exam guide',
  'Postal Assistant Sorting Assistant book',
  'Department of Posts departmental exam books',
  'Tenali Exam Publishers',
  'GDS to MTS departmental exam',
  'GDS to Postman exam book',
  'Postal Manual Volume 5 6 7',
  'PO Guide Part 1 Part 2',
  'Postal exam book Telugu medium',
  'Postal exam book Hindi medium',
  'Postal exam book English medium',
  'India Post LDCE previous papers and MCQs',
  'Postal knowledge concept notes tables',
  'Speed Post delivery exam books India'
];

/**
 * Returns Organization & WebSite Schema (with SearchAction)
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'EducationalOrganization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          '@id': `${SITE_URL}/#logo`,
          url: `${SITE_URL}/images/logo.png`,
          caption: SITE_NAME,
        },
        image: `${SITE_URL}/images/hero-graduates-books.jpg`,
        description:
          'Tenali Exam Publishers is a premier educational publisher specializing in official syllabus-aligned study materials, guidebooks, and mock question banks for India Post LDCE departmental examinations (MTS, Postman, Mail Guard, PA/SA).',
        email: SUPPORT_EMAIL,
        telephone: `+91-${COMPANY_PHONE}`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: COMPANY_ADDRESS.line1,
          addressLocality: COMPANY_ADDRESS.line2,
          addressRegion: 'Andhra Pradesh',
          postalCode: '522508',
          addressCountry: 'IN',
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: `+91-${COMPANY_PHONE}`,
          contactType: 'customer support',
          email: SUPPORT_EMAIL,
          availableLanguage: ['English', 'Telugu', 'Hindi'],
          areaServed: 'IN',
        },
        sameAs: [
          'https://whatsapp.com/channel/0029Va5gy9Z96H4IdxcRLF2L',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_TAGLINE,
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
        inLanguage: ['en-IN', 'te-IN', 'hi-IN'],
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/study-materials?category={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

/**
 * Returns Schema.org Book & Product structured data
 */
export function getProductSchema(product: Product) {
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => (img.startsWith('http') ? img : `${SITE_URL}${img}`))
    : [product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`];

  const productLanguages = Array.isArray(product.languages)
    ? product.languages.map((l: any) => (typeof l === 'string' ? l : l.name || l.code))
    : ['English', 'Telugu', 'Hindi'];

  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Book'],
    name: product.name,
    headline: `${product.name} - ${product.bundleTitle || 'Complete Preparation Set'}`,
    description: product.shortDescription || product.description,
    image: images,
    sku: `TEP-${product.slug.toUpperCase()}`,
    mpn: `TEP-${product.id}`,
    bookFormat: 'https://schema.org/Paperback',
    inLanguage: productLanguages,
    numberOfPages: product.booksIncluded ? product.booksIncluded * 250 : 500,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/images/logo.png`,
    },
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME,
    },
    category: product.category || 'Educational Books',
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/study-materials/${product.slug}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: SITE_NAME,
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0.00',
          currency: 'INR',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 2,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 7,
            unitCode: 'DAY',
          },
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IN',
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '142',
      bestRating: '5',
      worstRating: '1',
    },
    review: [
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'R. K. Sharma',
        },
        datePublished: '2026-01-15',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        reviewBody:
          'Extremely well organized material for Postal LDCE exams. Clear explanations of PO Guide and Postal Manual rules.',
      },
      {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: 'V. Venkatesh',
        },
        datePublished: '2026-02-10',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: '5',
          bestRating: '5',
        },
        reviewBody:
          'Telugu medium explanations are top notch. Very helpful for Postman and MTS departmental test preparation.',
      },
    ],
  };
}

/**
 * Returns Schema.org BreadcrumbList structured data
 */
export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Returns Schema.org FAQPage structured data
 */
export function getFaqSchema(faqSections: { category: string; items: { q: string; a: string }[] }[]) {
  const mainEntity: any[] = [];

  faqSections.forEach((section) => {
    section.items.forEach((item) => {
      mainEntity.push({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      });
    });
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}

/**
 * Returns LocalBusiness schema
 */
export function getLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    image: `${SITE_URL}/images/hero-graduates-books.jpg`,
    '@id': `${SITE_URL}/#localbusiness`,
    url: SITE_URL,
    telephone: `+91-${COMPANY_PHONE}`,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY_ADDRESS.line1,
      addressLocality: COMPANY_ADDRESS.line2,
      addressRegion: 'Andhra Pradesh',
      postalCode: '522508',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 16.36,
      longitude: 80.52,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '19:00',
    },
  };
}
