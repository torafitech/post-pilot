// lib/twitterAutomation.ts
// Shared Twitter helpers for Link Me and Auto Reply automation.
// Uses OAuth 1.0a + v1.1 API (standard access — no Elevated required).
import { TwitterApi } from 'twitter-api-v2';
import { adminDb } from '@/lib/firebaseAdmin';

export function buildTwitterClient(twAcc: any) {
  return new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY!,
    appSecret: process.env.TWITTER_APP_SECRET!,
    accessToken: twAcc.oauthToken,
    accessSecret: twAcc.oauthTokenSecret,
  });
}

/**
 * Fetch up to `count` recent mentions for this account using the v1.1
 * mentions timeline.  This requires only "Read" access — no elevated tier.
 */
export async function fetchMentions(twAcc: any, count = 20): Promise<TweetMention[]> {
  const client = buildTwitterClient(twAcc);
  try {
    const tweets = await client.v1.get('statuses/mentions_timeline.json', {
      count,
      tweet_mode: 'extended',
      include_entities: false,
    });
    return (tweets || []).map((t: any) => ({
      id: t.id_str as string,
      text: (t.full_text || t.text || '') as string,
      authorId: t.user?.id_str as string,
      authorHandle: t.user?.screen_name as string,
      inReplyToStatusId: t.in_reply_to_status_id_str as string | null,
    }));
  } catch (err: any) {
    console.error('[Twitter] fetchMentions error:', err.message);
    return [];
  }
}

export interface TweetMention {
  id: string;
  text: string;
  authorId: string;
  authorHandle: string;
  inReplyToStatusId: string | null;
}

/**
 * Reply to a tweet using v1.1 statuses/update.
 * Returns true on success.
 */
export async function replyToTweet(twAcc: any, inReplyToId: string, replyText: string): Promise<boolean> {
  const client = buildTwitterClient(twAcc);
  try {
    await client.v1.tweet(replyText, { in_reply_to_status_id: inReplyToId });
    return true;
  } catch (err: any) {
    console.error('[Twitter] replyToTweet error:', err.message);
    return false;
  }
}

// ── Dedup helpers ─────────────────────────────────────────────────────────────

export async function checkReplied(userId: string, tweetId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(tweetId)
    .get();
  return doc.exists;
}

export async function markReplied(userId: string, tweetId: string, type: string) {
  await adminDb
    .collection('users').doc(userId)
    .collection(`${type}Replies`).doc(tweetId)
    .set({ platform: 'twitter', repliedAt: new Date() });
}
