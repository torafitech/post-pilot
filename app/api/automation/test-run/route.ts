// app/api/automation/test-run/route.ts
// Immediately processes Link Me or Auto Reply for the authenticated user only.
// Uses v1.1 Twitter API (no Elevated access) and youtube.force-ssl for comments.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { google } from 'googleapis';
import OpenAI from 'openai';
import {
  fetchMentions,
  replyToTweet,
  checkReplied as twCheckReplied,
  markReplied as twMarkReplied,
} from '@/lib/twitterAutomation';

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

// ── Shared ────────────────────────────────────────────────────────────────────

function buildYTClient(ytAcc: any) {
  const oauth2 = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
    process.env.YOUTUBE_CLIENT_SECRET!,
    process.env.YOUTUBE_REDIRECT_URI || 'https://www.starlingpost.com/api/auth/youtube/callback',
  );
  oauth2.setCredentials({
    access_token: ytAcc.accessToken,
    refresh_token: ytAcc.refreshToken || undefined,
  });
  return google.youtube({ version: 'v3', auth: oauth2 });
}

async function checkYTReplied(userId: string, commentId: string, type: string) {
  return (await adminDb.collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId).get()).exists;
}

async function markYTReplied(userId: string, commentId: string, type: string) {
  await adminDb.collection('users').doc(userId)
    .collection(`${type}Replies`).doc(commentId)
    .set({ platform: 'youtube', repliedAt: new Date() });
}

// ── Link Me ───────────────────────────────────────────────────────────────────

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
        if (ytAcc) matched += await lmYouTube(userId, post.platformPostId, platformRules, ytAcc);
      } else if (platform === 'twitter') {
        const twAcc = connectedAccounts.find((a: any) => a.platform === 'twitter');
        if (twAcc) matched += await lmTwitter(userId, platformRules, twAcc);
      }
    } catch (err: any) {
      console.error('[TEST-RUN LinkMe]', platform, err.message);
    }
  }

  return { matched, message: `Replied to ${matched} comment${matched !== 1 ? 's' : ''}.` };
}

async function lmYouTube(userId: string, videoId: string, rules: any[], ytAcc: any) {
  const youtube = buildYTClient(ytAcc);
  const res = await youtube.commentThreads.list({
    part: ['snippet'], videoId, maxResults: 20, order: 'time',
  });
  let matched = 0;

  for (const thread of res.data.items || []) {
    const commentId = thread.id!;
    const text = (thread.snippet?.topLevelComment?.snippet?.textDisplay || '').toLowerCase();
    const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
    if (authorChannelId === ytAcc.platformId) continue;

    const already = await checkYTReplied(userId, commentId, 'linkMe');
    if (already) continue;

    const rule = rules.find((r: any) => text.includes(r.keyword.toLowerCase()));
    if (!rule) continue;

    try {
      await youtube.comments.insert({
        part: ['snippet'],
        requestBody: { snippet: { parentId: commentId, textOriginal: rule.replyMessage } },
      });
      await markYTReplied(userId, commentId, 'linkMe');
      await adminDb.collection('users').doc(userId).collection('linkMeRules').doc(rule.id)
        .update({ totalMatches: (rule.totalMatches || 0) + 1 });
      matched++;
    } catch (err: any) {
      console.error('[TEST-RUN LinkMe YT comment]', err.message);
    }
  }
  return matched;
}

async function lmTwitter(userId: string, rules: any[], twAcc: any) {
  const mentions = await fetchMentions(twAcc, 20);
  let matched = 0;

  for (const mention of mentions) {
    if (mention.authorId === twAcc.platformId) continue;

    const already = await twCheckReplied(userId, mention.id, 'linkMe');
    if (already) continue;

    const rule = rules.find((r: any) => mention.text.toLowerCase().includes(r.keyword.toLowerCase()));
    if (!rule) continue;

    const ok = await replyToTweet(twAcc, mention.id, rule.replyMessage);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'linkMe');
      matched++;
    }
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
        if (ytAcc) replied += await arYouTube(userId, post.platformPostId, tmpl, ytAcc);
      } else if (platform === 'twitter') {
        const twAcc = connectedAccounts.find((a: any) => a.platform === 'twitter');
        if (twAcc) replied += await arTwitter(userId, tmpl, twAcc);
      }
    } catch (err: any) {
      console.error('[TEST-RUN AutoReply]', platform, err.message);
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
          { role: 'system', content: 'Write a short friendly reply to a social media comment. 1-2 sentences. No hashtags.' },
          { role: 'user', content: `Comment: "${commentText}"` },
        ],
        max_tokens: 80,
      });
      return res.choices[0].message.content?.trim() || template.message;
    } catch { return template.message; }
  }
  return (template.message || '').replace('{username}', username || 'there');
}

async function arYouTube(userId: string, videoId: string, template: any, ytAcc: any) {
  const youtube = buildYTClient(ytAcc);
  const res = await youtube.commentThreads.list({
    part: ['snippet'], videoId, maxResults: 10, order: 'time',
  });
  let replied = 0;

  for (const thread of res.data.items || []) {
    const commentId = thread.id!;
    const commentText = thread.snippet?.topLevelComment?.snippet?.textDisplay || '';
    const authorName = thread.snippet?.topLevelComment?.snippet?.authorDisplayName || '';
    const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
    if (authorChannelId === ytAcc.platformId) continue;

    const already = await checkYTReplied(userId, commentId, 'autoReply');
    if (already) continue;

    const replyText = await buildReplyText(template, commentText, authorName);
    try {
      await youtube.comments.insert({
        part: ['snippet'],
        requestBody: { snippet: { parentId: commentId, textOriginal: replyText } },
      });
      await markYTReplied(userId, commentId, 'autoReply');
      replied++;
    } catch (err: any) {
      console.error('[TEST-RUN AutoReply YT]', err.message);
    }
  }
  return replied;
}

async function arTwitter(userId: string, template: any, twAcc: any) {
  const mentions = await fetchMentions(twAcc, 20);
  let replied = 0;

  for (const mention of mentions) {
    if (mention.authorId === twAcc.platformId) continue;

    const already = await twCheckReplied(userId, mention.id, 'autoReply');
    if (already) continue;

    const replyText = await buildReplyText(template, mention.text, `@${mention.authorHandle}`);
    const ok = await replyToTweet(twAcc, mention.id, replyText);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'autoReply');
      replied++;
    }
  }
  return replied;
}
