// lib/youtubeAutomation.ts
// Shared YouTube helpers for Link Me and Auto Reply automation.
// Fetches recent uploads from the connected channel directly — not
// limited to videos posted via StarlingPost.
import { google } from 'googleapis';
import { adminDb } from '@/lib/firebaseAdmin';

export function buildYouTubeClient(ytAcc: any) {
  const oauth2 = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
    process.env.YOUTUBE_CLIENT_SECRET!,
    process.env.YOUTUBE_REDIRECT_URI || 'https://www.starlingpost.com/api/auth/youtube/callback',
  );
  oauth2.setCredentials({
    access_token: ytAcc.accessToken,
    refresh_token: ytAcc.refreshToken || undefined,
  });
  return google.youtube({ version: 'v3', auth: oauth2 });
}

/**
 * Fetch the connected channel's most recent video IDs from its uploads
 * playlist. Returns up to `count` IDs (clamped to 50 by the API).
 */
export async function fetchRecentVideoIds(ytAcc: any, count = 10): Promise<string[]> {
  const youtube = buildYouTubeClient(ytAcc);
  try {
    // Prefer the exact connected channel ID — more reliable when one
    // Google account owns multiple channels.
    const ch = ytAcc.platformId
      ? await youtube.channels.list({ part: ['contentDetails'], id: [ytAcc.platformId] })
      : await youtube.channels.list({ part: ['contentDetails'], mine: true });

    const uploadsId =
      ch.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) return [];

    const items = await youtube.playlistItems.list({
      part: ['contentDetails'],
      playlistId: uploadsId,
      maxResults: Math.min(count, 50),
    });

    return (items.data.items || [])
      .map((i) => i.contentDetails?.videoId)
      .filter((v): v is string => !!v);
  } catch (err: any) {
    console.error('[YouTube] fetchRecentVideoIds error:', err.message);
    return [];
  }
}

export async function checkYTReplied(userId: string, commentId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .get();
  return doc.exists;
}

export async function markYTReplied(userId: string, commentId: string, type: string) {
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .set({ platform: 'youtube', repliedAt: new Date() });
}
