// lib/linkedinAutomation.ts
// LinkedIn automation helpers for Link Me and Auto Reply.
import { adminDb } from '@/lib/firebaseAdmin';

// v2 API — no LinkedIn-Version header required (stable, unlike /rest endpoints)
const LI_V2 = 'https://api.linkedin.com/v2';

const liHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'X-Restli-Protocol-Version': '2.0.0',
});

export interface LinkedInComment {
  id: string;       // full URN e.g. urn:li:comment:(urn:li:ugcPost:xxx,yyy)
  text: string;
  actorUrn: string; // urn:li:person:xxx — used to skip own comments
}

// Sanitize URN for use as Firestore document ID (no forward slashes)
function urnToDocId(urn: string): string {
  return urn.replace(/\//g, '_').replace(/[(),]/g, '-');
}

// Reads post URNs from Firestore (posts published via PostPilot) instead of
// calling /v2/ugcPosts which requires restricted r_member_social scope.
export async function fetchRecentLinkedInPostUrns(userId: string, count = 10): Promise<string[]> {
  try {
    const snap = await adminDb
      .collection('users').doc(userId)
      .collection('posts')
      .where('platform', '==', 'linkedin')
      .orderBy('publishedAt', 'desc')
      .limit(count)
      .get();
    return snap.docs.map((d) => d.data().platformPostId as string).filter(Boolean);
  } catch (err: any) {
    console.error('[LinkedIn] fetchRecentPostUrns (Firestore) error:', err.message);
    return [];
  }
}

export async function fetchLinkedInComments(liAcc: any, postUrn: string, count = 20): Promise<LinkedInComment[]> {
  try {
    const url = `${LI_V2}/socialActions/${encodeURIComponent(postUrn)}/comments?count=${count}`;
    const res = await fetch(url, { headers: liHeaders(liAcc.accessToken) });
    if (!res.ok) {
      console.error('[LinkedIn] fetchComments', res.status, await res.text());
      return [];
    }
    const data = await res.json();
    return (data.elements || []).map((c: any): LinkedInComment => ({
      id: c.id as string,
      text: c.message?.text || '',
      actorUrn: c.actor as string,
    }));
  } catch (err: any) {
    console.error('[LinkedIn] fetchComments error:', err.message);
    return [];
  }
}

export async function replyToLinkedInComment(
  liAcc: any,
  commentUrn: string,
  replyText: string,
): Promise<boolean> {
  try {
    const url = `${LI_V2}/socialActions/${encodeURIComponent(commentUrn)}/comments`;
    const res = await fetch(url, {
      method: 'POST',
      headers: liHeaders(liAcc.accessToken),
      body: JSON.stringify({
        actor: liAcc.authorUrn,
        message: { text: replyText },
      }),
    });
    if (!res.ok) {
      console.error('[LinkedIn] replyToComment', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[LinkedIn] replyToComment error:', err.message);
    return false;
  }
}

export async function checkLIReplied(userId: string, commentId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(urnToDocId(commentId))
    .get();
  return doc.exists;
}

export async function markLIReplied(userId: string, commentId: string, type: string): Promise<void> {
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(urnToDocId(commentId))
    .set({ platform: 'linkedin', commentUrn: commentId, repliedAt: new Date() });
}
