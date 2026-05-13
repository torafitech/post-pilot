'use client';

import { useAuth } from '@/context/AuthContext';
import { Check, Zap } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const FREE_FEATURES = [
  '3 connected accounts',
  '10 posts per month',
  '2 automation rules',
  'Basic analytics',
];

const PRO_FEATURES = [
  'Unlimited connected accounts',
  'Unlimited posts',
  'Unlimited automation rules',
  'Live platform analytics',
  'AI caption enhancement',
  'Priority support',
];

export default function BillingPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]); // eslint-disable-line

  if (loading || !user) return null;

  const isPro = userProfile?.plan === 'pro';

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain">
      <div className="max-w-[780px] mx-auto px-6 md:px-10 py-16">

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-stone-800">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">Account</p>
          <h1
            className="font-display italic text-stone-100 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Plan & billing
          </h1>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            You are on the <span className="text-stone-300 capitalize">{userProfile?.plan || 'freemium'}</span> plan
          </p>
        </div>

        {/* Current plan */}
        <div className="mb-10 flex items-center justify-between p-5 border border-stone-800">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-1">Current plan</p>
            <div className="flex items-center gap-3">
              <span className="font-display italic text-2xl text-stone-100 capitalize">
                {userProfile?.plan || 'Freemium'}
              </span>
              <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border ${
                userProfile?.planStatus === 'active'
                  ? 'border-[#d4ff3a]/30 text-[#d4ff3a]'
                  : 'border-stone-700 text-stone-500'
              }`}>
                {userProfile?.planStatus || 'Active'}
              </span>
            </div>
          </div>
          {!isPro && (
            <div className="font-display italic text-stone-600 text-right">
              <div className="text-sm">Free forever</div>
              <div className="text-xs text-stone-700">limited features</div>
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-stone-800">

          {/* Free */}
          <div className={`p-8 ${!isPro ? 'bg-stone-900/30' : ''} md:border-r border-stone-800`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-1">Free</p>
                <div className="font-display italic text-3xl text-stone-100">Freemium</div>
              </div>
              {!isPro && (
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border border-[#d4ff3a]/30 text-[#d4ff3a]">
                  Current
                </span>
              )}
            </div>
            <div className="font-display italic text-4xl text-stone-100 mb-1">$0</div>
            <p className="font-mono text-[10px] text-stone-600 uppercase tracking-[0.15em] mb-8">Per month, forever</p>
            <ul className="space-y-3">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <Check size={13} className="text-stone-600 flex-shrink-0" />
                  <span className="font-mono text-[11px] text-stone-400 uppercase tracking-[0.1em]">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro */}
          <div className={`p-8 relative ${isPro ? 'bg-stone-900/30' : ''}`}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d4ff3a] mb-1">Recommended</p>
                <div className="font-display italic text-3xl text-stone-100">Pro</div>
              </div>
              {isPro && (
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border border-[#d4ff3a]/30 text-[#d4ff3a]">
                  Current
                </span>
              )}
            </div>
            <div className="font-display italic text-4xl text-stone-100 mb-1">$19</div>
            <p className="font-mono text-[10px] text-stone-600 uppercase tracking-[0.15em] mb-8">Per month · billed monthly</p>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-3">
                  <Check size={13} className="text-[#d4ff3a] flex-shrink-0" />
                  <span className="font-mono text-[11px] text-stone-300 uppercase tracking-[0.1em]">{f}</span>
                </li>
              ))}
            </ul>
            {!isPro && (
              <button
                disabled
                className="
                  w-full flex items-center justify-center gap-2
                  bg-[#d4ff3a] text-[#0a0a0b]
                  font-mono text-[10px] uppercase tracking-[0.25em] font-bold
                  py-3.5 opacity-50 cursor-not-allowed
                "
              >
                <Zap size={12} /> Upgrade to Pro
              </button>
            )}
            {!isPro && (
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 text-center mt-3">
                Billing integration — coming soon
              </p>
            )}
          </div>
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex items-center justify-between">
          <Link href="/profile" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            ← Profile
          </Link>
          <Link href="/dashboard" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            Dashboard →
          </Link>
        </div>

      </div>
    </div>
  );
}
