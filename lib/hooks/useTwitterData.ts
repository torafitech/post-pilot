// lib/hooks/useTwitterData.ts
import React, { useEffect, useState } from 'react';

export interface TwitterUserInfo {
  userId: string;
  username: string;
  name: string;
  description?: string;
  profileImageUrl?: string;
  verified?: boolean;
  followerCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  createdAt: string;
  location?: string;
  url?: string;
}

export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  engagementRate: number;
}
export interface TweetMedia {
  type: 'photo' | 'video' | 'gif';
  url: string;
  previewImageUrl?: string;
}

export interface TweetData {
  id: string;
  text: string;
  createdAt: string;
  metrics: TweetMetrics;

  // Extra fields used by the UI:
  mediaType?: string;             // e.g. 'photo', 'video', 'animated_gif'
  media?: TweetMedia[];
  authorName?: string;
  authorHandle?: string;
  url?: string;                   // link to tweet on X
  likeCount?: number;
  replyCount?: number;
  retweetCount?: number;
  viewCount?: number;            // used via `'viewCount' in tweet`

  permalink: string;
}

export interface TwitterPerformanceTrend {
  date: string;
  tweets: number;
  impressions: number;
  engagements: number;
  followers: number;
}

export interface TwitterAnalytics {
  userInfo: TwitterUserInfo | null;
  recentTweets: TweetData[];
  topTweets: TweetData[];
  performanceTrends: TwitterPerformanceTrend[];
  metrics: {
    totalImpressions: number;
    totalEngagements: number;
    avgEngagementRate: number;
    totalTweets: number;
    tweetsThisMonth: number;
  };
  loading: boolean;
  error: string | null;
}

export function useTwitterData(userId: string | null) {
  const [userInfo, setUserInfo] = useState<TwitterUserInfo | null>(null);
  const [recentTweets, setRecentTweets] = useState<TweetData[]>([]);
  const [topTweets, setTopTweets] = useState<TweetData[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<TwitterPerformanceTrend[]>([]);
  const [metrics, setMetrics] = useState({
    totalImpressions: 0,
    totalEngagements: 0,
    avgEngagementRate: 0,
    totalTweets: 0,
    tweetsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('No user ID provided');
      return;
    }

    fetchTwitterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchTwitterData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userRes, tweetsRes] = await Promise.all([
        fetch(`/api/twitter/user?userId=${userId}`),
        fetch(`/api/twitter/tweets?userId=${userId}&maxResults=50`),
      ]);

      if (!userRes.ok) {
        if (userRes.status === 404) {
          setError('Twitter account not connected');
          return;
        }
        throw new Error(`Twitter API error: ${userRes.status}`);
      }

      const userData = await userRes.json();
      setUserInfo(userData);

      if (tweetsRes.ok) {
        const tweetsData = await tweetsRes.json();
        const tweets: TweetData[] = tweetsData.tweets || [];

        setRecentTweets(tweets);

        // Top tweets by engagement
        const sorted = [...tweets]
          .sort((a, b) => {
            const aEng =
              (a.metrics?.likes || 0) +
              (a.metrics?.retweets || 0) +
              (a.metrics?.replies || 0);
            const bEng =
              (b.metrics?.likes || 0) +
              (b.metrics?.retweets || 0) +
              (b.metrics?.replies || 0);
            return bEng - aEng;
          })
          .slice(0, 5);
        setTopTweets(sorted);

        // Metrics
        const totalImpressions = tweets.reduce(
          (sum, t) => sum + (t.metrics?.impressions || 0),
          0,
        );
        const totalEngagements = tweets.reduce(
          (sum, t) =>
            sum +
            (t.metrics?.likes || 0) +
            (t.metrics?.retweets || 0) +
            (t.metrics?.replies || 0) +
            (t.metrics?.quotes || 0),
          0,
        );
        const avgEngagementRate =
          totalImpressions > 0
            ? (totalEngagements / totalImpressions) * 100
            : 0;

        const now = new Date();
        const tweetsThisMonth = tweets.filter(t => {
          const d = new Date(t.createdAt);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        }).length;

        setMetrics({
          totalImpressions,
          totalEngagements,
          avgEngagementRate,
          totalTweets: userData.tweetCount || tweets.length,
          tweetsThisMonth,
        });

        // 30‑day performance trends (existing)
        const trends = generatePerformanceTrends(tweets);
        setPerformanceTrends(trends);
      }
    } catch (err: any) {
      console.error('Error fetching Twitter data:', err);
      setError(err.message || 'Failed to fetch Twitter data');
    } finally {
      setLoading(false);
    }
  };

  const generatePerformanceTrends = (
    tweets: TweetData[],
  ): TwitterPerformanceTrend[] => {
    const trends: TwitterPerformanceTrend[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTweets = tweets.filter(t => {
        const tweetDate = new Date(t.createdAt);
        return tweetDate.toISOString().split('T')[0] === dateStr;
      });

      const impressions = dayTweets.reduce(
        (sum, t) => sum + (t.metrics?.impressions || 0),
        0,
      );
      const engagements = dayTweets.reduce(
        (sum, t) =>
          sum +
          (t.metrics?.likes || 0) +
          (t.metrics?.retweets || 0) +
          (t.metrics?.replies || 0),
        0,
      );

      trends.push({
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        tweets: dayTweets.length,
        impressions,
        engagements,
        followers: 0,
      });
    }

    return trends;
  };

  // Extra series for dashboard charts: tweetsByDay + engagementByDay
  const trends = React.useMemo(() => {
    if (!recentTweets.length) {
      return {
        tweetsByDay: [] as {
          date: string;
          count: number;
          impressions: number;
        }[],
        engagementByDay: [] as {
          date: string;
          engagement: number;
          rate: number;
        }[],
      };
    }

    const tweetsByDayMap: Record<
      string,
      { count: number; impressions: number }
    > = {};
    const engagementByDayMap: Record<
      string,
      { engagement: number; impressions: number }
    > = {};

    recentTweets.forEach(t => {
      const d = new Date(t.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10); // YYYY‑MM‑DD

      const impressions = t.metrics?.impressions || 0;
      const likes = t.metrics?.likes || 0;
      const retweets = t.metrics?.retweets || 0;
      const replies = t.metrics?.replies || 0;
      const quotes = t.metrics?.quotes || 0;
      const engagements = likes + retweets + replies + quotes;

      if (!tweetsByDayMap[key]) {
        tweetsByDayMap[key] = { count: 0, impressions: 0 };
      }
      tweetsByDayMap[key].count += 1;
      tweetsByDayMap[key].impressions += impressions;

      if (!engagementByDayMap[key]) {
        engagementByDayMap[key] = { engagement: 0, impressions: 0 };
      }
      engagementByDayMap[key].engagement += engagements;
      engagementByDayMap[key].impressions += impressions;
    });

    const tweetsByDay = Object.entries(tweetsByDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        count: v.count,
        impressions: v.impressions,
      }));

    const engagementByDay = Object.entries(engagementByDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        engagement: v.engagement,
        rate:
          v.impressions > 0
            ? (v.engagement / v.impressions) * 100
            : 0,
      }));

    return { tweetsByDay, engagementByDay };
  }, [recentTweets]);

  const refresh = () => {
    fetchTwitterData();
  };

  return {
    userInfo,
    recentTweets,
    topTweets,
    performanceTrends, // 30‑day summary
    trends,            // tweetsByDay + engagementByDay for charts
    metrics,
    loading,
    error,
    refresh,
  };
}
