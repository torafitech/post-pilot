import { Check, X } from 'lucide-react';
import Link from 'next/link';

const COMPARISON = [
  { feature: 'Connected accounts',      free: '3',           pro: 'Unlimited'  },
  { feature: 'Posts per month',         free: '10',          pro: 'Unlimited'  },
  { feature: 'Platforms',               free: '6',           pro: '6'          },
  { feature: 'Automation rules',        free: '2',           pro: 'Unlimited'  },
  { feature: 'AI caption enhancement',  free: true,          pro: true         },
  { feature: 'Link Me auto-reply',      free: true,          pro: true         },
  { feature: 'Live platform analytics', free: false,         pro: true         },
  { feature: 'Optimal post timing',     free: false,         pro: true         },
  { feature: 'Post scheduling',         free: true,          pro: true         },
  { feature: 'Multi-account per platform', free: false,      pro: true         },
  { feature: 'Priority support',        free: false,         pro: true         },
  { feature: 'API access',              free: false,         pro: true         },
];

const FAQ = [
  {
    q: 'Can I use StarlingPost for free?',
    a: 'Yes. The free tier is permanent — no trial expiry. You get 3 connected accounts, 10 posts/month, and 2 automation rules.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'YouTube, Twitter/X, LinkedIn, Instagram, Facebook, and Threads. Beta is live on YouTube, Twitter/X, and LinkedIn. Instagram/Facebook/Threads are connected but pending full API approvals.',
  },
  {
    q: 'How does billing work?',
    a: 'Pro is billed monthly. No annual lock-in. Cancel any time and you keep access until the end of your billing period.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'We are planning a 14-day Pro trial. For now, start on the free tier and upgrade when you need more.',
  },
  {
    q: 'What counts as a post?',
    a: 'One post creation = one post, regardless of how many platforms it publishes to. Posting to 6 platforms at once still counts as 1 post.',
  },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] grain pt-20">
      <div className="max-w-[900px] mx-auto px-6 md:px-10 py-20">

        {/* Hero */}
        <div className="mb-16 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">Pricing</p>
          <h1
            className="font-display italic text-stone-100 leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Simple, honest pricing.
          </h1>
          <p className="text-stone-400 max-w-[440px] mx-auto text-sm leading-relaxed">
            Free forever for individuals. Pro when you need scale.
            No hidden limits, no surprise overage charges.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-stone-800 mb-16">

          {/* Free */}
          <div className="p-10 md:border-r border-stone-800 border-b md:border-b-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-2">Free</p>
            <h2
              className="font-display italic text-stone-100 mb-6"
              style={{ fontSize: '2rem', fontVariationSettings: '"opsz" 80' }}
            >
              Freemium
            </h2>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display italic text-stone-100"
                style={{ fontSize: '3.5rem', fontVariationSettings: '"opsz" 144, "wght" 300', lineHeight: 1 }}
              >
                $0
              </span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-600 mb-8">Forever free · no card required</p>
            <Link
              href="/register"
              className="block text-center border border-stone-800 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-300 hover:text-stone-100 hover:border-stone-600 transition-colors"
            >
              Start free →
            </Link>
          </div>

          {/* Pro */}
          <div className="p-10 relative">
            <div className="absolute top-4 right-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-1 bg-[#d4ff3a]/10 border border-[#d4ff3a]/30 text-[#d4ff3a]">
                Recommended
              </span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d4ff3a] mb-2">Pro</p>
            <h2
              className="font-display italic text-stone-100 mb-6"
              style={{ fontSize: '2rem', fontVariationSettings: '"opsz" 80' }}
            >
              Professional
            </h2>
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="font-display italic text-stone-100"
                style={{ fontSize: '3.5rem', fontVariationSettings: '"opsz" 144, "wght" 300', lineHeight: 1 }}
              >
                $19
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500">/ month</span>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-600 mb-8">Billed monthly · cancel anytime</p>
            <button
              disabled
              className="w-full bg-[#d4ff3a] text-[#0a0a0b] px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 cursor-not-allowed transition-colors"
            >
              Coming soon
            </button>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 text-center mt-2">
              Billing integration in progress
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <div className="mb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">Full comparison</p>
          <div className="border border-stone-800">
            {/* Header */}
            <div className="grid grid-cols-3 border-b border-stone-800 px-6 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">Feature</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 text-center">Free</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a] text-center">Pro</span>
            </div>
            {COMPARISON.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-center px-6 py-3.5 ${idx < COMPARISON.length - 1 ? 'border-b border-stone-900' : ''}`}
              >
                <span className="font-mono text-[11px] text-stone-400 uppercase tracking-[0.1em]">{row.feature}</span>
                <div className="flex justify-center">
                  {typeof row.free === 'boolean'
                    ? row.free
                      ? <Check size={14} className="text-stone-400" />
                      : <X size={14} className="text-stone-800" />
                    : <span className="font-mono text-[11px] text-stone-400">{row.free}</span>
                  }
                </div>
                <div className="flex justify-center">
                  {typeof row.pro === 'boolean'
                    ? row.pro
                      ? <Check size={14} className="text-[#d4ff3a]" />
                      : <X size={14} className="text-stone-800" />
                    : <span className="font-mono text-[11px] text-[#d4ff3a]">{row.pro}</span>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-8">FAQ</p>
          <div className="space-y-0 border border-stone-800">
            {FAQ.map((item, idx) => (
              <div key={idx} className={`px-8 py-7 ${idx < FAQ.length - 1 ? 'border-b border-stone-800' : ''}`}>
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
            Start for free today.
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-8">
            No credit card · No expiry · Upgrade when ready
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#d4ff3a] text-[#0a0a0b] px-10 py-4 font-mono text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#bff020] transition-colors"
          >
            Create free account →
          </Link>
        </div>

      </div>
    </main>
  );
}
