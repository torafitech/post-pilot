'use client';

import React, { FC } from 'react';
import { YouTubeChannelInfo } from '@/lib/hooks/useYouTubeData'; // Import the correct type
import { AlertCircle } from 'lucide-react';

interface YouTubeProfileCardProps {
  channelInfo: YouTubeChannelInfo | null; // Change from 'profile' to 'channelInfo'
  loading: boolean;
  error: string | null;
  onAnalyticsClick?: () => void;
  onDisconnectClick?: () => void;
}

const YouTubeProfileCard: FC<YouTubeProfileCardProps> = ({
  channelInfo, // Changed from 'profile'
  loading,
  error,
  onAnalyticsClick,
  onDisconnectClick,
}) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-24 h-24 bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded mb-2" />
            <div className="h-4 bg-gray-700 rounded w-3/4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-700 rounded-xl h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <div className="font-semibold text-red-400">YouTube Error</div>
            <div className="text-sm text-red-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!channelInfo) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
          <span className="text-2xl">▶️</span>
        </div>
        <p className="text-gray-400">YouTube channel not connected</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg hover:border-slate-600 transition-all duration-300">
      {/* ============ Header ============ */}
      <div className="flex items-center gap-4 mb-6">
        {channelInfo.profileImageUrl ? (
          <img
            src={channelInfo.profileImageUrl}
            alt={channelInfo.channelName}
            className="w-16 h-16 rounded-full border-2 border-red-600 object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full border-2 border-red-600 bg-slate-700 flex items-center justify-center">
            <span className="text-2xl">▶️</span>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white truncate">
              {channelInfo.channelName}
            </h3>
            {channelInfo.verifiedBadge && (
              <span className="text-blue-400 text-sm font-semibold">✓</span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {channelInfo.customUrl || `@${channelInfo.channelName}`}
          </p>
        </div>
      </div>

      {/* ============ Stats Grid ============ */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Subscribers */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-lg p-4 border border-red-500/20">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
            Subscribers
          </p>
          <p className="text-2xl font-bold text-white">
            {formatNumber(channelInfo.subscriberCount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total followers</p>
        </div>

        {/* Total Views */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-4 border border-blue-500/20">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
            Total Views
          </p>
          <p className="text-2xl font-bold text-white">
            {formatNumber(channelInfo.viewCount)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Channel views</p>
        </div>

        {/* Total Videos */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-4 border border-green-500/20">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
            Videos
          </p>
          <p className="text-2xl font-bold text-white">
            {channelInfo.videoCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">Total uploads</p>
        </div>

        {/* Engagement */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-4 border border-purple-500/20">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2">
            Status
          </p>
          <p className="text-sm font-bold text-green-400">Connected</p>
          <p className="text-xs text-gray-500 mt-1">Active connection</p>
        </div>
      </div>

      {/* ============ Description ============ */}
      {channelInfo.description && (
        <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <p className="text-sm text-gray-300 line-clamp-2">
            {channelInfo.description}
          </p>
        </div>
      )}

      {/* ============ Action Buttons ============ */}
      <div className="flex gap-3">
        <button
          onClick={onAnalyticsClick}
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>📊</span>
          <span>Analytics</span>
        </button>

        <button
          onClick={onDisconnectClick}
          disabled={loading}
          className="flex-1 bg-red-600/20 hover:bg-red-600/30 disabled:bg-red-600/10 disabled:cursor-not-allowed text-red-400 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 border border-red-600/30 hover:border-red-600/50 flex items-center justify-center gap-2"
        >
          <span>🔌</span>
          <span>Disconnect</span>
        </button>
      </div>

      {/* ============ Footer ============ */}
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <p className="text-xs text-gray-500 text-center">
          Channel ID: <code className="text-gray-400">{channelInfo.channelId}</code>
        </p>
      </div>
    </div>
  );
};

export default YouTubeProfileCard;