// components/Navbar.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import {
  PlusCircle, LogOut, User, Settings, ChevronDown, Bot,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, userProfile, logout } = useAuth();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  // Auth pages render their own minimal header
  if (pathname === '/login' || pathname === '/register') return null;

  const handleLogout = async () => {
    try { await logout(); router.push('/'); }
    catch (e) { console.error('Logout error:', e); }
  };

  const initial = (userProfile?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  const navBase = `
    sticky top-0 z-50 w-full
    bg-[#0a0a0b] border-b border-stone-800
    transition-colors duration-200
    ${scrolled ? 'bg-[#0a0a0b]/95 backdrop-blur-md' : ''}
  `;

  const Logo = (
    <Link href={user ? '/dashboard' : '/'} className="flex items-center">
      <div className="relative h-9 w-36 md:h-10 md:w-40">
        <Image
          src="/images/logo.png"
          alt="StarlingPost"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 144px, 160px"
        />
      </div>
    </Link>
  );

  const UserMenu = (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(v => !v)}
        className="flex items-center gap-2.5 border border-stone-800 px-3 py-2 hover:border-stone-600 transition-colors"
      >
        <div className="w-7 h-7 bg-[#f4f1ea] text-[#0a0a0b] flex items-center justify-center font-display italic font-bold text-sm">
          {initial}
        </div>
        <span className="hidden md:block font-mono text-[10px] uppercase tracking-[0.15em] text-stone-300 max-w-[120px] truncate">
          {userProfile?.displayName || user?.email?.split('@')[0] || 'Account'}
        </span>
        <ChevronDown size={12} className={`text-stone-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-1 w-60 bg-[#0a0a0b] border border-stone-800 shadow-2xl z-50">
          <div className="px-4 py-3.5 border-b border-stone-800">
            <div className="font-display italic text-stone-100 text-base">
              {userProfile?.displayName || 'Account'}
            </div>
            <div className="font-mono text-[10px] text-stone-500 truncate mt-0.5 uppercase tracking-[0.1em]">
              {user?.email}
            </div>
          </div>

          {[
            { Icon: User,     label: 'Profile',    href: '/profile'    },
            { Icon: Bot,      label: 'Automation', href: '/automation' },
            { Icon: Settings, label: 'Settings',   href: '/settings'   },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-stone-400 hover:text-stone-100 hover:bg-stone-900/60 transition-colors border-b border-stone-900"
            >
              <item.Icon size={14} className="text-stone-600" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-[#ff5e3a]/80 hover:text-[#ff5e3a] hover:bg-[#ff5e3a]/5 transition-colors"
          >
            <LogOut size={14} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );

  // ── LANDING ──────────────────────────────────────────────────────────────────
  if (pathname === '/') {
    return (
      <nav className={navBase.replace('sticky', 'fixed')}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          {Logo}
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="hidden md:inline-flex px-4 py-2 border border-stone-800 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors"
                >
                  Sign In
                </button>
                <Link
                  href="/register"
                  className="bg-[#d4ff3a] text-[#0a0a0b] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] transition-colors"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="bg-[#d4ff3a] text-[#0a0a0b] px-5 py-2 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] transition-colors"
              >
                Studio →
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // ── POST CREATE ───────────────────────────────────────────────────────────────
  if (pathname?.startsWith('/posts')) {
    return (
      <nav className={navBase}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          {Logo}
          <Link
            href="/dashboard"
            className="border border-stone-800 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>
    );
  }

  // ── SUB-PAGES (automation / settings / profile) ───────────────────────────────
  const isSubPage = pathname?.startsWith('/automation') ||
                    pathname?.startsWith('/settings')   ||
                    pathname?.startsWith('/profile');

  if (isSubPage) {
    return (
      <nav className={navBase}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          {Logo}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden md:inline-flex border border-stone-800 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors"
            >
              ← Dashboard
            </Link>
            {UserMenu}
          </div>
        </div>
      </nav>
    );
  }

  // ── DASHBOARD / ANALYTICS ─────────────────────────────────────────────────────
  return (
    <>
      <nav className={navBase}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 h-14 flex items-center justify-between">
          {Logo}
          <div className="flex items-center gap-2">
            <Link
              href="/posts/create"
              className="hidden md:inline-flex items-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] transition-colors"
            >
              <PlusCircle size={12} /> New Post
            </Link>
            {UserMenu}
          </div>
        </div>

        {/* Mobile row */}
        <div className="md:hidden border-t border-stone-900 flex items-center justify-between px-6 py-2">
          <Link
            href="/posts/create"
            className="inline-flex items-center gap-1.5 bg-[#d4ff3a] text-[#0a0a0b] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] font-bold"
          >
            <PlusCircle size={11} /> New Post
          </Link>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="border border-stone-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400"
          >
            {initial} ▾
          </button>
        </div>
      </nav>
    </>
  );
}
