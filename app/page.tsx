import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-3xl">🚀</div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              PostPilot
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/login" className="text-gray-300 hover:text-white transition">
              Sign In
            </Link>
            <Link 
              href="/register"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-6 py-2 rounded-lg font-semibold transition"
            >
              Try Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-sm font-semibold text-cyan-300">
              ✨ Powered by Advanced AI & Machine Learning
            </div>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-center mb-6 leading-tight">
            Your Social Media
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Just Got Intelligent
            </span>
          </h1>

          <p className="text-xl text-gray-300 text-center mb-12 max-w-3xl mx-auto leading-relaxed">
            PostPilot uses AI to write, enhance, schedule, and optimize your content across all platforms. Watch your engagement soar while competitors struggle with basic scheduling tools.
          </p>

          <div className="flex gap-4 justify-center flex-wrap mb-16">
            <Link 
              href="/register"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-8 py-4 rounded-lg text-lg font-bold transition transform hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              Start Free Trial →
            </Link>
            <Link
              href="/login"
              className="border-2 border-gray-600 hover:border-cyan-500 px-8 py-4 rounded-lg text-lg font-bold transition hover:bg-gray-900"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Video Demo / Screenshot Placeholder */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl rounded-3xl"></div>
          <div className="relative bg-gradient-to-b from-gray-900 to-black border border-gray-800 rounded-3xl p-2 overflow-hidden">
            <div className="bg-black rounded-2xl aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-gray-400">Interactive Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-4">
            AI That Actually Works
          </h2>
          <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
            We go beyond basic scheduling. Our AI understands your audience and creates content that converts.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-6 rounded-2xl border border-gray-800 hover:border-cyan-500/50 bg-gray-900/50 hover:bg-gray-900/80 transition">
              <div className="text-5xl mb-4">✍️</div>
              <h3 className="text-2xl font-bold mb-2">AI Content Creation</h3>
              <p className="text-gray-400">
                Generate engaging captions, hashtags, and full posts powered by GPT-4. Never face writer's block again.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-2xl border border-gray-800 hover:border-purple-500/50 bg-gray-900/50 hover:bg-gray-900/80 transition">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-2">Content Optimization</h3>
              <p className="text-gray-400">
                AI analyzes trending topics and audience behavior to suggest the perfect posting time and format.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-2xl border border-gray-800 hover:border-pink-500/50 bg-gray-900/50 hover:bg-gray-900/80 transition">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold mb-2">Smart Auto-Reposting</h3>
              <p className="text-gray-400">
                AI monitors performance and automatically reposts your best content to different audiences. 2-3x more reach.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 rounded-2xl border border-gray-800 hover:border-cyan-500/50 bg-gray-900/50 hover:bg-gray-900/80 transition">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-2xl font-bold mb-2">Visual Enhancement</h3>
              <p className="text-gray-400">
                AI suggests image filters, layouts, and designs to maximize engagement and brand consistency.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-6 rounded-2xl border border-gray-800 hover:border-purple-500/50 bg-gray-900/50 hover:bg-gray-900/80 transition">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-2">Predictive Analytics</h3>
              <p className="text-gray-400">
                AI predicts which content will perform best before you post. Get recommendations in real-time.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-6 rounded-2xl border border-gray-800 hover:border-pink-500/50 bg-gray-900/50 hover:bg-gray-900/80 transition">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="text-2xl font-bold mb-2">Multi-Platform Sync</h3>
              <p className="text-gray-400">
                One post, infinite platforms. AI adapts your content for Instagram, TikTok, Twitter, LinkedIn, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16">
            How PostPilot Stands Out
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="pb-4 font-bold text-lg">Feature</th>
                  <th className="pb-4 text-center"><span className="text-cyan-400 font-bold">PostPilot</span></th>
                  <th className="pb-4 text-center text-gray-500">Buffer</th>
                  <th className="pb-4 text-center text-gray-500">Hootsuite</th>
                  <th className="pb-4 text-center text-gray-500">SocialPilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <tr>
                  <td className="py-4 font-semibold">AI Content Generation</td>
                  <td className="py-4 text-center text-green-400">✓ Advanced</td>
                  <td className="py-4 text-center text-gray-500">Basic</td>
                  <td className="py-4 text-center text-gray-500">Basic</td>
                  <td className="py-4 text-center text-gray-500">Basic</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold">Auto-Reposting (AI)</td>
                  <td className="py-4 text-center text-green-400">✓ Yes</td>
                  <td className="py-4 text-center text-gray-500">✗</td>
                  <td className="py-4 text-center text-gray-500">✗</td>
                  <td className="py-4 text-center text-gray-500">✗</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold">Predictive Analytics</td>
                  <td className="py-4 text-center text-green-400">✓ Yes</td>
                  <td className="py-4 text-center text-gray-500">✗</td>
                  <td className="py-4 text-center text-gray-500">✗</td>
                  <td className="py-4 text-center text-gray-500">✗</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold">Platform Adaptation</td>
                  <td className="py-4 text-center text-green-400">✓ AI-Powered</td>
                  <td className="py-4 text-center text-gray-500">Manual</td>
                  <td className="py-4 text-center text-gray-500">Manual</td>
                  <td className="py-4 text-center text-gray-500">Manual</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold">Multi-Platform Support</td>
                  <td className="py-4 text-center text-green-400">✓ 12+</td>
                  <td className="py-4 text-center">11</td>
                  <td className="py-4 text-center">8+</td>
                  <td className="py-4 text-center">10+</td>
                </tr>
                <tr>
                  <td className="py-4 font-semibold">Affordable AI</td>
                  <td className="py-4 text-center text-green-400">✓ Built-in</td>
                  <td className="py-4 text-center text-gray-500">Extra Cost</td>
                  <td className="py-4 text-center text-gray-500">Extra Cost</td>
                  <td className="py-4 text-center text-gray-500">Extra Cost</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                300%
              </div>
              <p className="text-gray-400">Average Reach Increase</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                10 mins
              </div>
              <p className="text-gray-400">Time to Create & Schedule</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <p className="text-gray-400">Uptime Guaranteed</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <p className="text-gray-400">AI-Powered Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16">
            How PostPilot Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Connect Accounts</h3>
              <p className="text-gray-400">Link your Instagram, TikTok, YouTube, Twitter, LinkedIn, and more in seconds.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Create or Generate</h3>
              <p className="text-gray-400">Write your own content or let AI generate engaging posts tailored to your niche.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Optimize & Schedule</h3>
              <p className="text-gray-400">AI suggests optimal posting times and auto-adapts content for each platform.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-xl font-bold mb-2">Track & Automate</h3>
              <p className="text-gray-400">Watch analytics in real-time. AI automatically reposts top performers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16">
            Loved by Content Creators
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50">
              <div className="flex gap-1 mb-4">
                {"⭐⭐⭐⭐⭐"}
              </div>
              <p className="text-gray-300 mb-6">
                "PostPilot's AI increased my reach by 400%. I went from struggling with scheduling to automating my entire content strategy."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500"></div>
                <div>
                  <p className="font-bold">Sarah Chen</p>
                  <p className="text-sm text-gray-400">Content Creator, 250K followers</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50">
              <div className="flex gap-1 mb-4">
                {"⭐⭐⭐⭐⭐"}
              </div>
              <p className="text-gray-300 mb-6">
                "Finally, a tool that understands social media. The auto-reposting feature alone saved me 15 hours per week."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500"></div>
                <div>
                  <p className="font-bold">Marcus Williams</p>
                  <p className="text-sm text-gray-400">Agency Owner</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50">
              <div className="flex gap-1 mb-4">
                {"⭐⭐⭐⭐⭐"}
              </div>
              <p className="text-gray-300 mb-6">
                "The best social media investment I've made. ROI is incredible and the platform keeps getting smarter."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-500"></div>
                <div>
                  <p className="font-bold">Emma Rodriguez</p>
                  <p className="text-sm text-gray-400">E-commerce Brand Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
            All plans include full AI features. No hidden costs. Cancel anytime.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="p-8 rounded-2xl border border-gray-800 bg-gray-900/50">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-gray-400 mb-6">Perfect for individuals</p>
              <div className="text-4xl font-bold mb-6">
                $19<span className="text-lg text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Up to 4 accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>AI Content Generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Auto-Reposting</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Basic Analytics</span>
                </li>
              </ul>
              <Link 
                href="/dashboard"
                className="w-full block text-center border-2 border-gray-600 hover:border-cyan-500 px-6 py-3 rounded-lg font-bold transition hover:bg-gray-900"
              >
                Get Started
              </Link>
            </div>

            {/* Professional */}
            <div className="p-8 rounded-2xl border-2 border-cyan-500 bg-gray-900/80 relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-gray-400 mb-6">For growing teams</p>
              <div className="text-4xl font-bold mb-6">
                $49<span className="text-lg text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Unlimited accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Advanced AI Features</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Predictive Analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Team Collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Priority Support</span>
                </li>
              </ul>
              <Link 
                href="/dashboard"
                className="w-full block text-center bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-6 py-3 rounded-lg font-bold transition"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 rounded-2xl border border-gray-800 bg-gray-900/50">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-400 mb-6">For large organizations</p>
              <div className="text-4xl font-bold mb-6">
                Custom<span className="text-lg text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Dedicated Account Manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>Custom AI Models</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>API Access</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-cyan-400">✓</span>
                  <span>24/7 Phone Support</span>
                </li>
              </ul>
              <Link 
                href="mailto:sales@postpilot.io"
                className="w-full block text-center border-2 border-gray-600 hover:border-cyan-500 px-6 py-3 rounded-lg font-bold transition hover:bg-gray-900"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-center mb-16">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <details className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50 cursor-pointer group">
              <summary className="flex items-center justify-between font-bold text-lg">
                <span>How does AI auto-reposting work?</span>
                <span className="text-cyan-400">+</span>
              </summary>
              <p className="text-gray-400 mt-4">
                Our AI analyzes engagement metrics and automatically reposts your best-performing content to different audience segments at optimal times. This can increase reach by 2-3x without you lifting a finger.
              </p>
            </details>

            <details className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50 cursor-pointer group">
              <summary className="flex items-center justify-between font-bold text-lg">
                <span>Which platforms are supported?</span>
                <span className="text-cyan-400">+</span>
              </summary>
              <p className="text-gray-400 mt-4">
                PostPilot supports Instagram, TikTok, YouTube, Twitter/X, LinkedIn, Facebook, Pinterest, Threads, Bluesky, and more. We're constantly adding new platforms.
              </p>
            </details>

            <details className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50 cursor-pointer group">
              <summary className="flex items-center justify-between font-bold text-lg">
                <span>Is there a free trial?</span>
                <span className="text-cyan-400">+</span>
              </summary>
              <p className="text-gray-400 mt-4">
                Yes! Start with a 7-day free trial of our Professional plan. No credit card required. Full access to all AI features.
              </p>
            </details>

            <details className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50 cursor-pointer group">
              <summary className="flex items-center justify-between font-bold text-lg">
                <span>Can I cancel anytime?</span>
                <span className="text-cyan-400">+</span>
              </summary>
              <p className="text-gray-400 mt-4">
                Absolutely. Cancel your subscription at any time, no questions asked. Your data remains accessible for 30 days.
              </p>
            </details>

            <details className="p-6 rounded-2xl border border-gray-800 bg-gray-900/50 cursor-pointer group">
              <summary className="flex items-center justify-between font-bold text-lg">
                <span>How accurate is the AI?</span>
                <span className="text-cyan-400">+</span>
              </summary>
              <p className="text-gray-400 mt-4">
                Our AI is trained on millions of posts and uses machine learning to understand what resonates with audiences. It continuously improves based on your results.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl font-bold mb-6">
            Ready to Transform Your Social Media?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join thousands of creators, agencies, and brands using PostPilot to dominate social media with AI.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/register"
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-8 py-4 rounded-lg text-lg font-bold transition transform hover:scale-105 shadow-lg shadow-purple-500/50"
            >
              Start Free Trial (No CC Required)
            </Link>
            <Link
              href="/login"
              className="border-2 border-gray-600 hover:border-cyan-500 px-8 py-4 rounded-lg text-lg font-bold transition hover:bg-gray-900"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">PostPilot</h3>
              <p className="text-gray-400">AI-powered social media management for everyone.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 PostPilot. All rights reserved. | Made with ❤️ for creators</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
