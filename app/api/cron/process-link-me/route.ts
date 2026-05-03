// app/api/cron/process-link-me/route.ts
// Cron job: scan recent comments on all posts, fire Link Me rules
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { google } from 'googleapis';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

const MAX_USERS_PER_RUN = 10;
const MAX_POSTS_PER_USER = 5;

export async function GET(_req: NextRequest) {
  try {
    // 1) Find users who have at least one active Link Me rule
    const usersWithRules = await findUsersWithActiveRules();

    let totalReplied = 0;

    for (const userId of usersWithRules.slice(0, MAX_USERS_PER_RUN)) {
      try {
        const replied = await processUserLinkMe(userId);
        totalReplied += replied;
      } catch (err: any) {
        console.error('[LINK-ME] Error processing user', userId, err.message);
      }
    }

    return NextResponse.json({ success: true, totalReplied });
  } catch (err: any) {
    console.error('[LINK-ME] Cron error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function findUsersWithActiveRules(): Promise<string[]> {
  const userIds: string[] = [];

  // Firestore collection group query across all linkMeRules
  const snap = await adminDb
    .collectionGroup('linkMeRules')
    .where('isActive', '==', true)
    .limit(MAX_USERS_PER_RUN)
    .get();

  snap.docs.forEach((doc) => {
    // parent path: users/{userId}/linkMeRules/{ruleId}
    const userId = doc.ref.parent.parent?.id;
    if (userId && !userIds.includes(userId)) {
      userIds.push(userId);
    }
  });

  return userIds;
}

async function processUserLinkMe(userId: string): Promise<number> {
  let replied = 0;

  // Load user's active rules
  const rulesSnap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('linkMeRules')
    .where('isActive', '==', true)
    .get();

  if (rulesSnap.empty) return 0;

  const rules = rulesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

  // Load user's connected accounts
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const connectedAccounts: any[] = userSnap.data()?.connectedAccounts || [];

  // Load recent posts for this user
  const postsSnap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('posts')
    .orderBy('publishedAt', 'desc')
    .limit(MAX_POSTS_PER_USER)
    .get();

  for (const postDoc of postsSnap.docs) {
    const post = postDoc.data() as any;
    const platform = post.platform?.toLowerCase();

    const platformRules = rules.filter(
      (r: any) => r.platforms?.includes(platform),
    );
    if (platformRules.length === 0) continue;

    try {
      if (platform === 'youtube') {
        const ytAccount = connectedAccounts.find((a: any) => a.platform === 'youtube');
        if (!ytAccount) continue;
        const replies = await processYouTubeLinkMe(
          userId,
          post.platformPostId,
          platformRules,
          ytAccount,
        );
        replied += replies;
      } else if (platform === 'twitter') {
        const twAccount = connectedAccounts.find((a: any) => a.platform === 'twitter');
        if (!twAccount) continue;
        const replies = await processTwitterLinkMe(
          userId,
          post.platformPostId,
          platformRules,
          twAccount,
        );
        replied += replies;
      }
      // LinkedIn comment API requires elevated permissions — skipped for now
    } catch (err: any) {
      console.error('[LINK-ME] Platform error for post', postDoc.id, err.message);
    }
  }

  return replied;
}

async function processYouTubeLinkMe(
  userId: string,
  videoId: string,
  rules: any[],
  ytAccount: any,
): Promise<number> {
  const oauth2Client = buildYouTubeOAuth(ytAccount);
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  // Fetch recent comments
  const commentsRes = await youtube.commentThreads.list({
    part: ['snippet'],
    videoId,
    maxResults: 20,
    order: 'time',
  });

  const threads = commentsRes.data.items || [];
  let replied = 0;

  for (const thread of threads) {
    const commentId = thread.id!;
    const commentText =
      thread.snippet?.topLevelComment?.snippet?.textDisplay?.toLowerCase() || '';
    const authorChannelId =
      thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';

    // Skip our own comments
    if (authorChannelId === ytAccount.platformId) continue;

    // Check if already replied (stored in Firestore)
    const alreadyReplied = await checkAlreadyReplied(userId, commentId);
    if (alreadyReplied) continue;

    // Match against rules
    for (const rule of rules) {
      if (commentText.includes(rule.keyword)) {
        try {
          await youtube.comments.insert({
            part: ['snippet'],
            requestBody: {
              snippet: {
                parentId: commentId,
                textOriginal: rule.replyMessage,
              },
            },
          });

          await markReplied(userId, commentId, 'youtube', rule.id);
          await incrementRuleMatch(userId, rule.id);
          replied++;
          break; // One reply per comment
        } catch (err: any) {
          console.error('[LINK-ME] YouTube reply error:', err.message);
        }
      }
    }
  }

  return replied;
}

async function processTwitterLinkMe(
  userId: string,
  tweetId: string,
  rules: any[],
  twAccount: any,
): Promise<number> {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY!,
    appSecret: process.env.TWITTER_APP_SECRET!,
    accessToken: twAccount.oauthToken,
    accessSecret: twAccount.oauthTokenSecret,
  });

  let replied = 0;

  try {
    // Fetch replies to this tweet
    const replies = await client.v2.search(
      `conversation_id:${tweetId} is:reply`,
      { max_results: 20, 'tweet.fields': ['author_id', 'text', 'id'] },
    );

    for (const reply of replies.data?.data || []) {
      // Skip own tweets
      if (reply.author_id === twAccount.platformId) continue;

      const alreadyReplied = await checkAlreadyReplied(userId, reply.id);
      if (alreadyReplied) continue;

      const replyText = reply.text?.toLowerCase() || '';

      for (const rule of rules) {
        if (replyText.includes(rule.keyword)) {
          try {
            await client.v2.reply(rule.replyMessage, reply.id);
            await markReplied(userId, reply.id, 'twitter', rule.id);
            await incrementRuleMatch(userId, rule.id);
            replied++;
            break;
          } catch (err: any) {
            console.error('[LINK-ME] Twitter reply error:', err.message);
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[LINK-ME] Twitter search error:', err.message);
  }

  return replied;
}

function buildYouTubeOAuth(ytAccount: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
    process.env.YOUTUBE_CLIENT_SECRET!,
    process.env.YOUTUBE_REDIRECT_URI || 'https://www.starlingpost.com/api/auth/youtube/callback',
  );
  oauth2Client.setCredentials({
    access_token: ytAccount.accessToken,
    refresh_token: ytAccount.refreshToken || undefined,
  });
  return oauth2Client;
}

async function checkAlreadyReplied(userId: string, commentId: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection('linkMeReplies')
    .doc(commentId)
    .get();
  return doc.exists;
}

async function markReplied(
  userId: string,
  commentId: string,
  platform: string,
  ruleId: string,
) {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection('linkMeReplies')
    .doc(commentId)
    .set({
      platform,
      ruleId,
      repliedAt: new Date(),
    });
}

async function incrementRuleMatch(userId: string, ruleId: string) {
  const ruleRef = adminDb
    .collection('users')
    .doc(userId)
    .collection('linkMeRules')
    .doc(ruleId);

  const doc = await ruleRef.get();
  const current = (doc.data()?.totalMatches || 0) as number;
  await ruleRef.update({ totalMatches: current + 1 });
}
