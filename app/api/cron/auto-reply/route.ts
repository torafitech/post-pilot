// app/api/cron/auto-reply/route.ts
// Cron: scan recent activity on each connected platform and auto-reply
// using configured templates. Iterates every connected account per
// platform (multi-account safe). LinkedIn is currently skipped.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import OpenAI from 'openai';
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

export const dynamic = 'force-dynamic';

const MAX_USERS_PER_RUN = 10;
const MAX_VIDEOS_PER_ACCOUNT = 10;
const MAX_COMMENTS_PER_VIDEO = 10;
const MAX_MENTIONS = 20;

export async function GET(_req: NextRequest) {
  try {
    const userIds = await findUsersWithActiveTemplates();
    let totalReplied = 0;

    for (const userId of userIds.slice(0, MAX_USERS_PER_RUN)) {
      try {
        totalReplied += await processUserAutoReply(userId);
      } catch (err: any) {
        console.error('[AUTO-REPLY] user error', userId, err.message);
      }
    }

    return NextResponse.json({ success: true, totalReplied });
  } catch (err: any) {
    console.error('[AUTO-REPLY] Cron error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

async function findUsersWithActiveTemplates(): Promise<string[]> {
  const userIds: string[] = [];
  const snap = await adminDb
    .collectionGroup('autoReplyTemplates')
    .where('isActive', '==', true)
    .limit(MAX_USERS_PER_RUN * 5)
    .get();

  snap.docs.forEach((doc) => {
    const userId = doc.ref.parent.parent?.id;
    if (userId && !userIds.includes(userId)) userIds.push(userId);
  });

  return userIds;
}

async function processUserAutoReply(userId: string): Promise<number> {
  const tplSnap = await adminDb
    .collection('users').doc(userId)
    .collection('autoReplyTemplates')
    .where('isActive', '==', true)
    .get();
  if (tplSnap.empty) return 0;

  const templates = tplSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const accounts: any[] = userSnap.data()?.connectedAccounts || [];

  let replied = 0;

  // YouTube — first active template per platform
  const ytTemplate = templates.find((t: any) => t.platforms?.includes('youtube'));
  if (ytTemplate) {
    const ytAccounts = accounts.filter((a: any) => a.platform === 'youtube');
    for (const ytAcc of ytAccounts) {
      try {
        replied += await autoReplyYouTube(userId, ytTemplate, ytAcc);
      } catch (err: any) {
        console.error('[AUTO-REPLY] YT account', ytAcc.platformId, err.message);
      }
    }
  }

  const twTemplate = templates.find((t: any) => t.platforms?.includes('twitter'));
  if (twTemplate) {
    const twAccounts = accounts.filter((a: any) => a.platform === 'twitter');
    for (const twAcc of twAccounts) {
      try {
        replied += await autoReplyTwitter(userId, twTemplate, twAcc);
      } catch (err: any) {
        console.error('[AUTO-REPLY] TW account', twAcc.platformId, err.message);
      }
    }
  }

  return replied;
}

async function buildReplyText(template: any, commentText: string, username: string): Promise<string> {
  if (template.useAI) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful social media manager. Write a short, friendly, genuine reply to a comment. 1-2 sentences max. No hashtags.',
          },
          { role: 'user', content: `Comment: "${commentText}"` },
        ],
        max_tokens: 80,
        temperature: 0.7,
      });
      return res.choices[0].message.content?.trim() || template.message;
    } catch {
      return template.message;
    }
  }

  return (template.message || '').replace('{username}', username || 'there');
}

async function autoReplyYouTube(
  userId: string,
  template: any,
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
        const commentText = thread.snippet?.topLevelComment?.snippet?.textDisplay || '';
        const authorName = thread.snippet?.topLevelComment?.snippet?.authorDisplayName || '';
        const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
        if (authorChannelId === ytAccount.platformId) continue;
        if (await checkYTReplied(userId, commentId, 'autoReply')) continue;

        const replyText = await buildReplyText(template, commentText, authorName);

        try {
          await youtube.comments.insert({
            part: ['snippet'],
            requestBody: { snippet: { parentId: commentId, textOriginal: replyText } },
          });
          await markYTReplied(userId, commentId, 'autoReply');
          replied++;
        } catch (err: any) {
          console.error('[AUTO-REPLY] YT reply error:', err.message);
        }
      }
    } catch (err: any) {
      console.error('[AUTO-REPLY] YT video error', videoId, err.message);
    }
  }

  return replied;
}

async function autoReplyTwitter(
  userId: string,
  template: any,
  twAccount: any,
): Promise<number> {
  const mentions = await fetchMentions(twAccount, MAX_MENTIONS);
  let replied = 0;

  for (const mention of mentions) {
    if (mention.authorId === twAccount.platformId) continue;
    if (await twCheckReplied(userId, mention.id, 'autoReply')) continue;

    const replyText = await buildReplyText(template, mention.text, `@${mention.authorHandle}`);
    const ok = await replyToTweet(twAccount, mention.id, replyText);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'autoReply');
      replied++;
    }
  }

  return replied;
}
