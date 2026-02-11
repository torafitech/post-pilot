// components/YouTubeStatsCards.tsx - Updated version
'use client';

import { YouTubeChannelInfo } from '@/lib/hooks/useYouTubeData';
import { TrendingUp, Users, Eye, Video, Loader } from 'lucide-react';

interface YouTubeStatsCardsProps {
  channelInfo: YouTubeChannelInfo | null;
  loading: boolean;
}

export default function YouTubeStatsCards({
  channelInfo,
  loading,
}: YouTubeStatsCardsProps) {
  if (loading || !channelInfo) {
    return (
      <>
        {/* Loading skeletons */}
        {[1, 2, 3].map((i) => (
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

  const stats = [
    {
      label: 'YouTube Subscribers',
      value: channelInfo.subscriberCount.toLocaleString(),
      change: '+2.4%',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      label: 'YouTube Views',
      value: (channelInfo.viewCount / 1000000).toFixed(1) + 'M',
      change: '+12.5%',
      icon: Eye,
      gradient: 'from-cyan-500 to-blue-500',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
    },
    {
      label: 'YouTube Videos',
      value: channelInfo.videoCount.toString(),
      change: '+3',
      icon: Video,
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-500/10 to-pink-500/10',
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