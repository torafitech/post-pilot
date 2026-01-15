'use client';

import { ArrowRight, BarChart3, Brain, Clock, Globe, MessageSquare, Play, Rocket, Shield, Sparkles, TrendingUp, Users, Users2, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 text-gray-900 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent animate-gradient">
              PostPilot
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="hidden md:inline text-gray-600 hover:text-blue-600 transition font-medium px-3 py-2 rounded-lg hover:bg-blue-50">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-32 px-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-200/10 rounded-full blur-2xl"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">AI-Powered Social Media Intelligence</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-center mb-6 leading-tight text-gray-900 animate-fade-in-up">
            Post Smarter,
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
              Not Harder
            </span>
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 text-center mb-12 max-w-3xl mx-auto leading-relaxed font-light animate-fade-in-up delay-100">
            One click to post everywhere. AI writes captions, picks hashtags, and finds the perfect time to post. Your reach multiplies automatically.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center flex-wrap mb-16 animate-fade-in-up delay-200">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-2xl active:scale-95"
            >
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="group inline-flex items-center gap-2 border-2 border-gray-300 hover:border-blue-600 text-gray-900 px-8 sm:px-10 py-3 sm:py-4 rounded-xl text-lg font-bold transition-all duration-300 hover:bg-blue-50 backdrop-blur-sm">
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" /> Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-20 animate-fade-in-up delay-300">
            {[
              { num: "300%", label: "Avg. Reach Increase", icon: "📈" },
              { num: "10 min", label: "Time per Post", icon: "⏱️" },
              { num: "12+", label: "Platforms", icon: "🌐" }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 hover:border-blue-300"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stat.num}</div>
                <div className="text-sm text-gray-600 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative max-w-6xl mx-auto" style={{ transform: `translateY(${scrollPosition * 0.05}px)` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-cyan-200/20 blur-3xl rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-white to-gray-50 border border-gray-300/50 rounded-3xl p-3 overflow-hidden shadow-2xl hover:shadow-3xl transition-shadow duration-500">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm font-medium text-gray-600">PostPilot Dashboard</div>
              <div className="w-20 h-2 bg-gray-200 rounded-full"></div>
            </div>

            {/* Dashboard Content */}
            <div className="bg-gradient-to-br from-blue-50/50 to-gray-50/50 rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden">
              {/* Mock Dashboard Elements */}
              <div className="absolute inset-0 flex flex-col p-6">
                {/* Top Stats Row */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Engagement", value: "4.8K", trend: "+12%" },
                    { label: "Reach", value: "48.2K", trend: "+24%" },
                    { label: "Posts", value: "156", trend: "+8%" },
                    { label: "Growth", value: "42%", trend: "+15%" }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
                      <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-green-600 font-medium">{stat.trend}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Area */}
                <div className="flex-1 grid grid-cols-3 gap-6">
                  {/* Left - Platform Distribution */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                    <div className="text-sm font-semibold text-gray-900 mb-4">Platform Distribution</div>
                    <div className="space-y-3">
                      {[
                        { platform: "Instagram", percentage: 45, color: "bg-gradient-to-r from-pink-500 to-purple-600" },
                        { platform: "Twitter", percentage: 25, color: "bg-gradient-to-r from-blue-400 to-cyan-500" },
                        { platform: "YouTube", percentage: 20, color: "bg-gradient-to-r from-red-500 to-red-600" },
                        { platform: "LinkedIn", percentage: 10, color: "bg-gradient-to-r from-blue-600 to-blue-800" }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-700">{item.platform}</span>
                            <span className="font-medium">{item.percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Center - Main Chart */}
                  <div className="col-span-2 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                    <div className="text-sm font-semibold text-gray-900 mb-4">Engagement Trend</div>
                    <div className="flex items-end h-32 gap-2">
                      {[30, 45, 60, 75, 65, 80, 95].map((height, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-lg transition-all duration-500 hover:opacity-80"
                            style={{ height: `${height}%` }}
                          ></div>
                          <div className="text-xs text-gray-500 mt-2">Day {idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200/50">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-500 text-sm font-medium mb-8">Trusted by innovative teams at</p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 opacity-60">
            {[
              { name: "TechCrunch", emoji: "📰" },
              { name: "Forbes", emoji: "💼" },
              { name: "StartupXYZ", emoji: "🚀" },
              { name: "GrowthHack", emoji: "📈" },
              { name: "SocialPro", emoji: "👥" },
              { name: "CreatorHub", emoji: "🎨" }
            ].map((company, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/50 border border-gray-200/50 hover:border-blue-300 hover:shadow-md transition-all duration-300"
              >
                <div className="text-3xl mb-2">{company.emoji}</div>
                <div className="text-sm font-semibold text-gray-700">{company.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* How It Works - Scroll Stack */}
      <section className="py-32 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-gray-900">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four simple steps to automate your social media
            </p>
          </div>

          <div className="space-y-12">
            {[
              {
                step: 'Step 1',
                title: 'Connect your accounts',
                desc: 'Link Instagram, YouTube and X in seconds. No complex setup or API headache.',
                badge: 'Setup in minutes',
                imageEmoji: '🔗',
              },
              {
                step: 'Step 2',
                title: 'Create or let AI write',
                desc: 'Write once or let AI generate platform‑perfect captions and hashtags.',
                badge: 'AI powered',
                imageEmoji: '✨',
              },
              {
                step: 'Step 3',
                title: 'Pick your schedule',
                desc: 'Post now or use advanced scheduling and AI‑recommended times (coming soon).',
                badge: 'Smart timing',
                imageEmoji: '⏰',
              },
              {
                step: 'Step 4',
                title: 'Track performance',
                desc: 'See reach, engagement and top posts in a single clean dashboard.',
                badge: 'Live analytics',
                imageEmoji: '📊',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="grid md:grid-cols-2 gap-10 items-center"
              >
                {/* Left: image / mock card */}
                <div className="order-1 md:order-none">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition" />
                    <div className="relative rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-xl overflow-hidden group-hover:shadow-2xl transform group-hover:scale-[1.02] transition">
                      <div className="aspect-video flex items-center justify-center">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-5xl text-white shadow-2xl group-hover:scale-110 transition-transform">
                          {item.imageEmoji}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: text */}
                <div className="space-y-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
                    {item.step}
                  </span>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {item.title}
                  </h3>
                  <p className="text-base text-gray-600">
                    {item.desc}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 text-xs font-semibold text-blue-700">
                    <Sparkles className="w-4 h-4" />
                    <span>{item.badge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>





      {/* AI Features */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 mb-4">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">AI-Powered Intelligence</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-gray-900">
              Smarter Social Media
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced AI features that handle the heavy lifting while you focus on creativity
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* AI Dashboard Mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 blur-3xl rounded-3xl"></div>
              <div className="relative bg-white rounded-3xl border border-gray-200/50 shadow-2xl overflow-hidden">
                {/* Dashboard Header */}
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">AI Content Studio</h3>
                        <p className="text-sm text-gray-600">Real-time optimization</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Active
                    </div>
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-xs text-blue-700 font-medium mb-2">Best Time to Post</div>
                      <div className="text-lg font-bold text-gray-900">7:30 PM</div>
                      <div className="text-xs text-gray-600">Expected engagement: 92%</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="text-xs text-purple-700 font-medium mb-2">Hashtag Score</div>
                      <div className="text-lg font-bold text-gray-900">87/100</div>
                      <div className="text-xs text-gray-600">Top performer: #socialmedia</div>
                    </div>
                  </div>

                  {/* Content Suggestions */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-900">Content Suggestions</div>
                    <div className="space-y-2">
                      {[
                        { text: "Create a carousel post about productivity tips", score: "95%" },
                        { text: "Share behind-the-scenes video", score: "88%" },
                        { text: "Post customer testimonial", score: "92%" }
                      ].map((suggestion, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                          <span className="text-sm text-gray-700">{suggestion.text}</span>
                          <span className="text-xs font-semibold text-green-600">{suggestion.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature List */}
            <div className="space-y-8">
              {[
                {
                  icon: <Sparkles className="w-6 h-6" />,
                  title: "AI Content Generation",
                  desc: "Generate high-performing captions and relevant hashtags based on your audience and industry trends.",
                  color: "text-blue-600 bg-blue-50"
                },
                {
                  icon: <TrendingUp className="w-6 h-6" />,
                  title: "Smart Timing",
                  desc: "AI analyzes when your audience is most active and suggests optimal posting times for maximum reach.",
                  color: "text-emerald-600 bg-emerald-50"
                },
                {
                  icon: <Users className="w-6 h-6" />,
                  title: "Audience Insights",
                  desc: "Get detailed analytics about your audience demographics, interests, and engagement patterns.",
                  color: "text-purple-600 bg-purple-50"
                },
                {
                  icon: <BarChart3 className="w-6 h-6" />,
                  title: "Performance Predictions",
                  desc: "AI predicts how your content will perform before you even post it.",
                  color: "text-amber-600 bg-amber-50"
                }
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 p-4 rounded-xl bg-white border border-gray-200/50 hover:border-blue-300 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-gray-900">
              Why Choose PostPilot?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to grow your social media presence efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Save Time",
                desc: "Reduce social media management from hours to minutes with automation",
                stats: "10x faster",
                color: "from-amber-500 to-orange-500"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "Multi-Platform",
                desc: "Manage all your social accounts from one unified dashboard",
                stats: "12+ platforms",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Enterprise Security",
                desc: "Bank-level security with encrypted data and secure API connections",
                stats: "99.9% uptime",
                color: "from-emerald-500 to-green-500"
              },
              {
                icon: <Clock className="w-8 h-8" />,
                title: "24/7 Scheduling",
                desc: "Schedule posts for any time zone and automate your content calendar",
                stats: "Unlimited posts",
                color: "from-purple-500 to-pink-500"
              },
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: "Engagement Tools",
                desc: "Monitor comments, mentions, and engage with your audience effectively",
                stats: "Auto-responses",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: <Users2 className="w-8 h-8" />,
                title: "Team Collaboration",
                desc: "Invite team members, assign roles, and collaborate in real-time",
                stats: "Unlimited seats",
                color: "from-rose-500 to-red-500"
              }
            ].map((benefit, idx) => (
              <div
                key={idx}
                className="group relative p-8 rounded-2xl bg-white border border-gray-200/50 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-500 hover:scale-105"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${benefit.color} rounded-t-2xl`}></div>
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 mb-4">{benefit.desc}</p>
                <div className="text-lg font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {benefit.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-gray-900">
              Loved by Creators
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of creators and brands growing with PostPilot
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                content: "PostPilot increased our social media reach by 300% in just 3 months. The AI recommendations are incredibly accurate.",
                author: "Sarah Johnson",
                role: "Marketing Director, TechStart",
                avatar: "👩‍💼",
                rating: 5,
                growth: "+300% reach"
              },
              {
                content: "As a content creator, saving 15 hours a week on social media management has been life-changing. The auto-scheduling is brilliant.",
                author: "Alex Chen",
                role: "Content Creator, 500K followers",
                avatar: "🎬",
                rating: 5,
                growth: "15 hours/week saved"
              },
              {
                content: "The multi-platform support and analytics helped our agency scale social media management for 50+ clients efficiently.",
                author: "Marcus Williams",
                role: "CEO, SocialGrowth Agency",
                avatar: "💼",
                rating: 5,
                growth: "50+ clients managed"
              }
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-2xl bg-white border border-gray-200/50 shadow-lg hover:shadow-2xl hover:border-blue-300 transition-all duration-500 hover:scale-105"
              >
                <div className="flex gap-1 mb-6 text-amber-500">
                  {"⭐".repeat(testimonial.rating)}
                </div>
                <p className="text-gray-700 mb-8 text-lg leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center justify-between pt-6 border-t border-gray-200/50">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center text-2xl font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    {testimonial.growth}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600">
              Everything you need to know about PostPilot
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does the AI content generation work?",
                a: "Our AI analyzes millions of successful posts across industries to generate optimized captions, hashtags, and content suggestions tailored to your audience and goals."
              },
              {
                q: "Which social media platforms do you support?",
                a: "We support Instagram, Facebook, Twitter/X, LinkedIn, TikTok, YouTube, Pinterest, Threads, Bluesky, and more. New platforms are added regularly based on user demand."
              },
              {
                q: "Is there a free trial available?",
                a: "Yes! We offer a 14-day free trial with full access to all features. No credit card required to start. You can upgrade, downgrade, or cancel anytime."
              },
              {
                q: "Can I schedule posts in advance?",
                a: "Absolutely. You can schedule unlimited posts in advance with our visual calendar. Set specific times, create recurring posts, and manage your entire content calendar."
              },
              {
                q: "How secure is my data with PostPilot?",
                a: "We use enterprise-grade encryption, secure API connections, and comply with global data protection regulations. Your data is never shared or sold to third parties."
              },
              {
                q: "Do you offer team collaboration features?",
                a: "Yes! You can invite unlimited team members, assign different roles and permissions, collaborate on content creation, and manage approvals all within the platform."
              }
            ].map((item, idx) => (
              <details
                key={idx}
                className="group p-6 rounded-xl bg-gray-50/50 border border-gray-200/50 hover:border-blue-300 transition-all duration-300 open:bg-blue-50/30 open:border-blue-300"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-lg font-semibold text-gray-900 group-open:text-blue-600">{item.q}</span>
                  <span className="text-blue-600 text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-gray-700 mt-4 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-lg sm:text-xl mb-12 leading-relaxed opacity-95 max-w-2xl mx-auto">
            Join thousands of creators and brands using PostPilot to save time, boost engagement, and grow their following with AI.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-8 sm:px-12 py-3 sm:py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white/10 px-8 sm:px-12 py-3 sm:py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>

          <p className="mt-8 text-sm opacity-80">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Rocket className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">PostPilot</h3>
              </div>
              <p className="text-gray-600 font-medium">
                AI-powered social media management for creators and brands who want to grow faster.
              </p>
              <div className="flex gap-4 mt-6">
                {["🐦", "📘", "💼", "📷"].map((icon, idx) => (
                  <div key={idx} className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-lg hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer">
                    {icon}
                  </div>
                ))}
              </div>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Platforms", "Security", "Updates", "Roadmap"]
              },
              {
                title: "Resources",
                links: ["Blog", "Documentation", "API", "Tutorials", "Community", "Help Center"]
              },
              {
                title: "Company",
                links: ["About", "Careers", "Contact", "Partners", "Press", "Legal"]
              }
            ].map((column, idx) => (
              <div key={idx}>
                <h4 className="font-bold mb-4 text-gray-900">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link href="#" className="text-gray-600 hover:text-blue-600 transition font-medium">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 font-medium">
              &copy; {new Date().getFullYear()} PostPilot. All rights reserved.
            </p>
            <div className="flex gap-6 text-gray-600 font-medium">
              <Link href="#" className="hover:text-blue-600 transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-blue-600 transition">Terms of Service</Link>
              <Link href="#" className="hover:text-blue-600 transition">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Add global animations */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
      `}</style>
    </div>
  );
}