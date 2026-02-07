// components/Navbar.tsx
'use client';

import { PremiumModal } from '@/components/PremiumModal';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Zap,
  Home,
  PlusCircle,
  LogOut,
  User,
  Settings,
  Bell,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

type NavbarVariant = 'landing' | 'dashboard' | 'create' | 'analytics';

interface NavbarProps {
  variant?: NavbarVariant;
}

export function Navbar({ variant }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentVariant: NavbarVariant =
    variant ??
    (pathname === '/'
      ? 'landing'
      : pathname?.includes('/create')
      ? 'create'
      : pathname?.includes('/analytics')
      ? 'analytics'
      : 'dashboard');

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const Logo = (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative h-9 w-36 md:h-10 md:w-40 transition-transform group-hover:scale-105">
        <Image
          src="/images/logo6.png"
          alt="StarlingPost"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 144px, 160px"
        />
      </div>
    </Link>
  );

  // CREATE VARIANT
  if (currentVariant === 'create') {
    return (
      <nav
        className={`sticky top-0 z-50 pb-2 transition-all duration-300 ${
          isScrolled
            ? 'bg-gradient-to-r from-gray-900/95 via-gray-900/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl'
            : 'bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 border-b border-gray-800'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {Logo}
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-xs font-semibold text-gray-300">
                  Content Studio
                </span>
                <span className="text-[11px] text-gray-500">
                  Draft, refine, and publish in one place
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Home size={16} />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // LANDING VARIANT
  if (currentVariant === 'landing') {
    const isAuthPage = pathname === '/login' || pathname === '/register';

    return (
      <nav
        className={`fixed top-0 z-50 w-full pb-2 transition-all duration-300 ${
          isScrolled
            ? 'bg-gradient-to-r from-gray-900/95 via-gray-900/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl'
            : 'bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 border-b border-gray-800'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {Logo}
            </div>

            <div className="flex items-center gap-3">
              {!user && !isAuthPage && (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="hidden md:inline-flex px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors text-sm font-medium"
                    aria-label="Sign In"
                  >
                    Sign In
                  </button>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center gap-2 text-sm"
                  >
                    <Sparkles size={16} />
                    Get Started Free
                  </Link>
                </>
              )}

              {user && (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center gap-2 text-sm"
                >
                  <Zap size={16} />
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // DASHBOARD / ANALYTICS VARIANT
  return (
    <>
      <nav
        className={`sticky top-0 z-50 pb-2 transition-all duration-300 ${
          isScrolled
            ? 'bg-gradient-to-r from-gray-900/95 via-gray-900/95 to-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl'
            : 'bg-gradient-to-r from-gray-900 via-gray-900 to-gray-900 border-b border-gray-800'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left cluster: logo + context */}
            <div className="flex items-center gap-3">
              {Logo}
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-xs font-semibold text-gray-300">
                  Creator dashboard
                </span>
                <span className="text-[11px] text-gray-500">
                  Plan, publish, and measure performance
                </span>
              </div>
            </div>

            {/* Right cluster: actions + user */}
            <div className="flex items-center gap-4">
              {/* CREATE as primary button */}
              <Link
                href="/posts/create"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 text-sm"
              >
                <PlusCircle size={16} />
                Create
              </Link>

              {/* Premium */}
              <button
                onClick={() => setShowPremiumModal(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/25 transition-all duration-300 text-sm"
              >
                <Sparkles size={16} />
                Upgrade
              </button>

              {/* Notifications */}
              <button className="p-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white transition-colors">
                <Bell size={18} />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                    {userProfile?.displayName?.charAt(0) ||
                      user?.email?.charAt(0) ||
                      'U'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-white">
                      {userProfile?.displayName || 'User'}
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-[120px]">
                      {user?.email}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-800">
                      <div className="text-sm font-semibold text-white">
                        {userProfile?.displayName || 'User'}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {user?.email}
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={16} />
                      Your Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings size={16} />
                      Settings
                    </Link>

                    <div className="h-px bg-gray-800 my-2" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile actions row under main bar */}
          <div className="md:hidden pb-1 flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Link
                href="/posts/create"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-medium"
              >
                <PlusCircle size={14} />
                Create
              </Link>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium"
              >
                <Sparkles size={14} />
                Upgrade
              </button>
            </div>
            <button
              onClick={() => setUserMenuOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 text-xs"
            >
              <User size={14} />
              Account
            </button>
          </div>
        </div>
      </nav>

      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}

      <PremiumModal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </>
  );
}
