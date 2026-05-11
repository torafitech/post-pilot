// app/page.tsx — server component for SEO + metadata
import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';

export const metadata: Metadata = {
  title: 'StarlingPost — One post, six platforms',
  description:
    'StarlingPost publishes once to YouTube, Twitter/X, LinkedIn, Instagram, Facebook, and Threads. AI captions per platform, scheduling, keyword auto-reply, and comment automation — built for creators and agencies.',
  keywords: [
    'social media scheduler',
    'YouTube scheduler',
    'Twitter scheduler',
    'LinkedIn automation',
    'Instagram scheduler',
    'Facebook page scheduler',
    'Threads scheduler',
    'multi platform posting',
    'AI caption generator',
    'auto reply comments',
    'content automation',
    'social media agency tool',
  ],
  authors: [{ name: 'StarlingPost' }],
  creator: 'StarlingPost',
  publisher: 'StarlingPost',
  metadataBase: new URL('https://www.starlingpost.com'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'StarlingPost — One post, six platforms',
    description:
      'Publish once to YouTube, Twitter/X, LinkedIn, Instagram, Facebook, and Threads. AI captions, scheduling, and comment automation in one dashboard.',
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
    title: 'StarlingPost — One post, six platforms',
    description:
      'Publish to YouTube, Twitter/X, LinkedIn, Instagram, Facebook, and Threads from one composer. AI captions + scheduling + comment automation.',
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
    'All-in-one social media scheduling and automation platform for YouTube, Twitter/X, LinkedIn, Instagram, Facebook, and Threads creators and agencies.',
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
