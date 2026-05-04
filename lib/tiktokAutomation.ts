// lib/tiktokAutomation.ts
// TikTok comment fetching. NOTE: TikTok's public API does NOT expose a
// comment-reply endpoint to non-partner apps as of 2025-Q1 — replying
// to comments requires the Marketing or Content Moderation partner tier.
// This module fetches recent videos + comments so the diagnostic surface
// works; replyToComment() will return false with a clear error until the
// app is granted comment.create scope.
import { adminDb } from '@/lib/firebaseAdmin';

const TIKTOK_API = 'https://open.tiktokapis.com/v2';

export async function fetchRecentVideoIds(
  ttAcc: any,
  count = 10,
): Promise<{ ids: string[]; error?: string }> {
  try {
    const res = await fetch(`${TIKTOK_API}/video/list/?fields=id,create_time`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ttAcc.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ max_count: Math.min(count, 20) }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[TikTok] list videos error:', res.status, body);
      return { ids: [], error: `TikTok list-videos failed (${res.status}).` };
    }
    const data = await res.json();
    return {
      ids: (data?.data?.videos || [])
        .map((v: any) => v.id)
        .filter((v: any): v is string => typeof v === 'string'),
    };
  } catch (err: any) {
    return { ids: [], error: err.message };
  }
}

export interface TtComment {
  id: string;
  text: string;
  userId: string;
}

export async function fetchVideoComments(
  ttAcc: any,
  videoId: string,
): Promise<{ comments: TtComment[]; error?: string }> {
  try {
    const res = await fetch(
      `${TIKTOK_API}/comment/list/?fields=id,text,user_id`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ttAcc.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ video_id: videoId, max_count: 50 }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      console.error('[TikTok] fetch comments error:', res.status, body);
      return { comments: [], error: `TikTok comments ${res.status}` };
    }
    const data = await res.json();
    return {
      comments: (data?.data?.comments || [])
        .map((c: any) => ({
          id: c.id || '',
          text: c.text || '',
          userId: c.user_id || '',
        }))
        .filter((c: TtComment) => c.id),
    };
  } catch (err: any) {
    return { comments: [], error: err.message };
  }
}

export async function replyToComment(
  ttAcc: any,
  videoId: string,
  parentCommentId: string,
  text: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${TIKTOK_API}/comment/create/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ttAcc.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId,
        text,
        parent_comment_id: parentCommentId,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[TikTok] reply error:', res.status, body);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[TikTok] replyToComment error:', err.message);
    return false;
  }
}

export async function checkTTReplied(userId: string, commentId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .get();
  return doc.exists;
}

export async function markTTReplied(userId: string, commentId: string, type: string) {
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .set({ platform: 'tiktok', repliedAt: new Date() });
}
