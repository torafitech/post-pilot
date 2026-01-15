// app/dashboard/page.tsx
'use client';

import { AdsenseAd } from '@/components/AdsenseAd';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { SocialPost } from '@/types/post';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  connectedAt: Date;
}

// Platform icons mapping
const platformIcons: Record<string, string> = {
  instagram: '📸',
  youtube: '🎥',
  twitter: '🐦',
  'twitter/x': '🐦',
  tiktok: '🎵',
  linkedin: '💼',
  facebook: '👍',
  pinterest: '📌',
};

// Platform colors for charts
const platformColors: Record<string, string> = {
  instagram: '#E1306C',
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  'twitter/x': '#1DA1F2',
  tiktok: '#000000',
  linkedin: '#0077B5',
  facebook: '#1877F2',
  pinterest: '#E60023',
  default: '#22C55E',
};

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');

  // posts + loading state
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [syncingPosts, setSyncingPosts] = useState(false);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<
    'all' | 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin'
  >('all');

  // Animation states
  const [statsVisible, setStatsVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const platforms = [
    'Instagram',
    'YouTube',
    'Twitter/X',
    // premium-only for future:
    // 'TikTok',
    // 'LinkedIn',
    // 'Facebook',
    // 'Pinterest',
  ];
  // Trigger animations
  useEffect(() => {
    const timer1 = setTimeout(() => setStatsVisible(true), 100);
    const timer2 = setTimeout(() => setCardsVisible(true), 300);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Check authentication and fetch data
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    fetchConnectedAccounts();
    fetchPosts();
  }, [user, authLoading, router, userProfile]);

  const fetchConnectedAccounts = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      const accounts: ConnectedAccount[] = [];

      if (docSnap.exists()) {
        const userData = docSnap.data() as any;
        const connectedAccountsList = userData.connectedAccounts || [];

        connectedAccountsList.forEach((account: any) => {
          const platformKey = account.platform || 'account';
          const platformLabel = platformKey.charAt(0).toUpperCase() + platformKey.slice(1);

          let connectedAt: Date = new Date();
          if (account.connectedAt?.toDate) {
            connectedAt = account.connectedAt.toDate();
          } else if (account.connectedAt) {
            connectedAt = new Date(account.connectedAt);
          }

          accounts.push({
            id: account.id,
            platform: platformLabel,
            accountName: account.accountName || account.accountLabel || platformLabel,
            accessToken: account.accessToken || '',
            refreshToken: account.refreshToken ?? null,
            connectedAt,
          });
        });
      }

      setConnectedAccounts(accounts);
    } catch (error: any) {
      console.error('❌ Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (!user) return;
    try {
      setPostsLoading(true);
      const postsRef = collection(db, 'users', user.uid, 'posts');
      const q = query(postsRef, orderBy('publishedAt', 'desc'), limit(100));
      const snap = await getDocs(q);

      const list: SocialPost[] = [];
      snap.forEach((docSnap) =>
        list.push({ id: docSnap.id, ...(docSnap.data() as any) }),
      );
      setPosts(list);
    } catch (error: any) {
      console.error('❌ Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSyncPosts = async () => {
    if (!user) return;
    try {
      setSyncingPosts(true);
      const res = await fetch('/api/posts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data = await res.json();
      if (!data.success) {
        alert('Error syncing posts: ' + (data.error || 'Unknown error'));
      } else {
        await fetchPosts();
      }
    } catch (error: any) {
      console.error('❌ Error syncing posts:', error);
      alert('Error syncing posts: ' + error.message);
    } finally {
      setSyncingPosts(false);
    }
  };

  const handleConnectAccount = async () => {
    if (!selectedPlatform) {
      alert('Please select a platform');
      return;
    }
    if (!user) {
      alert('You must be logged in');
      return;
    }

    try {
      setShowModal(false);

      if (selectedPlatform === 'youtube') {
        window.location.href = `/api/auth/youtube?uid=${encodeURIComponent(
          user.uid,
        )}`;
        return;
      }

      if (selectedPlatform === 'twitter' || selectedPlatform === 'twitter/x') {
        window.location.href = `/api/auth/twitter/oauth1?uid=${encodeURIComponent(
          user.uid,
        )}`;
        return;
      }

      if (selectedPlatform === 'instagram') {
        window.location.href = `/api/auth/instagram?uid=${encodeURIComponent(
          user.uid,
        )}`;
        return;
      }

      const oauthRoutes: { [key: string]: string } = {
        instagram: '/api/auth/instagram',
        youtube: '/api/auth/youtube',
        twitter: '/api/auth/twitter/oauth1',
        'twitter/x': '/api/auth/twitter/oauth1',
        linkedin: '/api/auth/linkedin',
        tiktok: '/api/auth/tiktok',
        facebook: '/api/auth/facebook',
        pinterest: '/api/auth/pinterest',
      };

      const oauthRoute = oauthRoutes[selectedPlatform];
      if (!oauthRoute) {
        alert(`OAuth not yet configured for ${selectedPlatform}`);
        return;
      }

      window.location.href = oauthRoute;
    } catch (error: any) {
      console.error('Error initiating OAuth:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!user) return;

    try {
      const accountToRemove = connectedAccounts.find((acc) => acc.id === accountId);
      if (!accountToRemove) return;

      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        const list = data.connectedAccounts || [];
        const filtered = list.filter((item: any) => item.id !== accountToRemove.id);

        await updateDoc(userDocRef, {
          connectedAccounts: filtered,
        });
      }

      const updatedAccounts = connectedAccounts.filter((acc) => acc.id !== accountId);
      setConnectedAccounts(updatedAccounts);
    } catch (error: any) {
      console.error('❌ Error disconnecting account:', error);
      alert(`❌ Error disconnecting account: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  // Process data for charts
  const aggregate = (() => {
    let reach = 0;
    let views = 0;
    let likes = 0;
    let comments = 0;

    posts.forEach((p) => {
      reach += p.metrics?.reach || 0;
      views += p.metrics?.views || 0;
      likes += p.metrics?.likes || 0;
      comments += p.metrics?.comments || 0;
    });

    return { reach, views, likes, comments };
  })();

  // Prepare data for platform distribution chart
  const platformDistribution = Object.entries(
    posts.reduce((acc: Record<string, number>, post) => {
      const platform = post.platform?.toLowerCase() || 'other';
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {}),
  ).map(([platform, count]) => ({
    name: platform.charAt(0).toUpperCase() + platform.slice(1),
    value: count,
    color: platformColors[platform] || platformColors.default,
  }));

  // Prepare engagement trend data from real posts (last 7 days)
  const engagementTrend = (() => {
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // init buckets for each of the last 7 days
    const buckets: { [key: string]: { dateLabel: string; engagement: number; reach: number } } = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      buckets[key] = {
        dateLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        engagement: 0,
        reach: 0,
      };
    }

    // aggregate posts into those buckets
    posts.forEach((p) => {
      const published =
        p.publishedAt?.toDate?.() ??
        (p.publishedAt ? new Date(p.publishedAt as any) : null);
      if (!published) return;

      published.setHours(0, 0, 0, 0);
      const key = published.toISOString().slice(0, 10);
      if (!buckets[key]) return; // outside last 7 days

      const likes = p.metrics?.likes || 0;
      const comments = p.metrics?.comments || 0;
      const reach = p.metrics?.reach || 0;

      buckets[key].engagement += likes + comments;
      buckets[key].reach += reach;
    });

    return Object.values(buckets);
  })();

  // Top performing posts
  const topPosts = [...posts]
    .sort(
      (a, b) =>
        (b.metrics?.likes || 0) +
        (b.metrics?.comments || 0) -
        ((a.metrics?.likes || 0) + (a.metrics?.comments || 0)),
    )
    .slice(0, 5);

  // Filter posts for table
  const filteredPosts = posts.filter((p) =>
    selectedPlatformFilter === 'all'
      ? true
      : p.platform?.toLowerCase() === selectedPlatformFilter,
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Soft background accent */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-cyan-100/40 via-white to-purple-100/40" />

      {/* Navigation */}
      <nav className="relative z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-xl text-white shadow-sm">
              🚀
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800">PostPilot</span>
              <span className="text-xs text-slate-400">Creator analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/posts/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium shadow-sm hover:shadow transition"
            >
              ✨ New post
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 bg-white hover:bg-slate-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
                Welcome back,{' '}
                <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  {userProfile?.displayName}
                </span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor performance across all your connected platforms.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSyncPosts}
                disabled={syncingPosts}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/60 disabled:opacity-60 transition"
              >
                {syncingPosts ? (
                  <>
                    <span className="animate-spin">⟳</span>
                    <span>Syncing…</span>
                  </>
                ) : (
                  <>
                    <span>🔁</span>
                    <span>Sync metrics</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Ad #1 - banner under welcome */}
        <div className="mb-8">
          <AdsenseAd
            slot="1111111111" // <-- replace with your AdSense slot ID
            className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-white/80"
          />
        </div>
        {/* Quick Stats Grid */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <StatCard
            icon="📱"
            label="Connected accounts"
            value={connectedAccounts.length}
            gradient="from-cyan-400 to-blue-400"
            delay={0}
          />
          <StatCard
            icon="📝"
            label="Total posts"
            value={posts.length}
            gradient="from-indigo-400 to-fuchsia-400"
            delay={80}
          />
          <StatCard
            icon="👥"
            label="Total reach"
            value={aggregate.reach.toLocaleString()}
            gradient="from-emerald-400 to-teal-400"
            delay={160}
          />
          <StatCard
            icon="💬"
            label="Total interactions"
            value={(aggregate.likes + aggregate.comments).toLocaleString()}
            gradient="from-orange-400 to-rose-400"
            delay={240}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Platform Distribution */}
          <div
            className={`bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Platform distribution
              </h3>
              <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center text-lg">
                📊
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Number of posts per platform.
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {platformDistribution.map((platform, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span className="text-xs text-slate-700">{platform.name}</span>
                  <span className="text-xs text-slate-400">({platform.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement Trend */}
          <div
            className={`bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Engagement trend
              </h3>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-lg">
                📈
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Daily engagement over the last 7 days (sampled).
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.5rem',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="#6366F1"
                    fill="url(#colorEngagement)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Connected Accounts Section */}
        <div
          className={`mb-10 transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Connected accounts
              </h2>
              <p className="text-xs text-slate-500">
                Manage and monitor your social integrations.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium shadow-sm hover:shadow transition"
            >
              <span className="text-lg">+</span>
              <span>Connect account</span>
            </button>
          </div>

          {connectedAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {connectedAccounts.map((account, index) => (
                <div
                  key={account.id}
                  className="group bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-cyan-300 transition"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl">
                        {platformIcons[account.platform.toLowerCase()] || '📱'}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {account.platform}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {account.accountName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Active</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 mb-4">
                    Connected on {account.connectedAt.toLocaleDateString()}
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() =>
                        router.push(
                          `/analytics?platform=${account.platform.toLowerCase()}`,
                        )
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-cyan-400 hover:bg-cyan-50/60 transition"
                    >
                      📊 View analytics
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Disconnect ${account.platform}?`)) {
                          handleDisconnectAccount(account.id);
                        }
                      }}
                      className="px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-400 hover:bg-rose-100 transition"
                      title="Disconnect"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl">
                📱
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No connected accounts yet
              </h3>
              <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                Connect your social media accounts to start tracking performance in one
                place.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium shadow-sm hover:shadow transition"
              >
                Connect your first account
              </button>
            </div>
          )}
        </div>

        {/* Posts Performance Section */}
        <div
          className={`mb-10 transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Posts performance
              </h2>
              <p className="text-xs text-slate-500">
                See how your recent content is performing.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-xs">
                {['all', 'instagram', 'twitter', 'youtube', 'tiktok'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() =>
                      setSelectedPlatformFilter(platform as any)
                    }
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${selectedPlatformFilter === platform
                      ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                      : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {platform === 'all'
                      ? 'All'
                      : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performing Posts */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Top performing posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPosts.slice(0, 3).map((post, index) => (
                <div
                  key={post.id}
                  className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        {platformIcons[post.platform?.toLowerCase() || 'default'] || '📝'}
                      </div>
                      <span className="text-xs font-medium text-slate-700 capitalize">
                        {post.platform}
                      </span>
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${index === 0
                        ? 'bg-amber-100 text-amber-700'
                        : index === 1
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-orange-100 text-orange-700'
                        }`}
                    >
                      #{index + 1}
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 mb-3 line-clamp-2">
                    {post.caption}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-sm font-semibold text-cyan-700">
                        {post.metrics?.likes || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Likes</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-sm font-semibold text-indigo-700">
                        {post.metrics?.comments || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Comments</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-sm font-semibold text-rose-700">
                        {post.metrics?.reach || 0}
                      </div>
                      <div className="text-[10px] text-slate-500">Reach</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Ad #2 - between top cards and table */}
          <div className="mb-6">
            <AdsenseAd
              slot="2222222222" // <-- replace with second AdSense slot ID
              className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-white/80"
            />
          </div>
          {/* Performance Metrics Table */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Post content
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Reach
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-600">
                      Published
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPosts.slice(0, 5).map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="max-w-xs">
                          <p className="text-xs text-slate-800 truncate">
                            {post.caption}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {(post.caption?.length || 0) + ' characters'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-sm">
                            {platformIcons[post.platform?.toLowerCase() || 'default'] ||
                              '📝'}
                          </div>
                          <span className="text-xs text-slate-700 capitalize">
                            {post.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-cyan-700">
                              {post.metrics?.likes || 0}
                            </div>
                            <div className="text-[10px] text-slate-400">Likes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-indigo-700">
                              {post.metrics?.comments || 0}
                            </div>
                            <div className="text-[10px] text-slate-400">Comments</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm font-semibold text-rose-700">
                          {post.metrics?.reach || 0}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-xs text-slate-500">
                          {post.publishedAt?.toDate
                            ? post.publishedAt.toDate().toLocaleDateString()
                            : post.publishedAt
                              ? new Date(post.publishedAt as any).toLocaleDateString()
                              : '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPosts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-6 text-center text-xs text-slate-400"
                      >
                        No posts yet for this filter. Create a post and sync metrics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 max-w-md w-full shadow-lg">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Connect account
                </h3>
                <p className="text-xs text-slate-500">
                  Choose a platform to connect via OAuth.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Platform
              </label>
              <div className="relative">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-cyan-500 focus:outline-none text-sm text-slate-800 appearance-none"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p.toLowerCase()}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="w-full h-1 rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400" />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectAccount}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium shadow-sm hover:shadow transition"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Stat Card Component */
function StatCard({
  icon,
  label,
  value,
  gradient,
  delay,
}: {
  icon: string;
  label: string;
  value: number | string;
  gradient: string;
  delay: number;
}) {
  return (
    <div
      className="group bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-r ${gradient} opacity-20 group-hover:opacity-40 transition-opacity`}
        />
      </div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
