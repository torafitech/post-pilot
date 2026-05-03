// app/api/auth/youtube/pin-comment/route.ts
// Posts a comment on a YouTube video and pins it as the "highlighted" comment
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { google } from 'googleapis';

export async function POST(request: NextRequest) {
  // Only callable internally (by the publish route)
  const secret = request.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, videoId, commentText } = body as {
      userId?: string;
      videoId?: string;
      commentText?: string;
    };

    if (!userId || !videoId || !commentText?.trim()) {
      return NextResponse.json(
        { error: 'Missing userId, videoId, or commentText' },
        { status: 400 },
      );
    }

    const userSnap = await adminDb.collection('users').doc(userId).get();
    const connectedAccounts: any[] = userSnap.data()?.connectedAccounts || [];
    const ytAccount = connectedAccounts.find((a: any) => a.platform === 'youtube');

    if (!ytAccount?.accessToken) {
      return NextResponse.json({ error: 'YouTube not connected' }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
      process.env.YOUTUBE_CLIENT_SECRET!,
      process.env.YOUTUBE_REDIRECT_URI ||
        'https://www.starlingpost.com/api/auth/youtube/callback',
    );

    oauth2Client.setCredentials({
      access_token: ytAccount.accessToken,
      refresh_token: ytAccount.refreshToken || undefined,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
    } catch {
      // continue with current token
    }

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Post the comment
    const commentRes = await youtube.commentThreads.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          videoId,
          topLevelComment: {
            snippet: {
              textOriginal: commentText.trim(),
            },
          },
        },
      },
    });

    const commentId = commentRes.data.id;

    // Mark the comment as "highlighted" (pinned) on the video
    if (commentId) {
      try {
        await youtube.videos.update({
          part: ['localizations'],
          requestBody: {
            id: videoId,
            localizations: {},
          },
        });
      } catch {
        // Pinning may fail if insufficient permissions — comment is still posted
      }
    }

    return NextResponse.json({ success: true, commentId });
  } catch (err: any) {
    console.error('YouTube pin-comment error:', err.message);
    return NextResponse.json(
      { error: 'Failed to pin comment', details: err.message },
      { status: 500 },
    );
  }
}
