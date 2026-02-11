// app/dashboard/page.tsx
'use client';
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
import {
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  Search,
  Share2,
  TrendingUp,
  Twitter,
  Users,
  Video,
  Youtube,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import YouTubeProfileCard from '@/components/YouTube/YouTubeProfileCard';
import YouTubeStatsCards from '@/components/YouTube/YouTubeStatsCards';
import { useYouTubeData } from '@/lib/hooks/useYouTubeData';

import TwitterProfileCard from '@/components/Twitter/TwitterProfileCard';
import TwitterStatsCards from '@/components/Twitter/TwitterStatsCards';
import TwitterTweetsList from '@/components/Twitter/TwitterTweetsList';
import { useTwitterData } from '@/lib/hooks/useTwitterData';

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  connectedAt: Date;
}

// Platform data with icons and colors
const platformData: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
  instagram: {
    icon: <Instagram size={20} />,
    color: '#E4405F',
    gradient: 'from-[#E4405F] to-[#405DE6]',
  },
  youtube: {
    icon: <Youtube size={20} />,
    color: '#FF0000',
    gradient: 'from-[#FF0000] to-[#282828]',
  },
  twitter: {
    icon: <Twitter size={20} />,
    color: '#1DA1F2',
    gradient: 'from-[#1DA1F2] to-[#14171A]',
  },
  'twitter/x': {
    icon: <Twitter size={20} />,
    color: '#1DA1F2',
    gradient: 'from-[#1DA1F2] to-[#14171A]',
  },
  tiktok: {
    icon: <Video size={20} />,
    color: '#000000',
    gradient: 'from-[#000000] to-[#69C9D0]',
  },
  linkedin: {
    icon: <Linkedin size={20} />,
    color: '#0A66C2',
    gradient: 'from-[#0A66C2] to-[#378FE9]',
  },
  facebook: {
    icon: <Globe size={20} />,
    color: '#1877F2',
    gradient: 'from-[#1877F2] to-[#42B72A]',
  },
  pinterest: {
    icon: <Share2 size={20} />,
    color: '#E60023',
    gradient: 'from-[#E60023] to-[#BD081C]',
  },
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

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  const {
    channelInfo,
    videos,
    videoMetrics,
    performanceTrends,
    loading: youtubeLoading,
    error: youtubeError
  } = useYouTubeData(user?.uid || null);

