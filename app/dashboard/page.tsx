// app/dashboard/page.tsx
'use client';

import { AdsenseAd } from '@/components/AdsenseAd';
import { PremiumModal } from '@/components/PremiumModal';
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

// Emojis for platforms
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

// Chart colors
const platformColors: Record<string, string> = {
  instagram: '#F97316',
  youtube: '#EF4444',
  twitter: '#0EA5E9',
  'twitter/x': '#0EA5E9',
  tiktok: '#111827',
  linkedin: '#0EA5E9',
  facebook: '#2563EB',
  pinterest: '#EC4899',
  default: '#22C55E',
};

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');

  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [syncingPosts, setSyncingPosts] = useState(false);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<
    'all' | 'instagram' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin'
  >('all');

  const [statsVisible, setStatsVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const platforms = ['Instagram', 'YouTube', 'Twitter/X'];

  useEffect(() => {
    const t1 = setTimeout(() => setStatsVisible(true), 100);
    const t2 = setTimeout(() => setCardsVisible(true), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

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
          const platformLabel =
            platformKey.charAt(0).toUpperCase() + platformKey.slice(1);

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

  // Aggregate metrics
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

  // Platform distribution
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

  // Engagement trend
  const engagementTrend = (() => {
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: {
      [key: string]: { dateLabel: string; engagement: number; reach: number };
    } = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = {
        dateLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
        engagement: 0,
        reach: 0,
      };
    }

    posts.forEach((p) => {
      const published =
        p.publishedAt?.toDate?.() ??
        (p.publishedAt ? new Date(p.publishedAt as any) : null);
      if (!published) return;

      published.setHours(0, 0, 0, 0);
      const key = published.toISOString().slice(0, 10);
      if (!buckets[key]) return;

      const likes = p.metrics?.likes || 0;
      const comments = p.metrics?.comments || 0;
      const reach = p.metrics?.reach || 0;

      buckets[key].engagement += likes + comments;
      buckets[key].reach += reach;
    });

    return Object.values(buckets);
  })();

  const topPosts = [...posts]
    .sort(
      (a, b) =>
        (b.metrics?.likes || 0) +
        (b.metrics?.comments || 0) -
        ((a.metrics?.likes || 0) + (a.metrics?.comments || 0)),
    )
    .slice(0, 5);

  const filteredPosts = posts.filter((p) =>
    selectedPlatformFilter === 'all'
      ? true
      : p.platform?.toLowerCase() === selectedPlatformFilter,
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-slate-50 text-slate-900">
      {/* subtle radial glow */}


      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-sky-700 bg-sky-50 rounded-full px-3 py-1 border border-sky-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Creator analytics
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-black text-slate-900">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
                {userProfile?.displayName || 'Creator'}
              </span>
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-600">
              Monitor performance across all your connected platforms.
            </p>
          </div>
        </div>

        {/* Ad #1 */}
        <div className="mb-8">
          <div className="rounded-2xl border border-sky-100 bg-white/90 shadow-sm">
            <AdsenseAd
              slot="8490208307"
              className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden"
            />
          </div>
        </div>

        {/* Stats */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <StatCard
            icon="📱"
            label="Connected accounts"
            value={connectedAccounts.length}
            gradient="from-sky-400 via-sky-500 to-blue-500"
            delay={0}
          />
          <StatCard
            icon="📝"
            label="Total posts"
            value={posts.length}
            gradient="from-indigo-400 via-sky-500 to-fuchsia-500"
            delay={80}
          />
          <StatCard
            icon="👥"
            label="Total reach"
            value={aggregate.reach.toLocaleString()}
            gradient="from-emerald-400 via-teal-400 to-sky-400"
            delay={160}
          />
          <StatCard
            icon="💬"
            label="Total interactions"
            value={(aggregate.likes + aggregate.comments).toLocaleString()}
            gradient="from-orange-400 via-amber-400 to-rose-400"
            delay={240}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Platform distribution */}
          <div
            className={`bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Platform distribution
              </h3>
              <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center text-lg">
                📊
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Number of posts per platform across all time.
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
                    paddingAngle={3}
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
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      color: '#0F172A',
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
                  <span className="text-[11px] text-slate-700">
                    {platform.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({platform.value})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement trend */}
          <div
            className={`bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Engagement trend
              </h3>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-lg">
                📈
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mb-4">
              Daily engagement (likes + comments) for the last 7 days.
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
                      borderRadius: '0.75rem',
                      fontSize: '0.75rem',
                      color: '#0F172A',
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

        {/* Connected accounts */}
        <div
          className={`mb-10 transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Connected accounts
              </h2>
              <p className="text-[11px] text-slate-500">
                Manage and monitor your social integrations.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs sm:text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition"
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
                  className="group bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-sky-400 hover:shadow-md transition"
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
                        <p className="text-[11px] text-slate-500">
                          {account.accountName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 mb-4">
                    Connected on{' '}
                    <span className="text-slate-700">
                      {account.connectedAt.toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2 text-[11px]">
                    <button
                      onClick={() =>
                        router.push(
                          `/analytics?platform=${account.platform.toLowerCase()}`,
                        )
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-sky-400 hover:bg-sky-50 transition"
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
            <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl">
                📱
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No connected accounts yet
              </h3>
              <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                Connect your social media accounts to start tracking performance in
                one place.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition"
              >
                Connect your first account
              </button>
            </div>
          )}
        </div>

        {/* Posts performance */}
        <div
          className={`mb-10 transition-all duration-700 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Posts performance
              </h2>
              <p className="text-[11px] text-slate-500">
                See how your recent content is performing.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-white border border-slate-200 rounded-xl p-1 text-[11px]">
                {['all', 'instagram', 'twitter', 'youtube', 'tiktok'].map(
                  (platform) => (
                    <button
                      key={platform}
                      onClick={() =>
                        setSelectedPlatformFilter(platform as any)
                      }
                      className={`px-3 py-1.5 rounded-lg font-medium transition ${selectedPlatformFilter === platform
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      {platform === 'all'
                        ? 'All'
                        : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>

          {/* Top posts */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-700 mb-3">
              Top performing posts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPosts.slice(0, 3).map((post, index) => (
                <div
                  key={post.id}
                  className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm hover:border-sky-400 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        {platformIcons[post.platform?.toLowerCase() || 'default'] ||
                          '📝'}
                      </div>
                      <span className="text-[11px] font-medium text-slate-700 capitalize">
                        {post.platform}
                      </span>
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${index === 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : index === 1
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                    >
                      #{index + 1}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-700 mb-3 line-clamp-2">
                    {post.caption}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                      <div className="text-sm font-semibold text-sky-700">
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

          {/* Ad #2 */}
          <div className="mb-6">
            <div className="rounded-2xl border border-sky-100 bg-white/90 shadow-sm max-w-3xl mx-auto">
              <AdsenseAd
                slot="6951047306"
                className="w-full rounded-2xl overflow-hidden"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
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
                          <p className="text-[11px] text-slate-800 truncate">
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
                          <span className="text-[11px] text-slate-700 capitalize">
                            {post.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xs font-semibold text-sky-700">
                              {post.metrics?.likes || 0}
                            </div>
                            <div className="text-[10px] text-slate-400">Likes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs font-semibold text-indigo-700">
                              {post.metrics?.comments || 0}
                            </div>
                            <div className="text-[10px] text-slate-400">Comments</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-xs font-semibold text-rose-700">
                          {post.metrics?.reach || 0}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-[11px] text-slate-500">
                          {post.publishedAt?.toDate
                            ? post.publishedAt.toDate().toLocaleDateString()
                            : post.publishedAt
                              ? new Date(
                                post.publishedAt as any,
                              ).toLocaleDateString()
                              : '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPosts.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-6 text-center text-[11px] text-slate-400"
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

      {/* Connect account modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Connect account
                </h3>
                <p className="text-[11px] text-slate-500">
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
              <label className="block text-[11px] font-semibold text-slate-700 mb-2">
                Platform
              </label>
              <div className="relative">
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 focus:border-sky-500 focus:outline-none text-sm text-slate-800 appearance-none"
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
              <div className="w-full h-1 rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500" />
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      <PremiumModal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}

/* Stat Card */
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
      className="group bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-sky-400/70 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl">{icon}</div>
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-r ${gradient} opacity-30 group-hover:opacity-80 transition-opacity`}
        />
      </div>
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
