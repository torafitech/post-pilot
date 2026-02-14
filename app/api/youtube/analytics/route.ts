// app/api/youtube/analytics/route.ts
import { adminDb } from '@/lib/firebaseAdmin';
import { google, youtube_v3 } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export interface YouTubeAnalyticsResponse {
  channelInfo: any;
  videos: any[];
  videoMetrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalWatchTime: number;
    avgViewDuration: number;
    engagementRate: number;
    topVideo: any;
    recentVideos: any[];
  };
  demographics?: any;
}

async function getYouTubeAccount(userId: string) {
  const snap = await adminDb.collection('users').doc(userId).get();
  if (!snap.exists) return null;
  const userData = snap.data() as any;
  const accounts = userData.connectedAccounts || [];
  return accounts.find((acc: any) => acc.platform === 'youtube') || null;
}

function calculateWatchTime(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('[YT ANALYTICS] Fetching for userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const youtubeAccount = await getYouTubeAccount(userId);

    if (!youtubeAccount) {
      return NextResponse.json(
        { error: 'YouTube not connected' },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken } = youtubeAccount;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 401 }
      );
    }

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
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    });

    // Refresh token if needed
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);

      // Update token in Firestore
      const userRef = adminDb.collection('users').doc(userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const userData = userSnap.data() as any;
        const accounts = userData.connectedAccounts || [];
        const updatedAccounts = accounts.map((acc: any) => {
          if (acc.platform === 'youtube') {
            return {
              ...acc,
              accessToken: credentials.access_token,
              refreshToken: credentials.refresh_token || acc.refreshToken,
            };
          }
          return acc;
        });

        await userRef.update({ connectedAccounts: updatedAccounts });
      }
    } catch (err) {
      const e = err as Error;
      console.warn('[YT ANALYTICS] Token refresh warning:', e.message);
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 1. Fetch channel details
    const channelParams: youtube_v3.Params$Resource$Channels$List = {
      part: ['snippet', 'statistics', 'brandingSettings'],
      mine: true,
    };

    const channelRes = await youtube.channels.list(channelParams);

    console.log('[YT ANALYTICS] Channel data received:', {
      itemCount: channelRes.data.items?.length,
    });

    if (!channelRes.data.items || channelRes.data.items.length === 0) {
      return NextResponse.json(
        { error: 'No YouTube channel found' },
        { status: 404 }
      );
    }

    const channel = channelRes.data.items[0]!;
    const stats = channel.statistics || {};
    const snippet = channel.snippet || {};
    const branding = channel.brandingSettings || {};

    const channelInfo = {
      channelId: channel.id || '',
      channelName: snippet.title || 'Unknown Channel',
      description: snippet.description || '',
      subscriberCount: parseInt(
        stats.hiddenSubscriberCount ? '0' : stats.subscriberCount || '0',
        10
      ),
      viewCount: parseInt(stats.viewCount || '0', 10),
      videoCount: parseInt(stats.videoCount || '0', 10),
      profileImageUrl: snippet.thumbnails?.high?.url || '',
      bannerImageUrl: branding.image?.bannerExternalUrl || '',
      customUrl: snippet.customUrl || undefined,
      country: branding.channel?.country || undefined,
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      verifiedBadge: false,
    };

    // 2. Fetch videos
    let videos: any[] = [];
    let nextPageToken: string | undefined = '';

    do {
      const searchParams: youtube_v3.Params$Resource$Search$List = {
        part: ['snippet'],
        channelId: channel.id || undefined,
        type: ['video'],
        maxResults: 50,
        pageToken: nextPageToken || undefined,
        order: 'date',
      };

      const videosRes = await youtube.search.list(searchParams);

      const searchItems = videosRes.data.items ?? [];

      const videoIds = searchItems
        .map(item => item.id?.videoId || null)
        .filter((id): id is string => !!id);

      if (videoIds.length > 0) {
        const videoParams: youtube_v3.Params$Resource$Videos$List = {
          part: ['snippet', 'statistics', 'contentDetails', 'status'],
          id: videoIds,
        };

        const videoDetailsRes = await youtube.videos.list(videoParams);

        const videoDetails = videoDetailsRes.data.items ?? [];

        videos = videos.concat(
          videoDetails.map(video => ({
            id: video.id,
            title: video.snippet?.title || '',
            description: video.snippet?.description || '',
            thumbnail: video.snippet?.thumbnails?.high?.url || '',
            views: parseInt(video.statistics?.viewCount || '0', 10),
            likes: parseInt(video.statistics?.likeCount || '0', 10),
            comments: parseInt(video.statistics?.commentCount || '0', 10),
            publishedAt: video.snippet?.publishedAt || '',
            privacyStatus: video.status?.privacyStatus || 'private',
            duration: video.contentDetails?.duration,
            watchTime: calculateWatchTime(
              video.contentDetails?.duration || ''
            ),
          }))
        );
      }

      nextPageToken = videosRes.data.nextPageToken || '';
    } while (nextPageToken && videos.length < 100);

    // 3. Calculate metrics
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    const totalLikes = videos.reduce((sum, video) => sum + video.likes, 0);
    const totalComments = videos.reduce(
      (sum, video) => sum + video.comments,
      0
    );
    const totalWatchTime = videos.reduce(
      (sum, video) => sum + video.watchTime,
      0
    );
    const avgViewDuration =
      videos.length > 0
        ? Math.round(totalWatchTime / videos.length)
        : 0;
    const engagementRate =
      totalViews > 0
        ? ((totalLikes + totalComments) / totalViews) * 100
        : 0;

    // 4. Find top video
    const topVideo =
      videos.length > 0
        ? videos.reduce((prev, current) =>
            prev.views > current.views ? prev : current
          )
        : null;

    // 5. Get recent videos
    const recentVideos = [...videos]
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
      )
      .slice(0, 5);

    // 6. Try to fetch analytics data if available
    let demographics: any;
    try {
      const analyticsParams: youtube_v3.Params$Resource$Channels$List = {
        part: ['statistics', 'brandingSettings', 'topicDetails'],
        id: channel.id ? [channel.id] : undefined,
      };

      await youtube.channels.list(analyticsParams);

      demographics = {
        // populate if you later use Analytics API
      };
    } catch (err) {
      const e = err as Error;
      console.log(
        '[YT ANALYTICS] Analytics data not available:',
        e.message
      );
    }

    const response: YouTubeAnalyticsResponse = {
      channelInfo,
      videos,
      videoMetrics: {
        totalViews,
        totalLikes,
        totalComments,
        totalWatchTime,
        avgViewDuration,
        engagementRate,
        topVideo,
        recentVideos,
      },
      demographics,
    };

    console.log('[YT ANALYTICS] Successfully fetched:', {
      channelName: channelInfo.channelName,
      subscribers: channelInfo.subscriberCount,
      videosCount: videos.length,
      totalViews,
      engagementRate: `${engagementRate.toFixed(2)}%`,
    });

    return NextResponse.json(response);
  } catch (error) {
    const e = error as Error;
    console.error('[YT ANALYTICS] Error:', e.message);

    if (
      e.message.includes('invalid_grant') ||
      e.message.includes('expired')
    ) {
      return NextResponse.json(
        { error: 'Token expired, please reconnect', needsReauth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch YouTube analytics',
        details: e.message,
      },
      { status: 500 }
    );
  }
}
