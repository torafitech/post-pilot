'use client';

import { useAuth } from '@/context/AuthContext';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    key:       'starter',
    label:     'Starter',
    price:     '$9',
    highlight: false,
    features:  ['3 connected accounts', '30 posts per month', '3 automation rules', 'AI caption enhancement', 'Link Me auto-reply', 'Post scheduling'],
  },
  {
    key:       'growth',
    label:     'Growth',
    price:     '$19',
    highlight: true,
    features:  ['10 connected accounts', 'Unlimited posts', 'Unlimited automation rules', 'Live platform analytics', 'Optimal post timing', 'Multi-account per platform'],
  },
  {
    key:       'agency',
    label:     'Agency',
    price:     '$49',
    highlight: false,
    features:  ['Unlimited connected accounts', 'Unlimited posts & rules', 'Multiple workspaces', 'Priority support', 'API access', 'Everything in Growth'],
  },
];

const PLAN_DISPLAY: Record<string, string> = {
  trial: 'Trial', starter: 'Starter', growth: 'Growth',
  agency: 'Agency', expired: 'Expired', freemium: 'Trial',
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export default function BillingPage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [cancelLoading,   setCancelLoading]   = useState(false);
  const [error,           setError]           = useState('');
  const [successMsg,      setSuccessMsg]      = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]); // eslint-disable-line

  const { trialDaysLeft, isInTrial, isExpired } = useMemo(() => {
    if (!userProfile?.createdAt) return { trialDaysLeft: 0, isInTrial: false, isExpired: false };
    const trialEnd = new Date(userProfile.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
    const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000));
    const plan     = userProfile.plan || 'trial';
    const inTrial  = (plan === 'trial' || plan === 'freemium') && daysLeft > 0;
    const expired  = plan === 'expired' || ((plan === 'trial' || plan === 'freemium') && daysLeft === 0);
    return { trialDaysLeft: daysLeft, isInTrial: inTrial, isExpired: expired };
  }, [userProfile]);

  if (loading || !user) return null;

  const currentPlan = userProfile?.plan || 'trial';
  const planStatus  = userProfile?.planStatus || '';
  const displayName = PLAN_DISPLAY[currentPlan] || currentPlan;
  const isPaidPlan  = ['starter', 'growth', 'agency'].includes(currentPlan);
  const isCancelling = planStatus === 'cancelling';
  const isHalted     = planStatus === 'halted' || planStatus === 'payment_failed';

  async function handleUpgrade(planKey: string) {
    setError(''); setSuccessMsg('');
    setCheckoutLoading(planKey);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error('Failed to load payment gateway. Check your connection.');

      const res  = await fetch('/api/billing/create-subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planKey }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not create subscription');

      const options = {
        key:             data.keyId,
        subscription_id: data.subscriptionId,
        name:            'StarlingPost',
        description:     `${data.planLabel} Plan`,
        image:           '/logo.png',
        prefill:         data.prefill,
        theme:           { color: '#d4ff3a' },
        modal: {
          ondismiss: () => setCheckoutLoading(null),
        },
        handler: async (response: any) => {
          try {
            const verify = await fetch('/api/billing/verify-payment', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                razorpay_payment_id:      response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature:       response.razorpay_signature,
                planKey,
              }),
            });
            const vData = await verify.json();
            if (!verify.ok || !vData.success) throw new Error(vData.error || 'Payment verification failed');
            setSuccessMsg(`Successfully subscribed to ${PLAN_DISPLAY[planKey]}! Refreshing…`);
            setTimeout(() => window.location.reload(), 2000);
          } catch (e: any) {
            setError(e.message);
          } finally {
            setCheckoutLoading(null);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r: any) => {
        setError(`Payment failed: ${r.error?.description || 'Unknown error'}`);
        setCheckoutLoading(null);
      });
      rzp.open();

    } catch (e: any) {
      setError(e.message);
      setCheckoutLoading(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Cancel your subscription? You keep access until the end of the billing period.')) return;
    setError(''); setCancelLoading(true);
    try {
      const res  = await fetch('/api/billing/cancel-subscription', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cancellation failed');
      setSuccessMsg('Subscription cancelled. Access continues until end of billing period.');
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelLoading(false);
    }
  }

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

        {/* Feedback banners */}
        {error && (
          <div className="mb-6 border border-[#ff5e3a]/30 bg-[#ff5e3a]/5 px-5 py-4 flex items-start gap-3">
            <AlertCircle size={14} className="text-[#ff5e3a] mt-0.5 flex-shrink-0" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#ff5e3a]">{error}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 border border-[#d4ff3a]/30 bg-[#d4ff3a]/5 px-5 py-4 flex items-start gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff3a] mt-1 flex-shrink-0" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#d4ff3a]">{successMsg}</p>
          </div>
        )}

        {/* Trial / expired / halted banners */}
        {isInTrial && (
          <div className="mb-8 border border-[#d4ff3a]/20 bg-[#d4ff3a]/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff3a] flex-shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a]">
                Trial active · {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} remaining
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600">Full access until trial ends</span>
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
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600">Your data is preserved for 30 days</span>
          </div>
        )}
        {isHalted && (
          <div className="mb-8 border border-amber-500/30 bg-amber-500/5 px-5 py-4 flex items-center gap-3">
            <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
              Payment failed · Please update your payment method via Razorpay dashboard
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
                isPaidPlan && !isCancelling ? 'border-[#d4ff3a]/30 text-[#d4ff3a]'
                : isCancelling             ? 'border-amber-500/30 text-amber-400'
                : isExpired                ? 'border-[#ff5e3a]/30 text-[#ff5e3a]'
                :                           'border-stone-700 text-stone-500'
              }`}>
                {isCancelling ? 'Cancelling' : isPaidPlan ? 'Active' : isInTrial ? 'Trial' : 'Expired'}
              </span>
            </div>
            {isCancelling && (
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 mt-1">
                Access continues until end of billing period
              </p>
            )}
          </div>

          {isPaidPlan && !isCancelling && (
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600 hover:text-[#ff5e3a] disabled:opacity-40 transition-colors"
            >
              {cancelLoading && <Loader2 size={11} className="animate-spin" />}
              Cancel subscription
            </button>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-stone-800 mb-10">
          {PLANS.map((plan, idx) => {
            const isCurrent    = currentPlan === plan.key;
            const isDowngrade  = isPaidPlan && PLANS.findIndex(p => p.key === currentPlan) > PLANS.findIndex(p => p.key === plan.key);
            const btnLabel     = isCurrent ? 'Current' : isExpired ? 'Subscribe' : isDowngrade ? 'Downgrade' : 'Upgrade';
            const isLoading    = checkoutLoading === plan.key;

            return (
              <div
                key={plan.key}
                className={`p-7 relative ${idx < PLANS.length - 1 ? 'border-b md:border-b-0 md:border-r border-stone-800' : ''} ${isCurrent ? 'bg-stone-900/30' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`font-mono text-[10px] uppercase tracking-[0.25em] mb-1 ${plan.highlight ? 'text-[#d4ff3a]' : 'text-stone-500'}`}>
                      {plan.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display italic text-stone-100" style={{ fontSize: '2rem', fontVariationSettings: '"opsz" 80', lineHeight: 1 }}>
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
                      <Check size={12} className={`flex-shrink-0 ${plan.highlight ? 'text-[#d4ff3a]' : 'text-stone-600'}`} />
                      <span className="font-mono text-[10px] text-stone-400 uppercase tracking-[0.08em]">{f}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={!!checkoutLoading || cancelLoading}
                    className={`w-full flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      plan.highlight
                        ? 'bg-[#d4ff3a] text-[#0a0a0b] hover:bg-[#bff020]'
                        : 'border border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
                    }`}
                  >
                    {isLoading
                      ? <><Loader2 size={11} className="animate-spin" /> Opening checkout…</>
                      : `${btnLabel} →`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 text-center mb-2">
          Billed monthly · Cancel anytime · No credit card for 14-day trial
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
