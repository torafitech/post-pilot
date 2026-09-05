'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  Calendar, CheckCircle2, Facebook,
  Linkedin, Twitter, Wand2, Youtube,
  BarChart3, Layers, Globe, Bot, KeyRound, ChevronRight,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { HOMEPAGE_FAQ } from '@/lib/pricing';
import { FOUNDING_INCLUDES, LAUNCH_PRICING } from '@/lib/launch';
import { WaitlistButton } from '@/components/Waitlist';

// ─── Local SVG icons ──────────────────────────────────────────────────────────

const Instagram = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const ThreadsIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8c-1.2-1.5-3-2.4-5-2.4-3.6 0-6 2.4-6 6.4 0 3.7 2 6.4 6 6.4 2.8 0 5-1.6 5-4 0-2-1.8-3.6-4.5-3.6-1.5 0-2.7.6-2.7 1.7 0 .8.7 1.5 1.8 1.5" />
  </svg>
);

// ─── Platform definitions ────────────────────────────────────────────────────

type PlatformDef = {
  id: string;
  name: string;
  Icon: React.ElementType;
  accent: string;
  text: string;
  ring: string;
  caps: string[];
  comingSoon?: boolean;
};

const PLATFORMS: PlatformDef[] = [
  { id: 'youtube',   name: 'YouTube',   Icon: Youtube,     accent: '#ef4444', text: 'text-red-400',  ring: 'ring-red-500/40',
    caps: ['Video upload', 'Pinned first comment', 'Analytics deep-dive', 'Comment auto-reply'] },
  { id: 'twitter',   name: 'Twitter/X', Icon: Twitter,     accent: '#38bdf8', text: 'text-sky-400',  ring: 'ring-sky-500/40',
    caps: ['Text + media tweets', 'Reply to mentions', 'Keyword auto-reply', 'Tweet metrics'] },
  { id: 'linkedin',  name: 'LinkedIn',  Icon: Linkedin,    accent: '#60a5fa', text: 'text-blue-400', ring: 'ring-blue-500/40',
    caps: ['UGC posts (image/video)', 'Engagement tracking', 'Comment automation', 'Post scheduling'] },
  { id: 'instagram', name: 'Instagram', Icon: Instagram,   accent: '#f472b6', text: 'text-pink-400', ring: 'ring-pink-500/40',
    comingSoon: true,
    caps: ['Feed + Reels', 'AI captions + hashtags', 'Insights', 'Multi-account'] },
  { id: 'facebook',  name: 'Facebook',  Icon: Facebook,    accent: '#3b82f6', text: 'text-blue-500', ring: 'ring-blue-600/40',
    comingSoon: true,
    caps: ['Page posts', 'Photo + video', 'Comment auto-reply', 'Insights'] },
  { id: 'threads',   name: 'Threads',   Icon: ThreadsIcon, accent: '#d4d4d4', text: 'text-gray-300', ring: 'ring-gray-500/40',
    comingSoon: true,
    caps: ['Text-first posts', 'Image + video', 'Reply automation', 'Long-lived OAuth'] },
];

// ─── Animation variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.21, 1, 0.32, 1] as const } },
};

const reveal = (delay = 0) => ({
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.21, 1, 0.32, 1] as const } },
});

// ─── Hero: the moment the product exists for ─────────────────────────────────
// A comment lands while you're on client work; the reply goes out without you.
// One orchestrated load sequence — the only unprompted motion on the page.

