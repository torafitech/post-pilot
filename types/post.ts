// types/post.ts
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
  id?: string;
  userId: string;               // uid
  platform: string;             // 'instagram' | 'youtube' | ...
  accountId: string;            // platform account id
  platformPostId: string;       // id returned by platform API
  caption: string;
  mediaUrl?: string;
  publishedAt: any;             // Firestore Timestamp
  createdAt: any;               // Firestore Timestamp
  metrics: PostMetrics;
  lastSyncedAt?: any;           // Firestore Timestamp
}
