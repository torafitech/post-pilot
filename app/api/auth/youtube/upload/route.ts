// app/api/auth/youtube/upload/route.ts
import { adminDb } from '@/lib/firebaseAdmin';
import axios from 'axios';
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

async function getYouTubeAccount(userId: string) {
  const snap = await adminDb.collection('users').doc(userId).get();
  if (!snap.exists) return null;

  const userData = snap.data() as any;
  const accounts = userData.connectedAccounts || [];
  return accounts.find((acc: any) => acc.platform === 'youtube') || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, description, videoUrl, tags } = body as {
      userId?: string;
      title?: string;
      description?: string;
      videoUrl?: string;
      tags?: string[];
    };

    console.log('YouTube upload called for user:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 },
      );
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 },
      );
    }

    const youtubeAccount = await getYouTubeAccount(userId);

    if (!youtubeAccount) {
      return NextResponse.json(
        { error: 'YouTube not connected' },
        { status: 401 },
      );
    }

    const { accessToken, refreshToken } = youtubeAccount;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 401 },
      );
    }

    const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET!;
    const redirectUri =
      process.env.YOUTUBE_REDIRECT_URI ||
      'http://localhost:3000/api/auth/youtube/callback';

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
    });

    // Force refresh
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log('✅ Token refreshed');
    } catch (err: any) {
      console.warn('Token refresh failed, continuing:', err.message);
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    let uploadResponse: any = null;

    if (videoUrl) {
      console.log('Downloading video...');

      const videoResponse = await axios.get(videoUrl, {
        responseType: 'stream',
        timeout: 60000,
      });

      console.log('Uploading to YouTube...');

      // 🔑 FIX: Use string for 'part', not array
      // app/api/auth/youtube/upload/route.ts

      uploadResponse = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: title.trim().substring(0, 100),
            description: (description || 'Posted via PostPilot').substring(0, 5000),
            tags: Array.isArray(tags) ? tags.slice(0, 30) : ['postpilot'],
            categoryId: '22',
          },
          status: {
            privacyStatus: 'public',
          },
        },
        media: {
          mimeType: 'video/mp4',
          body: videoResponse.data,
        },
      });

      const videoId = uploadResponse.data.id;
      console.log('✅ YouTube uploaded, videoId =', videoId);

      return NextResponse.json({
        success: true,
        videoId,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });

    } else {
      console.log('Creating metadata-only entry...');

      uploadResponse = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: title.trim().substring(0, 100),
            description: (description || 'Posted via PostPilot')
              .substring(0, 5000),
            tags: Array.isArray(tags) ? tags.slice(0, 30) : ['postpilot'],
            categoryId: '22',
          },
          status: {
            privacyStatus: 'unlisted',
          },
        },
      });

      console.log('✅ Metadata created:', uploadResponse.data.id);
    }

    return NextResponse.json({
      success: true,
      videoId: uploadResponse.data.id,
      videoUrl: `https://www.youtube.com/watch?v=${uploadResponse.data.id}`,
    });
  } catch (error: any) {
    console.error('❌ Error:', error.message);

    if (
      error.message.includes('invalid_grant') ||
      error.message.includes('expired')
    ) {
      return NextResponse.json(
        { error: 'Token expired, please reconnect YouTube', needsReauth: true },
        { status: 401 },
      );
    }

    if (error.response?.data?.error) {
      console.error('API error:', error.response.data.error);
    }

    return NextResponse.json(
      { error: 'Failed to upload to YouTube', details: error.message },
      { status: 500 },
    );
  }
}
