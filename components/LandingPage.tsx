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
  Play,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Youtube,
  Twitter,
  Linkedin,
  Star,
  Globe,
  CalendarDays,
  BrainCircuit,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState, useEffect } from 'react';

// ─── Animation helpers ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
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

// ─── Animated counter ──────────────────────────────────────────────────────

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

// ─── Mini animated bar chart ───────────────────────────────────────────────

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

// ─── Platform pill ─────────────────────────────────────────────────────────

function PlatformBadge({
  icon: Icon,
  label,
  color,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}
    >
      <Icon size={12} />
      {label}
    </span>
  );
}

// ─── FAQ item ──────────────────────────────────────────────────────────────

function FaqItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-gray-900 hover:bg-gray-800 transition-colors"
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

// ─── Main component ────────────────────────────────────────────────────────

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<string | null>('faq-1');
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const handleEmailCapture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailSent(true);
  };

  const features = [
    {
      icon: CalendarDays,
      color: 'from-cyan-500 to-blue-600',
      title: 'Smart Scheduling',
      desc: 'Queue posts for YouTube, Twitter/X, and LinkedIn at optimal times. Set it once, publish forever.',
    },
    {
      icon: BrainCircuit,
      color: 'from-purple-500 to-pink-600',
      title: 'AI Caption Engine',
      desc: 'Generate platform-native captions, hashtags, and hooks with GPT-4 tuned for each network.',
    },
    {
      icon: MessageCircle,
      color: 'from-emerald-500 to-teal-600',
      title: 'Auto-Reply Comments',
      desc: 'Never leave a comment unanswered. Set smart reply templates or let AI craft genuine responses.',
    },
    {
      icon: Link2,
      color: 'from-orange-500 to-rose-600',
      title: 'Link Me Automation',
      desc: 'Detect keywords like "link?" in comments and auto-send your promo URL — hands-free.',
    },
    {
      icon: Pin,
      color: 'from-yellow-500 to-amber-600',
      title: 'Auto-Pin First Comment',
      desc: 'Automatically pin a curated first comment on every YouTube video the moment it goes live.',
    },
    {
      icon: BarChart3,
      color: 'from-indigo-500 to-violet-600',
      title: 'Unified Analytics',
      desc: 'Views, impressions, engagement and follower growth across all platforms in one dashboard.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Connect your accounts',
      desc: 'Link YouTube, Twitter/X, and LinkedIn in under 60 seconds via secure OAuth.',
      icon: Globe,
    },
    {
      num: '02',
      title: 'Create or import content',
      desc: 'Use the AI studio to write captions, generate hashtags, and preview across platforms.',
      icon: Sparkles,
    },
    {
      num: '03',
      title: 'Schedule & automate',
      desc: 'Pick a publish time, enable auto-reply or Link Me, and let StarlingPost do the work.',
      icon: Clock,
    },
    {
      num: '04',
      title: 'Track & optimize',
      desc: 'Monitor performance metrics in real time and double down on what resonates.',
      icon: TrendingUp,
    },
  ];

  const pricing = [
    {
      name: 'Starter',
      price: 0,
      period: 'forever free',
      color: 'border-gray-700',
      badge: null,
      features: [
        '3 scheduled posts / month',
        '1 connected platform',
        'Basic analytics (7 days)',
        'Community support',
      ],
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
      ctaStyle:
        'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30',
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
      ctaStyle:
        'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30',
    },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Tech YouTuber · 280K subscribers',
      avatar: 'PS',
      color: 'from-cyan-500 to-blue-600',
      text: "StarlingPost's Link Me automation alone doubled my affiliate link clicks. I just set the keyword once and it sends the link to every single comment asking for it.",
      stars: 5,
    },
    {
      name: 'Marcus Webb',
      role: 'Twitter/X Creator · 95K followers',
      avatar: 'MW',
      color: 'from-purple-500 to-pink-600',
      text: 'The AI captions are shockingly good for Twitter. They feel native, not like some generic GPT output. My engagement rate went up 40% within the first month.',
      stars: 5,
    },
    {
      name: 'Aisha Okonkwo',
      role: 'LinkedIn Thought Leader · 45K followers',
      avatar: 'AO',
      color: 'from-emerald-500 to-teal-600',
      text: "Scheduling LinkedIn posts at optimal times while traveling is a game-changer. My impressions tripled and I didn't have to touch my phone once.",
      stars: 5,
    },
    {
      name: 'James Liu',
      role: 'Content Agency Founder',
      avatar: 'JL',
      color: 'from-orange-500 to-rose-600',
      text: 'We manage 8 client accounts from one dashboard. The auto-reply templates save us hours every week — clients think we have a full moderation team.',
      stars: 5,
    },
  ];

  const faqs = [
    {
      id: 'faq-1',
      q: 'Which platforms does StarlingPost support?',
      a: 'StarlingPost currently supports YouTube, Twitter/X, and LinkedIn. We chose to go deep on these three platforms rather than spreading thin across all networks — each integration is native, secure, and regularly updated.',
    },
    {
      id: 'faq-2',
      q: 'How does the Link Me automation work?',
      a: 'You define a keyword (e.g., "link" or "where to buy") and a reply message. When a viewer comments with that keyword on any of your posts, StarlingPost automatically replies with your preset message — instantly, 24/7, without you lifting a finger.',
    },
    {
      id: 'faq-3',
      q: 'Is my account data safe?',
      a: 'Yes. StarlingPost uses OAuth 2.0 for all platform connections — we never store your passwords. All data is encrypted at rest and in transit. You can revoke access at any time from your platform settings.',
    },
    {
      id: 'faq-4',
      q: 'Does the AI caption generator replace my voice?',
      a: "No — it amplifies it. The AI learns from your platform, your tone, and the context of your content. You always review and edit before publishing. Think of it as a first draft that's already 80% there.",
    },
    {
      id: 'faq-5',
      q: 'Can I try StarlingPost without a credit card?',
      a: 'Absolutely. The Starter plan is free forever with no card required. Paid plans include a 14-day free trial — cancel any time, no questions asked.',
    },
    {
      id: 'faq-6',
      q: 'What happens to my scheduled posts if I downgrade?',
      a: "All your existing published posts and analytics data are preserved. Pending scheduled posts beyond the free tier's limit will be paused — you can republish them manually or upgrade to resume.",
    },
  ];

  return (
    <div className="bg-gray-950 text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden"
      >
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-3xl" />
          {/* Animated grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
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
          className="relative z-10 text-center max-w-5xl mx-auto"
        >
          {/* Trust badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-medium"
          >
            <Sparkles size={14} />
            Trusted by 10,000+ creators worldwide
            <Sparkles size={14} />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          >
            Grow Faster on{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                YouTube, X & LinkedIn
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              />
            </span>
            <br className="hidden md:block" />
            — Without the Grind
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            StarlingPost handles scheduling, AI captions, auto-replies, and analytics
            across all three platforms — so you can focus on creating, not managing.
          </motion.p>

          {/* CTA group */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-lg shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
            >
              Start Free — No Card Needed
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-lg transition-colors"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <PlatformBadge icon={Youtube} label="YouTube" color="bg-red-600/10 border-red-600/30 text-red-400" />
            <PlatformBadge icon={Twitter} label="Twitter / X" color="bg-gray-700/30 border-gray-600/30 text-gray-300" />
            <PlatformBadge icon={Linkedin} label="LinkedIn" color="bg-blue-600/10 border-blue-500/30 text-blue-400" />
          </motion.div>
        </motion.div>

        {/* Floating dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.6, ease: 'easeOut' }}
          className="relative z-10 mt-16 w-full max-w-4xl mx-auto"
        >
          <div className="relative rounded-2xl border border-gray-700/60 bg-gray-900/80 backdrop-blur-sm shadow-2xl overflow-hidden">
            {/* Window bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800/80 border-b border-gray-700/60">
              <span className="w-3 h-3 rounded-full bg-red-500/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
              <span className="w-3 h-3 rounded-full bg-green-500/70" />
              <span className="mx-auto text-xs text-gray-500 font-mono">starlingpost.com/dashboard</span>
            </div>

            {/* Simulated dashboard content */}
            <div className="p-6 grid grid-cols-3 gap-4">
              {/* Stat cards */}
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

              {/* Mini chart spanning 2 cols */}
              <div className="col-span-2 bg-gray-800/60 rounded-xl p-4 border border-gray-700/40">
                <div className="text-xs text-gray-500 mb-3">Engagement · Last 10 days</div>
                <MiniChart />
              </div>

              {/* Upcoming post card */}
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
                <div className="mt-2 flex gap-1">
                  {['Link Me', 'Auto Pin'].map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Glow under card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-cyan-500/15 blur-2xl rounded-full" />
        </motion.div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <Section className="py-10 border-y border-gray-800 bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Creators Onboarded', value: 10000, suffix: '+' },
              { label: 'Posts Scheduled', value: 2400000, suffix: '+' },
              { label: 'Comments Auto-Replied', value: 850000, suffix: '+' },
              { label: 'Hours Saved Per Creator', value: 12, suffix: 'h/wk' },
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

      {/* ── PROBLEM / SOLUTION ── */}
      <Section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
            <Zap size={14} />
            The Creator Struggle
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            You Create Great Content.<br />
            <span className="text-gray-500">But the Algorithm Doesn't Wait.</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto mb-12">
            Inconsistent posting, missed engagement windows, hours spent copy-pasting captions across platforms — it kills momentum. StarlingPost fixes all of it.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
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
                before: 'Switching between 3 apps to check analytics',
                after: 'One dashboard for all metrics, all platforms',
                icon: BarChart3,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                    <span className="text-rose-400 text-xs font-bold">✕</span>
                  </div>
                  <p className="text-gray-500 text-sm">{item.before}</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle size={14} className="text-emerald-400" />
                  </div>
                  <p className="text-white text-sm font-medium">{item.after}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── FEATURES ── */}
      <Section className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
              <Rocket size={14} />
              Platform Features
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Scale Your Presence
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-lg max-w-2xl mx-auto">
              Six powerful tools — one unified platform — built specifically for YouTube, Twitter/X, and LinkedIn creators.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300 cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}
                >
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
      <Section className="py-24 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium">
              <Bot size={14} />
              Automation Suite
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
              Your Comments Section,{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                On Autopilot
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-gray-400 text-base leading-relaxed mb-8">
              StarlingPost's automation engine monitors your posts around the clock. Whether a viewer asks for a link, needs engagement, or just posted a comment — your channel responds like a pro team is watching.
            </motion.p>

            <motion.div variants={stagger(0.12)} className="space-y-4">
              {[
                {
                  icon: Link2,
                  color: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
                  title: 'Link Me',
                  desc: 'Keyword detected in comment → auto-send your URL. Works on YouTube and Twitter/X.',
                },
                {
                  icon: MessageCircle,
                  color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                  title: 'Auto-Reply Templates',
                  desc: 'Set smart reply templates per platform. Enable AI mode for genuine, varied responses.',
                },
                {
                  icon: Pin,
                  color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
                  title: 'Auto-Pin First Comment',
                  desc: 'Drop a pinned promo or summary comment on every YouTube video at publish time.',
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

          {/* Visual: automation flow card */}
          <motion.div variants={fadeUp} className="relative">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300">Automation Activity</span>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>

              {[
                { time: '2m ago', type: 'Link Me', platform: 'YouTube', msg: 'Sent link to @curious_dev22 asking "where to buy?"', color: 'text-orange-400' },
                { time: '8m ago', type: 'Auto-Reply', platform: 'Twitter/X', msg: 'Replied to @tech_sarah: "Thanks so much! 🙌"', color: 'text-emerald-400' },
                { time: '15m ago', type: 'Auto-Pin', platform: 'YouTube', msg: 'Pinned first comment on "My 2025 Setup Tour"', color: 'text-yellow-400' },
                { time: '1h ago', type: 'Link Me', platform: 'Twitter/X', msg: 'Sent link to @buildinpublic asking "link?"', color: 'text-orange-400' },
              ].map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-3 p-3 bg-gray-800/60 rounded-xl border border-gray-700/50"
                >
                  <div className={`flex-shrink-0 text-xs font-bold mt-0.5 ${event.color}`}>
                    {event.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 truncate">{event.msg}</div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-gray-600">{event.platform}</span>
                      <span className="text-[10px] text-gray-600">·</span>
                      <span className="text-[10px] text-gray-600">{event.time}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
          </motion.div>
        </div>
      </Section>

      {/* ── HOW IT WORKS ── */}
      <Section className="py-24 px-4 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <RefreshCw size={14} />
              How It Works
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-4">
              Up and Running in{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Under 5 Minutes
              </span>
            </motion.h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] right-0 h-px border-t border-dashed border-gray-700" />
                )}
                <div className="relative z-10 mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex flex-col items-center justify-center mb-4 shadow-lg">
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
      <Section className="py-24 px-4">
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
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-600 transition-all"
              >
                <div className="flex gap-0.5">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} size={13} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
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
      <Section className="py-24 px-4 bg-gray-900/30" id="pricing">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
              <Shield size={14} />
              Simple, Transparent Pricing
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-extrabold mb-3">
              Start Free, Scale When Ready
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

          <motion.p variants={fadeUp} className="text-center text-gray-600 text-xs mt-8">
            All paid plans include a 14-day free trial. No credit card required to start the free plan.
          </motion.p>
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section className="py-24 px-4">
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
            className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-gray-700 p-10 md:p-16 text-center"
          >
            {/* Glow blobs */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles size={20} className="text-cyan-400" />
                <span className="text-cyan-400 font-semibold text-sm">Start Growing Today</span>
                <Sparkles size={20} className="text-cyan-400" />
              </div>

              <h2 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
                Your Audience Is Waiting.
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Don't Keep Them Waiting.
                </span>
              </h2>

              <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
                Join 10,000+ creators who automate the boring parts and focus on creating what they love.
              </p>

              {/* Email capture */}
              {!emailSent ? (
                <form
                  onSubmit={handleEmailCapture}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-5 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm whitespace-nowrap shadow-lg shadow-cyan-500/30 transition-all"
                  >
                    Get Early Access
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 mb-6 text-emerald-400 font-semibold"
                >
                  <CheckCircle size={20} />
                  You're on the list! Check your inbox.
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base shadow-xl shadow-cyan-500/25 transition-all duration-300"
                >
                  Start Free — No Card Needed
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 mt-8 text-xs text-gray-600">
                {['Free forever plan', '14-day trial on paid', 'Cancel any time'].map((t) => (
                  <div key={t} className="flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-gray-600" />
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
