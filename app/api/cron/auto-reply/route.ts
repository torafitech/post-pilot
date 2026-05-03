// app/api/cron/auto-reply/route.ts
// Cron job: scan recent comments on published posts and auto-reply with templates
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { google } from 'googleapis';
import OpenAI from 'openai';
import { fetchMentions, replyToTweet, checkReplied as twCheckReplied, markReplied as twMarkReplied } from '@/lib/twitterAutomation';

export const dynamic = 'force-dynamic';

const MAX_USERS_PER_RUN = 10;
const MAX_POSTS_PER_USER = 5;

export async function GET(_req: NextRequest) {
  try {
    const usersWithTemplates = await findUsersWithActiveTemplates();
    let totalReplied = 0;

    for (const userId of usersWithTemplates.slice(0, MAX_USERS_PER_RUN)) {
      try {
        const replied = await processUserAutoReply(userId);
        totalReplied += replied;
      } catch (err: any) {
        console.error('[AUTO-REPLY] Error for user', userId, err.message);
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
    .limit(MAX_USERS_PER_RUN)
    .get();

  snap.docs.forEach((doc) => {
    const userId = doc.ref.parent.parent?.id;
    if (userId && !userIds.includes(userId)) userIds.push(userId);
  });

  return userIds;
}

async function processUserAutoReply(userId: string): Promise<number> {
  let replied = 0;

  const templatesSnap = await adminDb
    .collection('users')
    .doc(userId)
    .collection('autoReplyTemplates')
    .where('isActive', '==', true)
    .get();

  if (templatesSnap.empty) return 0;

  const templates = templatesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

  const userSnap = await adminDb.collection('users').doc(userId).get();
  const connectedAccounts: any[] = userSnap.data()?.connectedAccounts || [];

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

    const platformTemplates = templates.filter(
      (t: any) => t.platforms?.includes(platform),
    );
    if (platformTemplates.length === 0) continue;

    // Use first active template per platform
    const template = platformTemplates[0];

    try {
      if (platform === 'youtube') {
        const ytAcc = connectedAccounts.find((a: any) => a.platform === 'youtube');
        if (!ytAcc) continue;
        const r = await autoReplyYouTube(userId, post.platformPostId, template, ytAcc);
        replied += r;
      } else if (platform === 'twitter') {
        const twAcc = connectedAccounts.find((a: any) => a.platform === 'twitter');
        if (!twAcc) continue;
        const r = await autoReplyTwitter(userId, post.platformPostId, template, twAcc);
        replied += r;
      }
    } catch (err: any) {
      console.error('[AUTO-REPLY] Platform error:', err.message);
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

  return template.message.replace('{username}', username || 'there');
}

async function autoReplyYouTube(
  userId: string,
  videoId: string,
  template: any,
  ytAccount: any,
): Promise<number> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
    process.env.YOUTUBE_CLIENT_SECRET!,
    process.env.YOUTUBE_REDIRECT_URI || 'https://www.starlingpost.com/api/auth/youtube/callback',
  );
  oauth2Client.setCredentials({
    access_token: ytAccount.accessToken,
    refresh_token: ytAccount.refreshToken || undefined,
  });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  const commentsRes = await youtube.commentThreads.list({
    part: ['snippet'],
    videoId,
    maxResults: 10,
    order: 'time',
  });

  let replied = 0;
  for (const thread of commentsRes.data.items || []) {
    const commentId = thread.id!;
    const commentText = thread.snippet?.topLevelComment?.snippet?.textDisplay || '';
    const authorName = thread.snippet?.topLevelComment?.snippet?.authorDisplayName || '';
    const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';

    if (authorChannelId === ytAccount.platformId) continue;

    const alreadyReplied = await checkAlreadyReplied(userId, commentId, 'autoReply');
    if (alreadyReplied) continue;

    const replyText = await buildReplyText(template, commentText, authorName);

    try {
      await youtube.comments.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            parentId: commentId,
            textOriginal: replyText,
          },
        },
      });
      await markReplied(userId, commentId, 'youtube', 'autoReply');
      replied++;
    } catch (err: any) {
      console.error('[AUTO-REPLY] YouTube comment error:', err.message);
    }
  }

  return replied;
}

async function autoReplyTwitter(
  userId: string,
  _tweetId: string,
  template: any,
  twAccount: any,
): Promise<number> {
  // v1.1 mentions timeline — no Elevated access required
  const mentions = await fetchMentions(twAccount, 20);
  let replied = 0;

  for (const mention of mentions) {
    if (mention.authorId === twAccount.platformId) continue;

    const alreadyReplied = await twCheckReplied(userId, mention.id, 'autoReply');
    if (alreadyReplied) continue;

    const replyText = await buildReplyText(template, mention.text, `@${mention.authorHandle}`);
    const ok = await replyToTweet(twAccount, mention.id, replyText);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'autoReply');
      replied++;
    }
  }

  return replied;
}

async function checkAlreadyReplied(userId: string, commentId: string, type: string): Promise<boolean> {
  const doc = await adminDb
    .collection('users')
    .doc(userId)
    .collection(`${type}Replies`)
    .doc(commentId)
    .get();
  return doc.exists;
}

async function markReplied(userId: string, commentId: string, platform: string, type: string) {
  await adminDb
    .collection('users')
    .doc(userId)
    .collection(`${type}Replies`)
    .doc(commentId)
    .set({ platform, repliedAt: new Date() });
}
