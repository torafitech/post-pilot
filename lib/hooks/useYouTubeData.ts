// lib/hooks/useYouTubeData.ts - Updated version
'use client';

import { useEffect, useState } from 'react';

export interface YouTubeChannelInfo {
  channelId: string;
  channelName: string;
  description: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  profileImageUrl: string;
  bannerImageUrl: string;
  customUrl?: string;
  country?: string;
  publishedAt: string;
  verifiedBadge: boolean;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  privacyStatus: string;
  scheduledPublishTime?: string;
  duration?: string;
  watchTime?: number;
  engagementRate?: number;
}

export interface YouTubeAnalytics {
  channelInfo: YouTubeChannelInfo | null;
  videos: YouTubeVideo[];
  videoMetrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalWatchTime: number;
    avgViewDuration: number;
    engagementRate: number;
    topVideo: YouTubeVideo | null;
    recentVideos: YouTubeVideo[];
  };
  performanceTrends: {
    viewsByDay: Array<{ date: string; views: number }>;
    engagementByDay: Array<{ date: string; engagement: number }>;
    videosByMonth: Array<{ month: string; count: number }>;
  };
  demographics?: {
    ageGroups?: Array<{ group: string; percentage: number }>;
    gender?: Array<{ gender: string; percentage: number }>;
    countries?: Array<{ country: string; percentage: number }>;
  };
  loading: boolean;
  error: string | null;
}

export function useYouTubeData(userId: string | null): YouTubeAnalytics {
  const [channelInfo, setChannelInfo] = useState<YouTubeChannelInfo | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchYouTubeData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch comprehensive YouTube data
        const res = await fetch(
          `/api/youtube/analytics?userId=${userId}`
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.error || 'Failed to fetch YouTube analytics'
          );
        }

        const data = await res.json();
        
        setChannelInfo(data.channelInfo);
        setVideos(data.videos || []);
        
        console.log('[useYouTubeData] Data fetched:', {
          channelName: data.channelInfo?.channelName,
          videosCount: data.videos?.length,
          metrics: data.videoMetrics
        });
      } catch (err: any) {
        console.error('[useYouTubeData] Error:', err);
        setError(err.message);
        setChannelInfo(null);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchYouTubeData();
  }, [userId]);

  // Calculate derived metrics
  const videoMetrics = (() => {
    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
    const totalLikes = videos.reduce((sum, video) => sum + (video.likes || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + (video.comments || 0), 0);
    const totalWatchTime = videos.reduce((sum, video) => sum + (video.watchTime || 0), 0);
    const avgViewDuration = videos.length > 0 ? Math.round(totalWatchTime / videos.length) : 0;
    const engagementRate = totalViews > 0 
      ? ((totalLikes + totalComments) / totalViews * 100)
      : 0;

    const topVideo = videos.length > 0 
      ? videos.reduce((prev, current) => 
          (prev.views || 0) > (current.views || 0) ? prev : current
        )
      : null;

    const recentVideos = [...videos]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 5);

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalWatchTime,
      avgViewDuration,
      engagementRate,
      topVideo,
      recentVideos
    };
  })();

  // Calculate performance trends
  const performanceTrends = (() => {
    const now = new Date();
    const viewsByDay: Array<{ date: string; views: number }> = [];
    const engagementByDay: Array<{ date: string; engagement: number }> = [];
    const videosByMonth: Array<{ month: string; count: number }> = [];

    // Last 30 days trend
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayVideos = videos.filter(v => {
        const videoDate = new Date(v.publishedAt).toISOString().split('T')[0];
        return videoDate === dateStr;
      });

      viewsByDay.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: dayVideos.reduce((sum, v) => sum + (v.views || 0), 0)
      });

      engagementByDay.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        engagement: dayVideos.reduce((sum, v) => sum + (v.likes || 0) + (v.comments || 0), 0)
      });
    }

    // Last 6 months distribution
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const monthVideos = videos.filter(v => {
        const videoDate = new Date(v.publishedAt);
        return videoDate.getMonth() === date.getMonth() && 
               videoDate.getFullYear() === date.getFullYear();
      });

      videosByMonth.push({
        month: monthStr,
        count: monthVideos.length
      });
    }

    return { viewsByDay, engagementByDay, videosByMonth };
  })();

  return {
    channelInfo,
    videos,
    videoMetrics,
    performanceTrends,
    loading,
    error
  };
}