import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Gyms Near You',
  description: 'Find gyms near your location with advanced filters for price, facilities, ratings, and distance. Book flexible gym passes instantly.',
  openGraph: {
    title: 'Search Gyms Near You | Neyofit',
    description: 'Find gyms near your location with advanced filters.',
    type: 'website',
    images: ['/images/og-search.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Search Gyms Near You',
    description: 'Find gyms near your location with advanced filters.',
    images: ['/images/og-search.jpg'],
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
