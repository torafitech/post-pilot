'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Camera,
  Filter,
  Hash,
  Heart,
  MessageCircle,
  MoreVertical,
  Rocket,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeCard, setActiveCard] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
const socialPosts = [
  {
    platform: 'instagram',
    username: '@creative.design',
    likes: '2.4K',
    comments: '128',
    time: '2h ago',
    content:
      '🎨 Just launched our new brand identity! Swipe to see the process →',
    imageUrl: '/images/posts/instagram-1.jpg',
    imageColor: 'bg-gradient-to-br from-sky-400 to-indigo-500',
    badgeColor: 'from-sky-50 to-indigo-50 text-sky-700',
    avatarBg: 'from-sky-400 to-indigo-500',
  },
  {
    platform: 'twitter',
    username: '@techthoughts',
    likes: '856',
    comments: '42',
    time: '1h ago',
    content:
      'AI is changing how we create content. With @PostPilot, our team saves 15+ hours weekly on social media management.',
    imageUrl: '/images/posts/twitter-1.jpg',
    imageColor: 'bg-gradient-to-br from-blue-400 to-cyan-500',
    badgeColor: 'from-sky-50 to-cyan-50 text-sky-700',
    avatarBg: 'from-blue-400 to-cyan-500',
  },
  {
    platform: 'linkedin',
    username: 'Marketing Pro',
    likes: '1.2K',
    comments: '89',
    time: '4h ago',
    content:
      '📈 Case Study: How we increased social engagement by 300% using AI-powered scheduling and analytics.',
    imageUrl: '/images/posts/linkedin-1.jpg',
    imageColor: 'bg-gradient-to-br from-sky-600 to-blue-800',
    badgeColor: 'from-sky-50 to-blue-50 text-sky-700',
    avatarBg: 'from-sky-600 to-blue-800',
  },
  {
    platform: 'tiktok',
    username: '@contentcreator',
    likes: '15.2K',
    comments: '421',
    time: 'Just now',
    content:
      'Behind the scenes: How I manage 5 social platforms in 30 minutes daily! #SocialMediaTips',
    imageUrl: '/images/posts/tiktok-1.jpg',
    imageColor: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    badgeColor: 'from-cyan-50 to-sky-50 text-cyan-700',
    avatarBg: 'from-cyan-500 to-blue-600',
  },
];


  const features = [
    {
      title: 'AI Caption Writer',
      desc: 'Generate viral captions in your brand voice',
      icon: <MessageCircle className="w-6 h-6" />,
      image: '✍️',
      stats: '95% engagement boost',
    },
    {
      title: 'Smart Hashtags',
      desc: 'Discover trending hashtags automatically',
      icon: <Hash className="w-6 h-6" />,
      image: '🏷️',
      stats: '200% more discoverability',
    },
    {
      title: 'Optimal Timing',
      desc: 'Post when your audience is most active',
      icon: <Calendar className="w-6 h-6" />,
      image: '⏰',
      stats: '3x higher reach',
    },
    {
      title: 'Cross-Platform',
      desc: 'One click posts to 12+ platforms',
      icon: <Share2 className="w-6 h-6" />,
      image: '🔄',
      stats: 'Save 10+ hours/week',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 text-slate-900 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
              PostPilot
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {['Feed', 'Analytics', 'Schedule', 'AI Tools', 'Team'].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-slate-700 hover:text-sky-600 transition font-medium px-3 py-2 rounded-lg hover:bg-sky-50 relative group"
              >
                {item}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 group-hover:w-4 h-0.5 bg-sky-500 rounded-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition">
              <Bell className="w-5 h-5 text-slate-700" />
            </button>
            <Link
              href="/register"
              className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 relative overflow-hidden">
        {/* floating icons, toned down */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl opacity-[0.06]"
              initial={{ y: -100, x: Math.random() * 1000 }}
              animate={{ y: 1000, rotate: 360 }}
              transition={{
                duration: 22 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            >
              {['❤️', '📈', '🚀', '💬', '⭐', '👥', '🎯', '✨'][i % 8]}
            </motion.div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-100 to-cyan-100 border border-sky-200 backdrop-blur-sm shadow-sm mb-8">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span className="text-sm font-semibold text-sky-700">
                  AI-Powered Social Suite
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight">
                Your Social Media
                <br />
                <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
                  Supercharged
                </span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
                Create, schedule, and analyze content across all platforms with AI
                that understands your audience. Go viral faster.
              </p>

              <div className="flex gap-4 flex-wrap">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white px-8 py-3.5 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
                >
                  <Camera className="w-5 h-5" />
                  Start Creating Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-2">
                  <div className="flex -space-x-3">
                    {['👩', '👨', '👩‍💻', '👨‍💼'].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-sky-100 to-indigo-100 flex items-center justify-center text-lg"
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-slate-600">Join 10k+ creators</span>
                </div>
              </div>
            </div>

            {/* Right – cards */}
            <div className="relative">
              <div className="absolute inset-6 bg-gradient-to-br from-sky-200/40 via-blue-200/40 to-indigo-200/40 blur-3xl rounded-[32px]" />
              <div className="relative h-[500px]">
                {socialPosts.map((post, index) => (
                  <motion.div
                    key={index}
                    className="absolute w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
                    initial={{
                      y: index * 20,
                      x: index % 2 === 0 ? 18 : -18,
                      rotate: index % 2 === 0 ? 1.5 : -1.5,
                    }}
                    animate={{
                      y: scrollPosition * 0.02 + index * 20,
                      rotate: index % 2 === 0 ? 1.5 : -1.5,
                    }}
                    whileHover={{
                      y: -10,
                      scale: 1.05,
                      zIndex: 50,
                    }}
                    transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                    style={{ top: `${index * 20}px`, zIndex: 10 - index }}
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${post.imageColor} flex items-center justify-center text-white font-bold`}
                        >
                          {post.username.charAt(1)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {post.username}
                          </div>
                          <div className="text-sm text-slate-500">{post.time}</div>
                        </div>
                      </div>
                      <MoreVertical className="w-5 h-5 text-slate-400" />
                    </div>

                    <div className="p-4">
                      <p className="text-slate-800 mb-4">{post.content}</p>
                      <div
                        className={`aspect-video ${post.imageColor} rounded-xl mb-4 flex items-center justify-center text-white text-4xl`}
                      >
                        {post.platform === 'instagram'
                          ? '📸'
                          : post.platform === 'twitter'
                            ? '🐦'
                            : post.platform === 'linkedin'
                              ? '💼'
                              : '🎵'}
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <div className="flex items-center gap-4">
                          <button className="flex items-center gap-1 hover:text-rose-500 transition">
                            <Heart className="w-5 h-5" />
                            <span>{post.likes}</span>
                          </button>
                          <button className="flex items-center gap-1 hover:text-sky-500 transition">
                            <MessageCircle className="w-5 h-5" />
                            <span>{post.comments}</span>
                          </button>
                          <button className="hover:text-emerald-500 transition">
                            <Share2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="text-xs px-3 py-1 bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 rounded-full font-medium capitalize">
                          {post.platform}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features – still 4 cards but blue */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                Go Viral
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              AI-powered tools designed for the modern creator
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onHoverStart={() => setHoveredFeature(index)}
                onHoverEnd={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400/12 to-indigo-500/12 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:border-sky-300 h-full">
                  <div className="mb-6">
                    <motion.div
                      className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-2xl mb-4"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.image}
                    </motion.div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 mb-4">{feature.desc}</p>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 text-sm font-semibold text-sky-700">
                    <TrendingUp className="w-4 h-4" />
                    {feature.stats}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics (kept dark for contrast) */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/20 to-cyan-500/20 border border-sky-500/30 mb-4">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-semibold">Live Analytics Dashboard</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Watch Your Growth
              <br />
              <span className="bg-gradient-to-r from-sky-300 to-cyan-300 bg-clip-text text-transparent">
                In Real-Time
              </span>
            </h2>
          </div>

          <div className="relative rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 p-1 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium">Live Data</span>
                </div>
                <div className="hidden md:flex gap-2">
                  {['Today', '7D', '30D', 'Custom'].map((tab) => (
                    <button
                      key={tab}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 transition"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-slate-400" />
                <div className="text-sm text-slate-400">Updated just now</div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              {[
                { label: 'Total Followers', value: '124.8K', change: '+12.4%', icon: '👥' },
                { label: 'Engagement Rate', value: '4.8%', change: '+2.1%', icon: '❤️' },
                { label: 'Impressions', value: '2.4M', change: '+34.7%', icon: '👁️' },
                { label: 'Content Saved', value: '8.2K', change: '+18.3%', icon: '⭐' },
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{metric.icon}</span>
                    <span className="text-sm text-emerald-300 bg-emerald-400/10 px-2 py-1 rounded-full">
                      {metric.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{metric.value}</div>
                  <div className="text-sm text-slate-400">{metric.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="p-6">
              <div className="text-lg font-semibold mb-4">Engagement Trends</div>
              <div className="h-48 flex items-end gap-2">
                {[40, 65, 80, 60, 85, 95, 75, 90, 85, 95].map((height, index) => (
                  <motion.div
                    key={index}
                    className="flex-1 flex flex-col items-center"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-sky-500 to-cyan-400 rounded-t-lg hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ height: `${height}%` }}
                    />
                    <div className="text-xs text-slate-400 mt-2">Day {index + 1}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Scroll Stack Animation */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Create & Schedule
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                In Minutes
              </span>
            </h2>
          </div>

          {/* Scroll Stack Container */}
          <div className="relative" ref={scrollContainerRef}>
            {[
              {
                step: "01",
                title: "Connect Your Accounts",
                desc: "Link Instagram, TikTok, YouTube, and more in seconds.",
                image: (
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-2xl rounded-full" />
                    <div className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-white">
                      <div className="flex gap-4 mb-6">
                        {['📸', '🎵', '🐦', '💼'].map((icon, i) => (
                          <div key={i} className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                            {icon}
                          </div>
                        ))}
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">Connected</div>
                        <div className="text-sm opacity-90">4 platforms linked</div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                step: "02",
                title: "AI-Generate Content",
                desc: "Let AI write captions and suggest trending hashtags.",
                image: (
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 to-blue-500/20 blur-2xl rounded-full" />
                    <div className="relative bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl p-8 text-white">
                      <div className="space-y-4">
                        <div className="bg-white/20 rounded-lg p-4">
                          <div className="text-sm opacity-90">Suggested caption:</div>
                          <div className="font-semibold">"Just launched! Swipe for the full story 🚀"</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['#viral', '#trending', '#design', '#launch'].map((tag, i) => (
                            <div key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                step: "03",
                title: "Schedule & Publish",
                desc: "Post now or schedule for optimal engagement times.",
                image: (
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-2xl rounded-full" />
                    <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-8 text-white">
                      <div className="text-center mb-6">
                        <Calendar className="w-12 h-12 mx-auto mb-4" />
                        <div className="text-2xl font-bold">Optimal Time</div>
                        <div className="text-3xl font-black">7:30 PM</div>
                      </div>
                      <div className="text-sm opacity-90 text-center">92% engagement predicted</div>
                    </div>
                  </div>
                )
              },
              {
                step: "04",
                title: "Analyze & Optimize",
                desc: "Track performance and get AI insights for improvement.",
                image: (
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 blur-2xl rounded-full" />
                    <div className="relative bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-8 text-white">
                      <div className="space-y-6">
                        <div className="text-center">
                          <div className="text-3xl font-black">+300%</div>
                          <div className="text-sm opacity-90">Engagement growth</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="font-bold">4.8K</div>
                            <div className="text-xs opacity-90">Likes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">284</div>
                            <div className="text-xs opacity-90">Shares</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                className={`mb-12 last:mb-0 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex flex-col md:flex-row items-center gap-8`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 mb-4">
                    <span className="text-2xl font-black text-gray-300">{item.step}</span>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-gray-300 to-transparent" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-lg text-gray-600">{item.desc}</p>
                </div>
                <div className="flex-1">
                  {item.image}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - User Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-6">
              Loved by
              <br />
              <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                Content Creators
              </span>
            </h2>
          </div>

          {/* Testimonial Carousel */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Alex Morgan",
                handle: "@alexcreates",
                role: "Content Creator • 500K followers",
                avatar: "🎨",
                content: "PostPilot cut my social media time in half while doubling my engagement. The AI captions are pure magic!",
                platform: "Instagram",
                growth: "+245% engagement"
              },
              {
                name: "Samantha Lee",
                handle: "@techwithsam",
                role: "Tech Influencer",
                avatar: "👩‍💻",
                content: "Managing 8 platforms used to be a full-time job. Now it's 30 minutes a day with better results.",
                platform: "Twitter",
                growth: "15 hrs/week saved"
              },
              {
                name: "Marcus Chen",
                handle: "@marcusbuilds",
                role: "Founder, BuildScale",
                avatar: "🚀",
                content: "Our startup's social presence grew 5x in 3 months. The analytics helped us understand our audience better.",
                platform: "LinkedIn",
                growth: "5x growth"
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg hover:shadow-2xl transition-shadow duration-300"
                whileHover={{ y: -10 }}
              >
                {/* User Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center text-2xl text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.handle}</div>
                    <div className="text-xs text-gray-500 mt-1">{testimonial.role}</div>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>

                {/* Platform & Stats */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm">
                      {testimonial.platform.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{testimonial.platform}</span>
                  </div>
                  <div className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    {testimonial.growth}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-rose-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl opacity-20"
              initial={{
                y: -100,
                x: Math.random() * 1200
              }}
              animate={{
                y: 1000,
                rotate: Math.random() * 360
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 3
              }}
            >
              {['🚀', '💫', '✨', '🌟', '⭐', '🔥', '🎯', '🏆'][i % 8]}
            </motion.div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-8">
            Start Growing Your
            <br />
            <span className="bg-gradient-to-r from-white to-amber-200 bg-clip-text text-transparent">
              Social Presence Today
            </span>
          </h2>

          <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto">
            Join 10,000+ creators and brands using AI to create better content faster.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-8">
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 bg-white text-sky-700 hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              <Rocket className="w-5 h-5" />
              Start Free Trial - No Credit Card
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Bank-level security</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>10,000+ users</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">PostPilot</span>
            </div>

            <div className="flex gap-6">
              {['Twitter', 'Instagram', 'LinkedIn', 'YouTube'].map((social) => (
                <a key={social} href="#" className="hover:text-white transition">
                  {social}
                </a>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            &copy; {new Date().getFullYear()} PostPilot. All rights reserved.
          </div>
        </div>
      </footer>


      {/* Global */}
      <style jsx global>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
