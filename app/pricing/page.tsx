import type { Metadata } from 'next';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { PLANS, COMPARISON, PRICING_FAQ, type ComparisonVal } from '@/lib/pricing';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'StarlingPost plans start at $9/month — 14-day free trial, no credit card required. Starter, Growth, and Agency plans for creators and teams.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Pricing · StarlingPost',
    description:
      'StarlingPost plans start at $9/month — 14-day free trial, no credit card required. Starter, Growth, and Agency plans for creators and teams.',
    url: 'https://www.starlingpost.com/pricing',
  },
};

const BASE = 'https://www.starlingpost.com';

function Cell({ val, highlight }: { val: ComparisonVal; highlight: boolean }) {
  if (typeof val === 'boolean') {
    return val
      ? <Check size={14} className={highlight ? 'text-[#d4ff3a]' : 'text-stone-400'} />
      : <X size={14} className="text-stone-800" />;
  }
  return (
    <span className={`font-mono text-[11px] ${highlight ? 'text-[#d4ff3a]' : 'text-stone-400'}`}>
      {val}
    </span>
  );
}

export default function PricingPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Pricing', item: `${BASE}/pricing` },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: PRICING_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <main className="min-h-screen bg-[#0a0a0b] grain pt-20">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />

      <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-20">

        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">Pricing</p>
          <h1
            className="font-display italic text-stone-100 leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            14 days free.<br />Then pick a plan.
          </h1>
          <p className="text-stone-400 max-w-[440px] mx-auto text-sm leading-relaxed">
            No credit card required for the trial. No free tier —
            every feature costs real API money and we don&apos;t hide that.
          </p>
        </div>

        {/* Trial banner */}
        <div className="mb-12 border border-[#d4ff3a]/20 bg-[#d4ff3a]/5 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff3a] flex-shrink-0" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a]">
              14-day free trial · Full access · No card required
            </span>
          </div>
          <Link
            href="/register"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#0a0a0b] bg-[#d4ff3a] px-5 py-2 font-bold hover:bg-[#bff020] transition-colors flex-shrink-0"
          >
            Start trial →
          </Link>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 border border-stone-800 mb-16">
          {PLANS.map((plan, idx) => (
            <div
              key={plan.key}
              className={`p-8 relative ${idx < PLANS.length - 1 ? 'border-b md:border-b-0 md:border-r border-stone-800' : ''} ${plan.highlight ? 'bg-stone-900/40' : ''}`}
            >
              {plan.highlight && (
                <div className="absolute top-4 right-4">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-[#d4ff3a]/10 border border-[#d4ff3a]/30 text-[#d4ff3a]">
                    Most popular
                  </span>
                </div>
              )}
              <p className={`font-mono text-[10px] uppercase tracking-[0.25em] mb-2 ${plan.highlight ? 'text-[#d4ff3a]' : 'text-stone-500'}`}>
                {plan.label}
              </p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span
                  className="font-display italic text-stone-100"
                  style={{ fontSize: '3rem', fontVariationSettings: '"opsz" 144, "wght" 300', lineHeight: 1 }}
                >
                  {plan.price}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500">{plan.per}</span>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 mb-5">
                Billed monthly · cancel anytime
              </p>
              <p className="text-stone-500 text-[13px] leading-relaxed mb-8">{plan.desc}</p>
              <button
                disabled
                className={`w-full font-mono text-[10px] uppercase tracking-[0.2em] font-bold py-3.5 opacity-40 cursor-not-allowed transition-colors ${
                  plan.highlight
                    ? 'bg-[#d4ff3a] text-[#0a0a0b]'
                    : 'border border-stone-700 text-stone-400'
                }`}
              >
                {plan.cta}
              </button>
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-800 text-center mt-2">
                Billing coming soon
              </p>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">Full comparison</p>
          <div className="border border-stone-800 overflow-x-auto">
            <div className="grid grid-cols-4 border-b border-stone-800 px-6 py-3 min-w-[560px]">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">Feature</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 text-center">Starter</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a] text-center">Growth</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 text-center">Agency</span>
            </div>
            {COMPARISON.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 items-center px-6 py-3.5 min-w-[560px] ${idx < COMPARISON.length - 1 ? 'border-b border-stone-900' : ''}`}
              >
                <span className="font-mono text-[11px] text-stone-400 uppercase tracking-[0.1em]">{row.feature}</span>
                <div className="flex justify-center"><Cell val={row.starter} highlight={false} /></div>
                <div className="flex justify-center"><Cell val={row.growth}  highlight={true}  /></div>
                <div className="flex justify-center"><Cell val={row.agency}  highlight={false} /></div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-8">FAQ</p>
          <div className="border border-stone-800">
            {PRICING_FAQ.map((item, idx) => (
              <div key={idx} className={`px-8 py-7 ${idx < PRICING_FAQ.length - 1 ? 'border-b border-stone-800' : ''}`}>
                <h3
                  className="font-display italic text-stone-100 mb-3"
                  style={{ fontSize: '1.1rem', fontVariationSettings: '"opsz" 80' }}
                >
                  {item.q}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center border-t border-stone-800 pt-16">
          <h2
            className="font-display italic text-stone-100 mb-4"
            style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontVariationSettings: '"opsz" 80' }}
          >
            Start your 14-day trial.
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-8">
            No credit card · Full access · Cancel anytime
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#d4ff3a] text-[#0a0a0b] px-10 py-4 font-mono text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#bff020] transition-colors"
          >
            Create account →
          </Link>
        </div>

      </div>
    </main>
  );
}
