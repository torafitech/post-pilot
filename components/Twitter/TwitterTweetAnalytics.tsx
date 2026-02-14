// components/Twitter/TwitterTweetAnalytics.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, MessageCircle, Repeat2, Eye, BarChart3 } from 'lucide-react';

interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  likes?: number;
  retweets?: number;
  replies?: number;
  views?: number;
  media?: any[];
}

interface TwitterTweetAnalyticsProps {
  tweets: Tweet[];
  loading?: boolean;
}

export default function TwitterTweetAnalytics({ tweets, loading }: TwitterTweetAnalyticsProps) {
  const [expandedTweets, setExpandedTweets] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/5 rounded-lg" />
        ))}
      </div>
    );
  }

  const toggleTweet = (tweetId: string) => {
    const newExpanded = new Set(expandedTweets);
    if (newExpanded.has(tweetId)) {
      newExpanded.delete(tweetId);
    } else {
      newExpanded.add(tweetId);
    }
    setExpandedTweets(newExpanded);
  };

  const formatNumber = (num: number = 0) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const calculateEngagement = (tweet: Tweet) => {
    const total = (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies || 0);
    const impressions = tweet.views || total * 10; // fallback estimate
    return {
      total,
      rate: impressions > 0 ? ((total / impressions) * 100).toFixed(2) : '0'
    };
  };

  return (
    <div className="space-y-3">
      {tweets.map((tweet) => {
        const isExpanded = expandedTweets.has(tweet.id);
        const engagement = calculateEngagement(tweet);
        
        return (
          <div key={tweet.id} className="bg-white/5 rounded-lg overflow-hidden">
            {/* Tweet header */}
            <div 
              className="p-3 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => toggleTweet(tweet.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white line-clamp-2">{tweet.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(tweet.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Engagement rate */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-400">Engagement</p>
                  <p className="text-sm font-medium text-emerald-400">{engagement.rate}%</p>
                </div>

                <button className="p-1 rounded hover:bg-white/10">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Quick metrics preview */}
              <div className="flex items-center gap-4 mt-2 text-xs">
                <div className="flex items-center gap-1">
                  <Heart size={12} className="text-red-400" />
                  <span>{formatNumber(tweet.likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Repeat2 size={12} className="text-green-400" />
                  <span>{formatNumber(tweet.retweets)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={12} className="text-blue-400" />
                  <span>{formatNumber(tweet.replies)}</span>
                </div>
                {tweet.views && (
                  <div className="flex items-center gap-1">
                    <Eye size={12} className="text-purple-400" />
                    <span>{formatNumber(tweet.views)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded analytics */}
            {isExpanded && (
              <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white/5 rounded p-2">
                    <p className="text-xs text-gray-400 mb-1">Engagement Breakdown</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Likes</span>
                        <span className="text-white">{formatNumber(tweet.likes || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Retweets</span>
                        <span className="text-white">{formatNumber(tweet.retweets || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Replies</span>
                        <span className="text-white">{formatNumber(tweet.replies || 0)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded p-2">
                    <p className="text-xs text-gray-400 mb-1">Performance</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Total Eng.</span>
                        <span className="text-white">{formatNumber(engagement.total)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Eng. Rate</span>
                        <span className="text-emerald-400">{engagement.rate}%</span>
                      </div>
                      {tweet.views && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Impressions</span>
                          <span className="text-white">{formatNumber(tweet.views)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* View tweet button */}
                <a
                  href={`https://twitter.com/i/web/status/${tweet.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-center text-xs text-blue-400 hover:text-blue-300 py-2 border-t border-white/10"
                >
                  View on Twitter →
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}