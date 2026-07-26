import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gym Passes & Pricing',
  description: 'Explore flexible gym membership plans - daily, weekly, monthly, and yearly passes. No contracts, cancel anytime.',
  openGraph: {
    title: 'Gym Passes & Pricing | Neyofit',
    description: 'Explore flexible gym membership plans - no contracts, cancel anytime.',
    type: 'website',
    images: ['/images/og-passes.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gym Passes & Pricing',
    description: 'Explore flexible gym membership plans.',
    images: ['/images/og-passes.jpg'],
  },
};

export default function PassesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
