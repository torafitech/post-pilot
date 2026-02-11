// components/Twitter/TwitterTweetsList.tsx
'use client';

import React, { useState } from 'react';
import { TweetData } from '@/lib/hooks/useTwitterData';
import { 
  Heart, 
  Repeat, 
  MessageCircle, 
  Eye, 
  Calendar, 
  ExternalLink,
  BarChart3,
  ChevronRight,
  Image as ImageIcon,
  Video,
  FileText
} from 'lucide-react';

interface TwitterTweetsListProps {
  tweets: TweetData[];
  loading: boolean;
  title?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export default function TwitterTweetsList({
  tweets,
  loading,
  title = 'Recent Tweets',
  maxItems = 5,
  showViewAll = true,
  onViewAll,
}: TwitterTweetsListProps) {
  const [expandedTweet, setExpandedTweet] = useState<string | null>(null);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMediaTypeIcon = (tweet: TweetData) => {
    const mediaType = tweet.mediaType || tweet.media?.[0]?.type;
    if (!mediaType) return null;

    if (mediaType === 'photo' || mediaType === 'image') {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs">
          <ImageIcon className="w-3 h-3" />
          <span>Image</span>
        </div>
      );
    }

    if (mediaType === 'video' || mediaType === 'animated_gif') {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs">
          <Video className="w-3 h-3" />
          <span>Video</span>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-500/10 text-gray-300 text-xs">
        <FileText className="w-3 h-3" />
        <span>Text</span>
      </div>
    );
  };

  const visibleTweets = tweets.slice(0, maxItems);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-40 bg-gray-700 rounded" />
          <div className="h-8 w-24 bg-gray-700 rounded" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: maxItems }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!tweets.length) {
    return (
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-800 flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">No tweets to display</h3>
        <p className="text-sm text-gray-400">
          Connect your X/Twitter account and sync your latest tweets to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-400">
            Performance of your recent posts on X
          </p>
        </div>
        {showViewAll && onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-200 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            View all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {visibleTweets.map((tweet) => {
          const isExpanded = expandedTweet === tweet.id;
          const textToShow =
            tweet.text && tweet.text.length > 160 && !isExpanded
              ? tweet.text.slice(0, 160) + '…'
              : tweet.text || '';

          return (
            <div
              key={tweet.id}
              className="group border border-gray-700/80 rounded-xl p-4 bg-gray-900/40 hover:border-blue-500/50 hover:bg-gray-900/70 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getMediaTypeIcon(tweet)}
                    {tweet.authorName && (
                      <span className="text-xs text-gray-400">
                        {tweet.authorName}
                        {tweet.authorHandle && (
                          <span className="text-gray-500">
                            {' '}
                            · @{tweet.authorHandle}
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-100 whitespace-pre-wrap">
                    {textToShow || <span className="text-gray-500">No text</span>}
                  </p>

                  {tweet.text && tweet.text.length > 160 && (
                    <button
                      onClick={() =>
                        setExpandedTweet(isExpanded ? null : tweet.id)
                      }
                      className="mt-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => {
                      if (tweet.url) {
                        window.open(tweet.url, '_blank');
                      }
                    }}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    aria-label="Open on X"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    className="hidden md:inline-flex p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    aria-label="View tweet analytics"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-5 text-gray-400">
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-pink-400" />
                    <span>{formatNumber(tweet.likeCount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-blue-400" />
                    <span>{formatNumber(tweet.replyCount || 0)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Repeat className="w-3 h-3 text-emerald-400" />
                    <span>{formatNumber(tweet.retweetCount || 0)}</span>
                  </div>
                  {'viewCount' in tweet && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-amber-400" />
                      <span>{formatNumber((tweet as any).viewCount || 0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(tweet.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
