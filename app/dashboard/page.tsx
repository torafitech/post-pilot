// app/dashboard/page.tsx
'use client';

import { PremiumModal } from '@/components/PremiumModal';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { DashboardPost, SocialPost } from '@/types/post';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Globe,
  Heart,
  Instagram,
  Linkedin,
  Maximize2,
  MessageCircle,
  Minimize2,
  PieChart,
  RefreshCw,
  ThumbsUp,
  Twitter,
  Users,
  Video,
  Youtube,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';


import PlatformAccountCard from '@/components/Dashboard/PlatformAccountCard';

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  connectedAt: Date;
}

interface PlatformMetrics {
  followers: number;
  views: number;
  engagement: number;
  engagementRate: number;
  posts: number;
  change: {
    followers: number;
    views: number;
    engagement: number;
  };
}

interface AggregatedMetrics {
  totalFollowers: number;
  totalViews: number;
  totalEngagement: number;
  totalPosts: number;
  avgEngagementRate: number;
  platformBreakdown: {
    [key: string]: {
      followers: number;
      views: number;
      engagement: number;
      posts: number;
    };
  };
}

// Platform data with icons and colors
const platformData: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    gradient: string;
    metricLabels: {
      followers: string;
      views: string;
      engagement: string;
    };
  }
> = {
  youtube: {
    icon: <Youtube size={20} />,
    color: '#FF0000',
    bgColor: 'bg-red-500/10',
    gradient: 'from-red-500 to-red-600',
    metricLabels: {
      followers: 'Subscribers',
      views: 'Views',
      engagement: 'Eng. Rate',
    },
  },
  twitter: {
    icon: <Twitter size={20} />,
    color: '#1DA1F2',
    bgColor: 'bg-sky-500/10',
    gradient: 'from-sky-500 to-sky-600',
    metricLabels: {
      followers: 'Followers',
      views: 'Impressions',
      engagement: 'Eng. Rate',
    },
  },
  'twitter/x': {
    icon: <Twitter size={20} />,
    color: '#1DA1F2',
    bgColor: 'bg-sky-500/10',
    gradient: 'from-sky-500 to-sky-600',
    metricLabels: {
      followers: 'Followers',
      views: 'Impressions',
      engagement: 'Eng. Rate',
    },
  },
  instagram: {
    icon: <Instagram size={20} />,
    color: '#E4405F',
    bgColor: 'bg-pink-500/10',
    gradient: 'from-pink-500 to-purple-600',
    metricLabels: {
      followers: 'Followers',
      views: 'Reach',
      engagement: 'Eng. Rate',
    },
  },
  linkedin: {
    icon: <Linkedin size={20} />,
    color: '#0A66C2',
    bgColor: 'bg-blue-500/10',
    gradient: 'from-blue-500 to-blue-600',
    metricLabels: {
      followers: 'Followers',
      views: 'Impressions',
      engagement: 'Eng. Rate',
    },
  },
  tiktok: {
    icon: <Video size={20} />,
    color: '#000000',
    bgColor: 'bg-gray-500/10',
    gradient: 'from-gray-700 to-gray-900',
    metricLabels: {
      followers: 'Followers',
      views: 'Views',
      engagement: 'Eng. Rate',
    },
  },
  facebook: {
    icon: <Globe size={20} />,
    color: '#1877F2',
    bgColor: 'bg-blue-500/10',
    gradient: 'from-blue-500 to-blue-600',
    metricLabels: {
      followers: 'Followers',
      views: 'Reach',
      engagement: 'Eng. Rate',
    },
  },
};

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [dateRange, setDateRange] = useState('7d');
  const [syncingPosts, setSyncingPosts] = useState(false);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    recentActivity: true,
    platforms: true,
    scheduled: true,
  });



  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchConnectedAccounts();
    fetchPosts();
  }, [user, authLoading, router]);

  const now = new Date()

  const scheduledPosts = useMemo(
    () =>
      posts
        .filter(
          (p) =>
            p.status === 'scheduled' &&
            p.scheduledTime &&
            typeof p.scheduledTime.toDate === 'function'
        )
        .sort(
          (a, b) =>
            a.scheduledTime!.toDate().getTime() -
            b.scheduledTime!.toDate().getTime()
        ),
    [posts]
  );

  const recentPosts = useMemo(
    () =>
      posts
        .filter(
          (p) =>
            p.publishedAt &&
            typeof p.publishedAt.toDate === 'function'
        )
        .sort(
          (a, b) =>
            b.publishedAt!.toDate().getTime() -
            a.publishedAt!.toDate().getTime()
        ),
    [posts]
  );
  const recentByPlatform = useMemo(() => {
    const grouped: Record<string, DashboardPost[]> = {};

    recentPosts.forEach((post) => {
      const key = post.platform?.toLowerCase() || 'other';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(post);
    });

    // sort each platform’s posts by publishedAt desc
    Object.values(grouped).forEach((list) =>
      list.sort(
        (a, b) =>
          b.publishedAt!.toDate().getTime() -
          a.publishedAt!.toDate().getTime()
      )
    );

    return grouped;
  }, [recentPosts]);




  const getTimeLeft = (scheduledAt: Date) => {
    const diffMs = scheduledAt.getTime() - Date.now()
    if (diffMs <= 0) return "Due now"

    const diffMinutes = Math.round(diffMs / (1000 * 60))
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60

    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m left`
    if (hours > 0) return `${hours}h left`
    return `${minutes}m left`
  }

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
            platform: platformKey.toLowerCase(),
            accountName:
              account.accountName || account.accountLabel || platformLabel,
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
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);

      const list: SocialPost[] = [];
      snap.forEach((docSnap) =>
        list.push({ id: docSnap.id, ...(docSnap.data() as any) }),
      );
      setPosts(list);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleSyncPosts = async () => {
    if (!user) return;
    setSyncingPosts(true);
    try {
      await fetch('/api/posts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      await fetchPosts();
    } catch (error) {
      console.error('Error syncing posts:', error);
    } finally {
      setSyncingPosts(false);
    }
  };

  const handleConnectAccount = async (platform: string) => {
    if (!user) return;

    try {
      setShowConnectModal(false);

      const oauthRoutes: Record<string, string> = {
        youtube: `/api/auth/youtube?uid=${encodeURIComponent(user.uid)}`,
        twitter: `/api/auth/twitter/oauth1?uid=${encodeURIComponent(user.uid)}`,
        'twitter/x': `/api/auth/twitter/oauth1?uid=${encodeURIComponent(
          user.uid,
        )}`,
        instagram: `/api/auth/instagram?uid=${encodeURIComponent(user.uid)}`,
        linkedin: `/api/auth/linkedin?uid=${encodeURIComponent(user.uid)}`,
        tiktok: `/api/auth/tiktok?uid=${encodeURIComponent(user.uid)}`,
        facebook: `/api/auth/facebook?uid=${encodeURIComponent(user.uid)}`,
      };

      const route = oauthRoutes[platform];
      if (route) {
        window.location.href = route;
      }
    } catch (error) {
      console.error('Error initiating OAuth:', error);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        const list = data.connectedAccounts || [];
        const filtered = list.filter((item: any) => item.id !== accountId);

        await updateDoc(userDocRef, {
          connectedAccounts: filtered,
        });
      }

      const updatedAccounts = connectedAccounts.filter(
        (acc) => acc.id !== accountId,
      );
      setConnectedAccounts(updatedAccounts);

      const platform = connectedAccounts.find(
        (acc) => acc.id === accountId,
      )?.platform;
      if (platform) {
        const newExpanded = new Set(expandedPlatforms);
        newExpanded.delete(platform);
        setExpandedPlatforms(newExpanded);
      }
    } catch (error: any) {
      console.error('Error disconnecting account:', error);
    }
  };

  const togglePlatformExpand = (platform: string) => {
    const newExpanded = new Set(expandedPlatforms);
    if (newExpanded.has(platform)) {
      newExpanded.delete(platform);
    } else {
      newExpanded.add(platform);
    }
    setExpandedPlatforms(newExpanded);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const expandAllPlatforms = () => {
    const allPlatforms = connectedAccounts.map((acc) => acc.platform);
    setExpandedPlatforms(new Set(allPlatforms));
  };

  const collapseAllPlatforms = () => {
    setExpandedPlatforms(new Set());
  };




  // Aggregate metrics across all platforms
  const getAggregatedMetrics = (): AggregatedMetrics => {
    let totalFollowers = 0;
    let totalViews = 0;
    let totalEngagement = 0;
    let totalPosts = 0;
    const platformBreakdown: AggregatedMetrics['platformBreakdown'] = {};



    return {
      totalFollowers,
      totalViews,
      totalEngagement,
      totalPosts,
      avgEngagementRate:
        totalViews > 0
          ? Math.round((totalEngagement / totalViews) * 100 * 10) / 10
          : 0,
      platformBreakdown,
    };
  };



  const aggregatedMetrics = getAggregatedMetrics();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalAudience = aggregatedMetrics.totalFollowers;
  const totalContent = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Background pattern */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[url(\'data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23grid)'/%3E%3C/svg%3E\')] opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header (from other design) */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-300/80 uppercase tracking-[0.2em] mb-2">
              Creator Command Center
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
                {userProfile?.displayName ||
                  user.email?.split('@')[0] ||
                  'Creator'}
              </span>
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Monitor your channels, understand what works, and plan your next
              post.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
              <Calendar size={16} className="text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent text-sm text-white focus:outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div> */}

            <button
              onClick={handleSyncPosts}
              disabled={syncingPosts}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs md:text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={syncingPosts ? 'animate-spin' : ''}
              />
              {syncingPosts ? 'Syncing…' : 'Sync data'}
            </button>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-xs md:text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800"
            >
              <Zap size={16} />
              Connect
            </button>
          </div>
        </header>

        {/* Top summary (3 cards) */}
        <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Users size={14} className="text-blue-400" />
                Audience
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {totalAudience.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Across all connected channels
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Activity className="text-blue-400" size={20} />
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Video size={14} className="text-emerald-400" />
                Content
              </p>
            </div>
            <div>
              <p className="mt-2 text-2xl font-semibold text-white">
                {totalContent}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Videos, tweets and posts tracked
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <PieChart className="text-emerald-400" size={20} />
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Heart size={14} className="text-pink-400" />
                Engagement
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {aggregatedMetrics.avgEngagementRate}%
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Average engagement rate
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
              <ThumbsUp className="text-pink-400" size={20} />
            </div>
          </div>
        </section>

        {connectedAccounts.length > 0 ? (
          <>
            {/* SECTION 1: OVERVIEW */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between cursor-pointer p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-2xl hover:bg-white/10 transition-colors"
                onClick={() => toggleSection('overview')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Performance Overview
                    </h2>
                    <p className="text-xs text-gray-400">
                      High-level metrics across all platforms
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-white/10">
                  {expandedSections.overview ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {expandedSections.overview && (
                <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-t-0 border-white/10 rounded-b-2xl">
                  {/* Global Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {aggregatedMetrics.totalFollowers.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Total followers
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Eye className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {aggregatedMetrics.totalViews.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Total views / impressions
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <Heart className="w-5 h-5 text-emerald-400" />
                        </div>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {aggregatedMetrics.totalEngagement.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Total engagement
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <BarChart3 className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-xs text-gray-400">Avg</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {aggregatedMetrics.avgEngagementRate}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Avg engagement rate
                      </p>
                    </div>
                  </div>

                  {/* Distribution + Quick stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">
                        Platform distribution
                      </h3>
                      <div className="space-y-3">
                        {connectedAccounts.map((acc) => {
                          const metrics =
                            aggregatedMetrics.platformBreakdown[
                            acc.platform
                            ];
                          const percentage =
                            aggregatedMetrics.totalViews > 0
                              ? Math.round(
                                ((metrics?.views || 0) /
                                  aggregatedMetrics.totalViews) *
                                100,
                              )
                              : 0;

                          return (
                            <div
                              key={acc.id}
                              className="flex items-center gap-3"
                            >
                              <div
                                className={`w-8 h-8 rounded-lg ${platformData[acc.platform]?.bgColor ||
                                  'bg-gray-500/10'
                                  } flex items-center justify-center`}
                              >
                                {platformData[acc.platform]?.icon || (
                                  <Globe size={16} />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-white capitalize">
                                    {acc.platform}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {percentage}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor:
                                        platformData[acc.platform]?.color ||
                                        '#6B7280',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">
                        Quick stats
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Connected platforms
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {connectedAccounts.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Total posts
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {aggregatedMetrics.totalPosts}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Avg posts / day
                          </p>
                          <p className="text-2xl font-bold text-white">
                            {Math.round(
                              aggregatedMetrics.totalPosts / 30,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">
                            Best platform
                          </p>
                          <p className="text-2xl font-bold text-white capitalize">
                            {connectedAccounts[0]?.platform || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* SECTION: SCHEDULED POSTS */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between cursor-pointer p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-2xl hover:bg-white/10 transition-colors"
                onClick={() => toggleSection("scheduled")}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Scheduled posts</h2>
                    <p className="text-xs text-gray-400">
                      Upcoming posts across all platforms
                    </p>
                  </div>
                </div>

                <button className="p-2 rounded-lg hover:bg-white/10">
                  {expandedSections.scheduled ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {expandedSections.scheduled && (
                <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-t-0 border-white/10 rounded-b-2xl">
                  {scheduledPosts.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400">
                      No scheduled posts. Head to the content planner to schedule your next post!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduledPosts.map((post) => {
                        const scheduledDate = post.scheduledTime!.toDate();
                        const now = new Date();
                        const diffMs = scheduledDate.getTime() - now.getTime();
                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

                        // Format time left
                        let timeLeft = '';
                        if (diffDays > 0) {
                          timeLeft = `${diffDays}d ${diffHours}h left`;
                        } else if (diffHours > 0) {
                          timeLeft = `${diffHours}h ${diffMinutes}m left`;
                        } else if (diffMinutes > 0) {
                          timeLeft = `${diffMinutes}m left`;
                        } else {
                          timeLeft = 'Due now';
                        }

                        // Determine urgency color
                        const urgencyColor = diffDays === 0 && diffHours < 2 ? 'text-red-400' : 'text-amber-400';

                        // Get platform info - handle both single platform and multiple platforms
                        const platforms = post.platforms && post.platforms.length > 0
                          ? post.platforms
                          : [post.platform];

                        return (
                          <div
                            key={post.id}
                            className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              {/* Platform icons and post content */}
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {/* Platform icons */}
                                <div className="flex -space-x-2">
                                  {platforms.slice(0, 3).map((platform, idx) => {
                                    const platformInfo = platformData[platform.toLowerCase()] || {
                                      icon: <Globe size={14} />,
                                      bgColor: 'bg-gray-500/10'
                                    };
                                    return (
                                      <div
                                        key={idx}
                                        className={`w-8 h-8 rounded-lg ${platformInfo.bgColor} flex items-center justify-center ring-2 ring-gray-900`}
                                      >
                                        {platformInfo.icon}
                                      </div>
                                    );
                                  })}
                                  {platforms.length > 3 && (
                                    <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center ring-2 ring-gray-900">
                                      <span className="text-xs text-gray-400">+{platforms.length - 3}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Post details */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white truncate">
                                    {post.caption || 'Untitled post'}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-400">
                                      {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {post.status === 'draft' && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400">
                                        Draft
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Time left indicator */}
                              <div className="flex flex-col items-end">
                                <div className={`flex items-center gap-1 ${urgencyColor}`}>
                                  <Clock size={14} />
                                  <span className="text-xs font-medium">{timeLeft}</span>
                                </div>

                                {/* Progress bar for time left */}
                                <div className="w-24 h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${diffDays === 0 && diffHours < 2 ? 'bg-red-500' : 'bg-amber-500'
                                      }`}
                                    style={{
                                      width: `${Math.min(100, Math.max(0,
                                        diffDays > 0 ? 100 : (diffHours / 24) * 100
                                      ))}%`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Media preview - using mediaUrl instead of media array */}
                            {post.mediaUrl && (
                              <div className="mt-3">
                                <div className="w-12 h-12 rounded bg-gray-800 overflow-hidden">
                                  <img
                                    src={post.mediaUrl}
                                    alt="Post media"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 2: RECENT ACTIVITY */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between cursor-pointer p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-2xl hover:bg-white/10 transition-colors"
                onClick={() => toggleSection('recentActivity')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Recent posts</h2>
                    <p className="text-xs text-gray-400">
                      Your latest content
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-white/10">
                  {expandedSections.recentActivity ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {expandedSections.recentActivity && (
                <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-t-0 border-white/10 rounded-b-2xl">
                  {recentPosts.length > 0 ? (
                    <div className="space-y-3">
                      {recentPosts.slice(0, 10).map((post) => {
                        const publishedDate = post.publishedAt?.toDate();
                        const platformInfo = platformData[post.platform?.toLowerCase()] || {
                          icon: <Globe size={14} />,
                          bgColor: 'bg-gray-500/10'
                        };

                        return (
                          <div
                            key={post.id}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            {/* Platform icon */}
                            <div className={`p-2 rounded-lg ${platformInfo.bgColor} flex-shrink-0`}>
                              {platformInfo.icon}
                            </div>

                            {/* Post content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white line-clamp-1">
                                {post.caption || 'Untitled post'}
                              </p>
                              {publishedDate && (
                                <p className="text-xs text-gray-400">
                                  {publishedDate.toLocaleDateString()}
                                </p>
                              )}
                            </div>

                            {/* Media indicator - using mediaUrl instead of media array */}
                            {post.mediaUrl && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Eye size={12} />
                                <span>1</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No posts yet
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: CONNECTED PLATFORMS */}
            <div className="mb-6">
              <div
                className="flex items-center justify-between cursor-pointer p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-t-2xl hover:bg-white/10 transition-colors"
                onClick={() => toggleSection('platforms')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    <Globe className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Connected platforms
                    </h2>
                    <p className="text-xs text-gray-400">
                      {connectedAccounts.length}{' '}
                      {connectedAccounts.length === 1
                        ? 'platform'
                        : 'platforms'}{' '}
                      connected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expandedSections.platforms &&
                    connectedAccounts.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            expandAllPlatforms();
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                          title="Expand all"
                        >
                          <Maximize2 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            collapseAllPlatforms();
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                          title="Collapse all"
                        >
                          <Minimize2 size={16} />
                        </button>
                      </>
                    )}
                  <button className="p-2 rounded-lg hover:bg-white/10">
                    {expandedSections.platforms ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>
              </div>

              {expandedSections.platforms && (
                <div className="bg-white/[0.02] backdrop-blur-sm border border-t-0 border-white/10 rounded-b-2xl p-6">
                  {connectedAccounts.length > 0 ? (
                    <div className="space-y-4">
                      {connectedAccounts.map((account) => {
                        const platformInfo = platformData[account.platform] || {
                          icon: <Globe size={20} />,
                          color: '#6B7280',
                          bgColor: 'bg-gray-500/10',
                          gradient: 'from-gray-500 to-gray-600',
                          metricLabels: {
                            followers: 'Followers',
                            views: 'Views',
                            engagement: 'Engagement',
                          },
                        };

                        const isExpanded = expandedPlatforms.has(account.platform);

                        return (
                          <PlatformAccountCard
                            key={account.id}
                            userId={user!.uid}
                            account={account}
                            platformInfo={platformInfo}
                            posts={posts}
                            isExpanded={isExpanded}
                            onToggleExpand={() => togglePlatformExpand(account.platform)}
                            onDisconnect={() => handleDisconnectAccount(account.id)}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    /* your existing empty state JSX */
                    <div className="text-center py-8">
                      {/* ... */}
                    </div>
                  )}
                </div>
              )}

            </div>


          </>
        ) : (
          // Empty state
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Globe className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Welcome to StarlingPost!
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your first social media account to start tracking your
              performance and publishing content.
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
            >
              Connect your first account
            </button>
          </div>
        )}
      </div>
      {/* Connect account modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Connect account</h3>
              <button
                onClick={() => setShowConnectModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Choose a platform to connect and start tracking your analytics.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {Object.entries(platformData).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => handleConnectAccount(key)}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                >
                  <div className={value.bgColor}>{value.icon}</div>
                  <span className="text-sm font-medium text-white capitalize">
                    {key}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowConnectModal(false)}
              className="w-full px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <PremiumModal open={false} onClose={() => { }} />
    </div>
  );
}
