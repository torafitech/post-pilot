import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">✨</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              StarlingPost
            </h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/posts/create" className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
              Create Post
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          AI-Powered Social Media
          <br />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            That Works While You Sleep
          </span>
        </h2>
        
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Schedule posts across Instagram & YouTube. AI automatically reposts underperforming content for 2x reach.
        </p>

        <div className="flex gap-4 justify-center">
          <Link 
            href="/dashboard"
            className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
          >
            Get Started →
          </Link>
          <Link
            href="/posts/create"
            className="bg-white text-purple-600 border-2 border-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition"
          >
            Create First Post
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold mb-2">Smart Scheduling</h3>
            <p className="text-gray-600">
              Schedule posts across multiple platforms at optimal times
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI Auto-Repost</h3>
            <p className="text-gray-600">
              AI identifies underperforming posts and automatically reposts them
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Performance Analytics</h3>
            <p className="text-gray-600">
              Track reach, engagement, and growth across all accounts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
