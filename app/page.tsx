import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';
import { JsonLd } from '@/components/JsonLd';
import { PLANS, HOMEPAGE_FAQ } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'StarlingPost — Post once to YouTube, X & LinkedIn',
  description:
    'StarlingPost is a social media scheduling and automation tool — post once to YouTube, Twitter/X, and LinkedIn with AI captions, scheduling, and comment automation.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'StarlingPost — Post once to YouTube, X & LinkedIn',
    description:
      'Post once to YouTube, Twitter/X, and LinkedIn. AI captions, scheduling, and comment automation in one dashboard. Instagram, Facebook, and Threads coming soon.',
    url: 'https://www.starlingpost.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StarlingPost — Post once to YouTube, X & LinkedIn',
    description:
      'Post once to YouTube, Twitter/X, and LinkedIn. AI captions, scheduling, and comment automation in one dashboard.',
    images: ['/images/og-cover.png'],
    creator: '@starlingpost',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function Home() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'StarlingPost',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://www.starlingpost.com',
    description:
      'StarlingPost is a social media scheduling and automation tool that publishes a single post to YouTube, Twitter/X, and LinkedIn — with Instagram, Facebook, and Threads coming soon.',
    offers: PLANS.map((plan) => ({
      '@type': 'Offer',
      name: plan.label,
      price: plan.priceNum.toString(),
      priceCurrency: 'USD',
      description: plan.desc,
    })),
    author: { '@type': 'Organization', name: 'StarlingPost' },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOMEPAGE_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />
      <LandingPage />
    </>
  );
}
