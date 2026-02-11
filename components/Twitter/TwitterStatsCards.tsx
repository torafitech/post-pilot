// components/Twitter/TwitterStatsCards.tsx
'use client';

import { TwitterUserInfo } from '@/lib/hooks/useTwitterData';
import { TrendingUp, Users, MessageCircle, Heart, Repeat, Eye } from 'lucide-react';

interface TwitterStatsCardsProps {
  userInfo: TwitterUserInfo | null;
  metrics: {
    totalImpressions: number;
    totalEngagements: number;
    avgEngagementRate: number;
    totalTweets: number;
    tweetsThisMonth: number;
  };
  loading: boolean;
}

export default function TwitterStatsCards({
  userInfo,
  metrics,
  loading,
}: TwitterStatsCardsProps) {
  if (loading || !userInfo) {
    return (
      <>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-gray-700 rounded-xl" />
              <div className="w-16 h-6 bg-gray-700 rounded-full" />
            </div>
            <div className="h-4 bg-gray-700 rounded mb-2 w-1/2" />
            <div className="h-8 bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const stats = [
    {
      label: 'Twitter Followers',
      value: formatNumber(userInfo.followerCount),
      change: '',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      label: 'Total Impressions',
      value: formatNumber(metrics.totalImpressions),
      change: '',
      icon: Eye,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      label: 'Total Engagements',
      value: formatNumber(metrics.totalEngagements),
      change: '',
      icon: Heart,
      gradient: 'from-red-500 to-rose-500',
      bgGradient: 'from-red-500/10 to-rose-500/10',
    },
    {
      label: 'Engagement Rate',
      value: `${metrics.avgEngagementRate.toFixed(1)}%`,
      change: '',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
    },
  ];

  return (
    <>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:border-gray-600 transition-all duration-300"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-r ${stat.bgGradient}`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">
                  {stat.change}
                </span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </div>
        );
      })}
    </>
  );
}