const {
  userInfo: twitterUserInfo,
  recentTweets,
  metrics: twitterMetrics,
  trends: twitterTrends,
  loading: twitterLoading,
  error: twitterError,
} = useTwitterData(user?.uid || null);


  // Add this constant to check if YouTube is connected:
  const isYouTubeConnected = connectedAccounts.some(acc =>
    acc.platform.toLowerCase() === 'youtube'
  );

  const isTwitterConnected = connectedAccounts.some(acc => {
    const p = acc.platform.toLowerCase();
    return p === 'twitter' || p === 'twitter/x';
  });

  // Add this function for navigation:
  const navigateToYouTubeAnalytics = () => {
    router.push('/analytics/youtube');
  };

  const navigateToYouTubeVideos = () => {
    router.push('/content/youtube');
  };

  const navigateToTwitterAnalytics = () => {
    router.push('/analytics/twitter');
  };

  const navigateToTwitterTweets = () => {
    router.push('/content/twitter');
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchConnectedAccounts();
    fetchPosts();
  }, [user, authLoading, router, userProfile]);

  useEffect(() => {
    if (!user || authLoading) return;

    const lastSynced = window.localStorage.getItem('lastSyncAt');
    const lastSyncedAt = lastSynced ? new Date(lastSynced).getTime() : 0;
    const now = Date.now();
    const FIFTEEN_MIN = 15 * 60 * 1000;

    if (now - lastSyncedAt < FIFTEEN_MIN) {
      return;
    }

    const autoSync = async () => {
      try {
        const res = await fetch('/api/posts/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.uid }),
        });
        const data = await res.json();
        if (data.success) {
          window.localStorage.setItem('lastSyncAt', new Date().toISOString());
          await fetchPosts();
        }
      } catch (err) {
        console.error('Auto-sync error:', err);
      }
    };

    autoSync();
  }, [user, authLoading]);

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
      console.error('Error fetching accounts:', error);
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
      console.error('Error fetching posts:', error);
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
      console.error('Error syncing posts:', error);
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
        window.location.href = `/api/auth/youtube?uid=${encodeURIComponent(user.uid)}`;
        return;
      }

      if (selectedPlatform === 'twitter' || selectedPlatform === 'twitter/x') {
        window.location.href = `/api/auth/twitter/oauth1?uid=${encodeURIComponent(user.uid)}`;
        return;
      }

      if (selectedPlatform === 'instagram') {
        window.location.href = `/api/auth/instagram?uid=${encodeURIComponent(user.uid)}`;
        return;
      }

      if (selectedPlatform === 'linkedin') {
        window.location.href = `/api/auth/linkedin?uid=${encodeURIComponent(user.uid)}`;
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
      console.error('Error disconnecting account:', error);
      alert(`Error disconnecting account: ${error.message}`);
    }
  };

  // Aggregate metrics
  const aggregate = (() => {
    let reach = 0;
    let views = 0;
    let likes = 0;
    let comments = 0;
    let shares = 0;

    posts.forEach((p) => {
      reach += p.metrics?.reach || 0;
      views += p.metrics?.views || 0;
      likes += p.metrics?.likes || 0;
      comments += p.metrics?.comments || 0;
      shares += p.metrics?.shares || 0;
    });

    return { reach, views, likes, comments, shares };
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
    fill: platformData[platform]?.color || '#22C55E',
  }));

  // Engagement trend data
  const engagementTrend = (() => {
    const days = 7;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: {
      [key: string]: { date: string; engagement: number; reach: number; posts: number };
    } = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = {
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        engagement: 0,
        reach: 0,
        posts: 0,
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
      buckets[key].posts += 1;
    });

    return Object.values(buckets);
  })();

  // Performance by platform
  const platformPerformance = Object.entries(
    posts.reduce((acc: Record<string, { engagement: number; posts: number }>, post) => {
      const platform = post.platform?.toLowerCase() || 'other';
      if (!acc[platform]) {
        acc[platform] = { engagement: 0, posts: 0 };
      }
      acc[platform].engagement += (post.metrics?.likes || 0) + (post.metrics?.comments || 0);
      acc[platform].posts += 1;
      return acc;
    }, {}),
  ).map(([platform, data]) => ({
    platform: platform.charAt(0).toUpperCase() + platform.slice(1),
    engagement: data.engagement,
    posts: data.posts,
    avgEngagement: Math.round(data.engagement / data.posts),
  }));

  const topPosts = [...posts]
    .sort(
      (a, b) =>
        (b.metrics?.likes || 0) +
        (b.metrics?.comments || 0) -
        ((a.metrics?.likes || 0) + (a.metrics?.comments || 0)),
    )
    .slice(0, 5);

  const filteredPosts = posts
    .filter((p) =>
      selectedPlatformFilter === 'all'
        ? true
        : p.platform?.toLowerCase() === selectedPlatformFilter,
    )
    .filter((p) =>
      searchQuery
        ? p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.platform?.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-300 text-lg mt-4 font-medium">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                Analytics Dashboard
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
              Welcome back,{' '}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                {userProfile?.displayName || 'Creator'}
              </span>
            </h1>
            <p className="mt-2 text-gray-400 text-sm md:text-base">
              Monitor, analyze, and optimize your social media performance
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search posts, metrics, or platforms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            <button
              onClick={handleSyncPosts}
              disabled={syncingPosts}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
            >
              <RefreshCw size={18} className={syncingPosts ? 'animate-spin' : ''} />
              {syncingPosts ? 'Syncing...' : 'Sync Data'}
            </button>
          </div>
        </div>

        {/* Ad #1 */}
        {/* <div className="mb-8">
          <div className="rounded-2xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900/50 p-1 shadow-xl">
            <AdsenseAd
              slot="8490208307"
              className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden"
            />
          </div>
        </div> */}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            label="Total Reach"
            value={aggregate.reach.toLocaleString()}
            change="+12.5%"
            color="from-blue-500 to-cyan-400"
            delay={0}
          />
          <StatCard
            icon={<Heart className="w-6 h-6" />}
            label="Engagement"
            value={(aggregate.likes + aggregate.comments).toLocaleString()}
            change="+8.3%"
            color="from-purple-500 to-pink-400"
            delay={100}
          />
          <StatCard
            icon={<MessageCircle className="w-6 h-6" />}
            label="Total Posts"
            value={posts.length.toString()}
            change="+4.2%"
            color="from-emerald-500 to-teal-400"
            delay={200}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Avg. Engagement Rate"
            value={`${posts.length > 0 ? Math.round((aggregate.likes + aggregate.comments) / posts.length) : 0}%`}
            change="+2.1%"
            color="from-amber-500 to-orange-400"
            delay={300}
          />
        </div>

        {isYouTubeConnected && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">YouTube Analytics</h2>
                <p className="text-gray-400">Track your YouTube channel performance</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={navigateToYouTubeAnalytics}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300 flex items-center gap-2"
                >
                  <BarChart3 size={18} />
                  Detailed Analytics
                </button>
                <button
                  onClick={navigateToYouTubeVideos}
                  className="px-6 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-semibold hover:bg-red-500/20 transition-all duration-300 flex items-center gap-2"
                >
                  <Video size={18} />
                  View Videos
                </button>
              </div>
            </div>

            {/* YouTube Profile Card */}
            <div className="mb-6">
              <YouTubeProfileCard
                channelInfo={channelInfo}
                loading={youtubeLoading}
                error={youtubeError}
              />
            </div>

            {/* YouTube Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <YouTubeStatsCards
                channelInfo={channelInfo}
                loading={youtubeLoading}
              />

              {/* Additional YouTube Metrics */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:border-gray-600 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">
                      {videoMetrics.engagementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">Engagement Rate</p>
                <p className="text-3xl font-bold text-white">{videoMetrics.engagementRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* YouTube Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Views Trend */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Views Trend</h3>
                    <p className="text-gray-400 text-sm">Last 30 days</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-700/20">
                    <Eye className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceTrends.viewsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.75rem',
                          color: '#F9FAFB',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#EF4444"
                        fill="#EF4444"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Video Distribution */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Video Distribution</h3>
                    <p className="text-gray-400 text-sm">Last 6 months</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                    <Video className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceTrends.videosByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.75rem',
                          color: '#F9FAFB',
                        }}
                      />
                      <Bar
                        dataKey="count"
                        radius={[8, 8, 0, 0]}
                        fill="url(#videoGradient)"
                      />
                      <defs>
                        <linearGradient id="videoGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="#DC2626" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* YouTube Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                    <Eye className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-sm text-gray-400">Total</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">Video Views</p>
                <p className="text-3xl font-bold text-white">
                  {videoMetrics.totalViews >= 1000000
                    ? (videoMetrics.totalViews / 1000000).toFixed(1) + 'M'
                    : videoMetrics.totalViews >= 1000
                      ? (videoMetrics.totalViews / 1000).toFixed(1) + 'K'
                      : videoMetrics.totalViews.toLocaleString()}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Videos</span>
                    <span className="text-white font-semibold">{videos.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                    <Heart className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-sm text-gray-400">Engagement</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">Total Likes</p>
                <p className="text-3xl font-bold text-white">{videoMetrics.totalLikes.toLocaleString()}</p>
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Comments</span>
                    <span className="text-white font-semibold">{videoMetrics.totalComments.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-sm text-gray-400">Avg</span>
                </div>
                <p className="text-gray-400 text-sm mb-2">Watch Time</p>
                <p className="text-3xl font-bold text-white">
                  {videoMetrics.avgViewDuration >= 60
                    ? Math.floor(videoMetrics.avgViewDuration / 60) + 'm ' + (videoMetrics.avgViewDuration % 60) + 's'
                    : videoMetrics.avgViewDuration + 's'}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Total Watch Time</span>
                    <span className="text-white font-semibold">
                      {Math.floor(videoMetrics.totalWatchTime / 3600)}h
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {isTwitterConnected && (
          <div className="mb-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Twitter Analytics</h2>
                <p className="text-gray-400">
                  Track your Twitter/X profile and tweet performance
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={navigateToTwitterAnalytics}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold hover:shadow-lg hover:shadow-sky-500/25 transition-all duration-300 flex items-center gap-2"
                >
                  <BarChart3 size={18} />
                  Detailed Analytics
                </button>
                <button
                  onClick={navigateToTwitterTweets}
                  className="px-6 py-3 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 font-semibold hover:bg-sky-500/20 transition-all duration-300 flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  View Tweets
                </button>
              </div>
            </div>

            {/* Twitter Profile Card */}
            <div className="mb-6">
              <TwitterProfileCard
                userInfo={twitterUserInfo}
                loading={twitterLoading}
                error={twitterError}
                onAnalyticsClick={navigateToTwitterAnalytics}
                onDisconnectClick={() => {
                  // optional: open your disconnect flow / modal
                }}
              />
            </div>

            {/* Twitter Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <TwitterStatsCards
                userInfo={twitterUserInfo}
                metrics={twitterMetrics}
                loading={twitterLoading}
              />

              {/* Extra Twitter metric card (Engagement Rate highlight) */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:border-gray-600 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/10 to-cyan-500/10">
                    <TrendingUp className="w-6 h-6 text-sky-400" />
                  </div>
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400">
                      {twitterMetrics.avgEngagementRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-2">Avg Engagement Rate</p>
                <p className="text-3xl font-bold text-white">
                  {twitterMetrics.avgEngagementRate.toFixed(1)}%
                </p>
              </div>
            </div>
            {/* Twitter Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
              {/* Tweets Trend */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Tweets Trend</h3>
                    <p className="text-gray-400 text-sm">Last {twitterTrends.tweetsByDay.length} days</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-sky-500/20 to-sky-700/20">
                    <MessageCircle className="w-6 h-6 text-sky-400" />
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={twitterTrends.tweetsByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.75rem',
                          color: '#F9FAFB',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="Tweets"
                        stroke="#0EA5E9"
                        fill="#0EA5E9"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement Trend */}
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Engagement Trend</h3>
                    <p className="text-gray-400 text-sm">Daily engagements & rate</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={twitterTrends.engagementByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis yAxisId="left" stroke="#9CA3AF" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#9CA3AF"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '0.75rem',
                          color: '#F9FAFB',
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="engagement"
                        name="Engagements"
                        stroke="#22C55E"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="rate"
                        name="Engagement Rate (%)"
                        stroke="#FACC15"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Twitter Tweets List */}
            <TwitterTweetsList
              tweets={recentTweets}
              loading={twitterLoading}
              title="Recent Tweets"
              maxItems={5}
              showViewAll={true}
              onViewAll={navigateToTwitterTweets}
            />
          </div>
        )}


        {/* Main Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Engagement Trend Chart */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Engagement Trend</h3>
                <p className="text-gray-400 text-sm">Performance over the last 7 days</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.75rem',
                      color: '#F9FAFB',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="engagement"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#8B5CF6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Platform Distribution</h3>
                <p className="text-gray-400 text-sm">Posts across platforms</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
                <PieChart className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {platformDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#1F2937" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.75rem',
                      color: '#F9FAFB',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Platform Performance Bar Chart */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Platform Performance</h3>
              <p className="text-gray-400 text-sm">Engagement by platform</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Sort by engagement</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="platform" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.75rem',
                    color: '#F9FAFB',
                  }}
                />
                <Bar
                  dataKey="engagement"
                  radius={[8, 8, 0, 0]}
                  fill="url(#platformGradient)"
                />
                <defs>
                  <linearGradient id="platformGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Connected Accounts</h2>
              <p className="text-gray-400">Manage your social media integrations</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Connect Account
            </button>
          </div>

          {connectedAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {connectedAccounts.map((account, index) => {
                const platformInfo = platformData[account.platform.toLowerCase()] || {
                  icon: <Globe className="w-6 h-6" />,
                  color: '#6B7280',
                  gradient: 'from-gray-500 to-gray-600',
                };

                return (
                  <div
                    key={account.id}
                    className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl hover:border-blue-500/50 hover:shadow-blue-500/10 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${platformInfo.gradient}`}>
                          {platformInfo.icon}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{account.platform}</h3>
                          <p className="text-sm text-gray-400">{account.accountName}</p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-white">
                        <MoreVertical size={20} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle size={16} />
                        <span className="text-sm font-medium">Connected</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {account.connectedAt.toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          router.push(`/analytics?platform=${account.platform.toLowerCase()}`)
                        }
                        className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <BarChart3 size={16} />
                        Analytics
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Disconnect ${account.platform}?`)) {
                            handleDisconnectAccount(account.id);
                          }
                        }}
                        className="px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center">
                <Globe className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No accounts connected</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Connect your social media accounts to unlock powerful analytics and insights
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Connect Your First Account
              </button>
            </div>
          )}
        </div>

        {/* Posts Performance */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Posts Performance</h2>
              <p className="text-gray-400">Track and analyze your content performance</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-gray-800 border border-gray-700 rounded-xl p-1">
                {['all', 'instagram', 'twitter', 'youtube', 'linkedin'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatformFilter(platform as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedPlatformFilter === platform
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                  >
                    {platform === 'all' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Top Posts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topPosts.slice(0, 3).map((post, index) => (
              <div
                key={post.id}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${index === 0 ? 'bg-amber-500/20' : index === 1 ? 'bg-gray-700' : 'bg-emerald-500/20'}`}>
                      <span className={`text-sm font-bold ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-gray-300' : 'text-emerald-400'}`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {platformData[post.platform?.toLowerCase()]?.icon || <Globe size={18} />}
                      <span className="text-sm font-medium text-gray-300 capitalize">
                        {post.platform}
                      </span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white">
                    <ExternalLink size={18} />
                  </button>
                </div>

                <p className="text-gray-300 text-sm mb-6 line-clamp-3">
                  {post.caption}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-gray-800/50">
                    <div className="text-lg font-bold text-amber-400">{post.metrics?.likes || 0}</div>
                    <div className="text-xs text-gray-400">Likes</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-800/50">
                    <div className="text-lg font-bold text-blue-400">{post.metrics?.comments || 0}</div>
                    <div className="text-xs text-gray-400">Comments</div>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-800/50">
                    <div className="text-lg font-bold text-emerald-400">{post.metrics?.reach || 0}</div>
                    <div className="text-xs text-gray-400">Reach</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ad #2 */}
          {/* <div className="mb-6">
            <div className="rounded-2xl border border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900/50 p-1 shadow-xl">
              <AdsenseAd
                slot="6951047306"
                className="w-full rounded-xl overflow-hidden"
              />
            </div>
          </div> */}

          {/* Posts Table */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Content
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Platform
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Metrics
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Published
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredPosts.slice(0, 8).map((post) => (
                    <tr key={post.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-gray-300 line-clamp-2">
                            {post.caption}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {post.caption?.length || 0} characters
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platformData[post.platform?.toLowerCase()] ? 'bg-gradient-to-r ' + platformData[post.platform?.toLowerCase()].gradient : 'bg-gray-700'}`}>
                            {platformData[post.platform?.toLowerCase()]?.icon || <Globe size={16} />}
                          </div>
                          <span className="text-sm font-medium text-gray-300 capitalize">
                            {post.platform}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-6">
                          <div>
                            <div className="text-sm font-bold text-amber-400">
                              {post.metrics?.likes || 0}
                            </div>
                            <div className="text-xs text-gray-400">Likes</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-blue-400">
                              {post.metrics?.comments || 0}
                            </div>
                            <div className="text-xs text-gray-400">Comments</div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-emerald-400">
                              {post.metrics?.reach || 0}
                            </div>
                            <div className="text-xs text-gray-400">Reach</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-300">
                            {post.publishedAt?.toDate
                              ? post.publishedAt.toDate().toLocaleDateString()
                              : post.publishedAt
                                ? new Date(post.publishedAt as any).toLocaleDateString()
                                : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredPosts.length === 0 && (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-300 mb-2">No posts found</h4>
                <p className="text-gray-400 text-sm">
                  Try adjusting your filters or sync your accounts
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Connect Account</h3>
                <p className="text-gray-400 text-sm">
                  Choose a platform to connect via OAuth
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Select Platform
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  {platformData[selectedPlatform]?.icon || <Globe className="w-5 h-5 text-gray-400" />}
                </div>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-800/50 border border-gray-700 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  {Object.entries(platformData).map(([key, value]) => (
                    <option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  ▼
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="w-full h-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectAccount}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
              >
                Connect Now
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

/* Stat Card Component */
function StatCard({
  icon,
  label,
  value,
  change,
  color,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;





  color: string;
  delay: number;
}) {
  return (
    <div
      className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${color} bg-opacity-20`}>
          <div className="text-white">{icon}</div>
        </div>
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20">
          <TrendingUp size={14} className="text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">{change}</span>
        </div>
      </div>
      <p className="text-gray-400 text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}