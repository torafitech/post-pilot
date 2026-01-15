'use client';

import { ArrowRight, BarChart3, Brain, CheckCircle, Play, Rocket, Sparkles, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [activeStack, setActiveStack] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollPosition(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 text-gray-900 overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              PostPilot
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-gray-600 hover:text-blue-600 transition font-medium">
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-lg font-semibold transition transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Animated Background */}
      <section className="pt-32 pb-32 px-4 relative overflow-hidden">
        {/* Animated gradient orbs - lighter */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 border border-blue-200 backdrop-blur-sm shadow-sm">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">AI-Powered Social Media Intelligence</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-black text-center mb-6 leading-tight text-gray-900">
            Post Smarter,
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Not Harder
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 text-center mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            One click to post everywhere. AI writes captions, picks hashtags, and finds the perfect time to post. Your reach multiplies automatically.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center flex-wrap mb-20">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-10 py-4 rounded-xl text-lg font-bold transition transform hover:scale-105 shadow-2xl hover:shadow-2xl"
            >
              Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="#demo"
              className="inline-flex items-center gap-2 border-2 border-gray-300 hover:border-blue-600 text-gray-900 px-10 py-4 rounded-xl text-lg font-bold transition hover:bg-blue-50 backdrop-blur-sm"
            >
              <Play className="w-5 h-5" /> Watch Demo
            </Link>
          </div>

          {/* Stats with Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-24">
            {[
              { num: "300%", label: "Avg. Reach Increase" },
              { num: "10 min", label: "Time per Post" },
              { num: "12+", label: "Platforms" }
            ].map((stat, idx) => (
              <div key={idx} className="text-center p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition transform hover:scale-105">
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stat.num}</div>
                <div className="text-sm text-gray-600 mt-2 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview with Scroll Animation */}
        <div className="relative max-w-6xl mx-auto" style={{ transform: `translateY(${scrollPosition * 0.05}px)` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-cyan-200/20 blur-3xl rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-white to-gray-50 border border-gray-300/50 rounded-3xl p-3 overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-2xl aspect-video flex items-center justify-center border border-gray-200 relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 right-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-10 left-10 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50"></div>
              </div>
              <div className="text-center relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <Sparkles className="w-14 h-14 text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-900">Dashboard Preview</p>
                <p className="text-gray-600 mt-3 font-medium">Post, schedule & analyze across all platforms</p>
              </div>
            </div>
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


      {/* AI Features - Scroll Stack */}
      <section className="py-32 px-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-gray-900">
              AI that actually does the work
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              PostPilot handles the heavy lifting so you can focus on creating.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: hero image / mock dashboard with hover zoom */}
            <div className="order-1 md:order-none">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition" />
                <div className="relative rounded-3xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-2xl overflow-hidden transform group-hover:scale-[1.02] transition">
                  <div className="aspect-video flex flex-col justify-between p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl">
                          🤖
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          AI Assistant
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        Smart Mode
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
                        <p className="text-[11px] text-gray-500">Best time today</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">7:30 PM</p>
                      </div>
                      <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-3">
                        <p className="text-[11px] text-gray-500">Caption ideas</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">12</p>
                      </div>
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-[11px] text-gray-500">Hashtags</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">#growth</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-gray-900 text-white px-4 py-3 text-xs flex items-center justify-between">
                      <span className="opacity-80">
                        “Drafted an Instagram + YouTube post and picked the best time at 7:30 PM.”
                      </span>
                      <span className="ml-3 text-blue-300 font-semibold whitespace-nowrap">
                        Preview →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: bullet feature list */}
            <div className="space-y-5">
              <h3 className="text-3xl font-bold text-gray-900">
                All the AI you actually need
              </h3>
              <p className="text-base text-gray-600">
                Instead of throwing random AI features at you, PostPilot focuses on the tasks
                that move your numbers: writing, timing, and distribution.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-blue-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      AI content & hashtags
                    </p>
                    <p className="text-xs text-gray-600">
                      Generate high‑performing captions and relevant hashtags in one click.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Smart posting times
                    </p>
                    <p className="text-xs text-gray-600">
                      Let AI suggest the best time to post for each platform (premium / coming soon).
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Platform‑aware drafts
                    </p>
                    <p className="text-xs text-gray-600">
                      Adapt the same idea into platform‑specific versions without rewriting everything.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 text-blue-600">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      Engagement‑driven suggestions
                    </p>
                    <p className="text-xs text-gray-600">
                      See which posts and formats are working so you can double down on winners.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* What You Get with PostPilot */}
      <section className="py-32 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-gray-900">
              Everything in one place
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              PostPilot combines creation, scheduling, and analytics into a single, creator‑friendly
              workspace.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Create',
                desc: 'Draft once or use AI to generate ready‑to‑post content tailored to each platform.',
                icon: '📝',
              },
              {
                title: 'Schedule',
                desc: 'Post now or schedule ahead – with upcoming premium features for AI timing and advanced controls.',
                icon: '⏱️',
              },
              {
                title: 'Analyze',
                desc: 'See reach, engagement and top posts without jumping between apps or spreadsheets.',
                icon: '📊',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl border border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-blue-500 hover:shadow-xl transition"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl mb-4">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Scroll Stack Effect */}
      {/* <section className="py-32 px-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-gray-900">Loved by Creators</h2>
            <p className="text-xl text-gray-600">See how creators are transforming with PostPilot</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stars: 5,
                quote: "PostPilot increased my reach by 400%. I went from struggling to handling 10 accounts effortlessly.",
                author: "Sarah Chen",
                role: "Content Creator • 250K followers",
                avatar: "🎬",
                color: "from-blue-50 to-blue-100"
              },
              {
                stars: 5,
                quote: "The auto-reposting feature alone saves me 15 hours per week. Best investment ever.",
                author: "Marcus Williams",
                role: "Agency Owner",
                avatar: "💼",
                color: "from-cyan-50 to-cyan-100"
              },
              {
                stars: 5,
                quote: "Best ROI I've seen. The platform keeps getting smarter and my engagement keeps growing.",
                author: "Emma Rodriguez",
                role: "E-commerce Brand Owner",
                avatar: "🚀",
                color: "from-blue-50 to-blue-100"
              }
            ].map((testimonial, idx) => (
              <div key={idx} className={`p-8 rounded-2xl border-2 border-gray-300 bg-gradient-to-br ${testimonial.color} hover:border-blue-500 transition transform hover:scale-105 hover:shadow-xl cursor-pointer`}>
                <div className="flex gap-1 mb-6 text-yellow-500">
                  {"⭐".repeat(testimonial.stars)}
                </div>
                <p className="text-gray-800 mb-8 text-lg font-medium italic leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-gray-300">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-3xl font-bold border border-gray-200 shadow-md">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.author}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Pricing */}
      {/* <section className="py-32 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-gray-900">Simple Pricing</h2>
            <p className="text-xl text-gray-600">All plans include AI features. No hidden costs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: 19,
                desc: "Perfect for individuals",
                features: [
                  "4 social accounts",
                  "AI Content Generation",
                  "Smart Scheduling",
                  "Basic Analytics",
                  "Auto-Reposting (2x/month)"
                ],
                cta: "Get Started",
                highlighted: false
              },
              {
                name: "Professional",
                price: 49,
                desc: "For growing teams",
                features: [
                  "Unlimited accounts",
                  "Advanced AI Features",
                  "Predictive Analytics",
                  "Unlimited Auto-Reposting",
                  "Team Collaboration",
                  "Priority Support",
                  "Custom Reports"
                ],
                cta: "Start Free Trial",
                highlighted: true
              },
              {
                name: "Enterprise",
                price: null,
                priceText: "Custom",
                desc: "For large organizations",
                features: [
                  "Everything in Pro",
                  "Dedicated Manager",
                  "Custom AI Models",
                  "API Access",
                  "White Label",
                  "24/7 Support",
                  "SLA Guarantee"
                ],
                cta: "Contact Sales",
                highlighted: false
              }
            ].map((plan, idx) => (
              <div key={idx} className={`rounded-3xl transition transform hover:scale-105 ${plan.highlighted
                ? "border-3 border-blue-600 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-2xl p-8 relative"
                : "border-2 border-gray-300 bg-white p-8 hover:border-blue-400 hover:shadow-xl"
                }`}>
                {plan.highlighted && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap shadow-lg">
                    Most Popular ⭐
                  </div>
                )}
                <h3 className="text-3xl font-bold mb-2 text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mb-8 font-medium">{plan.desc}</p>
                <div className="text-5xl font-black mb-8 text-blue-600">
                  {plan.price ? (
                    <>
                      ${plan.price}<span className="text-lg text-gray-500 font-semibold">/mo</span>
                    </>
                  ) : (
                    <span className="text-3xl">{plan.priceText}/mo</span>
                  )}
                </div>
                <ul className="space-y-4 mb-10">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Enterprise" ? "mailto:sales@postpilot.io" : "/register"}
                  className={`w-full block text-center py-4 rounded-xl font-bold text-lg transition transform hover:scale-105 ${plan.highlighted
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                    : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-32 px-4 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-4 text-gray-900">Questions?</h2>
            <p className="text-xl text-gray-600">Everything you need to know about PostPilot</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How does AI auto-reposting work?",
                a: "Our AI analyzes engagement metrics and automatically reposts your best-performing content to different audience segments at optimal times. This can increase reach by 2-3x."
              },
              {
                q: "Which platforms are supported?",
                a: "PostPilot supports Instagram, TikTok, YouTube, Twitter/X, LinkedIn, Facebook, Pinterest, Threads, Bluesky, and more. New platforms added regularly."
              },
              {
                q: "Is there a free trial?",
                a: "Yes! 7-day free trial of our Professional plan. No credit card required. Full access to all AI features."
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel anytime, no questions asked. Your data remains accessible for 30 days after cancellation."
              },
              {
                q: "How accurate is the AI?",
                a: "Our AI is trained on millions of posts using machine learning. It continuously improves based on your results and engagement patterns."
              }
            ].map((item, idx) => (
              <details key={idx} className="p-6 rounded-xl border-2 border-gray-300 bg-white hover:border-blue-400 transition cursor-pointer group">
                <summary className="flex items-center justify-between font-bold text-lg text-gray-900 hover:text-blue-600 transition">
                  <span>{item.q}</span>
                  <span className="text-blue-600 group-open:rotate-180 transition text-2xl">+</span>
                </summary>
                <p className="text-gray-700 mt-4 leading-relaxed font-medium">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 border-t border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-6">
            Ready to Win at Social?
          </h2>
          <p className="text-xl mb-12 leading-relaxed opacity-95">
            Join thousands of creators and brands using PostPilot to save time, boost engagement, and grow their following with AI.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-blue-600 hover:bg-gray-100 px-12 py-4 rounded-xl text-lg font-bold transition transform hover:scale-105 shadow-2xl"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white/10 px-12 py-4 rounded-xl text-lg font-bold transition transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-300 py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center text-white">
                  <Rocket className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">PostPilot</h3>
              </div>
              <p className="text-gray-600 font-medium">AI-powered social media management for creators and brands.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-900">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Features</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Pricing</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Security</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Updates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-900">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">About</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Blog</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Careers</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-gray-900">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Privacy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Terms</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition font-medium">Cookies</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-8 text-center text-gray-600 font-medium">
            <p>&copy; 2026 PostPilot. All rights reserved. | Built with ❤️ for creators</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
