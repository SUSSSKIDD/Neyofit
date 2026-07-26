import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Gyms & Fitness Centers',
  description: 'Discover verified gyms across India with flexible pay-per-day passes. Filter by location, price, facilities, and ratings.',
  openGraph: {
    title: 'Find Gyms & Fitness Centers | Neyofit',
    description: 'Discover verified gyms across India with flexible pay-per-day passes.',
    type: 'website',
    images: ['/images/og-gyms.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Gyms & Fitness Centers',
    description: 'Discover verified gyms with flexible pay-per-day passes.',
    images: ['/images/og-gyms.jpg'],
  },
};

export default function GymsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
