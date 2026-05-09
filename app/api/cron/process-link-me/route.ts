// app/api/cron/process-link-me/route.ts
// Cron: scan recent activity on each connected platform and fire Link Me
// rules. Iterates every connected account per platform (multi-account safe).
// Platforms: YouTube, Twitter, LinkedIn (requires LinkedIn MDP access).
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import {
  fetchMentions,
  replyToTweet,
  checkReplied as twCheckReplied,
  markReplied as twMarkReplied,
} from '@/lib/twitterAutomation';
import {
  buildYouTubeClient,
  fetchRecentVideoIds,
  checkYTReplied,
  markYTReplied,
} from '@/lib/youtubeAutomation';
import {
  fetchRecentLinkedInPostUrns,
  fetchLinkedInComments,
  replyToLinkedInComment,
  checkLIReplied,
  markLIReplied,
} from '@/lib/linkedinAutomation';

export const dynamic = 'force-dynamic';

const MAX_USERS_PER_RUN = 10;
const MAX_VIDEOS_PER_ACCOUNT = 10;
const MAX_COMMENTS_PER_VIDEO = 20;
const MAX_MENTIONS = 20;

function isAuthorizedCron(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET || process.env.INTERNAL_CRON_SECRET;
  if (!secret) return false;
  return (
    req.headers.get('authorization') === `Bearer ${secret}` ||
    req.headers.get('x-internal-secret') === secret
  );
}

