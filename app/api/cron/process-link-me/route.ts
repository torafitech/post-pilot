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
import {
  fetchRecentFBPostIds,
  fetchFBPostComments,
  replyToFBComment,
  checkFBReplied,
  markFBReplied,
} from '@/lib/facebookAutomation';
import {
  fetchRecentThreadIds,
  fetchThreadReplies,
  postThreadReply,
  checkTHReplied,
  markTHReplied,
} from '@/lib/threadsAutomation';
import { parsePostUrls } from '@/lib/postScopeUtils';

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

  // Threads — every connected Threads account
  const thRules = rules.filter((r: any) => r.platforms?.includes('threads'));
  if (thRules.length) {
    const thAccounts = accounts.filter((a: any) => a.platform === 'threads');
    for (const thAcc of thAccounts) {
      try {
        replied += await processThreadsLinkMe(userId, thRules, thAcc);
      } catch (err: any) {
        console.error('[LINK-ME] TH account', thAcc.platformId, err.message);
      }
    }
  }

  // Facebook — every connected Facebook Page account
  const fbRules = rules.filter((r: any) => r.platforms?.includes('facebook'));
  if (fbRules.length) {
    const fbAccounts = accounts.filter((a: any) => a.platform === 'facebook');
    for (const fbAcc of fbAccounts) {
      try {
        replied += await processFacebookLinkMe(userId, fbRules, fbAcc);
      } catch (err: any) {
        console.error('[LINK-ME] FB account', fbAcc.platformId, err.message);
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
  const maxRecent = Math.max(...rules.filter(r => r.postScope !== 'custom').map(r => r.recentCount || 5), 0);
  const recentUrns = maxRecent > 0 ? await fetchRecentLinkedInPostUrns(userId, Math.min(maxRecent, MAX_VIDEOS_PER_ACCOUNT)) : [];
  const customUrns = new Set<string>(
    rules.flatMap(r => r.postScope === 'custom' ? parsePostUrls(r.customUrls || [], 'linkedin') : [])
  );
  const allUrns = [...new Set([...recentUrns, ...customUrns])];

  let replied = 0;
  for (const postUrn of allUrns) {
    const applicableRules = rules.filter(r =>
      r.postScope === 'custom'
        ? parsePostUrls(r.customUrls || [], 'linkedin').includes(postUrn)
        : recentUrns.slice(0, r.recentCount || 5).includes(postUrn)
    );
    if (!applicableRules.length) continue;

    const comments = await fetchLinkedInComments(liAcc, postUrn, MAX_COMMENTS_PER_VIDEO);
    for (const comment of comments) {
      if (comment.actorUrn === liAcc.authorUrn) continue;
      if (await checkLIReplied(userId, comment.id, 'linkMe')) continue;
      const text = comment.text.toLowerCase();
      const rule = applicableRules.find((r: any) => text.includes(r.keyword.trim().toLowerCase()));
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

  // Collect video IDs for each rule's scope
  const maxRecent = Math.max(...rules.filter(r => r.postScope !== 'custom').map(r => r.recentCount || 5), 0);
  const recentIds = maxRecent > 0 ? await fetchRecentVideoIds(ytAccount, Math.min(maxRecent, MAX_VIDEOS_PER_ACCOUNT)) : [];
  const customIds = new Set<string>(
    rules.flatMap(r => r.postScope === 'custom' ? parsePostUrls(r.customUrls || [], 'youtube') : [])
  );
  const allIds = [...new Set([...recentIds, ...customIds])];

  let replied = 0;
  for (const videoId of allIds) {
    const applicableRules = rules.filter(r =>
      r.postScope === 'custom'
        ? parsePostUrls(r.customUrls || [], 'youtube').includes(videoId)
        : recentIds.slice(0, r.recentCount || 5).includes(videoId)
    );
    if (!applicableRules.length) continue;

    try {
      const commentsRes = await youtube.commentThreads.list({
        part: ['snippet'], videoId, maxResults: MAX_COMMENTS_PER_VIDEO, order: 'time',
      });
      for (const thread of commentsRes.data.items || []) {
        const commentId = thread.id!;
        const text = (thread.snippet?.topLevelComment?.snippet?.textDisplay || '').toLowerCase();
        const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
        if (authorChannelId === ytAccount.platformId) continue;
        if (await checkYTReplied(userId, commentId, 'linkMe')) continue;
        const rule = applicableRules.find((r: any) => text.includes(r.keyword.trim().toLowerCase()));
        if (!rule) continue;
        try {
          await youtube.comments.insert({
            part: ['snippet'],
            requestBody: { snippet: { parentId: commentId, textOriginal: rule.replyMessage } },
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

    // Scope filter: custom-scope rules only apply to replies to specific tweet IDs
    const applicableRules = rules.filter(r => {
      if (r.postScope === 'custom') {
        const targetIds = parsePostUrls(r.customUrls || [], 'twitter');
        return targetIds.includes(mention.inReplyToStatusId || '');
      }
      return true;
    });
    if (!applicableRules.length) continue;

    const text = mention.text.toLowerCase();
    const rule = applicableRules.find((r: any) => text.includes(r.keyword.trim().toLowerCase()));
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

async function processThreadsLinkMe(
  userId: string,
  rules: any[],
  thAcc: any,
): Promise<number> {
  const maxRecent = Math.max(
    ...rules.filter(r => r.postScope !== 'custom').map(r => r.recentCount || 5),
    0,
  );
  const { ids: threadIds } = maxRecent > 0
    ? await fetchRecentThreadIds(thAcc, Math.min(maxRecent, MAX_COMMENTS_PER_VIDEO))
    : { ids: [] };

  let replied = 0;
  for (const threadId of threadIds) {
    const applicableRules = rules.filter(r =>
      r.postScope !== 'custom'
        ? threadIds.slice(0, r.recentCount || 5).includes(threadId)
        : false,
    );
    if (!applicableRules.length) continue;

    const { replies } = await fetchThreadReplies(thAcc, threadId);
    for (const reply of replies) {
      if (reply.userId === thAcc.platformId) continue;
      if (await checkTHReplied(userId, reply.id, 'linkMe')) continue;
      const text = reply.text.toLowerCase();
      const rule = applicableRules.find((r: any) => text.includes(r.keyword.trim().toLowerCase()));
      if (!rule) continue;
      const ok = await postThreadReply(thAcc, reply.id, rule.replyMessage);
      if (ok) {
        await markTHReplied(userId, reply.id, 'linkMe');
        await incrementRuleMatch(userId, rule.id);
        replied++;
      }
    }
  }
  return replied;
}

async function processFacebookLinkMe(
  userId: string,
  rules: any[],
  fbAcc: any,
): Promise<number> {
  const maxRecent = Math.max(
    ...rules.filter(r => r.postScope !== 'custom').map(r => r.recentCount || 5),
    0,
  );
  const { ids: recentIds } = maxRecent > 0
    ? await fetchRecentFBPostIds(fbAcc, Math.min(maxRecent, MAX_COMMENTS_PER_VIDEO))
    : { ids: [] };

  let replied = 0;
  for (const postId of recentIds) {
    const applicableRules = rules.filter(r =>
      r.postScope !== 'custom'
        ? recentIds.slice(0, r.recentCount || 5).includes(postId)
        : false,
    );
    if (!applicableRules.length) continue;

    const { comments } = await fetchFBPostComments(fbAcc, postId);
    for (const comment of comments) {
      if (comment.fromId === fbAcc.platformId) continue;
      if (await checkFBReplied(userId, comment.id, 'linkMe')) continue;
      const text = comment.text.toLowerCase();
      const rule = applicableRules.find((r: any) => text.includes(r.keyword.trim().toLowerCase()));
      if (!rule) continue;
      const ok = await replyToFBComment(fbAcc, comment.id, rule.replyMessage);
      if (ok) {
        await markFBReplied(userId, comment.id, 'linkMe');
        await incrementRuleMatch(userId, rule.id);
        replied++;
      }
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
