export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log('[YT CHANNEL INFO] Fetching for userId:', userId);

    // ============ Validate userId ============
    if (!userId) {
      console.error('[YT CHANNEL INFO] Missing userId');
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // ============ Get stored YouTube credentials ============
    console.log('[YT CHANNEL INFO] Getting YouTube account from Firestore');

    let youtubeAccount;
    try {
      // ✅ Correct Admin SDK API
      const youtubeDoc = await adminDb
        .collection('users')
        .doc(userId)
        .collection('accounts')
        .doc('youtube')
        .get();

      // ✅ Check property, not method
      if (!youtubeDoc.exists) {
        console.log('[YT CHANNEL INFO] No YouTube account connected for user:', userId);
        return NextResponse.json(
          { error: 'YouTube account not connected' },
          { status: 404 }
        );
      }

      youtubeAccount = youtubeDoc.data();
      console.log('[YT CHANNEL INFO] YouTube account found');
    } catch (dbError: any) {
      console.error('[YT CHANNEL INFO] Firestore error:', {
        code: dbError?.code,
        message: dbError?.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch credentials from database' },
        { status: 500 }
      );
    }

    // ============ Validate access token ============
    if (!youtubeAccount?.accessToken) {
      console.log('[YT CHANNEL INFO] No access token found');
      return NextResponse.json(
        { error: 'No access token. Please reconnect YouTube.' },
        { status: 401 }
      );
    }

    // ============ Check token expiration ============
    const expiresAt = youtubeAccount.expiresAt?.toMillis?.() || youtubeAccount.expiresAt;
    const isExpired = expiresAt && expiresAt < Date.now();

    console.log('[YT CHANNEL INFO] Token status:', {
      hasToken: !!youtubeAccount.accessToken,
      isExpired,
      expiresAt,
    });

    if (isExpired && youtubeAccount.refreshToken) {
      console.log('[YT CHANNEL INFO] Token expired, attempting refresh...');

      try {
        const newTokens = await refreshYouTubeToken(youtubeAccount.refreshToken);
        youtubeAccount.accessToken = newTokens.access_token;
        youtubeAccount.expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

        // Update database
        await adminDb
          .collection('users')
          .doc(userId)
          .collection('accounts')
          .doc('youtube')
          .update({
            accessToken: newTokens.access_token,
            expiresAt: youtubeAccount.expiresAt,
          });

        console.log('[YT CHANNEL INFO] Token refreshed successfully');
      } catch (refreshErr: any) {
        console.error('[YT CHANNEL INFO] Token refresh failed:', refreshErr?.message);
        return NextResponse.json(
          { error: 'Token refresh failed. Please reconnect YouTube.' },
          { status: 401 }
        );
      }
    }

    // ============ Fetch channel info from YouTube API ============
    console.log('[YT CHANNEL INFO] Fetching from YouTube API');

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: youtubeAccount.accessToken,
    });

    try {
      const youtube = google.youtube('v3');
      const channelResponse = await youtube.channels.list({
        part: ['snippet', 'statistics'],
        mine: true,
      });

      const channel = channelResponse.data.items?.[0];

      if (!channel) {
        console.error('[YT CHANNEL INFO] No channel found');
        return NextResponse.json(
          { error: 'YouTube channel not found' },
          { status: 404 }
        );
      }

      console.log('[YT CHANNEL INFO] Channel retrieved:', channel.id);

      // ============ Return channel info ============
      return NextResponse.json({
        channelId: channel.id,
        channelName: channel.snippet?.title,
        channelHandle: channel.snippet?.customUrl || `@${channel.snippet?.title}`,
        profileImage: channel.snippet?.thumbnails?.default?.url,
        subscribers: parseInt(channel.statistics?.subscriberCount || '0'),
        viewCount: parseInt(channel.statistics?.viewCount || '0'),
        videoCount: parseInt(channel.statistics?.videoCount || '0'),
        description: channel.snippet?.description,
      });
    } catch (youtubeError: any) {
      console.error('[YT CHANNEL INFO] YouTube API error:', {
        message: youtubeError?.message,
        code: youtubeError?.code,
      });
      return NextResponse.json(
        { error: 'Failed to fetch YouTube channel info' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[YT CHANNEL INFO] Unexpected error:', error?.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============ Helper: Refresh YouTube Token ============
async function refreshYouTubeToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Token refresh failed: ${errorData.error}`);
  }

  return response.json();
}
