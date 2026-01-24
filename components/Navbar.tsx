// components/Navbar.tsx
'use client';

import { PremiumModal } from '@/components/PremiumModal';
import { useAuth } from '@/context/AuthContext';
import { Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

type NavbarVariant = 'landing' | 'dashboard' | 'create';

interface NavbarProps {
  variant?: NavbarVariant;
}

const centerLinks = ['Feed', 'Analytics', 'Schedule', 'AI Tools', 'Team'];

export function Navbar({ variant }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const currentVariant: NavbarVariant =
    variant ??
    (pathname === '/'
      ? 'landing'
      : pathname?.startsWith('/posts/create')
        ? 'create'
        : 'dashboard');

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  // Logo: same visual weight as landing, no extra gap
  const Logo = (
    <Link href="/" className="flex items-center">
      <div className="relative h-12 w-56 md:h-14 md:w-64">
        <Image
          src="/images/logo6.png"
          alt="StarlingPost"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 224px, 256px"
        />
      </div>
    </Link>
  );

  // CREATE VARIANT (editor)
  if (currentVariant === 'create') {
    return (
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {Logo}
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs sm:text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-100"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>
    );
  }

  // LANDING VARIANT
  if (currentVariant === 'landing') {
    return (
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {Logo}
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/login')}
              className="rounded-full bg-sky-50 px-4 py-2 text-xs sm:text-sm font-medium text-sky-700 transition hover:bg-sky-100 hover:text-sky-800"
              aria-label="Sign In"
            >
              Sign In
            </button>
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-sky-700 hover:to-blue-700 hover:shadow-xl active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              Get Started
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // DASHBOARD VARIANT – aligned with landing (light, glassy, sky accents)
  return (
    <>

      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            {Logo}
            <div className="hidden flex-col sm:flex">
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Creator analytics
              </span>
              <span className="text-[11px] text-slate-500">
                Track performance across platforms
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/posts/create"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-md transition hover:shadow-lg"
            >
              ✨ New post
            </Link>
            <button
              onClick={() => setShowPremiumModal(true)}
              className="hidden sm:inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs sm:text-sm font-medium text-amber-700 transition hover:bg-amber-100"

            >
              ⭐ Premium (coming soon)
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <PremiumModal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>

  );
}