function InboundDemo() {
  const reduced = useReducedMotion();
  const step = (delay: number) =>
    reduced
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.21, 1, 0.32, 1] as const },
        };

  return (
    <motion.div
      {...step(0.35)}
      className="relative w-full max-w-md mx-auto lg:mx-0 border border-white/10 rounded-2xl bg-[#0e0e10] overflow-hidden"
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/[0.07]">
        <Youtube size={15} className="text-red-400" />
        <span className="text-[13px] text-zinc-400">Comment on your latest video</span>
        <span className="ml-auto text-[12px] text-zinc-600">11:47 pm</span>
      </div>

      <div className="p-5 space-y-1">
        <div className="flex gap-3">
          <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-zinc-800 text-zinc-400 grid place-items-center text-[13px] font-medium">
            M
          </div>
          <div className="min-w-0">
            <div className="text-[13px] text-zinc-500">@mira.builds</div>
            <p className="mt-1 text-[15px] text-zinc-200 leading-snug">
              This is exactly what I need. What do you charge for something like this?
            </p>
          </div>
        </div>

        <motion.div
          {...step(1.0)}
          className="ml-4 h-7 w-px bg-gradient-to-b from-white/10 to-[var(--citron)]/50"
        />

        <motion.div {...step(1.25)} className="flex gap-3">
          <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-[var(--citron)] text-black grid place-items-center text-[13px] font-semibold">
            S
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-zinc-300">You</span>
              <span className="text-[11px] text-zinc-400 border border-white/15 rounded-full px-2 py-0.5">
                sent by StarlingPost
              </span>
            </div>
            <p className="mt-1 text-[15px] text-zinc-200 leading-snug">
              Thanks Mira — rates and availability are here:{' '}
              <span className="text-[var(--citron)] underline decoration-[var(--citron)]/40 underline-offset-2">
                starling.link/mira
              </span>
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div
        {...step(1.75)}
        className="flex items-center gap-2 px-5 py-3 border-t border-white/[0.07] text-[12px] text-zinc-500"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--citron)]" />
        Answered in 38 seconds. You were asleep.
      </motion.div>
    </motion.div>
  );
}

