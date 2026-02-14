// components/YouTube/YouTubeVideoAnalytics.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, Heart, MessageCircle, ThumbsUp, Calendar, BarChart3 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  duration?: string;
}

interface YouTubeVideoAnalyticsProps {
  videos: Video[];
  loading?: boolean;
}

export default function YouTubeVideoAnalytics({ videos, loading }: YouTubeVideoAnalyticsProps) {
  const [expandedVideos, setExpandedVideos] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded-lg" />
        ))}
      </div>
    );
  }

  const toggleVideo = (videoId: string) => {
    const newExpanded = new Set(expandedVideos);
    if (newExpanded.has(videoId)) {
      newExpanded.delete(videoId);
    } else {
      newExpanded.add(videoId);
    }
    setExpandedVideos(newExpanded);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const calculateEngagementRate = (views: number, likes: number, comments: number) => {
    if (views === 0) return 0;
    return ((likes + comments) / views * 100).toFixed(2);
  };

  return (
    <div className="space-y-3">
      {videos.map((video) => {
        const isExpanded = expandedVideos.has(video.id);
        const engagementRate = calculateEngagementRate(video.views, video.likes, video.comments);
        
        return (
          <div key={video.id} className="bg-white/5 rounded-lg overflow-hidden">
            {/* Video header */}
            <div 
              className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => toggleVideo(video.id)}
            >
              {/* Thumbnail */}
              <div className="w-16 h-9 bg-gray-800 rounded flex-shrink-0 overflow-hidden">
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Eye size={16} className="text-gray-600" />
                  </div>
                )}
              </div>

              {/* Video info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{video.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-1">
                    <Eye size={12} />
                    <span>{formatNumber(video.views)}</span>
                  </div>
                </div>
              </div>

              {/* Engagement rate */}
              <div className="text-right mr-2">
                <p className="text-xs text-gray-400">Engagement</p>
                <p className="text-sm font-medium text-emerald-400">{engagementRate}%</p>
              </div>

              {/* Expand button */}
              <button className="p-1 rounded hover:bg-white/10">
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* Expanded analytics */}
            {isExpanded && (
              <div className="p-3 border-t border-white/10 bg-white/[0.02]">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                      <Eye size={14} />
                      <span className="text-xs">Views</span>
                    </div>
                    <p className="text-sm font-medium text-white">{formatNumber(video.views)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                      <ThumbsUp size={14} />
                      <span className="text-xs">Likes</span>
                    </div>
                    <p className="text-sm font-medium text-white">{formatNumber(video.likes)}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                      <MessageCircle size={14} />
                      <span className="text-xs">Comments</span>
                    </div>
                    <p className="text-sm font-medium text-white">{formatNumber(video.comments)}</p>
                  </div>
                </div>

                {/* Detailed metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 rounded p-2">
                    <p className="text-gray-400">Like/View Ratio</p>
                    <p className="text-white font-medium">
                      {video.views > 0 ? ((video.likes / video.views) * 100).toFixed(2) : '0'}%
                    </p>
                  </div>
                  <div className="bg-white/5 rounded p-2">
                    <p className="text-gray-400">Comment/View Ratio</p>
                    <p className="text-white font-medium">
                      {video.views > 0 ? ((video.comments / video.views) * 100).toFixed(2) : '0'}%
                    </p>
                  </div>
                </div>

                {/* View video button */}
                <a
                  href={`https://youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center text-xs text-blue-400 hover:text-blue-300 py-2 border-t border-white/10"
                >
                  View on YouTube →
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}