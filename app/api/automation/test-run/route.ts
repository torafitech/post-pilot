// app/api/automation/test-run/route.ts
// Immediately runs Link Me or Auto Reply processing for the authenticated user only
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { google } from 'googleapis';
import { TwitterApi } from 'twitter-api-v2';
import OpenAI from 'openai';

const MAX_POSTS = 5;

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type } = await request.json();
  if (!['link-me', 'auto-reply'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  try {
    const result = type === 'link-me'
      ? await runLinkMe(userId)
      : await runAutoReply(userId);

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[TEST-RUN]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Link Me ──────────────────────────────────────────────────────────────────

async function runLinkMe(userId: string) {
  const rulesSnap = await adminDb
    .collection('users').doc(userId)
    .collection('linkMeRules')
    .where('isActive', '==', true)
    .get();

  if (rulesSnap.empty) return { matched: 0, message: 'No active Link Me rules found.' };

  const rules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const connectedAccounts: any[] = userSnap.data()?.connectedAccounts || [];

  const postsSnap = await adminDb
    .collection('users').doc(userId)
    .collection('posts')
    .orderBy('publishedAt', 'desc')
    .limit(MAX_POSTS)
    .get();

  let matched = 0;
  for (const postDoc of postsSnap.docs) {
    const post = postDoc.data() as any;
    const platform = post.platform?.toLowerCase();
    const platformRules = rules.filter((r: any) => r.platforms?.includes(platform));
    if (!platformRules.length) continue;

    try {
      if (platform === 'youtube') {
        const ytAcc = connectedAccounts.find((a: any) => a.platform === 'youtube');
        if (!ytAcc) continue;
        matched += await linkMeYouTube(userId, post.platformPostId, platformRules, ytAcc);
      } else if (platform === 'twitter') {
        const twAcc = connectedAccounts.find((a: any) => a.platform === 'twitter');
        if (!twAcc) continue;
        matched += await linkMeTwitter(userId, post.platformPostId, platformRules, twAcc);
      }
    } catch (err: any) {
      console.error('[TEST-RUN LinkMe]', err.message);
    }
  }

  return { matched, message: `Replied to ${matched} comment${matched !== 1 ? 's' : ''}.` };
}

async function linkMeYouTube(userId: string, videoId: string, rules: any[], ytAcc: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
    process.env.YOUTUBE_CLIENT_SECRET!,
    process.env.YOUTUBE_REDIRECT_URI || 'https://www.starlingpost.com/api/auth/youtube/callback',
  );
  oauth2Client.setCredentials({ access_token: ytAcc.accessToken, refresh_token: ytAcc.refreshToken });
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const res = await youtube.commentThreads.list({ part: ['snippet'], videoId, maxResults: 20, order: 'time' });
  let matched = 0;
  for (const thread of res.data.items || []) {
    const commentId = thread.id!;
    const text = (thread.snippet?.topLevelComment?.snippet?.textDisplay || '').toLowerCase();
    const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
    if (authorChannelId === ytAcc.platformId) continue;

    const matchedRule = rules.find((r: any) => text.includes(r.keyword));
    if (!matchedRule) continue;

    const already = await checkReplied(userId, commentId, 'linkMe');
    if (already) continue;

    await youtube.comments.insert({
      part: ['snippet'],
      requestBody: { snippet: { parentId: commentId, textOriginal: matchedRule.replyMessage } },
    });
    await markReplied(userId, commentId, 'youtube', 'linkMe');
    await adminDb.collection('users').doc(userId).collection('linkMeRules').doc(matchedRule.id)
      .update({ totalMatches: (matchedRule.totalMatches || 0) + 1 });
    matched++;
  }
  return matched;
}

async function linkMeTwitter(userId: string, tweetId: string, rules: any[], twAcc: any) {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY!,
    appSecret: process.env.TWITTER_APP_SECRET!,
    accessToken: twAcc.oauthToken,
    accessSecret: twAcc.oauthTokenSecret,
  });
  let matched = 0;
  try {
    const replies = await client.v2.search(
      `conversation_id:${tweetId} is:reply`,
      { max_results: 10, 'tweet.fields': ['author_id', 'text', 'id'] },
    );
    for (const reply of replies.data?.data || []) {
      if (reply.author_id === twAcc.platformId) continue;
      const text = (reply.text || '').toLowerCase();
      const matchedRule = rules.find((r: any) => text.includes(r.keyword));
      if (!matchedRule) continue;
      const already = await checkReplied(userId, reply.id, 'linkMe');
      if (already) continue;
      await client.v2.reply(matchedRule.replyMessage, reply.id);
      await markReplied(userId, reply.id, 'twitter', 'linkMe');
      matched++;
    }
  } catch (err: any) {
    console.error('[TEST-RUN LinkMe Twitter]', err.message);
  }
  return matched;
}

