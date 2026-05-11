// lib/threadsAutomation.ts
// Threads reply automation via Meta Threads API.
// REQUIRES scopes: threads_basic, threads_read_replies, threads_manage_replies.
import { adminDb } from '@/lib/firebaseAdmin';

const THREADS_API = 'https://graph.threads.net/v1.0';

export async function fetchRecentThreadIds(
  thAcc: any,
  count = 10,
): Promise<{ ids: string[]; error?: string }> {
  const userId = thAcc.platformId;
  if (!userId) return { ids: [], error: 'Missing Threads user id.' };

  const url = `${THREADS_API}/${userId}/threads?fields=id,timestamp&limit=${count}&access_token=${encodeURIComponent(thAcc.accessToken)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error('[Threads] list threads error:', res.status, body);
      return { ids: [], error: `Threads list failed (${res.status}).` };
    }
    const data = await res.json();
    return {
      ids: (data.data || [])
        .map((t: any) => t.id)
        .filter((v: any): v is string => typeof v === 'string'),
    };
  } catch (err: any) {
    return { ids: [], error: err.message };
  }
}

export interface ThReply {
  id: string;
  text: string;
  username: string;
  userId: string;
}

export async function fetchThreadReplies(
  thAcc: any,
  threadId: string,
): Promise<{ replies: ThReply[]; error?: string }> {
  const url = `${THREADS_API}/${threadId}/replies?fields=id,text,username,from&access_token=${encodeURIComponent(thAcc.accessToken)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      console.error('[Threads] fetch replies error:', res.status, body);
      return { replies: [], error: `Threads replies ${res.status}` };
    }
    const data = await res.json();
    return {
      replies: (data.data || [])
        .map((r: any) => ({
          id: r.id || '',
          text: r.text || '',
          username: r.username || r.from?.username || '',
          userId: String(r.from?.id || ''),
        }))
        .filter((r: ThReply) => r.id),
    };
  } catch (err: any) {
    return { replies: [], error: err.message };
  }
}

export async function postThreadReply(
  thAcc: any,
  parentThreadId: string,
  text: string,
): Promise<boolean> {
  const userId = thAcc.platformId;
  if (!userId) return false;
  try {
    // Step 1: create reply container
    const initRes = await fetch(`${THREADS_API}/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type: 'TEXT',
        text,
        reply_to_id: parentThreadId,
        access_token: thAcc.accessToken,
      }),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || !initData.id) {
      console.error('[Threads] reply container error:', initRes.status, initData);
      return false;
    }
    // Step 2: publish reply
    const pubRes = await fetch(`${THREADS_API}/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: initData.id,
        access_token: thAcc.accessToken,
      }),
    });
    if (!pubRes.ok) {
      const body = await pubRes.text();
      console.error('[Threads] reply publish error:', pubRes.status, body);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[Threads] postReply error:', err.message);
    return false;
  }
}

export async function checkTHReplied(userId: string, replyId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(replyId)
    .get();
  return doc.exists;
}

export async function markTHReplied(userId: string, replyId: string, type: string) {
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(replyId)
    .set({ platform: 'threads', repliedAt: new Date() });
}
