// lib/linkedinAutomation.ts
// Shared LinkedIn helpers for Link Me and Auto Reply automation.
// Uses the LinkedIn Versioned REST API. Requires:
//   - w_member_social: to POST comments
//   - r_member_social: to LIST recent posts and READ comments
import { adminDb } from '@/lib/firebaseAdmin';

const LI_VERSION = '202411';

function liHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
    'LinkedIn-Version': LI_VERSION,
  };
}

/**
 * Fetch the connected member's most recent post URNs.
 * Returns an empty list if the app doesn't have r_member_social scope.
 */
export async function fetchRecentPostUrns(
  liAcc: any,
  count = 10,
): Promise<{ urns: string[]; error?: string }> {
  if (!liAcc.authorUrn) return { urns: [], error: 'Missing LinkedIn author URN — please reconnect.' };

  const author = encodeURIComponent(liAcc.authorUrn);
  const url = `https://api.linkedin.com/rest/posts?q=author&author=${author}&count=${Math.min(count, 50)}&sortBy=LAST_MODIFIED`;

  try {
    const res = await fetch(url, { headers: liHeaders(liAcc.accessToken) });
    if (!res.ok) {
      const body = await res.text();
      console.error('[LinkedIn] list posts error:', res.status, body);
      return { urns: [], error: `LinkedIn list-posts failed (${res.status}). Likely missing r_member_social scope.` };
    }
    const data = await res.json();
    const urns = (data.elements || [])
      .map((p: any) => p.id || p.urn || p.entityUrn)
      .filter((u: any): u is string => typeof u === 'string' && u.length > 0);
    return { urns };
  } catch (err: any) {
    console.error('[LinkedIn] fetchRecentPostUrns error:', err.message);
    return { urns: [], error: err.message };
  }
}

export interface LinkedInComment {
  id: string;       // comment URN, used as Firestore dedup key
  text: string;
  actorUrn: string; // urn:li:person:xxx — to skip own comments
}

export async function fetchPostComments(
  liAcc: any,
  postUrn: string,
): Promise<{ comments: LinkedInComment[]; error?: string }> {
  const enc = encodeURIComponent(postUrn);
  const url = `https://api.linkedin.com/rest/socialActions/${enc}/comments?count=50`;
  try {
    const res = await fetch(url, { headers: liHeaders(liAcc.accessToken) });
    if (!res.ok) {
      const body = await res.text();
      console.error('[LinkedIn] fetch comments error:', res.status, body);
      return { comments: [], error: `LinkedIn fetch-comments ${res.status}` };
    }
    const data = await res.json();
    const comments: LinkedInComment[] = (data.elements || [])
      .map((c: any) => ({
        id: c.id || c.$URN || c.urn || '',
        text: c.message?.text || '',
        actorUrn: c.actor || '',
      }))
      .filter((c: LinkedInComment) => c.id);
    return { comments };
  } catch (err: any) {
    console.error('[LinkedIn] fetchPostComments error:', err.message);
    return { comments: [], error: err.message };
  }
}

export async function postComment(
  liAcc: any,
  postUrn: string,
  text: string,
): Promise<boolean> {
  const enc = encodeURIComponent(postUrn);
  const url = `https://api.linkedin.com/rest/socialActions/${enc}/comments`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: liHeaders(liAcc.accessToken),
      body: JSON.stringify({
        actor: liAcc.authorUrn,
        object: postUrn,
        message: { text },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[LinkedIn] post comment error:', res.status, body);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[LinkedIn] postComment error:', err.message);
    return false;
  }
}

// LinkedIn comment URNs contain ":", "(", ")", "," — all valid in Firestore
// doc IDs except slashes (which LinkedIn doesn't use here).
export async function checkLIReplied(userId: string, commentId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .get();
  return doc.exists;
}

export async function markLIReplied(userId: string, commentId: string, type: string) {
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .set({ platform: 'linkedin', repliedAt: new Date() });
}
