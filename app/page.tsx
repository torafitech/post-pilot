import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';
import { JsonLd } from '@/components/JsonLd';
import { HOMEPAGE_FAQ } from '@/lib/pricing';
import { LAUNCH_PRICING } from '@/lib/launch';

const TITLE = 'StarlingPost — Post everywhere. Capture every lead it brings back.';
const DESCRIPTION =
  'StarlingPost helps solo developers, designers, consultants, and marketers grow reach on their organic posts across every platform — then automatically captures the comments and DMs those posts generate as leads. One flat price, no per-channel fees.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://www.starlingpost.com',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
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
    description: DESCRIPTION,
    offers: {
      '@type': 'Offer',
      name: 'Founding Member',
      price: LAUNCH_PRICING.foundingPrice.toString(),
      priceCurrency: 'INR',
      description:
        'Flat monthly price with every connected account included — no per-channel fees. Founding member rate locked for life.',
    },
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
