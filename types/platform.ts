// types/platform.ts
export interface PlatformMetrics {
  platform: string;
  profile: PlatformProfile;
  content: PlatformContent[];
  analytics: PlatformAnalytics;
  trends: PlatformTrends;
  loading: boolean;
  error: string | null;
}

export interface PlatformProfile {
  id: string;
  name: string;
  handle: string;
  description?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  followersCount: number;
  followingCount?: number;
  postsCount: number;
  verified?: boolean;
  joinedDate?: string;
  website?: string;
  location?: string;
}

export interface PlatformContent {
  id: string;
  platformId: string;
  title?: string;
  caption?: string;
  content?: string;
  mediaUrls?: string[];
  publishedAt: string;
  metrics: ContentMetrics;
  type?: string;
  status?: string;
  tags?: string[];
}

export interface ContentMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  reach?: number;
  impressions?: number;
  engagementRate?: number;
  watchTime?: number;
  clicks?: number;
}

export interface PlatformAnalytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalReach: number;
  avgEngagementRate: number;
  topContent: PlatformContent | null;
  recentContent: PlatformContent[];
  growthRate: number;
}

export interface PlatformTrends {
  viewsByDay: Array<{ date: string; views: number }>;
  engagementByDay: Array<{ date: string; engagement: number }>;
  contentByMonth: Array<{ month: string; count: number }>;
  topPosts: PlatformContent[];
  demographics?: {
    ageGroups?: Array<{ group: string; percentage: number }>;
    gender?: Array<{ gender: string; percentage: number }>;
    countries?: Array<{ country: string; percentage: number }>;
  };
}

// Generic platform service interface
export interface PlatformService {
  fetchProfile(userId: string): Promise<PlatformProfile | null>;
  fetchContent(userId: string, limit?: number): Promise<PlatformContent[]>;
  fetchAnalytics(userId: string): Promise<PlatformAnalytics>;
  fetchTrends(userId: string, period?: string): Promise<PlatformTrends>;
  postContent(userId: string, content: any): Promise<any>;
}