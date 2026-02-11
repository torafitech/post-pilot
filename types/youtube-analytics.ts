export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y';

export interface ChannelStats {
  subscribers: number;
  subscriberChange: number;
  videos: number;
  videoChange: number;
  totalViews: number;
  viewChange: number;
  watchTime: number;
  watchTimeChange: number;
}

export interface PerformanceData {
  date: string;
  views: number;
  watchTime: number;
  subscribers: number;
}

export interface VideoData {
  id: number;
  title: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  published: string;
  status: 'published' | 'draft' | 'scheduled';
  engagement: number;
  thumbnail: string;
}

export interface MetricData {
  label: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  data: number[];
}

export interface AudienceData {
  country: string;
  percentage: number;
  views: number;
}

export interface TrafficSource {
  source: string;
  percentage: number;
}

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
