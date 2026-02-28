'use client';

import React from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye,
  Globe,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRouter } from 'next/navigation';

import YouTubeProfileCard from '@/components/YouTube/YouTubeProfileCard';
import YouTubeVideoAnalytics from '@/components/YouTube/YouTubeVideoAnalytics';
import TwitterProfileCard from '@/components/Twitter/TwitterProfileCard';
import TwitterStatsCards from '@/components/Twitter/TwitterStatsCards';
import { useYouTubeData } from '@/lib/hooks/useYouTubeData';
import { useTwitterData } from '@/lib/hooks/useTwitterData';
import type { DashboardPost } from '@/types/post';

export interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  connectedAt: Date;
}

export interface PlatformInfoMeta {
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

interface PlatformAccountCardProps {
  userId: string;
  account: ConnectedAccount;
  platformInfo: PlatformInfoMeta;
  posts: DashboardPost[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDisconnect: () => void;
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

const PlatformAccountCard: React.FC<PlatformAccountCardProps> = ({
  userId,
  account,
  platformInfo,
  posts,
  isExpanded,
  onToggleExpand,
  onDisconnect,
}) => {
  const router = useRouter();

  // Platform-specific hooks live here, not in DashboardPage
  const isYouTube = account.platform === 'youtube';
  const isTwitter =
    account.platform === 'twitter' || account.platform === 'twitter/x';

  const youtube = isYouTube
    ? useYouTubeData(userId, account.id)
    : null;

  const twitter = isTwitter ? useTwitterData(userId) : null;

  const getMetrics = (): PlatformMetrics => {
    if (isYouTube && youtube) {
      const vm = youtube.videoMetrics;
      return {
        followers: youtube.channelInfo?.subscriberCount ?? 0,
        views: vm.totalViews ?? 0,
        engagement: (vm.totalLikes ?? 0) + (vm.totalComments ?? 0),
        engagementRate: vm.engagementRate ?? 0,
        posts: youtube.videos?.length ?? 0,
        change: {
          followers: 0,
          views: 0,
          engagement: 0,
        },
      };
    }

    if (isTwitter && twitter) {
      return {
        followers: twitter.userInfo?.followerCount || 0,
        views: twitter.metrics.totalImpressions || 0,
        engagement: twitter.metrics.totalEngagements || 0,
        engagementRate: twitter.metrics.avgEngagementRate || 0,
        posts: twitter.recentTweets.length || 0,
        change: {
          followers: 5.2,
          views: 7.8,
          engagement: 2.1,
        },
      };
    }

    const platformPosts = posts.filter(
      (p) => p.platform?.toLowerCase() === account.platform,
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
  };

  const metrics = getMetrics();

  const renderDetails = () => {
    if (isYouTube && youtube) {
      const {
        channelInfo,
        videos,
        performanceTrends,
        loading,
        error,
      } = youtube;

      return (
        <div className="space-y-6 pt-4">
          <YouTubeProfileCard
            channelInfo={channelInfo}
            loading={loading}
            error={error}
          />

          <div className="bg-black/20 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-white">
                  Video Performance
                </p>
                <p className="text-xs text-gray-400">
                  Analytics for your recent videos
                </p>
              </div>
            </div>
            <YouTubeVideoAnalytics videos={videos} loading={loading} />
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
                <div>
                  <Eye size={18} className="text-red-400" />
                </div>
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

            {/* Top videos block (same as before) */}
            {/* ... */}
          </div>
        </div>
      );
    }

    if (isTwitter && twitter) {
      return (
        <div className="space-y-6 pt-4">
          <TwitterProfileCard
            userInfo={twitter.userInfo}
            loading={twitter.loading}
            error={null}
            onAnalyticsClick={() => router.push('/analytics/twitter')}
            onDisconnectClick={() => {}}
          />
          <TwitterStatsCards
            userInfo={twitter.userInfo}
            metrics={twitter.metrics}
            loading={twitter.loading}
          />
          {/* keep your existing Twitter analytics JSX here */}
        </div>
      );
    }

    // Default: your existing generic platform details (reach, likes, comments, posts)
    const platformPosts = posts.filter(
      (p) => p.platform?.toLowerCase() === account.platform,
    );

    return (
      <div className="space-y-6 pt-4">
        {/* paste your current default renderPlatformDetails JSX here */}
      </div>
    );
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-2.5 rounded-lg ${platformInfo.bgColor}`}>
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
            </div>

            <div className="flex items-center gap-6 mt-2">
              <div>
                <span className="text-xs text-gray-500 mr-2">
                  {platformInfo.metricLabels.followers}:
                </span>
                <span className="text-sm font-semibold text-white">
                  {metrics.followers.toLocaleString()}
                </span>
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
                  {platformInfo.metricLabels.engagement}:
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
              router.push(`/analytics/${account.platform}`);
            }}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <BarChart3 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Disconnect ${account.platform}?`)) {
                onDisconnect();
              }
            }}
            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
          >
            Disconnect
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-white/10 p-4">{renderDetails()}</div>
      )}
    </div>
  );
};

export default PlatformAccountCard;
