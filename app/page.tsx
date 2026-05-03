// app/page.tsx — server component for SEO + metadata
import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'StarlingPost — Schedule & Automate YouTube, Twitter/X & LinkedIn Content',
  description:
    'StarlingPost is the all-in-one content scheduling and automation platform for creators. Schedule posts, auto-reply to comments, and grow faster on YouTube, Twitter/X, and LinkedIn.',
  keywords: [
    'social media scheduler',
    'YouTube scheduler',
    'Twitter scheduler',
    'LinkedIn automation',
    'content automation',
    'auto reply comments',
    'social media management tool',
    'creator tools',
    'schedule YouTube videos',
    'grow on social media',
  ],
  authors: [{ name: 'StarlingPost' }],
  creator: 'StarlingPost',
  publisher: 'StarlingPost',
  metadataBase: new URL('https://www.starlingpost.com'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'StarlingPost — Automate Your Social Media Growth',
    description:
      'Schedule posts, auto-reply to comments, and analyze performance across YouTube, Twitter/X, and LinkedIn — all from one powerful dashboard.',
    url: 'https://www.starlingpost.com',
    siteName: 'StarlingPost',
    images: [
      {
        url: '/images/og-cover.png',
        width: 1200,
        height: 630,
        alt: 'StarlingPost — Social Media Automation Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StarlingPost — Social Media Automation for Creators',
    description:
      'Schedule, automate, and grow on YouTube, Twitter/X, and LinkedIn with AI-powered tools.',
    images: ['/images/og-cover.png'],
    creator: '@starlingpost',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'StarlingPost',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://www.starlingpost.com',
  description:
    'All-in-one social media scheduling and automation platform for YouTube, Twitter/X, and LinkedIn creators.',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '0',
    highPrice: '79',
    priceCurrency: 'USD',
    offerCount: 3,
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '412',
  },
  author: { '@type': 'Organization', name: 'StarlingPost' },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
