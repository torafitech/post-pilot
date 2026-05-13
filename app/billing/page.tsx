'use client';

import { useAuth } from '@/context/AuthContext';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

const PLANS = [
  {
    key:   'starter',
    label: 'Starter',
    price: '$9',
    features: [
      '3 connected accounts',
      '30 posts per month',
      '3 automation rules',
      'AI caption enhancement',
      'Link Me auto-reply',
      'Post scheduling',
    ],
  },
  {
    key:   'growth',
    label: 'Growth',
    price: '$19',
    highlight: true,
    features: [
      '10 connected accounts',
      'Unlimited posts',
      'Unlimited automation rules',
      'Live platform analytics',
      'Optimal post timing',
      'Multi-account per platform',
    ],
  },
  {
    key:   'agency',
    label: 'Agency',
    price: '$49',
    features: [
      'Unlimited connected accounts',
      'Unlimited posts & rules',
      'Multiple workspaces',
      'Priority support',
      'API access',
      'Everything in Growth',
    ],
  },
];

const PLAN_DISPLAY: Record<string, string> = {
  trial:    'Trial',
  starter:  'Starter',
  growth:   'Growth',
  agency:   'Agency',
  expired:  'Expired',
  freemium: 'Trial',
};

export default function BillingPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]); // eslint-disable-line

  const { trialDaysLeft, isInTrial, isExpired } = useMemo(() => {
    if (!userProfile?.createdAt) return { trialDaysLeft: 0, isInTrial: false, isExpired: false };
    const trialEnd  = new Date(userProfile.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const daysLeft  = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    const plan      = userProfile.plan || 'trial';
    const inTrial   = (plan === 'trial' || plan === 'freemium') && daysLeft > 0;
    const expired   = plan === 'expired' || ((plan === 'trial' || plan === 'freemium') && daysLeft === 0);
    return { trialDaysLeft: daysLeft, isInTrial: inTrial, isExpired: expired };
  }, [userProfile]);

  if (loading || !user) return null;

  const currentPlan  = userProfile?.plan || 'trial';
  const displayName  = PLAN_DISPLAY[currentPlan] || currentPlan;
  const isPaidPlan   = ['starter', 'growth', 'agency'].includes(currentPlan);

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain">
      <div className="max-w-[860px] mx-auto px-6 md:px-10 py-16">

        {/* Header */}
        <div className="mb-10 pb-8 border-b border-stone-800">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">Account</p>
          <h1
            className="font-display italic text-stone-100 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Plan & billing
          </h1>
        </div>

        {/* Status banner */}
        {isInTrial && (
          <div className="mb-8 border border-[#d4ff3a]/20 bg-[#d4ff3a]/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff3a] flex-shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a]">
                Trial active · {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600">
              Full access until trial ends
            </span>
          </div>
        )}

        {isExpired && (
          <div className="mb-8 border border-[#ff5e3a]/30 bg-[#ff5e3a]/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5e3a] flex-shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5e3a]">
                Trial ended · Subscribe to resume
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600">
              Your data is preserved for 30 days
            </span>
          </div>
        )}

        {/* Current plan card */}
        <div className="mb-10 flex items-center justify-between p-5 border border-stone-800">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-1">Current plan</p>
            <div className="flex items-center gap-3">
              <span className="font-display italic text-2xl text-stone-100">{displayName}</span>
              <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border ${
                isPaidPlan
                  ? 'border-[#d4ff3a]/30 text-[#d4ff3a]'
                  : isExpired
                    ? 'border-[#ff5e3a]/30 text-[#ff5e3a]'
                    : 'border-stone-700 text-stone-500'
              }`}>
                {isPaidPlan ? 'Active' : isInTrial ? 'Trial' : 'Expired'}
              </span>
            </div>
          </div>
          {!isPaidPlan && (
            <Link
              href="/pricing"
              className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-500 hover:text-[#d4ff3a] transition-colors"
            >
              View plans →
            </Link>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-stone-800 mb-10">
          {PLANS.map((plan, idx) => {
            const isCurrent = currentPlan === plan.key;
            return (
              <div
                key={plan.key}
                className={`p-7 relative ${idx < PLANS.length - 1 ? 'border-b md:border-b-0 md:border-r border-stone-800' : ''} ${isCurrent ? 'bg-stone-900/40' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`font-mono text-[10px] uppercase tracking-[0.25em] mb-1 ${plan.highlight ? 'text-[#d4ff3a]' : 'text-stone-500'}`}>
                      {plan.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-display italic text-stone-100"
                        style={{ fontSize: '2rem', fontVariationSettings: '"opsz" 80', lineHeight: 1 }}
                      >
                        {plan.price}
                      </span>
                      <span className="font-mono text-[9px] text-stone-600 uppercase tracking-[0.15em]">/mo</span>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border border-[#d4ff3a]/30 text-[#d4ff3a]">
                      Current
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check size={12} className={plan.highlight ? 'text-[#d4ff3a] flex-shrink-0' : 'text-stone-600 flex-shrink-0'} />
                      <span className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.08em]">{f}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <>
                    <button
                      disabled
                      className={`w-full font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-3 opacity-40 cursor-not-allowed ${
                        plan.highlight
                          ? 'bg-[#d4ff3a] text-[#0a0a0b]'
                          : 'border border-stone-700 text-stone-400'
                      }`}
                    >
                      {isExpired ? 'Subscribe' : 'Upgrade'}
                    </button>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-800 text-center mt-1.5">
                      Billing coming soon
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 text-center mb-2">
          All plans include a 14-day free trial · Cancel anytime · No credit card for trial
        </p>

        {/* Footer nav */}
        <div className="mt-10 pt-8 border-t border-stone-800 flex items-center justify-between">
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
