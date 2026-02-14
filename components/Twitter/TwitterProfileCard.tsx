// components/Twitter/TwitterProfileCard.tsx
'use client';

import React, { FC } from 'react';
import { TwitterUserInfo } from '@/lib/hooks/useTwitterData';
import { AlertCircle, MapPin, Link as LinkIcon, Calendar, Users, MessageCircle, Heart, Repeat, TrendingUp } from 'lucide-react';

interface TwitterProfileCardProps {
  userInfo: TwitterUserInfo | null;
  loading: boolean;
  error: string | null;
  onAnalyticsClick?: () => void;
  onDisconnectClick?: () => void;
}

const TwitterProfileCard: FC<TwitterProfileCardProps> = ({
  userInfo,
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

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded mb-2 w-3/4" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
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
            <div className="font-semibold text-red-400">Twitter Error</div>
            <div className="text-sm text-red-300">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <p className="text-gray-400">Twitter/X account not connected</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg hover:border-blue-400/30 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Profile Image */}
          {userInfo.profileImageUrl ? (
            <img
              src={userInfo.profileImageUrl}
              alt={userInfo.name}
              className="w-16 h-16 rounded-full border-2 border-blue-400 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-blue-400 bg-slate-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
          )}

          {/* Name and Username */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">
                {userInfo.name}
              </h3>
              {userInfo.verified && (
                <span className="text-blue-400">
                  <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              @{userInfo.username}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full border border-blue-500/30">
          Connected
        </span>
      </div>

      {/* Bio */}
      {userInfo.description && (
        <div className="mb-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <p className="text-sm text-gray-300">
            {userInfo.description}
          </p>
        </div>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        {userInfo.location && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <MapPin className="w-4 h-4" />
            <span>{userInfo.location}</span>
          </div>
        )}
        {userInfo.url && (
          <div className="flex items-center gap-1.5 text-gray-400">
            <LinkIcon className="w-4 h-4" />
            <a 
              href={userInfo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline truncate max-w-[200px]"
            >
              {userInfo.url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Joined {formatDate(userInfo.createdAt)}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-lg p-3 border border-blue-500/20 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tweets</p>
          <p className="text-xl font-bold text-white">
            {formatNumber(userInfo.tweetCount)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-lg p-3 border border-green-500/20 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Following</p>
          <p className="text-xl font-bold text-white">
            {formatNumber(userInfo.followingCount)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-lg p-3 border border-purple-500/20 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Followers</p>
          <p className="text-xl font-bold text-white">
            {formatNumber(userInfo.followerCount)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-lg p-3 border border-amber-500/20 text-center">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Listed</p>
          <p className="text-xl font-bold text-white">
            {formatNumber(userInfo.listedCount)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">

        <button
          onClick={onDisconnectClick}
          className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 border border-red-600/30 hover:border-red-600/50 flex items-center justify-center gap-2"
        >
          <span>🔌</span>
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};

export default TwitterProfileCard;