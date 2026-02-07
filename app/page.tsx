// app/page.tsx (Landing Page)
'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BarChart3,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  Crown,
  Filter,
  Heart,
  MessageCircle,
  MessageSquare,
  Play,
  Rocket,
  Share2,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [activeFeature, setActiveFeature] = useState(0);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Social posts preview with real images
  const socialPosts = [
    {
      platform: 'instagram',
      username: '@creative.design',
      likes: '2.4K',
      comments: '128',
      time: '2h ago',
      content: '🎨 Just launched our new brand identity! Swipe to see the process →',
      imageUrl: '/images/image2.png',
      badgeColor: 'from-pink-500/10 to-purple-500/10 border-pink-500/30',
      textColor: 'text-pink-400',
      icon: <Camera className="w-4 h-4 text-pink-400" />,
    },
    {
      platform: 'twitter',
      username: '@techthoughts',
      likes: '856',
      comments: '42',
      time: '1h ago',
      content: 'AI is changing how we create content. With @StarlingPost, our team saves 15+ hours weekly on social media management.',
      imageUrl: '/images/image1.png',
      badgeColor: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30',
      textColor: 'text-blue-400',
      icon: <MessageSquare className="w-4 h-4 text-blue-400" />,
    },
    {
      platform: 'linkedin',
      username: 'Marketing Pro',
      likes: '1.2K',
      comments: '89',
      time: '4h ago',
      content: '📈 Case Study: How we increased social engagement by 300% using AI-powered scheduling and analytics.',
      imageUrl: '/images/image3.png',
      badgeColor: 'from-sky-500/10 to-blue-500/10 border-sky-500/30',
      textColor: 'text-sky-400',
      icon: <TrendingUp className="w-4 h-4 text-sky-400" />,
    },
    {
      platform: 'tiktok',
      username: '@contentcreator',
      likes: '15.2K',
      comments: '421',
      time: 'Just now',
      content: 'Behind the scenes: How I manage 5 social platforms in 30 minutes daily! #SocialMediaTips',
      imageUrl: '/images/image4.png',
      badgeColor: 'from-emerald-500/10 to-cyan-500/10 border-emerald-500/30',
      textColor: 'text-emerald-400',
      icon: <Zap className="w-4 h-4 text-emerald-400" />,
    },
  ];

  // Features with real images
  const features = [
    {
      title: 'AI Caption Writer',
      description: 'Generate viral captions in your brand voice with our advanced AI.',
      image: '/images/feature1.png',
      gradient: 'from-purple-500 to-pink-600',
      stats: '12.4K likes • 92% engagement',
      color: 'text-purple-400',
      index: 0,
    },
    {
      title: 'Smart Hashtags',
      description: 'Discover trending, relevant hashtags automatically.',
      image: '/images/feature2.png',
      gradient: 'from-cyan-500 to-blue-600',
      stats: '300% reach boost • 40+ hashtags',
      color: 'text-cyan-400',
      index: 1,
    },
    {
      title: 'Optimal Timing',
      description: 'Post when your audience is most active with AI predictions.',
      image: '/images/feature3.png',
      gradient: 'from-emerald-500 to-teal-600',
      stats: '95% accuracy • Real-time data',
      color: 'text-emerald-400',
      index: 2,
    },
    {
      title: 'Cross-Platform Posting',
      description: 'One-click publishing to all your social channels.',
      image: '/images/feature4.png',
      gradient: 'from-amber-500 to-orange-600',
      stats: '8 platforms • 5x faster',
      color: 'text-amber-400',
      index: 3,
    },
  ];

  // How it works steps with scroll stack
  const steps = [
    {
      number: '01',
      title: 'Connect Your Accounts',
      description: 'Link Instagram, TikTok, YouTube, and more in seconds. Secure OAuth integration with all major platforms.',
      image: '/images/step1.png',
      gradient: 'from-blue-500 to-cyan-600',
      features: ['Secure OAuth', 'Multi-platform', 'Instant sync'],
    },
    {
      number: '02',
      title: 'AI-Generate Content',
      description: 'Let AI write captions and suggest trending hashtags. Customize tone and style for your brand.',
      image: '/images/step2.png',
      gradient: 'from-purple-500 to-pink-600',
      features: ['AI captions', 'Hashtag suggestions', 'Brand voice'],
    },
    {
      number: '03',
      title: 'Schedule & Publish',
      description: 'Post now or schedule for optimal engagement times. Set it and forget it with our smart scheduler.',
      image: '/images/step3.png',
      gradient: 'from-emerald-500 to-teal-600',
      features: ['Smart scheduling', 'Auto-posting', 'Queue management'],
    },
    {
      number: '04',
      title: 'Analyze & Optimize',
      description: 'Track performance and get AI insights for improvement. Real-time analytics across all platforms.',
      image: '/images/step4.png',
      gradient: 'from-amber-500 to-orange-600',
      features: ['Real-time analytics', 'AI insights', 'Performance tracking'],
    },
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Alex Morgan',
      role: 'Content Creator • 500K followers',
      avatar: 'AM',
      content: 'StarlingPost cut my social media time in half while doubling my engagement. The AI captions are pure magic!',
      stats: '+245% engagement',
      color: 'from-purple-500 to-pink-600',
    },
    {
      name: 'Samantha Lee',
      role: 'Tech Influencer',
      avatar: 'SL',
      content: 'Managing 8 platforms used to be a full-time job. Now it\'s 30 minutes a day with better results.',
      stats: '15 hrs/week saved',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      name: 'Marcus Chen',
      role: 'Founder, BuildScale',
      avatar: 'MC',
      content: 'Our startup\'s social presence grew 5x in 3 months. The analytics helped us understand our audience better.',
      stats: '5x growth',
      color: 'from-emerald-500 to-teal-600',
    },
  ];

  // Dashboard statistics
  const dashboardStats = [
    { label: 'Total Reach', value: '2.4M', change: '+34.7%', icon: '👁️' },
    { label: 'Engagement Rate', value: '4.8%', change: '+2.1%', icon: '❤️' },
    { label: 'New Followers', value: '12.4K', change: '+12.4%', icon: '👥' },
    { label: 'Content Saved', value: '8.2K', change: '+18.3%', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 mb-8"
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-purple-300">
                  AI-Powered Social Suite
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight"
              >
                Post Smarter
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Not Harder
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl"
              >
                One click to post everywhere. AI writes captions, picks hashtags, and finds the perfect time to post. Your reach multiplies automatically.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-6 items-start sm:items-center"
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                >
                  <Rocket className="w-5 h-5" />
                  Start Creating Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {['👩', '👨', '👩‍💻', '👨‍💼'].map((emoji, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-gray-800 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-lg"
                      >
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-300">Join 10k+ creators</div>
                    <div className="text-xs text-gray-500">Trusted by top brands</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Social Cards with Images */}
            <div className="relative">
              <div className="absolute inset-6 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 blur-3xl rounded-[32px]" />
              <div className="relative h-[500px]">
                {socialPosts.map((post, index) => (
                  <motion.div
                    key={index}
                    className="absolute w-full max-w-md bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-xl overflow-hidden"
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
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          {post.icon}
                        </div>
                        <div>
                          <div className="font-bold text-gray-100">
                            {post.username}
                          </div>
                          <div className="text-sm text-gray-400">{post.time}</div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${post.badgeColor} text-xs font-medium ${post.textColor}`}>
                        {post.platform}
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-gray-300 mb-4">{post.content}</p>
                      <div className="aspect-video rounded-xl mb-4 overflow-hidden bg-gray-800">
                        <Image
                          src={post.imageUrl}
                          alt={`${post.platform} post`}
                          width={400}
                          height={300}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">{post.likes}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm">{post.comments}</span>
                          </div>
                          <Share2 className="w-4 h-4 text-gray-400" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Scroll Stack Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 mb-4"
            >
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Powerful Features</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Everything You Need
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                All in One Place
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              Powerful features designed to save time and boost engagement across all platforms.
            </motion.p>
          </div>

          {/* Scroll Stack Container */}
          <div className="relative" ref={scrollContainerRef}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`mb-16 last:mb-0 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex flex-col lg:flex-row items-center gap-12`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                {/* Image Side */}
                <div className="lg:w-1/2">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-2xl rounded-3xl" />

                    <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl group">
                      <div className="aspect-video relative overflow-hidden">
                        {/* hover is driven by the parent .group */}
                        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-105">
                          <Image
                            src={feature.image}
                            alt={feature.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div
                            className={`w-3 h-3 rounded-full bg-gradient-to-r ${feature.gradient}`}
                          />
                          <span className="text-sm font-semibold text-gray-300">
                            Feature Preview
                          </span>
                        </div>
                        <div className="text-lg font-bold text-white mb-2">
                          {feature.title}
                        </div>
                        <p className="text-gray-400 text-sm">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                </div>



                {/* Content Side */}
                <div className="lg:w-1/2">
                  <div className="max-w-lg">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <span className="text-2xl font-black text-gray-300">0{index + 1}</span>
                      <div className="h-0.5 w-12 bg-gradient-to-r from-gray-300 to-transparent" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-lg text-gray-400 mb-6">{feature.description}</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {feature.stats.split('•').map((stat, idx) => (
                        <div key={idx} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                          <div className="text-sm text-gray-400">{stat.trim()}</div>
                        </div>
                      ))}
                    </div>

                    <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors">
                      <span>Learn more</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Dashboard Preview */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 mb-6">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">Live Analytics</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Real-Time Analytics
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Watch Your Growth
                </span>
              </h2>

              <p className="text-xl text-gray-400 mb-8">
                Track performance across all platforms with our advanced analytics dashboard. Get insights that drive growth.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {dashboardStats.map((stat, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className="text-sm text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                        {stat.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
              >
                <BarChart3 className="w-4 h-4" />
                Explore Analytics
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 blur-3xl rounded-3xl" />
                <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                  {/* Dashboard Header */}
                  <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-gray-300">Live Dashboard</span>
                      </div>
                      <div className="hidden md:flex gap-2">
                        {['Today', '7D', '30D', 'Custom'].map((tab) => (
                          <button
                            key={tab}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 transition"
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Filter className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-6">
                    {/* Platform Performance */}
                    <div className="mb-8">
                      <div className="text-sm font-semibold text-gray-300 mb-4">Platform Performance</div>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { platform: 'Instagram', value: '2.4K', growth: '+12.4%', color: 'from-pink-500 to-purple-600' },
                          { platform: 'Twitter', value: '856', growth: '+8.2%', color: 'from-blue-500 to-cyan-600' },
                          { platform: 'YouTube', value: '1.2K', growth: '+24.7%', color: 'from-red-500 to-orange-600' },
                        ].map((platform, index) => (
                          <div key={index} className="text-center">
                            <div className={`h-2 mb-2 rounded-full bg-gradient-to-r ${platform.color}`} />
                            <div className="text-lg font-bold text-white mb-1">{platform.value}</div>
                            <div className="text-xs text-gray-400">{platform.platform}</div>
                            <div className="text-xs text-emerald-400 mt-1">{platform.growth}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Engagement Chart */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold text-gray-300">Engagement Trend</div>
                        <div className="text-xs text-gray-500">Last 7 days</div>
                      </div>
                      <div className="h-32 flex items-end gap-1">
                        {[40, 65, 80, 60, 85, 95, 75].map((height, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <motion.div
                              initial={{ height: 0 }}
                              whileInView={{ height: `${height}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className="w-full bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-t-lg"
                            />
                            <div className="text-xs text-gray-500 mt-2">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Top Post</div>
                        <div className="text-sm font-medium text-white">AI Content Strategy</div>
                        <div className="text-xs text-gray-500">2.4K likes • 128 comments</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Best Time</div>
                        <div className="text-sm font-medium text-white">7:30 PM</div>
                        <div className="text-xs text-gray-500">92% engagement predicted</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works - Scroll Stack */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-4"
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-300">Simple Process</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Create & Schedule
              <br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                In Minutes
              </span>
            </motion.h2>
          </div>

          {/* Scroll Stack Steps */}
          <div className="relative" ref={scrollContainerRef}>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`mb-16 last:mb-0 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex flex-col lg:flex-row items-center gap-12`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                {/* Image Side */}
                <div className="lg:w-1/2 w-full">
                  <div className="relative">
                    <div className={`absolute -inset-4 bg-gradient-to-r ${step.gradient.replace('to', '/10 to').replace('from', '/10 from')} blur-2xl rounded-3xl`} />
                    <div className={`relative bg-gradient-to-br ${step.gradient} rounded-2xl overflow-hidden shadow-2xl group w-full`}>
                      <div className="relative w-full pt-[56.25%] overflow-hidden bg-gray-900"> {/* 16:9 aspect ratio */}
                        <Image
                          src={step.image}
                          alt={step.title}
                          fill
                          className="object-contain transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority={index === 0}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                      </div>
                      <div className="p-6 text-white">
                        <div className="text-2xl font-black mb-2">{step.number}</div>
                        <div className="text-xl font-bold mb-3">{step.title}</div>
                        <div className="flex flex-wrap gap-2">
                          {step.features.map((feature, idx) => (
                            <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="lg:w-1/2">
                  <div className="max-w-lg">
                    <div className="inline-flex items-center gap-2 mb-4">
                      <span className="text-2xl font-black text-gray-300">{step.number}</span>
                      <div className="h-0.5 w-12 bg-gradient-to-r from-gray-300 to-transparent" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-lg text-gray-400 mb-6">{step.description}</p>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {step.features.map((feature, idx) => (
                        <div key={idx} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 text-center">
                          <div className="text-sm text-gray-300">{feature}</div>
                        </div>
                      ))}
                    </div>

                    <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors">
                      <span>Learn more</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-300">Trusted by Creators</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            >
              Loved by
              <br />
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Content Creators
              </span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${testimonial.color} flex items-center justify-center text-white font-bold`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>

                <p className="text-gray-300 mb-6 italic">"{testimonial.content}"</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-gray-300">Verified User</span>
                  </div>
                  <div className="text-sm font-semibold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 px-3 py-1 rounded-full">
                    {testimonial.stats}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { value: '10K+', label: 'Active Creators' },
              { value: '95%', label: 'Satisfaction Rate' },
              { value: '5M+', label: 'Posts Published' },
              { value: '300%', label: 'Avg. Growth' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20" />
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-3xl opacity-10"
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-6"
          >
            <Crown className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-300">Limited Time Offer</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8"
          >
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-white to-blue-400 bg-clip-text text-transparent">
              Your Social Strategy?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
          >
            Join 10,000+ creators and brands using AI to create better content faster.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-10 py-5 rounded-xl text-lg font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
            >
              <Rocket className="w-5 h-5" />
              Start Free Trial - No Credit Card
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>

            <Link
              href="/demo"
              className="inline-flex items-center gap-2 px-8 py-5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}