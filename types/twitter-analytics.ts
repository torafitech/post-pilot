// types/twitter-analytics.ts
export interface TwitterChannelInfo {
  id: string;
  username: string;
  name: string;
  description?: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
  profileImageUrl?: string;
  verified: boolean;
  createdAt: string;
  location?: string;
  url?: string;
}

export interface TwitterMetrics {
  followers: number;
  followersChange: number;
  tweets: number;
  tweetsChange: number;
  totalImpressions: number;
  impressionsChange: number;
  engagementRate: number;
  engagementChange: number;
  profileVisits: number;
  mentions: number;
  retweetCount: number;
  likeCount: number;
  replyCount: number;
}

export interface TweetData {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  url: string;
  media?: {
    type: 'photo' | 'video' | 'gif';
    url: string;
  }[];
  hashtags?: string[];
  mentions?: string[];
  isReply: boolean;
  isRetweet: boolean;
  isQuote: boolean;
}

export interface TwitterPerformanceData {
  date: string;
  impressions: number;
  engagements: number;
  newFollowers: number;
  tweetCount: number;
}

export interface TwitterAudienceData {
  ageRange: string;
  percentage: number;
  count: number;
}

export interface TwitterLocationData {
  country: string;
  percentage: number;
  followers: number;
}

export interface TwitterMetricsData {
  totalImpressions: number;
  totalEngagements: number;
  totalTweets: number;
  avgEngagementRate: number;
  engagementRate: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  totalQuotes: number;
}

export interface TwitterTrendData {
  tweetsByDay: { date: string; count: number; impressions: number }[];
  engagementByDay: { date: string; engagement: number; rate: number }[];
  followersByDay: { date: string; count: number }[];
  topHashtags: { tag: string; count: number }[];
  topMentions: { username: string; count: number }[];
}