export async function GET(_req: NextRequest) {
  if (!isAuthorizedCron(_req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userIds = await findUsersWithActiveRules();
    let totalReplied = 0;

    for (const userId of userIds.slice(0, MAX_USERS_PER_RUN)) {
      try {
        totalReplied += await processUserLinkMe(userId);
      } catch (err: any) {
        console.error('[LINK-ME] user error', userId, err.message);
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
  const snap = await adminDb
    .collectionGroup('linkMeRules')
    .where('isActive', '==', true)
    .limit(MAX_USERS_PER_RUN * 5)
    .get();

  snap.docs.forEach((doc) => {
    const userId = doc.ref.parent.parent?.id;
    if (userId && !userIds.includes(userId)) userIds.push(userId);
  });

  return userIds;
}

async function processUserLinkMe(userId: string): Promise<number> {
  const rulesSnap = await adminDb
    .collection('users').doc(userId)
    .collection('linkMeRules')
    .where('isActive', '==', true)
    .get();
  if (rulesSnap.empty) return 0;

  const rules = rulesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const accounts: any[] = userSnap.data()?.connectedAccounts || [];

  let replied = 0;

  // YouTube — every connected YouTube account
  const ytRules = rules.filter((r: any) => r.platforms?.includes('youtube'));
  if (ytRules.length) {
    const ytAccounts = accounts.filter((a: any) => a.platform === 'youtube');
    for (const ytAcc of ytAccounts) {
      try {
        replied += await processYouTubeLinkMe(userId, ytRules, ytAcc);
      } catch (err: any) {
        console.error('[LINK-ME] YT account', ytAcc.platformId, err.message);
      }
    }
  }

  // Twitter — every connected Twitter account
  const twRules = rules.filter((r: any) => r.platforms?.includes('twitter'));
  if (twRules.length) {
    const twAccounts = accounts.filter((a: any) => a.platform === 'twitter');
    for (const twAcc of twAccounts) {
      try {
        replied += await processTwitterLinkMe(userId, twRules, twAcc);
      } catch (err: any) {
        console.error('[LINK-ME] TW account', twAcc.platformId, err.message);
      }
    }
  }

  // LinkedIn — every connected LinkedIn account
  const liRules = rules.filter((r: any) => r.platforms?.includes('linkedin'));
  if (liRules.length) {
    const liAccounts = accounts.filter((a: any) => a.platform === 'linkedin');
    for (const liAcc of liAccounts) {
      try {
        replied += await processLinkedInLinkMe(userId, liRules, liAcc);
      } catch (err: any) {
        console.error('[LINK-ME] LI account', liAcc.platformId, err.message);
      }
    }
  }

  return replied;
}

async function processLinkedInLinkMe(
  userId: string,
  rules: any[],
  liAcc: any,
): Promise<number> {
  const postUrns = await fetchRecentLinkedInPostUrns(liAcc, MAX_VIDEOS_PER_ACCOUNT);
  let replied = 0;

  for (const postUrn of postUrns) {
    const comments = await fetchLinkedInComments(liAcc, postUrn, MAX_COMMENTS_PER_VIDEO);
    for (const comment of comments) {
      if (comment.actorUrn === liAcc.authorUrn) continue;
      if (await checkLIReplied(userId, comment.id, 'linkMe')) continue;

      const text = comment.text.toLowerCase();
      const rule = rules.find((r: any) => text.includes(r.keyword.toLowerCase()));
      if (!rule) continue;

      const ok = await replyToLinkedInComment(liAcc, comment.id, rule.replyMessage);
      if (ok) {
        await markLIReplied(userId, comment.id, 'linkMe');
        await incrementRuleMatch(userId, rule.id);
        replied++;
      }
    }
  }

  return replied;
}

async function processYouTubeLinkMe(
  userId: string,
  rules: any[],
  ytAccount: any,
): Promise<number> {
  const youtube = buildYouTubeClient(ytAccount);
  const videoIds = await fetchRecentVideoIds(ytAccount, MAX_VIDEOS_PER_ACCOUNT);
  let replied = 0;

  for (const videoId of videoIds) {
    try {
      const commentsRes = await youtube.commentThreads.list({
        part: ['snippet'],
        videoId,
        maxResults: MAX_COMMENTS_PER_VIDEO,
        order: 'time',
      });

      for (const thread of commentsRes.data.items || []) {
        const commentId = thread.id!;
        const text = (thread.snippet?.topLevelComment?.snippet?.textDisplay || '').toLowerCase();
        const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
        if (authorChannelId === ytAccount.platformId) continue;

        if (await checkYTReplied(userId, commentId, 'linkMe')) continue;

        const rule = rules.find((r: any) => text.includes(r.keyword.toLowerCase()));
        if (!rule) continue;

        try {
          await youtube.comments.insert({
            part: ['snippet'],
            requestBody: {
              snippet: { parentId: commentId, textOriginal: rule.replyMessage },
            },
          });
          await markYTReplied(userId, commentId, 'linkMe');
          await incrementRuleMatch(userId, rule.id);
          replied++;
        } catch (err: any) {
          console.error('[LINK-ME] YT reply error:', err.message);
        }
      }
    } catch (err: any) {
      console.error('[LINK-ME] YT video error', videoId, err.message);
    }
  }

  return replied;
}

async function processTwitterLinkMe(
  userId: string,
  rules: any[],
  twAccount: any,
): Promise<number> {
  const mentions = await fetchMentions(twAccount, MAX_MENTIONS);
  let replied = 0;

  for (const mention of mentions) {
    if (mention.authorId === twAccount.platformId) continue;
    if (await twCheckReplied(userId, mention.id, 'linkMe')) continue;

    const text = mention.text.toLowerCase();
    const rule = rules.find((r: any) => text.includes(r.keyword.toLowerCase()));
    if (!rule) continue;

    const ok = await replyToTweet(twAccount, mention.id, rule.replyMessage);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'linkMe');
      await incrementRuleMatch(userId, rule.id);
      replied++;
    }
  }

  return replied;
}

async function incrementRuleMatch(userId: string, ruleId: string) {
  const ref = adminDb
    .collection('users').doc(userId)
    .collection('linkMeRules').doc(ruleId);
  const doc = await ref.get();
  const current = (doc.data()?.totalMatches || 0) as number;
  await ref.update({ totalMatches: current + 1 });
}
