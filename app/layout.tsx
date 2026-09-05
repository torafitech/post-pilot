import type { Metadata } from 'next';
import { Fraunces, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { TrackingScripts } from '@/components/TrackingScripts';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  axes: ['opsz', 'SOFT'],
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.starlingpost.com'),
  title: {
    default: 'StarlingPost — Post once to YouTube, X & LinkedIn',
    template: '%s · StarlingPost',
  },
  description:
    'StarlingPost is a social media scheduling and automation tool — post once to YouTube, Twitter/X, and LinkedIn with AI captions, scheduling, and comment automation.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'StarlingPost',
    url: 'https://www.starlingpost.com',
    title: 'StarlingPost — Post once to YouTube, X & LinkedIn',
    description:
      'StarlingPost is a social media scheduling and automation tool — post once to YouTube, Twitter/X, and LinkedIn with AI captions, scheduling, and comment automation.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'StarlingPost' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@starlingpost',
    creator: '@starlingpost',
  },
  icons: {
    icon: '/favicon.ico',
  },
  // TODO: add /public/manifest.json and uncomment:
  // manifest: '/manifest.json',
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'StarlingPost',
  url: 'https://www.starlingpost.com',
  logo: 'https://www.starlingpost.com/images/logo.png',
  sameAs: [
    'https://twitter.com/starlingpost',
    'https://linkedin.com/company/starlingpost',
    'https://youtube.com/starlingpost',
    'https://github.com/torafitech/post-pilot',
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'StarlingPost',
  url: 'https://www.starlingpost.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.starlingpost.com/blog?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7342126104264680"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-gray-950 text-white antialiased">
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
        <TrackingScripts />
        <Analytics />
      </body>
    </html>
  );
}
