import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { GoogleMapsProvider } from '@/components/google-maps-provider'

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  // Allow user scaling for accessibility
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Neyofit',
  url: 'https://neyofit.in',
  logo: 'https://neyofit.in/images/logo.png',
  sameAs: [
    'https://twitter.com/neyofit',
    'https://instagram.com/neyofit',
    'https://linkedin.com/company/neyofit'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-XXXXXXXXXX',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi']
  }
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: 'https://neyofit.in',
  name: 'Neyofit',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://neyofit.in/search?q={search_term_string}'
    },
    'query-input': 'required name=search_term_string'
  }
}

export const metadata: Metadata = {
  title: {
    default: 'Neyofit - Flexible Gym Passes & Day Passes in India',
    template: '%s | Neyofit',
  },
  description: 'Discover verified gyms across India with flexible pay-per-day passes. No contracts, no commitments. Book day passes instantly.',
  keywords: ['gym passes', 'day pass', 'fitness', 'gym membership', 'pay per day gym', 'flexible gym', 'India gyms'],
  generator: 'Neyofit',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Neyofit',
  },
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL('https://neyofit.in'),
  alternates: {
    canonical: 'https://neyofit.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://neyofit.in',
    siteName: 'Neyofit',
    title: 'Neyofit - Flexible Gym Passes & Day Passes in India',
    description: 'Discover verified gyms across India with flexible pay-per-day passes. No contracts, no commitments.',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Neyofit - Flexible Gym Passes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@neyofit',
    creator: '@neyofit',
    title: 'Neyofit - Flexible Gym Passes',
    description: 'Discover verified gyms with flexible pay-per-day passes. No contracts.',
    images: ['/images/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'application/ld+json': JSON.stringify([organizationSchema, websiteSchema]),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={GeistSans.className}>
        <AuthProvider>
          <GoogleMapsProvider>
            {children}
          </GoogleMapsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
