export interface YouTubeProfile {
  channelId: string;
  channelName: string;
  channelHandle: string;
  profileImage: string;
  subscribers: number;
  viewCount: number;
  videoCount: number;
  description?: string;
  verified?: boolean;
}

export interface YouTubeStat {
  label: string;
  value: string | number;
  trend?: number;
  icon: React.ReactNode;
}

export interface YouTubeStatsData {
  totalReach: number;
  engagement: number;
  totalPosts: number;
  avgEngagementRate: number;
  trends: {
    reach: number;
    engagement: number;
    posts: number;
    engagementRate: number;
  };
}
