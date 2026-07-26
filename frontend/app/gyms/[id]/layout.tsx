import type { Metadata } from 'next';
import { Gym } from '@/lib/api';

interface GymDetailLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
  gymData?: Gym;
}

export async function generateMetadata({ params, gymData }: GymDetailLayoutProps): Promise<Metadata> {
  const resolvedParams = await params;
  const gym = gymData;
  
  if (!gym) {
    return {
      title: 'Gym Not Found | Neyofit',
      description: 'The gym you are looking for does not exist or has been removed.',
      robots: 'noindex, nofollow',
    };
  }

  const location = gym.location?.address 
    ? `${gym.location.address.city}, ${gym.location.address.state}`
    : 'your area';

  const title = `${gym.name} | Gym in ${location} | Neyofit`;
  const description = `Discover ${gym.name} in ${location}. ${gym.description || `View facilities, pricing, reviews, and book flexible gym passes on Neyofit.`}`;
  const image = gym.pictures?.[0] 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.neyofit.in/api/v1'}/gym-pictures/${gym.pictures[0]}/image`
    : 'https://neyofit.in/og-default.jpg';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Gym',
    name: gym.name,
    description: gym.description,
    address: gym.location?.address ? {
      '@type': 'PostalAddress',
      streetAddress: gym.location.address.street,
      addressLocality: gym.location.address.city,
      addressRegion: gym.location.address.state,
      postalCode: gym.location.address.pinCode,
      addressCountry: gym.location.address.country,
    } : undefined,
    geo: gym.location?.coordinates ? {
      '@type': 'GeoCoordinates',
      latitude: gym.location.coordinates.coordinates[1],
      longitude: gym.location.coordinates.coordinates[0],
    } : undefined,
    telephone: gym.contact?.phone,
    email: gym.contact?.email,
    url: `https://neyofit.in/gyms/${gym._id}`,
    image: gym.pictures?.map(p => `${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.neyofit.in/api/v1'}/gym-pictures/${p}/image`) || [],
    priceRange: gym.priceRange,
    aggregateRating: gym.rating ? {
      '@type': 'AggregateRating',
      ratingValue: gym.rating,
      reviewCount: gym.reviewCount || 0,
    } : undefined,
    openingHoursSpecification: gym.openingHours ? Object.entries(gym.openingHours).map(([day, schedule]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: day.charAt(0).toUpperCase() + day.slice(1),
      opens: schedule.slots?.[0]?.startTime || '06:00',
      closes: schedule.slots?.[0]?.endTime || '22:00',
      validFrom: '2024-01-01',
      validThrough: '2025-12-31',
    })).filter(h => !h.opens.includes('closed')) : undefined,
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://neyofit.in'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Gyms',
        item: 'https://neyofit.in/gyms'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: gym.name,
        item: `https://neyofit.in/gyms/${gym._id}`
      }
    ]
  };

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://neyofit.in/gyms/${gym._id}`,
      siteName: 'Neyofit',
      type: 'website',
      locale: 'en_IN',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: gym.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `https://neyofit.in/gyms/${gym._id}`,
    },
    other: {
      'application/ld+json': JSON.stringify([structuredData, breadcrumbSchema]),
    },
  };
}

export default function GymDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}