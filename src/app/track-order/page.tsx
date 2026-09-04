import type { Metadata } from 'next';
import { SITE_NAME, SITE_URL, getBreadcrumbSchema } from '@/lib/seo';
import JsonLd from '@/components/seo/JsonLd';
import TrackOrderClient from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'Track Your Book Order | Tenali Exam Publishers',
  description:
    'Track your India Post Speed Post parcel delivery status in real-time using your Order ID and phone number or email address.',
  alternates: {
    canonical: '/track-order',
  },
  openGraph: {
    title: 'Track Your Order | Tenali Exam Publishers',
    description: 'Check real-time dispatch and delivery status of your exam study materials.',
    url: `${SITE_URL}/track-order`,
    type: 'website',
  },
};

export default function TrackOrderPage(): React.JSX.Element {
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Track Order', url: '/track-order' },
  ]);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <JsonLd data={breadcrumbSchema} />
      <header className="page-header">
        <h1 className="page-title">Track Your Order</h1>
      </header>
      <main>
        <TrackOrderClient />
      </main>
    </div>
  );
}
