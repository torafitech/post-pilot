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
  Calendar,
  ChevronDown,
  ChevronRight,
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
  Repeat2,
  ThumbsUp,
  TrendingUp,
  Twitter,
  Users,
  Video,
  Youtube,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import YouTubeProfileCard from '@/components/YouTube/YouTubeProfileCard';
import { useYouTubeData } from '@/lib/hooks/useYouTubeData';

import TwitterProfileCard from '@/components/Twitter/TwitterProfileCard';
import TwitterStatsCards from '@/components/Twitter/TwitterStatsCards';
import YouTubeVideoAnalytics from '@/components/YouTube/YouTubeVideoAnalytics';
import { useTwitterData } from '@/lib/hooks/useTwitterData';

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

  // Platform-specific data hooks
  const {
    channelInfo,
    videos,
    videoMetrics,
    performanceTrends,
    loading: youtubeLoading,
  } = useYouTubeData(user?.uid || null);

  const {
    userInfo: twitterUserInfo,
    recentTweets,
    metrics: twitterMetrics,
    trends: twitterTrends,
    loading: twitterLoading,
  } = useTwitterData(user?.uid || null);

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

  // Get platform metrics
  const getPlatformMetrics = (platform: string): PlatformMetrics => {
    switch (platform) {
      case 'youtube':
        return {
          followers: channelInfo?.subscriberCount || 0,
          views: videoMetrics.totalViews || 0,
          engagement:
            (videoMetrics.totalLikes || 0) +
            (videoMetrics.totalComments || 0),
          engagementRate: videoMetrics.engagementRate || 0,
          posts: videos.length || 0,
          change: {
            followers: 12.5,
            views: 8.3,
            engagement: 4.2,
          },
        };
      case 'twitter':
      case 'twitter/x':
        return {
          followers: twitterUserInfo?.followerCount || 0,
          views: twitterMetrics.totalImpressions || 0,
          engagement: twitterMetrics.totalEngagements || 0,
          engagementRate: twitterMetrics.avgEngagementRate || 0,
          posts: recentTweets.length || 0,
          change: {
            followers: 5.2,
            views: 7.8,
            engagement: 2.1,
          },
        };
      default: {
        const platformPosts = posts.filter(
          (p) => p.platform?.toLowerCase() === platform,
        );
        const totalEngagement = platformPosts.reduce(
          (sum, p) =>
            sum + (p.metrics?.likes || 0) + (p.metrics?.comments || 0),
          0,
        );
        const totalReach = platformPosts.reduce(
          (sum, p) => sum + (p.metrics?.reach || 0),
          0,
        );

        return {
          followers:
            platformPosts.reduce(
              (sum, p) => sum + (p.metrics?.reach || 0),
              0,
            ) || 0,
          views:
            platformPosts.reduce(
              (sum, p) => sum + (p.metrics?.views || 0),
              0,
            ) || 0,
          engagement: totalEngagement,
          engagementRate:
            platformPosts.length > 0 && totalReach > 0
              ? Math.round((totalEngagement / totalReach) * 100 * 10) / 10
              : 0,
          posts: platformPosts.length,
          change: {
            followers: 3.4,
            views: 6.2,
            engagement: 1.8,
          },
        };
      }
    }
  };

  // Aggregate metrics across all platforms
  const getAggregatedMetrics = (): AggregatedMetrics => {
    let totalFollowers = 0;
    let totalViews = 0;
    let totalEngagement = 0;
    let totalPosts = 0;
    const platformBreakdown: AggregatedMetrics['platformBreakdown'] = {};

    connectedAccounts.forEach((acc) => {
      const metrics = getPlatformMetrics(acc.platform);
      totalFollowers += metrics.followers;
      totalViews += metrics.views;
      totalEngagement += metrics.engagement;
      totalPosts += metrics.posts;

      platformBreakdown[acc.platform] = {
        followers: metrics.followers,
        views: metrics.views,
        engagement: metrics.engagement,
        posts: metrics.posts,
      };
    });

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

  // Loading state per platform
  const isPlatformLoading = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return youtubeLoading;
      case 'twitter':
      case 'twitter/x':
        return twitterLoading;
      default:
        return false;
    }
  };

  // Detailed analytics per platform (merged charts)
  const renderPlatformDetails = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return (
          <div className="space-y-6 pt-4">
            <YouTubeProfileCard
              channelInfo={channelInfo}
              loading={youtubeLoading}
              error={null}
            />

            {/* Video Analytics Section */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white">Video Performance</p>
                  <p className="text-xs text-gray-400">Analytics for your recent videos</p>
                </div>
              </div>
              <YouTubeVideoAnalytics
                videos={videos}
                loading={youtubeLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Views trend</p>
                    <p className="text-sm text-gray-300">
                      Last {performanceTrends.viewsByDay.length} days
                    </p>
                  </div>
                  <Eye size={18} className="text-red-400" />
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceTrends.viewsByDay}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272f"
                      />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          border: '1px solid #27272f',
                          borderRadius: 12,
                          color: '#e5e7eb',
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="#f97373"
                        fill="#f97373"
                        fillOpacity={0.25}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Top Performing Videos</p>
                    <p className="text-sm text-gray-300">By engagement rate</p>
                  </div>
                  <BarChart3 size={18} className="text-blue-400" />
                </div>
                <div className="space-y-3">
                  {videos
                    .sort((a, b) => {
                      const aRate = ((a.likes + a.comments) / a.views) * 100;
                      const bRate = ((b.likes + b.comments) / b.views) * 100;
                      return bRate - aRate;
                    })
                    .slice(0, 3)
                    .map((video, i) => {
                      const rate = ((video.likes + video.comments) / video.views * 100).toFixed(2);
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex-1 min-w-0">
                            <p className="text-white truncate">{video.title}</p>
                            <p className="text-gray-400">{video.views.toLocaleString()} views</p>
                          </div>
                          <div className="ml-2 text-emerald-400 font-medium">
                            {rate}%
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        );
      case 'twitter':
      case 'twitter/x':
        return (
          <div className="space-y-6 pt-4">
            <TwitterProfileCard
              userInfo={twitterUserInfo}
              loading={twitterLoading}
              error={null}
              onAnalyticsClick={() => router.push('/analytics/twitter')}
              onDisconnectClick={() => { }}
            />

            <TwitterStatsCards
              userInfo={twitterUserInfo}
              metrics={twitterMetrics}
              loading={twitterLoading}
            />

            {/* Tweet Analytics Section */}
            <div className="bg-black/20 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-white">Tweet Performance</p>
                  <p className="text-xs text-gray-400">Analytics for your recent tweets</p>
                </div>
              </div>

              {twitterLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-white/5 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTweets.slice(0, 5).map((tweet: any) => {
                    // Extract metrics from tweet's public_metrics (Twitter API v2 structure)
                    const metrics = tweet.public_metrics || {};
                    const likes = metrics.like_count || 0;
                    const retweets = metrics.retweet_count || 0;
                    const replies = metrics.reply_count || 0;
                    const impressions = metrics.impression_count || 0;

                    return (
                      <div key={tweet.id} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                        <p className="text-sm text-white line-clamp-2 mb-2">{tweet.text}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Heart size={12} className="text-red-400" />
                            <span className="text-white">{likes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Repeat2 size={12} className="text-green-400" />
                            <span className="text-white">{retweets.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={12} className="text-blue-400" />
                            <span className="text-white">{replies.toLocaleString()}</span>
                          </div>
                          {impressions > 0 && (
                            <div className="flex items-center gap-1">
                              <Eye size={12} className="text-purple-400" />
                              <span className="text-white">{impressions.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(tweet.createdAt).toLocaleDateString()} • {new Date(tweet.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Engagement trend</p>
                    <p className="text-sm text-gray-300">
                      Daily engagements & rate
                    </p>
                  </div>
                  <TrendingUp size={18} className="text-emerald-400" />
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={twitterTrends.engagementByDay}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272f"
                      />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          border: '1px solid #27272f',
                          borderRadius: 12,
                          color: '#e5e7eb',
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="engagement"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-400">Top Tweets</p>
                    <p className="text-sm text-gray-300">By engagement</p>
                  </div>
                  <BarChart3 size={18} className="text-purple-400" />
                </div>
                <div className="space-y-3">
                  {recentTweets
                    .map((tweet: any) => {
                      const metrics = tweet.public_metrics || {};
                      const totalEng = (metrics.like_count || 0) +
                        (metrics.retweet_count || 0) +
                        (metrics.reply_count || 0);
                      return { tweet, totalEng };
                    })
                    .sort((a, b) => b.totalEng - a.totalEng)
                    .slice(0, 3)
                    .map(({ tweet, totalEng }) => (
                      <div key={tweet.id} className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-white truncate">{tweet.text}</p>
                          <p className="text-gray-400">
                            {new Date(tweet.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-2 text-emerald-400 font-medium">
                          {totalEng.toLocaleString()} engagements
                        </div>
                      </div>
                    ))}

                  {recentTweets.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">
                      No tweets found
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      default: {
        const platformPosts = posts.filter(
          (p) => p.platform?.toLowerCase() === platform,
        );

        return (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs text-gray-400">Reach</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {platformPosts
                    .reduce((sum, p) => sum + (p.metrics?.reach || 0), 0)
                    .toLocaleString()}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Heart className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-400">Likes</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {platformPosts
                    .reduce((sum, p) => sum + (p.metrics?.likes || 0), 0)
                    .toLocaleString()}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs text-gray-400">Comments</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {platformPosts
                    .reduce((sum, p) => sum + (p.metrics?.comments || 0), 0)
                    .toLocaleString()}
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Calendar className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-xs text-gray-400">Posts</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {platformPosts.length}
                </p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-white">Recent posts</h4>
                <button
                  onClick={() => router.push(`/content/${platform}`)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  View all
                  <ChevronRight size={14} />
                </button>
              </div>

              {platformPosts.length > 0 ? (
                <div className="space-y-3">
                  {platformPosts.slice(0, 4).map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between text-xs p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">
                          {post.caption || 'Untitled'}
                        </p>
                        <p className="text-gray-400 mt-1">
                          {post.publishedAt?.toDate?.().toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-2 text-gray-300">
                        <div className="flex items-center gap-1">
                          <Heart size={12} className="text-gray-400" />
                          <span>{post.metrics?.likes?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle size={12} className="text-gray-400" />
                          <span>{post.metrics?.comments?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm py-4">
                  No posts found for this platform
                </p>
              )}
            </div>
          </div>
        );
      }
    }
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
  const totalContent =
    (videos?.length || 0) + (recentTweets?.length || 0) + posts.length;

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
                        const metrics = getPlatformMetrics(account.platform);
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
                        const isExpanded = expandedPlatforms.has(
                          account.platform,
                        );
                        const isLoading = isPlatformLoading(account.platform);

                        return (
                          <div
                            key={account.id}
                            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
                          >
                            {/* Platform header */}
                            <div
                              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
                              onClick={() =>
                                togglePlatformExpand(account.platform)
                              }
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div
                                  className={`p-2.5 rounded-lg ${platformInfo.bgColor}`}
                                >
                                  {platformInfo.icon}
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-base font-semibold text-white capitalize">
                                      {account.platform}
                                    </h3>
                                    <span className="text-xs text-gray-400">
                                      {account.accountName}
                                    </span>
                                    {isLoading && (
                                      <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" />
                                    )}
                                  </div>

                                  {/* Quick metrics preview */}
                                  <div className="flex items-center gap-6 mt-2">
                                    <div>
                                      <span className="text-xs text-gray-500 mr-2">
                                        {platformInfo.metricLabels.followers}:
                                      </span>
                                      <span className="text-sm font-semibold text-white">
                                        {metrics.followers.toLocaleString()}
                                      </span>
                                      {metrics.change.followers > 0 && (
                                        <span className="text-xs text-emerald-400 ml-2">
                                          +{metrics.change.followers}%
                                        </span>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 mr-2">
                                        {platformInfo.metricLabels.views}:
                                      </span>
                                      <span className="text-sm font-semibold text-white">
                                        {metrics.views.toLocaleString()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500 mr-2">
                                        {
                                          platformInfo.metricLabels
                                            .engagement
                                        }
                                        :
                                      </span>
                                      <span className="text-sm font-semibold text-white">
                                        {metrics.engagementRate}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/analytics/${account.platform}`,
                                    );
                                  }}
                                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
                                >
                                  <BarChart3 size={18} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        `Disconnect ${account.platform}?`,
                                      )
                                    ) {
                                      handleDisconnectAccount(account.id);
                                    }
                                  }}
                                  className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                                >
                                  Disconnect
                                </button>
                                <button className="p-2 rounded-lg hover:bg-white/10">
                                  {isExpanded ? (
                                    <ChevronUp size={18} />
                                  ) : (
                                    <ChevronDown size={18} />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Expanded details */}
                            {isExpanded && (
                              <div className="border-t border-white/10 p-4">
                                {renderPlatformDetails(account.platform)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Globe className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-white font-medium mb-2">
                        No platforms connected
                      </h4>
                      <p className="text-gray-400 text-sm mb-4">
                        Connect your social media accounts to start tracking
                        analytics
                      </p>
                      <button
                        onClick={() => setShowConnectModal(true)}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800"
                      >
                        Connect account
                      </button>
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
