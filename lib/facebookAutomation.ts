// lib/facebookAutomation.ts
// Facebook Page comment automation via Meta Graph API.
// REQUIRES scopes: pages_read_engagement, pages_manage_engagement.
import { adminDb } from '@/lib/firebaseAdmin';

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export async function fetchRecentPostIds(
  fbAcc: any,
  count = 10,
): Promise<{ ids: string[]; error?: string }> {
  const pageId = fbAcc.platformId;
  if (!pageId) return { ids: [], error: 'Missing Facebook page id.' };

  const url = `${GRAPH}/${pageId}/posts?fields=id&limit=${count}&access_token=${encodeURIComponent(fbAcc.accessToken)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error('[Facebook] list posts error:', res.status, body);
      return { ids: [], error: `Facebook list-posts failed (${res.status}).` };
    }
    const data = await res.json();
    return {
      ids: (data.data || [])
        .map((p: any) => p.id)
        .filter((v: any): v is string => typeof v === 'string'),
    };
  } catch (err: any) {
    return { ids: [], error: err.message };
  }
}

export interface FbComment {
  id: string;
  text: string;
  fromId: string;
  fromName: string;
}

export async function fetchPostComments(
  fbAcc: any,
  postId: string,
): Promise<{ comments: FbComment[]; error?: string }> {
  const url = `${GRAPH}/${postId}/comments?fields=id,message,from&access_token=${encodeURIComponent(fbAcc.accessToken)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error('[Facebook] fetch comments error:', res.status, body);
      return { comments: [], error: `Facebook fetch-comments ${res.status}` };
    }
    const data = await res.json();
    return {
      comments: (data.data || [])
        .map((c: any) => ({
          id: c.id || '',
          text: c.message || '',
          fromId: c.from?.id || '',
          fromName: c.from?.name || '',
        }))
        .filter((c: FbComment) => c.id),
    };
  } catch (err: any) {
    return { comments: [], error: err.message };
  }
}

export async function replyToComment(
  fbAcc: any,
  commentId: string,
  text: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${GRAPH}/${commentId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        message: text,
        access_token: fbAcc.accessToken,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[Facebook] reply error:', res.status, body);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Facebook] replyToComment error:', err.message);
    return false;
  }
}

export async function checkFBReplied(userId: string, commentId: string, type: string): Promise<boolean> {
  // Comment IDs include "_" so they're safe; sanitize anyway.
  const safe = commentId.replace(/\//g, '_');
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(safe)
    .get();
  return doc.exists;
}

export async function markFBReplied(userId: string, commentId: string, type: string) {
  const safe = commentId.replace(/\//g, '_');
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(safe)
    .set({ platform: 'facebook', repliedAt: new Date() });
}
