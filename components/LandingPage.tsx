'use client';

import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  ChevronDown,
  Clock,
  Link2,
  MessageCircle,
  Pin,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
  Youtube,
  Twitter,
  Linkedin,
  Star,
  Globe,
  CalendarDays,
  BrainCircuit,
  RefreshCw,
  Play,
  Users,
  Activity,
  Layers,
  MousePointerClick,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';

// ─── Animation helpers ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const stagger = (delayChildren = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delayChildren } },
});

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      variants={stagger()}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Animated counter ───────────────────────────────────────────────────────

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(to / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Mini bar chart ─────────────────────────────────────────────────────────

const barData = [40, 65, 50, 80, 60, 90, 75, 100, 85, 95];

function MiniChart() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex items-end gap-1 h-14">
      {barData.map((h, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-t bg-gradient-to-t from-cyan-500 to-blue-400"
          initial={{ height: 0 }}
          animate={inView ? { height: `${h}%` } : { height: 0 }}
          transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ─── Platform Hub Orbital ───────────────────────────────────────────────────

function PlatformOrbit() {
  const platforms = [
    { icon: Youtube, label: 'YouTube', color: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/40', angle: -90 },
    { icon: Twitter, label: 'Twitter / X', color: '#94a3b8', bg: 'bg-slate-400/15', border: 'border-slate-400/40', angle: 30 },
    { icon: Linkedin, label: 'LinkedIn', color: '#3b82f6', bg: 'bg-blue-500/15', border: 'border-blue-500/40', angle: 150 },
  ];

  return (
    <div className="relative flex items-center justify-center w-[320px] h-[320px] md:w-[420px] md:h-[420px] mx-auto select-none">
      {/* Orbit ring */}
      <div className="absolute inset-8 rounded-full border border-dashed border-gray-700/60" />
      <div className="absolute inset-16 rounded-full border border-gray-800/40" />

      {/* Rotating connector lines */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {platforms.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const r = 50;
          const x = 50 + r * Math.cos(rad);
          const y = 50 + r * Math.sin(rad);
          return (
            <motion.div
              key={i}
              className={`absolute w-12 h-12 md:w-14 md:h-14 rounded-2xl ${p.bg} border ${p.border} flex items-center justify-center shadow-lg`}
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              animate={{ rotate: -360 }}
              transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            >
              <p.icon size={22} style={{ color: p.color }} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Center hub */}
      <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center shadow-2xl shadow-cyan-500/20">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 animate-pulse" />
        <Layers size={32} className="text-cyan-400 relative z-10" />
      </div>

      {/* Pulse rings from center */}
      {[1, 2, 3].map((n) => (
        <motion.div
          key={n}
          className="absolute rounded-full border border-cyan-500/20"
          style={{ width: `${n * 28}%`, height: `${n * 28}%` }}
          animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: n * 0.8, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ─── FAQ item ───────────────────────────────────────────────────────────────

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-gray-900 hover:bg-gray-800/80 transition-colors"
      >
        <span className="font-semibold text-white text-sm md:text-base">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden bg-gray-900/50"
          >
            <p className="px-6 py-4 text-gray-400 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Platform capability badge ───────────────────────────────────────────────

function CapBadge({ supported }: { supported: boolean }) {
  return supported ? (
    <div className="flex items-center justify-center">
      <CheckCircle size={17} className="text-emerald-400" />
    </div>
  ) : (
    <div className="flex items-center justify-center">
      <span className="w-4 h-px bg-gray-700 block" />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const handleEmailCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailSent(true);
  };

  const features = [
    {
      icon: CalendarDays,
      color: 'from-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/20',
      title: 'Smart Scheduling',
      desc: 'Queue posts for YouTube, Twitter/X, and LinkedIn at optimal engagement windows. Set it once, publish everywhere.',
    },
    {
      icon: BrainCircuit,
      color: 'from-purple-500 to-pink-600',
      glow: 'shadow-purple-500/20',
      title: 'AI Caption Engine',
      desc: 'Platform-native captions, hashtags, and hooks — GPT-4 tuned for each network\'s algorithm.',
    },
    {
      icon: MessageCircle,
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20',
      title: 'Auto-Reply Comments',
      desc: 'Smart reply templates or full AI mode — every comment gets a genuine response, 24/7.',
    },
    {
      icon: Link2,
      color: 'from-orange-500 to-rose-600',
      glow: 'shadow-orange-500/20',
      title: 'Link Me Automation',
      desc: 'Keyword detected in a comment → your promo link auto-sent. Zero manual work.',
    },
    {
      icon: Pin,
      color: 'from-yellow-500 to-amber-600',
      glow: 'shadow-yellow-500/20',
      title: 'Auto-Pin First Comment',
      desc: 'Drop a pinned promo or CTA on every YouTube video the moment it goes live.',
    },
    {
      icon: BarChart3,
      color: 'from-indigo-500 to-violet-600',
      glow: 'shadow-indigo-500/20',
      title: 'Unified Analytics',
      desc: 'Views, impressions, engagement, follower growth — all platforms in one live dashboard.',
    },
  ];

  const platformMatrix = [
    { feature: 'Post Scheduling', yt: true, tw: true, li: true },
    { feature: 'AI Captions & Hashtags', yt: true, tw: true, li: true },
    { feature: 'Auto-Reply Comments', yt: true, tw: true, li: false },
    { feature: 'Link Me Automation', yt: true, tw: true, li: false },
    { feature: 'Auto-Pin First Comment', yt: true, tw: false, li: false },
    { feature: 'Unified Analytics', yt: true, tw: true, li: true },
  ];

  const steps = [
    { num: '01', title: 'Connect Accounts', desc: 'Link YouTube, Twitter/X, and LinkedIn via secure OAuth in under 60 seconds.', icon: Globe },
    { num: '02', title: 'Create Content', desc: 'Write or generate AI captions, hashtags, and previews across platforms at once.', icon: Sparkles },
    { num: '03', title: 'Schedule & Automate', desc: 'Pick publish time, enable automations, and let StarlingPost handle the rest.', icon: Clock },
    { num: '04', title: 'Track & Optimize', desc: 'Monitor unified analytics in real time and double down on what works.', icon: TrendingUp },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: 0,
      period: 'forever free',
      color: 'border-gray-700',
      badge: null,
      features: ['3 scheduled posts / month', '1 connected platform', 'Basic analytics (7 days)', 'Community support'],
      cta: 'Get Started Free',
      ctaStyle: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
    },
    {
      name: 'Growth',
      price: 29,
      period: 'per month',
      color: 'border-cyan-500',
      badge: 'Most Popular',
      features: [
        'Unlimited scheduled posts',
        'All 3 platforms',
        'AI caption generation',
        'Auto-Reply automation',
        'Link Me keyword triggers',
        'Analytics (90 days)',
        'Priority email support',
      ],
      cta: 'Start 14-Day Free Trial',
      ctaStyle: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30',
    },
    {
      name: 'Agency Pro',
      price: 79,
      period: 'per month',
      color: 'border-amber-500',
      badge: 'Best for Teams',
      features: [
        'Everything in Growth',
        'Up to 10 brand accounts',
        'Auto-Pin first comment (YouTube)',
        'Team collaboration seats',
        'Full analytics history',
        'Dedicated onboarding call',
        'API access',
      ],
      cta: 'Start 14-Day Free Trial',
      ctaStyle: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30',
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Tech YouTuber · 280K subscribers',
      avatar: 'PS',
      color: 'from-cyan-500 to-blue-600',
      text: "Link Me automation alone doubled my affiliate link clicks. I set the keyword once and it replies to every single comment asking for it.",
      stars: 5,
    },
    {
      name: 'Marcus Webb',
      role: 'Twitter/X Creator · 95K followers',
      avatar: 'MW',
      color: 'from-purple-500 to-pink-600',
      text: 'AI captions are shockingly good for Twitter. They feel native. My engagement went up 40% within the first month.',
      stars: 5,
    },
    {
      name: 'Aisha Okonkwo',
      role: 'LinkedIn Thought Leader · 45K followers',
      avatar: 'AO',
      color: 'from-emerald-500 to-teal-600',
      text: "Scheduling LinkedIn posts at optimal times while traveling is a game-changer. My impressions tripled without touching my phone.",
      stars: 5,
    },
    {
      name: 'James Liu',
      role: 'Content Agency Founder',
      avatar: 'JL',
      color: 'from-orange-500 to-rose-600',
      text: 'We manage 8 client accounts from one dashboard. Auto-reply templates save hours every week — clients think we have a full moderation team.',
      stars: 5,
    },
  ];

  const faqs = [
    {
      id: 'faq-1',
      q: 'Which platforms does StarlingPost support?',
      a: 'StarlingPost supports YouTube, Twitter/X, and LinkedIn. We chose to go deep on these three rather than spreading thin — each integration is native, secure, and regularly updated.',
    },
    {
      id: 'faq-2',
      q: 'How does Link Me automation work?',
      a: 'You define a keyword (e.g., "link" or "where to buy") and a reply message. When a viewer comments with that keyword, StarlingPost auto-replies with your preset message — instantly, 24/7.',
    },
    {
      id: 'faq-3',
      q: 'Is my account data safe?',
      a: 'Yes. StarlingPost uses OAuth 2.0 for all connections — we never store your passwords. All data is encrypted at rest and in transit. Revoke access any time from your platform settings.',
    },
    {
      id: 'faq-4',
      q: 'Does the AI caption generator replace my voice?',
      a: "No — it amplifies it. The AI learns from your platform, tone, and content context. You always review before publishing. Think of it as a first draft that's already 80% there.",
    },
    {
      id: 'faq-5',
      q: 'Can I try StarlingPost without a credit card?',
      a: 'Absolutely. The Starter plan is free forever with no card required. Paid plans include a 14-day free trial — cancel any time, no questions asked.',
    },
    {
      id: 'faq-6',
      q: 'What happens to scheduled posts if I downgrade?',
      a: "All published posts and analytics data are preserved. Pending scheduled posts beyond the free tier's limit are paused — you can republish manually or upgrade to resume.",
    },
  ];

  return (
    <div className="bg-gray-950 text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-600/8 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-0 w-[600px] h-[400px] bg-blue-700/8 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-700/6 rounded-full blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto"
        >
          {/* Two-column layout on large screens */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-sm font-medium"
              >
                <Layers size={13} />
                One Hub. Every Platform. Zero Chaos.
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6"
              >
                Manage All Your{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Social Media
                  </span>
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.9, delay: 0.7 }}
                  />
                </span>
                <br />
                From One Place
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
              >
                StarlingPost is your centralized command center for YouTube, Twitter/X, and LinkedIn.
                Schedule posts, automate comments, generate AI captions, and track analytics — all from a single dashboard.
              </motion.p>

              {/* Social proof inline */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex items-center gap-3 mb-8 justify-center lg:justify-start"
              >
                <div className="flex -space-x-2">
                  {['PS', 'MW', 'AO', 'JL'].map((initials, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-gray-950 bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold ${
                      i === 0 ? 'from-cyan-500 to-blue-600' :
                      i === 1 ? 'from-purple-500 to-pink-600' :
                      i === 2 ? 'from-emerald-500 to-teal-600' :
                      'from-orange-500 to-rose-600'
                    }`}>
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-400">
                  <span className="text-white font-semibold">10,000+</span> creators already onboarded
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
                >
                  Start Free — No Card Needed
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-base transition-colors"
                >
                  Sign In
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="flex items-center gap-4 mt-6 justify-center lg:justify-start text-xs text-gray-600"
              >
                {['Free forever plan', '14-day trial on paid', 'Cancel any time'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle size={11} className="text-gray-600" />
                    {t}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: orbital hub viz */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="hidden lg:flex items-center justify-center"
            >
              <PlatformOrbit />
            </motion.div>
          </div>

          {/* Dashboard preview — full width below on all screens */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.65, ease: 'easeOut' }}
            className="mt-16 w-full max-w-5xl mx-auto"
          >
            <div className="relative rounded-2xl border border-gray-700/60 bg-gray-900/80 backdrop-blur-sm shadow-2xl overflow-hidden">
              {/* Window bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700/60">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <span className="w-3 h-3 rounded-full bg-green-500/70" />
                <span className="mx-auto text-xs text-gray-500 font-mono">starlingpost.com/dashboard</span>
              </div>
              <div className="p-6 grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Views', value: '1.2M', delta: '+18%', color: 'text-cyan-400' },
                  { label: 'Engagements', value: '84.3K', delta: '+32%', color: 'text-emerald-400' },
                  { label: 'Scheduled Posts', value: '47', delta: 'this month', color: 'text-purple-400' },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/40">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.delta}</div>
                  </div>
                ))}
                <div className="col-span-2 bg-gray-800/60 rounded-xl p-4 border border-gray-700/40">
                  <div className="text-xs text-gray-500 mb-3">Engagement · Last 10 days</div>
                  <MiniChart />
                </div>
                <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/40 flex flex-col justify-between">
                  <div className="text-xs text-gray-500 mb-2">Next Scheduled</div>
                  <div className="flex items-center gap-2 mb-1">
                    <Youtube size={14} className="text-red-400" />
                    <span className="text-xs text-gray-300 font-medium truncate">How I Hit 100K Subs</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={11} />
                    <span>Tomorrow 09:00 AM</span>
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {['Link Me', 'Auto Pin'].map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-cyan-500/10 blur-2xl rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <Section className="py-10 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Creators Onboarded', value: 10000, suffix: '+' },
              { label: 'Posts Scheduled', value: 2400000, suffix: '+' },
              { label: 'Comments Auto-Replied', value: 850000, suffix: '+' },
              { label: 'Hours Saved / Creator / Week', value: 12, suffix: 'h' },
            ].map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="flex flex-col gap-1">
                <div className="text-3xl font-extrabold text-white">
                  <Counter to={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── WHAT WE DO ── */}
      <Section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
            <Layers size={14} />
            Centralized Platform
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
            One Dashboard.{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Three Platforms.
            </span>{' '}
            Every Tool.
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto mb-14 leading-relaxed">
            Stop juggling tabs. StarlingPost pulls YouTube, Twitter/X, and LinkedIn into a single command center — post, automate, and analyze everything without switching apps.
          </motion.p>

          {/* Platform capability matrix */}
          <motion.div variants={fadeUp} className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-gray-500 font-medium w-1/2">Feature</th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-red-400 font-semibold">
                      <Youtube size={15} /> YouTube
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-gray-300 font-semibold">
                      <Twitter size={15} /> Twitter / X
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-blue-400 font-semibold">
                      <Linkedin size={15} /> LinkedIn
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {platformMatrix.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-800/60 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                    <td className="px-6 py-3.5 text-gray-300 text-left font-medium text-sm">{row.feature}</td>
                    <td className="px-6 py-3.5 text-center"><CapBadge supported={row.yt} /></td>
                    <td className="px-6 py-3.5 text-center"><CapBadge supported={row.tw} /></td>
                    <td className="px-6 py-3.5 text-center"><CapBadge supported={row.li} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </Section>

      {/* ── PROBLEM / SOLUTION ── */}
      <Section className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
            <Zap size={14} />
            The Creator Struggle
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            You Create Great Content.
            <br />
            <span className="text-gray-500">But Managing It Kills the Momentum.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            Inconsistent posting, missed engagement windows, hours copy-pasting captions — it adds up. StarlingPost fixes all of it.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-5 text-left">
            {[
              {
                before: 'Manually posting at different times across platforms',
                after: 'Schedule once, publish everywhere at the perfect time',
                icon: CalendarDays,
              },
              {
                before: 'Writing unique captions for every platform from scratch',
                after: 'AI adapts your caption for YouTube, X, and LinkedIn instantly',
                icon: BrainCircuit,
              },
              {
                before: 'Missing 80% of comments — fans feel ignored',
                after: 'Auto-reply keeps every viewer engaged, 24/7',
                icon: MessageCircle,
              },
              {
                before: 'Switching between 3 apps just to check analytics',
                after: 'One dashboard for all metrics, all platforms',
                icon: BarChart3,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <span className="text-rose-400 text-xs font-bold">✕</span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.before}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle size={13} className="text-emerald-400" />
                  </div>
                  <p className="text-white text-sm font-medium leading-relaxed">{item.after}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
              <Rocket size={14} />
              Platform Features
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Six Tools.{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                One Platform.
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every tool is purpose-built for YouTube, Twitter/X, and LinkedIn — not a generic one-size-fits-all bolt-on.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -5, scale: 1.01 }}
                className={`group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300 cursor-default hover:shadow-lg ${f.glow}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── AUTOMATION SPOTLIGHT ── */}
      <Section className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <Bot size={14} />
              Automation Suite
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
              Your Comments Section,{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                On Autopilot
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-base leading-relaxed mb-8">
              StarlingPost monitors your posts around the clock. Whether a viewer asks for a link, needs a reply, or just commented — your channel responds like a pro team is always watching.
            </motion.p>

            <motion.div variants={stagger(0.12)} className="space-y-4">
              {[
                {
                  icon: MousePointerClick,
                  color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
                  title: 'Link Me',
                  desc: 'Keyword in comment → auto-send your URL. Works on YouTube and Twitter/X.',
                },
                {
                  icon: MessageCircle,
                  color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                  title: 'Auto-Reply Templates',
                  desc: 'Set reply templates per platform. Enable AI mode for varied, genuine responses.',
                },
                {
                  icon: Pin,
                  color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
                  title: 'Auto-Pin First Comment',
                  desc: 'Drop a pinned promo or CTA on every YouTube video at publish time.',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-0.5">{item.title}</div>
                    <div className="text-gray-400 text-xs leading-relaxed">{item.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Automation feed card */}
          <motion.div variants={fadeUp} className="relative">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-300">Automation Activity</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              {[
                { time: '2m ago', type: 'Link Me', platform: 'YouTube', msg: 'Sent link to @curious_dev22 asking "where to buy?"', color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { time: '8m ago', type: 'Auto-Reply', platform: 'Twitter/X', msg: 'Replied to @tech_sarah: "Thanks so much! 🙌"', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { time: '15m ago', type: 'Auto-Pin', platform: 'YouTube', msg: 'Pinned first comment on "My 2025 Setup Tour"', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                { time: '1h ago', type: 'Link Me', platform: 'Twitter/X', msg: 'Sent link to @buildinpublic asking "link?"', color: 'text-orange-400', bg: 'bg-orange-500/10' },
              ].map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50"
                >
                  <div className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${event.color} ${event.bg}`}>
                    {event.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 truncate">{event.msg}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-gray-600">{event.platform}</span>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className="text-[10px] text-gray-600">{event.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-emerald-500/8 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-cyan-500/8 rounded-full blur-2xl pointer-events-none" />
          </motion.div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
              <RefreshCw size={14} />
              How It Works
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-4">
              Up and Running in{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Under 5 Minutes
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 max-w-xl mx-auto">
              No complex setup. No dev required. Connect, create, automate.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] right-0 h-px border-t border-dashed border-gray-800" />
                )}
                <div className="relative z-10 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex flex-col items-center justify-center mb-4 shadow-lg hover:border-cyan-800 transition-colors">
                  <span className="text-[10px] font-bold text-gray-600 mb-0.5">{step.num}</span>
                  <step.icon size={22} className="text-cyan-400" />
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── TESTIMONIALS ── */}
      <Section className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium">
              <Star size={14} />
              Creator Stories
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-3">
              Creators Who Made the Switch
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400">
              Real results from real creators — no sponsored fluff.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-700 transition-all"
              >
                <div className="flex gap-0.5">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} size={13} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">{t.name}</div>
                    <div className="text-gray-500 text-[10px]">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PRICING ── */}
      <Section className="py-24 px-4" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
              <Shield size={14} />
              Simple, Transparent Pricing
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-3">
              Start Free. Scale When Ready.
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400">
              No hidden fees. No annual lock-in. Cancel any time.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                className={`relative bg-gray-900 border-2 ${plan.color} rounded-2xl p-6 flex flex-col transition-all duration-300`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold whitespace-nowrap shadow">
                    {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-lg font-bold text-white mb-1">{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-gray-500 text-sm">/ {plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle size={15} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`w-full text-center px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} className="text-center text-gray-700 text-xs mt-8">
            All paid plans include a 14-day free trial. No credit card required to start the free plan.
          </motion.p>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-3">
              Frequently Asked Questions
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400">
              Everything you need to know before you start.
            </motion.p>
          </div>
          <motion.div variants={stagger(0.08)} className="space-y-3">
            {faqs.map((faq) => (
              <motion.div key={faq.id} variants={fadeUp}>
                <FaqItem
                  q={faq.q}
                  a={faq.a}
                  open={openFaq === faq.id}
                  onToggle={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ── FINAL CTA ── */}
      <Section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUp}
            className="relative rounded-3xl overflow-hidden border border-gray-800 p-10 md:p-16 text-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-900"
          >
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Layers size={18} className="text-cyan-400" />
                <span className="text-cyan-400 font-semibold text-sm tracking-wide uppercase">Your Social Hub Awaits</span>
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
                Stop Managing Platforms.<br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Start Running Them.
                </span>
              </h2>

              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join 10,000+ creators who centralized their social media on StarlingPost and got their time back.
              </p>

              {!emailSent ? (
                <form onSubmit={handleEmailCapture} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-5 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm whitespace-nowrap shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    <Send size={15} />
                    Get Early Access
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 mb-8 text-emerald-400 font-semibold"
                >
                  <CheckCircle size={20} />
                  You're on the list! Check your inbox.
                </motion.div>
              )}

              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/20 transition-all duration-300"
              >
                Start Free — No Card Needed
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-600">
                {['Free forever plan', '14-day trial on paid', 'Cancel any time'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle size={11} className="text-gray-700" />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </Section>

    </div>
  );
}
