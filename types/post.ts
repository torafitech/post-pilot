import { Timestamp } from 'firebase/firestore';

export interface PostMetrics {
  reach?: number;
  impressions?: number;
  views?: number;
  likes?: number;
  comments?: number;
  saves?: number;
  shares?: number;
}

export interface SocialPost {
  status: string;
  id?: string;
  userId: string;               // uid
  platform: string;             // 'instagram' | 'youtube' | ...
  accountId: string;            // platform account id
  platformPostId: string;       // id returned by platform API
  caption: string;
  mediaUrl?: string;
  publishedAt: Timestamp | null;
  createdAt: Timestamp;
  metrics: PostMetrics;
  lastSyncedAt?: Timestamp | null;
}

// Add this type for scheduler + feed combined
export interface DashboardPost extends SocialPost {
  // present for scheduled jobs
  scheduledTime?: Timestamp;
  // multi-platform scheduled jobs
  platforms?: string[];
  publishedAt: Timestamp | null;
}