// ── Auto Reply ────────────────────────────────────────────────────────────────

async function runAutoReply(userId: string) {
  const templatesSnap = await adminDb
    .collection('users').doc(userId)
    .collection('autoReplyTemplates')
    .where('isActive', '==', true)
    .get();

  if (templatesSnap.empty) return { replied: 0, message: 'No active Auto Reply templates found.' };

  const templates = templatesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const connectedAccounts: any[] = userSnap.data()?.connectedAccounts || [];

  const postsSnap = await adminDb
    .collection('users').doc(userId)
    .collection('posts')
    .orderBy('publishedAt', 'desc')
    .limit(MAX_POSTS)
    .get();

  let replied = 0;
  for (const postDoc of postsSnap.docs) {
    const post = postDoc.data() as any;
    const platform = post.platform?.toLowerCase();
    const tmpl = templates.find((t: any) => t.platforms?.includes(platform));
    if (!tmpl) continue;

    try {
      if (platform === 'youtube') {
        const ytAcc = connectedAccounts.find((a: any) => a.platform === 'youtube');
        if (!ytAcc) continue;
        replied += await autoReplyYouTube(userId, post.platformPostId, tmpl, ytAcc);
      } else if (platform === 'twitter') {
        const twAcc = connectedAccounts.find((a: any) => a.platform === 'twitter');
        if (!twAcc) continue;
        replied += await autoReplyTwitter(userId, post.platformPostId, tmpl, twAcc);
      }
    } catch (err: any) {
      console.error('[TEST-RUN AutoReply]', err.message);
    }
  }

  return { replied, message: `Sent ${replied} auto-repl${replied !== 1 ? 'ies' : 'y'}.` };
}

async function buildReplyText(template: any, commentText: string, username: string) {
  if (template.useAI) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Write a short, friendly reply to a comment. 1-2 sentences. No hashtags.' },
          { role: 'user', content: `Comment: "${commentText}"` },
        ],
        max_tokens: 80,
      });
      return res.choices[0].message.content?.trim() || template.message;
    } catch { return template.message; }
  }
  return template.message.replace('{username}', username || 'there');
}

async function autoReplyYouTube(userId: string, videoId: string, template: any, ytAcc: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
    process.env.YOUTUBE_CLIENT_SECRET!,
    process.env.YOUTUBE_REDIRECT_URI || 'https://www.starlingpost.com/api/auth/youtube/callback',
  );
  oauth2Client.setCredentials({ access_token: ytAcc.accessToken, refresh_token: ytAcc.refreshToken });
  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

  const res = await youtube.commentThreads.list({ part: ['snippet'], videoId, maxResults: 10, order: 'time' });
  let replied = 0;
  for (const thread of res.data.items || []) {
    const commentId = thread.id!;
    const commentText = thread.snippet?.topLevelComment?.snippet?.textDisplay || '';
    const authorName = thread.snippet?.topLevelComment?.snippet?.authorDisplayName || '';
    const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
    if (authorChannelId === ytAcc.platformId) continue;
    const already = await checkReplied(userId, commentId, 'autoReply');
    if (already) continue;
    const replyText = await buildReplyText(template, commentText, authorName);
    await youtube.comments.insert({
      part: ['snippet'],
      requestBody: { snippet: { parentId: commentId, textOriginal: replyText } },
    });
    await markReplied(userId, commentId, 'youtube', 'autoReply');
    replied++;
  }
  return replied;
}

async function autoReplyTwitter(userId: string, tweetId: string, template: any, twAcc: any) {
  const client = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY!,
    appSecret: process.env.TWITTER_APP_SECRET!,
    accessToken: twAcc.oauthToken,
    accessSecret: twAcc.oauthTokenSecret,
  });
  let replied = 0;
  try {
    const replies = await client.v2.search(
      `conversation_id:${tweetId} is:reply`,
      { max_results: 10, 'tweet.fields': ['author_id', 'text', 'id'] },
    );
    for (const reply of replies.data?.data || []) {
      if (reply.author_id === twAcc.platformId) continue;
      const already = await checkReplied(userId, reply.id, 'autoReply');
      if (already) continue;
      const replyText = await buildReplyText(template, reply.text || '', '');
      await client.v2.reply(replyText, reply.id);
      await markReplied(userId, reply.id, 'twitter', 'autoReply');
      replied++;
    }
  } catch (err: any) {
    console.error('[TEST-RUN AutoReply Twitter]', err.message);
  }
  return replied;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function checkReplied(userId: string, commentId: string, type: string) {
  const doc = await adminDb.collection('users').doc(userId).collection(`${type}Replies`).doc(commentId).get();
  return doc.exists;
}

async function markReplied(userId: string, commentId: string, platform: string, type: string) {
  await adminDb.collection('users').doc(userId).collection(`${type}Replies`).doc(commentId)
    .set({ platform, repliedAt: new Date() });
}
