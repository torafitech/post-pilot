// lib/services/platforms/youtube.service.ts
import {
  PlatformService,
  PlatformProfile,
  PlatformContent,
  PlatformAnalytics,
  PlatformTrends,
} from '@/types/platform';
import { adminDb } from '@/lib/firebaseAdmin';
import { google, youtube_v3 } from 'googleapis';

export class YouTubeService implements PlatformService {
  private async getAuthClient(userId: string) {
    const snap = await adminDb.collection('users').doc(userId).get();
    if (!snap.exists) return null;

    const userData = snap.data() as any;
    const accounts = userData.connectedAccounts || [];
    const youtubeAccount = accounts.find((acc: any) => acc.platform === 'youtube');

    if (!youtubeAccount) return null;

    const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
    const redirectUri =
      process.env.YOUTUBE_REDIRECT_URI ||
      'https://www.starlingpost.com/api/auth/youtube/callback';

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      access_token: youtubeAccount.accessToken,
      refresh_token: youtubeAccount.refreshToken || undefined,
    });

    // Refresh token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.warn('YouTube token refresh failed:', err);
    }

    return { client: oauth2Client, account: youtubeAccount };
  }

  async fetchProfile(userId: string): Promise<PlatformProfile | null> {
    try {
      const auth = await this.getAuthClient(userId);
      if (!auth) return null;

      const youtube = google.youtube({ version: 'v3', auth: auth.client });

      const channelParams: youtube_v3.Params$Resource$Channels$List = {
        part: ['snippet', 'statistics', 'brandingSettings'],
        mine: true,
      };

      const channelRes = await youtube.channels.list(channelParams);

      const channel = channelRes.data.items?.[0];
      if (!channel) return null;

      const stats = channel.statistics || {};
      const snippet = channel.snippet || {};

      return {
        id: channel.id || '',
        name: snippet.title || '',
        handle: snippet.customUrl || '',
        description: snippet.description || '',
        profileImageUrl: snippet.thumbnails?.high?.url || '',
        bannerImageUrl: channel.brandingSettings?.image?.bannerExternalUrl || '',
        followersCount: parseInt(stats.subscriberCount || '0', 10),
        postsCount: parseInt(stats.videoCount || '0', 10),
        verified: false,
        joinedDate: snippet.publishedAt || '',
      };
    } catch (error) {
      console.error('YouTubeService.fetchProfile error:', error);
      return null;
    }
  }

  async fetchContent(userId: string, limit: number = 100): Promise<PlatformContent[]> {
    try {
      const auth = await this.getAuthClient(userId);
      if (!auth) return [];

      const youtube = google.youtube({ version: 'v3', auth: auth.client });

      let allVideos: PlatformContent[] = [];
      let nextPageToken: string | undefined = '';

      do {
        const searchParams: youtube_v3.Params$Resource$Search$List = {
          part: ['snippet'],
          channelId: auth.account.platformId,
          type: ['video'],
          maxResults: 50,
          pageToken: nextPageToken || undefined,
          order: 'date',
        };

        const searchRes = await youtube.search.list(searchParams);

        const searchItems = searchRes.data.items ?? [];

        const videoIds = searchItems
          .map(item => item.id?.videoId || null)
          .filter((id): id is string => !!id);

        if (videoIds.length > 0) {
          const videoParams: youtube_v3.Params$Resource$Videos$List = {
            part: ['snippet', 'statistics', 'contentDetails', 'status'],
            id: videoIds,
          };

          const videosRes = await youtube.videos.list(videoParams);

          const videos = videosRes.data.items ?? [];

          allVideos = allVideos.concat(
            videos.map((video: youtube_v3.Schema$Video): PlatformContent => ({
              id: video.id || '',
              platformId: video.id || '',
              title: video.snippet?.title || '',
              caption: video.snippet?.description || '',
              mediaUrls: [video.snippet?.thumbnails?.high?.url || ''],
              publishedAt: video.snippet?.publishedAt || '',
              metrics: {
                views: parseInt(video.statistics?.viewCount || '0', 10),
                likes: parseInt(video.statistics?.likeCount || '0', 10),
                comments: parseInt(video.statistics?.commentCount || '0', 10),
              },
              type: 'video',
              status: video.status?.privacyStatus || 'private',
            }))
          );
        }

        nextPageToken = searchRes.data.nextPageToken || '';
      } while (nextPageToken && allVideos.length < limit);

      return allVideos.slice(0, limit);
    } catch (error) {
      console.error('YouTubeService.fetchContent error:', error);
      return [];
    }
  }

  async fetchAnalytics(userId: string): Promise<PlatformAnalytics> {
    try {
      const content = await this.fetchContent(userId, 100);

      const totalViews = content.reduce(
        (sum, item) => sum + (item.metrics.views || 0),
        0
      );
      const totalLikes = content.reduce(
        (sum, item) => sum + (item.metrics.likes || 0),
        0
      );
      const totalComments = content.reduce(
        (sum, item) => sum + (item.metrics.comments || 0),
        0
      );
      const totalEngagement = totalLikes + totalComments;
      const avgEngagementRate =
        totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

      const topContent =
        content.length > 0
          ? content.reduce((prev, current) =>
              (prev.metrics.views || 0) > (current.metrics.views || 0)
                ? prev
                : current
            )
          : null;

      const recentContent = [...content]
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 5);

      return {
        totalViews,
        totalLikes,
        totalComments,
        totalShares: 0, // YouTube doesn't have shares in the same way
        totalReach: totalViews,
        avgEngagementRate,
        topContent,
        recentContent,
        growthRate: 0, // TODO: calculate vs previous period
      };
    } catch (error) {
      console.error('YouTubeService.fetchAnalytics error:', error);
      return {
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalReach: 0,
        avgEngagementRate: 0,
        topContent: null,
        recentContent: [],
        growthRate: 0,
      };
    }
  }

  async fetchTrends(userId: string, period: string = '30d'): Promise<PlatformTrends> {
    try {
      const content = await this.fetchContent(userId, 100);

      // Calculate days based on period
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const viewsByDay: Array<{ date: string; views: number }> = [];
      const engagementByDay: Array<{ date: string; engagement: number }> = [];
      const contentByMonth: Array<{ month: string; count: number }> = [];

      // Last X days trend
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayContent = content.filter(c => {
          const contentDate = new Date(c.publishedAt)
            .toISOString()
            .split('T')[0];
          return contentDate === dateStr;
        });

        viewsByDay.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          views: dayContent.reduce(
            (sum, c) => sum + (c.metrics.views || 0),
            0
          ),
        });

        engagementByDay.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          engagement: dayContent.reduce(
            (sum, c) =>
              sum + (c.metrics.likes || 0) + (c.metrics.comments || 0),
            0
          ),
        });
      }

      // Last 6 months distribution
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStr = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        });

        const monthContent = content.filter(c => {
          const contentDate = new Date(c.publishedAt);
          return (
            contentDate.getMonth() === date.getMonth() &&
            contentDate.getFullYear() === date.getFullYear()
          );
        });

        contentByMonth.push({
          month: monthStr,
          count: monthContent.length,
        });
      }

      // Top 5 posts by engagement
      const topPosts = [...content]
        .sort(
          (a, b) =>
            (b.metrics.likes || 0) +
              (b.metrics.comments || 0) -
            ((a.metrics.likes || 0) + (a.metrics.comments || 0))
        )
        .slice(0, 5);

      return {
        viewsByDay,
        engagementByDay,
        contentByMonth,
        topPosts,
      };
    } catch (error) {
      console.error('YouTubeService.fetchTrends error:', error);
      return {
        viewsByDay: [],
        engagementByDay: [],
        contentByMonth: [],
        topPosts: [],
      };
    }
  }

  async postContent(userId: string, content: any): Promise<any> {
    try {
      const auth = await this.getAuthClient(userId);
      if (!auth) throw new Error('YouTube not connected');

      const youtube = google.youtube({ version: 'v3', auth: auth.client });

      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: content.title,
            description: content.description,
            tags: content.tags,
            categoryId: content.categoryId || '22',
          },
          status: {
            privacyStatus: content.privacy || 'public',
            publishAt: content.scheduledFor,
          },
        },
        media: {
          mimeType: 'video/*',
          body: content.videoFile || null,
        },
      });

      return {
        success: true,
        videoId: response.data.id,
        videoUrl: `https://www.youtube.com/watch?v=${response.data.id}`,
      };
    } catch (error) {
      console.error('YouTubeService.postContent error:', error);
      throw error;
    }
  }
}
