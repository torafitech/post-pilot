import Link from 'next/link';

const PILLARS = [
  {
    n: '01',
    title: 'One post, everywhere',
    body: 'Write once. StarlingPost pushes to YouTube, Twitter/X, LinkedIn, Instagram, Facebook, and Threads simultaneously — with per-platform customisation built in.',
  },
  {
    n: '02',
    title: 'AI that works quietly',
    body: 'Caption enhancement, optimal time recommendations, and contextual auto-replies — powered by GPT-4o-mini. No hallucinated engagement metrics.',
  },
  {
    n: '03',
    title: 'Automation without the noise',
    body: 'Link Me and Auto-Reply rules run on a cron cadence. Keyword-triggered, deduped, and scoped to exactly the posts you choose.',
  },
  {
    n: '04',
    title: 'Built for teams and solo creators',
    body: 'Multiple accounts per platform. Analytics that compare cross-platform performance. A dashboard that stays out of your way.',
  },
];

const STACK = [
  { label: 'Framework',  value: 'Next.js 16 · App Router · React 19' },
  { label: 'Styling',    value: 'Tailwind CSS 4 · Framer Motion'      },
  { label: 'Backend',    value: 'Firebase (Auth + Firestore)'          },
  { label: 'AI',         value: 'OpenAI GPT-4o-mini'                   },
  { label: 'Platforms',  value: 'YouTube · Twitter/X · LinkedIn · Meta' },
  { label: 'Hosting',    value: 'Vercel (with scheduled cron jobs)'    },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] grain pt-20">
      <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-20">

        {/* Hero */}
        <div className="mb-20 border-b border-stone-800 pb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">About</p>
          <h1
            className="font-display italic text-stone-100 leading-[0.95] mb-8"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Built for creators<br />who post seriously.
          </h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-[560px]">
            StarlingPost started as a simple frustration: managing six different social media
            apps, copying the same post six times, adjusting captions for each platform.
            There had to be a better way.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">Mission</p>
            <h2
              className="font-display italic text-stone-100 leading-tight mb-6"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontVariationSettings: '"opsz" 80' }}
            >
              Reduce the overhead of being everywhere at once.
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed">
              Social media demands presence. Presence demands time. StarlingPost compresses that
              time — not by dumbing down your content, but by eliminating the mechanical work of
              multi-platform distribution.
            </p>
          </div>
          <div className="space-y-4 pt-1">
            {[
              'Post to 6 platforms in one click',
              'AI-enhanced captions, not AI-generated slop',
              'Automation that respects platform rules',
              'Analytics you can actually act on',
            ].map((item, i) => (
              <div key={item} className="flex items-start gap-4 border-b border-stone-900 pb-4">
                <span className="font-mono text-[10px] text-stone-700 pt-0.5 w-4 flex-shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone-300">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Four pillars */}
        <div className="mb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-8">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-2 border border-stone-800">
            {PILLARS.map((p, idx) => (
              <div
                key={p.n}
                className={`p-8 ${idx % 2 === 0 ? 'md:border-r border-stone-800' : ''} ${idx < 2 ? 'border-b border-stone-800' : ''}`}
              >
                <span className="font-mono text-[10px] text-stone-700">{p.n}</span>
                <h3
                  className="font-display italic text-stone-100 mt-3 mb-4 leading-tight"
                  style={{ fontSize: '1.25rem', fontVariationSettings: '"opsz" 80' }}
                >
                  {p.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech stack */}
        <div className="mb-20">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-6">Under the hood</p>
          <div className="border border-stone-800">
            {STACK.map((s, idx) => (
              <div
                key={s.label}
                className={`flex items-start gap-6 px-6 py-4 ${idx < STACK.length - 1 ? 'border-b border-stone-800' : ''}`}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 w-24 flex-shrink-0 pt-0.5">
                  {s.label}
                </span>
                <span className="font-mono text-[11px] text-stone-300 tracking-wide">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Beta status */}
        <div className="mb-20 p-8 border border-stone-800">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff3a]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">Current status</span>
          </div>
          <h3
            className="font-display italic text-stone-100 mb-3"
            style={{ fontSize: '1.5rem', fontVariationSettings: '"opsz" 80' }}
          >
            Beta — YouTube, Twitter/X, LinkedIn
          </h3>
          <p className="text-stone-500 text-sm leading-relaxed max-w-[480px]">
            We are in active beta on three platforms. Instagram, Facebook, and Threads are
            integrated but pending full API access approvals. Pinterest and TikTok are in
            the pipeline.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4">
          <Link
            href="/register"
            className="bg-[#d4ff3a] text-[#0a0a0b] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#bff020] transition-colors"
          >
            Get started free →
          </Link>
          <Link
            href="/pricing"
            className="border border-stone-800 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors"
          >
            See pricing
          </Link>
        </div>

      </div>
    </main>
  );
}