// ─── Live counter ────────────────────────────────────────────────────────────

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const dur = 1400;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(to * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [inView, to]);

  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  span, tone, kicker, title, copy, icon, accent,
}: {
  span: string;
  tone: 'dark' | 'bright';
  kicker: string;
  title: string;
  copy: string;
  icon: React.ReactNode;
  accent: string;
}) {
  const bright = tone === 'bright';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 0.55, ease: [0.21, 1, 0.32, 1] }}
      className={`${span} relative overflow-hidden rounded-3xl p-8 lg:p-10 ${
        bright
          ? 'bg-[var(--citron)] text-black'
          : 'bg-zinc-900/60 border border-white/5 text-white hover:bg-zinc-900 transition-colors'
      }`}
    >
      <div className="flex items-start justify-between mb-8">
        <span className={`font-mono text-[10px] uppercase tracking-[0.3em] ${bright ? 'text-black/70' : 'text-zinc-500'}`}>
          {kicker}
        </span>
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg ${bright ? 'bg-black/10' : 'bg-white/5'}`}
          style={{ color: accent }}
        >
          {icon}
        </div>
      </div>
      <h3 className={`font-display text-2xl lg:text-3xl tracking-tight leading-tight ${bright ? 'text-black' : 'text-white'}`}>
        {title}
      </h3>
      <p className={`mt-3 text-sm lg:text-[15px] leading-relaxed ${bright ? 'text-black/70' : 'text-zinc-400'}`}>
        {copy}
      </p>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="bg-[var(--ink)] text-white">

      {/* ════════════ HERO ════════════ */}
      <section className="relative overflow-hidden grain">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,255,58,0.10), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 20%, rgba(255,94,58,0.06), transparent 60%)',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-14 lg:pt-36 lg:pb-24">
          {/* GEO definitional sentence — crawlable, visible */}
          <p className="sr-only">
            StarlingPost is a social media tool for solo freelancers that publishes organic posts
            to every connected platform from one place, and automatically captures the inbound
            interest those posts generate — replying to comments and sending your link — across
            YouTube, Twitter/X, and LinkedIn, with Instagram, Facebook, and Threads coming soon.
          </p>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] gap-12 lg:gap-16 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.21, 1, 0.32, 1] }}
                className="font-display text-[clamp(2.6rem,7.4vw,5.75rem)] leading-[0.92] tracking-[-0.035em] text-white text-balance"
              >
                Your posts go everywhere.
                <br />
                The replies don&apos;t wait for you.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.12, ease: [0.21, 1, 0.32, 1] }}
                className="mt-7 max-w-[46ch] text-zinc-400 text-[17px] leading-relaxed"
              >
                Built for solo developers, designers, consultants, and marketers: one click
                publishes to every account you own, and the comments it earns get answered
                without you.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.22, ease: [0.21, 1, 0.32, 1] }}
                className="mt-9 flex flex-col sm:flex-row sm:items-center gap-x-5 gap-y-3"
              >
                <WaitlistButton source="hero" />
                <p className="text-[13px] text-zinc-500">
                  No card. Founding price locked for life.
                </p>
              </motion.div>
            </div>

            <InboundDemo />
          </div>
        </div>

        {/* Marquee */}
        <div className="border-y border-white/5 bg-black/40 overflow-hidden">
          <div className="marquee-track flex whitespace-nowrap py-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-12 px-6 shrink-0">
                {PLATFORMS.map((p) => (
                  <div key={p.id + i} className={`flex items-center gap-3 ${p.comingSoon ? 'opacity-40' : ''}`}>
                    <p.Icon size={18} className={p.text} />
                    <span className="font-display italic text-2xl text-zinc-400">{p.name}</span>
                    {p.comingSoon && (
                      <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-700">soon</span>
                    )}
                    <span className="text-zinc-700">·</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ PROBLEM ════════════ */}
      <section className="relative max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-15%' }} variants={fadeUp}>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
            <span>01</span>
            <span className="h-px flex-1 bg-white/10" />
            <span>The Problem</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              The post did its job.
              <br />
              <span className="mark">You missed the reply.</span>
            </h2>

            <div className="space-y-7 text-zinc-400 text-base lg:text-lg leading-relaxed">
              <p>
                You&apos;re not running ads. Your reach is earned — a build log, a case study, a hot
                take that landed. Then someone comments &ldquo;how much?&rdquo; at 11pm while
                you&apos;re deep in a client sprint, and by the time you surface two days later the
                thread is cold and they&apos;ve hired someone else.
              </p>
              <p className="text-white">
                StarlingPost gets that content in front of every audience you have — then answers
                the people it brings back,{' '}
                <span className="font-display italic">automatically</span>.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {[
                  'Stop re-posting by hand',
                  'Stop losing warm comments',
                  'Stop sending links manually',
                  'Stop guessing what worked',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-zinc-300 text-sm">
                    <span className="mt-1 h-1 w-3 bg-[var(--coral)]" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════ PLATFORMS ════════════ */}
      <section className="relative border-t border-white/5">
        <div className="hatch absolute inset-0 opacity-30" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-15%' }} variants={fadeUp}>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
              <span>02</span>
              <span className="h-px flex-1 bg-white/10" />
              <span>Platforms</span>
            </div>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight max-w-4xl">
              Live now.
              <br />
              <span className="italic text-zinc-500">More coming soon.</span>
            </h2>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
            {PLATFORMS.map((p, i) => (
              <motion.article
                key={p.id}
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-10%' }}
                variants={reveal(i * 0.05)}
                className={`group relative bg-[var(--ink)] p-8 lg:p-10 transition-colors ${p.comingSoon ? 'opacity-50' : 'hover:bg-zinc-900/60'}`}
              >
                <div className="flex items-start justify-between mb-12">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10"
                    style={{ color: p.accent }}
                  >
                    <p.Icon size={22} />
                  </div>
                  <div className="flex items-center gap-2">
                    {p.comingSoon ? (
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 border border-zinc-800 px-2 py-0.5">
                        Coming soon
                      </span>
                    ) : (
                      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--citron)] border border-[var(--citron)]/30 px-2 py-0.5">
                        Live
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-display text-3xl tracking-tight text-white">{p.name}</h3>

                <ul className="mt-6 space-y-2.5">
                  {p.caps.map((c) => (
                    <li key={c} className="flex items-start gap-2.5 text-sm text-zinc-400">
                      <CheckCircle2 size={14} style={{ color: p.comingSoon ? '#52525b' : p.accent }} className="mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>

                {!p.comingSoon && (
                  <div
                    className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-700"
                    style={{ background: p.accent }}
                  />
                )}
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES BENTO ════════════ */}
      <section className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-15%' }} variants={fadeUp}>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
              <span>03</span>
              <span className="h-px flex-1 bg-white/10" />
              <span>The Toolkit</span>
            </div>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight max-w-4xl">
              Built for the way you actually <span className="italic">work.</span>
            </h2>
          </motion.div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-6 gap-4 lg:gap-5">
            <FeatureCard
              span="sm:col-span-4"
              tone="dark"
              kicker="Publish"
              title="One composer. Three destinations."
              copy="Write once, publish to every connected account in one click — video, image, or text, whatever each platform takes. Character limits, hashtag etiquette, and title length all handled per platform."
              icon={<Layers size={20} />}
              accent="var(--citron)"
            />
            <FeatureCard
              span="sm:col-span-2"
              tone="bright"
              kicker="AI"
              title="Caption alchemy"
              copy="AI writes your description and generates SEO-friendly tags per platform — hooks, hashtags, tone."
              icon={<Wand2 size={20} />}
              accent="#0a0a0b"
            />
            <FeatureCard
              span="sm:col-span-2"
              tone="dark"
              kicker="Schedule"
              title="Pick a time. Walk away."
              copy="Schedule once, publish everywhere. AI even suggests the optimal time per platform."
              icon={<Calendar size={20} />}
              accent="#f472b6"
            />
            <FeatureCard
              span="sm:col-span-2"
              tone="dark"
              kicker="Link Me"
              title="Keyword → send the link"
              copy="Someone comments 'link'? They get your link auto-replied, instantly — on YouTube, Twitter/X, and LinkedIn. Interest becomes a lead while it's still warm."
              icon={<KeyRound size={20} />}
              accent="var(--coral)"
            />
            <FeatureCard
              span="sm:col-span-2"
              tone="dark"
              kicker="Auto Reply"
              title="Conversations on autopilot"
              copy="Template or AI-written replies to every comment and mention, so nobody who reaches out gets left on read."
              icon={<Bot size={20} />}
              accent="#60a5fa"
            />
            <FeatureCard
              span="sm:col-span-3"
              tone="dark"
              kicker="Analytics"
              title="Real numbers. Not vanity charts."
              copy="Views, likes, comments, and reach across every connected platform in one dashboard — plus a YouTube deep-dive. One place to see what is actually pulling."
              icon={<BarChart3 size={20} />}
              accent="#34d399"
            />
            <FeatureCard
              span="sm:col-span-3"
              tone="dark"
              kicker="No Limits"
              title="Every account, single login"
              copy="Multiple YouTube channels, Twitter handles, and LinkedIn pages — your own and your clients'. Same flat price no matter how many you connect."
              icon={<Globe size={20} />}
              accent="var(--citron)"
            />
          </div>
        </div>
      </section>

      {/* ════════════ TIME MATH ════════════ */}
      <section className="relative border-t border-white/5 bg-[#0c0c0e]">
        <div className="hatch absolute inset-0 opacity-20" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-15%' }}
            variants={fadeUp}
            className="grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-24 items-end"
          >
            <div>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
                <span>04</span>
                <span className="h-px flex-1 bg-white/10" />
                <span>The Math</span>
              </div>
              <h2 className="font-display text-5xl lg:text-6xl leading-[0.95] tracking-tight">
                Every post used to take an hour.
                <br />
                <span className="italic text-[var(--citron)]">Now it takes five minutes.</span>
              </h2>
            </div>

            <div className="font-display tracking-tight space-y-5 text-right lg:text-left">
              <div className="text-3xl text-zinc-500">3 platforms · 12 posts / week</div>
              <div className="text-5xl lg:text-6xl text-white">= <span className="font-mono">~6 hrs</span> of context-switching</div>
              <div className="text-2xl text-zinc-500 italic">with StarlingPost:</div>
              <div className="text-6xl lg:text-7xl text-[var(--citron)]">
                <Counter to={1} />h <span className="font-display italic text-zinc-500 text-3xl">/ week</span>
              </div>
              <div className="text-sm font-mono text-zinc-600 mt-4 uppercase tracking-[0.2em]">
                <Counter to={20} /> hours back · every month
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-15%' }} variants={fadeUp}>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
              <span>05</span>
              <span className="h-px flex-1 bg-white/10" />
              <span>How It Works</span>
            </div>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight max-w-4xl">
              Three steps. <span className="italic text-zinc-500">No PhD required.</span>
            </h2>
          </motion.div>

          <div className="mt-16 grid lg:grid-cols-3 gap-6 lg:gap-10">
            {[
              { n: '01', t: 'Connect your accounts', d: 'OAuth into YouTube, Twitter/X, and LinkedIn once — tokens refresh automatically. Instagram, Facebook, and Threads coming soon.' },
              { n: '02', t: 'Write & enhance', d: 'Type one caption. Hit AI Enhance. Get tailored versions for each platform, hashtag suggestions, and optimal post times.' },
              { n: '03', t: 'Publish & forget', d: 'Post now or schedule. Replies and keyword triggers run on autopilot. Wake up to engagement reports.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={reveal(i * 0.1)}
                className="relative"
              >
                <div className="font-display text-[8rem] leading-none text-zinc-800 tracking-tighter -mb-6 select-none">{s.n}</div>
                <h3 className="font-display text-3xl tracking-tight relative z-10">{s.t}</h3>
                <p className="mt-4 text-zinc-400 leading-relaxed text-base">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ PRICING ════════════ */}
      <section className="relative border-t border-white/5 bg-[#0c0c0e]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-15%' }} variants={fadeUp}>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
              <span>06</span>
              <span className="h-px flex-1 bg-white/10" />
              <span>Pricing</span>
            </div>
            <div className="grid lg:grid-cols-[1fr_1fr] gap-8 lg:gap-12 items-end mb-12 lg:mb-16">
              <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
                One flat price. <br />
                <span className="italic text-zinc-500">Every channel included.</span>
              </h2>
              <p className="text-zinc-400 lg:max-w-md">
                Everyone else charges you per channel — add a second YouTube channel or a third
                client handle and the bill climbs. StarlingPost doesn&apos;t.{' '}
                <span className="text-white">No per-channel fees, ever.</span> Connect as many
                accounts as you post from, on one flat rate.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal(0)}
            className="grid lg:grid-cols-[1.1fr_0.9fr] gap-px bg-white/10 border border-white/10 rounded-3xl overflow-hidden"
          >
            {/* Price */}
            <div className="relative bg-[var(--ink)] p-7 sm:p-10 lg:p-12">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--citron)]/40 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--citron)]">
                {LAUNCH_PRICING.seatsClaim}
              </div>

              <div className="mt-7 flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-2xl sm:text-3xl text-zinc-600 line-through decoration-[var(--coral)] decoration-2">
                  {LAUNCH_PRICING.currency}
                  {LAUNCH_PRICING.regularPrice}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-600">
                  regular
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                <span className="font-display text-6xl sm:text-7xl lg:text-8xl tracking-tight text-white">
                  {LAUNCH_PRICING.currency}
                  {LAUNCH_PRICING.foundingPrice}
                </span>
                <span className="text-zinc-500 text-sm">{LAUNCH_PRICING.period}</span>
              </div>

              <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--citron)]">
                Founding member price
              </div>

              <p className="mt-5 text-sm text-zinc-400 leading-relaxed max-w-sm">
                {LAUNCH_PRICING.lockNote}
              </p>

              <div className="mt-8">
                <WaitlistButton source="pricing" />
              </div>
            </div>

            {/* What's included */}
            <div className="bg-[#0f0f11] p-7 sm:p-10 lg:p-12">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-zinc-500">
                Everything included
              </div>
              <ul className="mt-6 space-y-3.5">
                {FOUNDING_INCLUDES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15px] text-zinc-300 leading-snug">
                    <CheckCircle2 size={15} className="text-[var(--citron)] mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600 leading-relaxed">
                No per-channel fees · No seat fees · Cancel anytime
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ FAQ ════════════ */}
      <section className="relative border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 lg:px-12 py-24 lg:py-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
              <span>07</span>
              <span className="h-px flex-1 bg-white/10" />
              <span>Questions</span>
            </div>
            <h2 className="font-display text-5xl lg:text-6xl leading-[0.95] tracking-tight mb-12">
              You&apos;re going to ask <span className="italic text-zinc-500">these.</span>
            </h2>
          </motion.div>

          <div className="space-y-px bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            {HOMEPAGE_FAQ.map((item, i) => (
              <details key={i} className="group bg-[var(--ink)]">
                <summary className="flex items-center justify-between cursor-pointer p-6 lg:p-7 list-none">
                  <span className="font-display text-xl lg:text-2xl tracking-tight pr-6">{item.q}</span>
                  <ChevronRight size={18} className="text-zinc-500 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-6 lg:px-7 pb-7 -mt-2 text-zinc-400 text-base leading-relaxed max-w-3xl">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="relative overflow-hidden grain border-t border-white/5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 80% at 50% 50%, rgba(212,255,58,0.15), transparent 70%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-40 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-zinc-500 mb-6">
              Organic reach · Inbound capture · One flat price
            </div>
            <h2 className="font-display text-5xl sm:text-7xl lg:text-9xl leading-[0.88] tracking-tight max-w-5xl mx-auto">
              Post the work.
              <br />
              <span className="mark">Keep the leads.</span>
            </h2>

            <p className="mt-7 text-zinc-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              Founding members lock {LAUNCH_PRICING.currency}
              {LAUNCH_PRICING.foundingPrice} {LAUNCH_PRICING.period} for life — down from{' '}
              {LAUNCH_PRICING.currency}
              {LAUNCH_PRICING.regularPrice}.
            </p>

            <div className="mt-10 flex justify-center">
              <div className="w-full sm:w-auto max-w-md">
                <WaitlistButton source="final-cta" />
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-zinc-600">
              <span>No card</span>
              <span className="hidden sm:inline">·</span>
              <span>No per-channel fees</span>
              <span className="hidden sm:inline">·</span>
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
