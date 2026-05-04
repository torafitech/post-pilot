// lib/instagramAutomation.ts
// Instagram comment automation via Meta Graph API.
// REQUIRES scopes: instagram_basic, instagram_manage_comments, pages_show_list.
// REQUIRES env: META_GRAPH_VERSION (default v21.0).
import { adminDb } from '@/lib/firebaseAdmin';

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export async function fetchRecentMediaIds(
  igAcc: any,
  count = 10,
): Promise<{ ids: string[]; error?: string }> {
  const igUserId = igAcc.platformId;
  if (!igUserId) return { ids: [], error: 'Missing Instagram business user id.' };

  const url = `${GRAPH}/${igUserId}/media?fields=id,timestamp&limit=${count}&access_token=${encodeURIComponent(igAcc.accessToken)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error('[Instagram] list media error:', res.status, body);
      return { ids: [], error: `Instagram list-media failed (${res.status}).` };
    }
    const data = await res.json();
    return {
      ids: (data.data || [])
        .map((m: any) => m.id)
        .filter((v: any): v is string => typeof v === 'string'),
    };
  } catch (err: any) {
    return { ids: [], error: err.message };
  }
}

export interface IgComment {
  id: string;
  text: string;
  username: string;
}

export async function fetchMediaComments(
  igAcc: any,
  mediaId: string,
): Promise<{ comments: IgComment[]; error?: string }> {
  const url = `${GRAPH}/${mediaId}/comments?fields=id,text,username&access_token=${encodeURIComponent(igAcc.accessToken)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error('[Instagram] fetch comments error:', res.status, body);
      return { comments: [], error: `Instagram fetch-comments ${res.status}` };
    }
    const data = await res.json();
    return {
      comments: (data.data || [])
        .map((c: any) => ({
          id: c.id || '',
          text: c.text || '',
          username: c.username || '',
        }))
        .filter((c: IgComment) => c.id),
    };
  } catch (err: any) {
    return { comments: [], error: err.message };
  }
}

export async function replyToComment(
  igAcc: any,
  commentId: string,
  text: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH}/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        message: text,
        access_token: igAcc.accessToken,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[Instagram] reply error:', res.status, body);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Instagram] replyToComment error:', err.message);
    return false;
  }
}

export async function checkIGReplied(userId: string, commentId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .get();
  return doc.exists;
}

export async function markIGReplied(userId: string, commentId: string, type: string) {
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .set({ platform: 'instagram', repliedAt: new Date() });
}
