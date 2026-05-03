// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.starlingpost.com'),
  title: {
    default: 'StarlingPost — Social Media Automation for Creators',
    template: '%s | StarlingPost',
  },
  description:
    'Schedule posts, auto-reply to comments, and grow your audience on YouTube, Twitter/X, and LinkedIn with StarlingPost.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7342126104264680"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="bg-gray-950 text-white antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
