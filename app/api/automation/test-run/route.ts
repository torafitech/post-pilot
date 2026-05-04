// app/api/automation/test-run/route.ts
// Immediately runs Link Me or Auto Reply for the authenticated user.
// Scans the user's recent activity directly on each connected platform
// (YouTube channel uploads, Twitter mentions timeline) — not limited to
// posts published via StarlingPost. Iterates every connected account of
// each supported platform.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
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

const MAX_VIDEOS = 10;
const MAX_COMMENTS_PER_VIDEO = 20;
const MAX_MENTIONS = 20;

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

async function loadConnectedAccounts(userId: string): Promise<any[]> {
  const snap = await adminDb.collection('users').doc(userId).get();
  return (snap.data()?.connectedAccounts || []) as any[];
}

// ── Link Me ───────────────────────────────────────────────────────────────────

async function runLinkMe(userId: string) {
  const rulesSnap = await adminDb
    .collection('users').doc(userId)
    .collection('linkMeRules')
    .where('isActive', '==', true)
    .get();

  if (rulesSnap.empty) return { matched: 0, message: 'No active Link Me rules found.' };

  const rules = rulesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const accounts = await loadConnectedAccounts(userId);
  const notes: string[] = [];
  let matched = 0;

  // YouTube
  const ytRules = rules.filter((r: any) => r.platforms?.includes('youtube'));
  if (ytRules.length) {
    const ytAccounts = accounts.filter((a: any) => a.platform === 'youtube');
    if (!ytAccounts.length) {
      notes.push('No YouTube account connected.');
    }
    for (const ytAcc of ytAccounts) {
      try {
        matched += await lmYouTube(userId, ytRules, ytAcc);
      } catch (err: any) {
        console.error('[TEST-RUN LinkMe YT]', ytAcc.platformId, err.message);
      }
    }
  }

  // Twitter
  const twRules = rules.filter((r: any) => r.platforms?.includes('twitter'));
  if (twRules.length) {
    const twAccounts = accounts.filter((a: any) => a.platform === 'twitter');
    if (!twAccounts.length) {
      notes.push('No Twitter account connected.');
    }
    for (const twAcc of twAccounts) {
      try {
        matched += await lmTwitter(userId, twRules, twAcc);
      } catch (err: any) {
        console.error('[TEST-RUN LinkMe TW]', twAcc.platformId, err.message);
      }
    }
  }

  // LinkedIn — not yet supported
  if (rules.some((r: any) => r.platforms?.includes('linkedin'))) {
    notes.push('LinkedIn automation is coming soon — those rules were skipped.');
  }

  let message = `Replied to ${matched} comment${matched !== 1 ? 's' : ''}.`;
  if (notes.length) message += ' ' + notes.join(' ');
  return { matched, message };
}

async function lmYouTube(userId: string, rules: any[], ytAcc: any): Promise<number> {
  const youtube = buildYouTubeClient(ytAcc);
  const videoIds = await fetchRecentVideoIds(ytAcc, MAX_VIDEOS);
  let matched = 0;

  for (const videoId of videoIds) {
    try {
      const res = await youtube.commentThreads.list({
        part: ['snippet'], videoId, maxResults: MAX_COMMENTS_PER_VIDEO, order: 'time',
      });
      for (const thread of res.data.items || []) {
        const commentId = thread.id!;
        const text = (thread.snippet?.topLevelComment?.snippet?.textDisplay || '').toLowerCase();
        const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
        if (authorChannelId === ytAcc.platformId) continue;

        if (await checkYTReplied(userId, commentId, 'linkMe')) continue;

        const rule = rules.find((r: any) => text.includes(r.keyword.toLowerCase()));
        if (!rule) continue;

        try {
          await youtube.comments.insert({
            part: ['snippet'],
            requestBody: { snippet: { parentId: commentId, textOriginal: rule.replyMessage } },
          });
          await markYTReplied(userId, commentId, 'linkMe');
          await adminDb
            .collection('users').doc(userId)
            .collection('linkMeRules').doc(rule.id)
            .update({ totalMatches: (rule.totalMatches || 0) + 1 });
          matched++;
        } catch (err: any) {
          console.error('[TEST-RUN LinkMe YT reply]', err.message);
        }
      }
    } catch (err: any) {
      console.error('[TEST-RUN LinkMe YT video]', videoId, err.message);
    }
  }
  return matched;
}

async function lmTwitter(userId: string, rules: any[], twAcc: any): Promise<number> {
  const mentions = await fetchMentions(twAcc, MAX_MENTIONS);
  let matched = 0;

  for (const mention of mentions) {
    if (mention.authorId === twAcc.platformId) continue;
    if (await twCheckReplied(userId, mention.id, 'linkMe')) continue;

    const rule = rules.find((r: any) =>
      mention.text.toLowerCase().includes(r.keyword.toLowerCase()),
    );
    if (!rule) continue;

    const ok = await replyToTweet(twAcc, mention.id, rule.replyMessage);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'linkMe');
      await adminDb
        .collection('users').doc(userId)
        .collection('linkMeRules').doc(rule.id)
        .update({ totalMatches: (rule.totalMatches || 0) + 1 });
      matched++;
    }
  }
  return matched;
}

// ── Auto Reply ────────────────────────────────────────────────────────────────

async function runAutoReply(userId: string) {
  const tplSnap = await adminDb
    .collection('users').doc(userId)
    .collection('autoReplyTemplates')
    .where('isActive', '==', true)
    .get();

  if (tplSnap.empty) return { replied: 0, message: 'No active Auto Reply templates found.' };

  const templates = tplSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const accounts = await loadConnectedAccounts(userId);
  const notes: string[] = [];
  let replied = 0;

  // YouTube — first active template per platform
  const ytTemplate = templates.find((t: any) => t.platforms?.includes('youtube'));
  if (ytTemplate) {
    const ytAccounts = accounts.filter((a: any) => a.platform === 'youtube');
    if (!ytAccounts.length) {
      notes.push('No YouTube account connected.');
    }
    for (const ytAcc of ytAccounts) {
      try {
        replied += await arYouTube(userId, ytTemplate, ytAcc);
      } catch (err: any) {
        console.error('[TEST-RUN AR YT]', ytAcc.platformId, err.message);
      }
    }
  }

  const twTemplate = templates.find((t: any) => t.platforms?.includes('twitter'));
  if (twTemplate) {
    const twAccounts = accounts.filter((a: any) => a.platform === 'twitter');
    if (!twAccounts.length) {
      notes.push('No Twitter account connected.');
    }
    for (const twAcc of twAccounts) {
      try {
        replied += await arTwitter(userId, twTemplate, twAcc);
      } catch (err: any) {
        console.error('[TEST-RUN AR TW]', twAcc.platformId, err.message);
      }
    }
  }

  if (templates.some((t: any) => t.platforms?.includes('linkedin'))) {
    notes.push('LinkedIn automation is coming soon — those templates were skipped.');
  }

  let message = `Sent ${replied} auto-repl${replied !== 1 ? 'ies' : 'y'}.`;
  if (notes.length) message += ' ' + notes.join(' ');
  return { replied, message };
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

async function arYouTube(userId: string, template: any, ytAcc: any): Promise<number> {
  const youtube = buildYouTubeClient(ytAcc);
  const videoIds = await fetchRecentVideoIds(ytAcc, MAX_VIDEOS);
  let replied = 0;

  for (const videoId of videoIds) {
    try {
      const res = await youtube.commentThreads.list({
        part: ['snippet'], videoId, maxResults: MAX_COMMENTS_PER_VIDEO, order: 'time',
      });
      for (const thread of res.data.items || []) {
        const commentId = thread.id!;
        const commentText = thread.snippet?.topLevelComment?.snippet?.textDisplay || '';
        const authorName = thread.snippet?.topLevelComment?.snippet?.authorDisplayName || '';
        const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
        if (authorChannelId === ytAcc.platformId) continue;
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
          console.error('[TEST-RUN AR YT reply]', err.message);
        }
      }
    } catch (err: any) {
      console.error('[TEST-RUN AR YT video]', videoId, err.message);
    }
  }
  return replied;
}

async function arTwitter(userId: string, template: any, twAcc: any): Promise<number> {
  const mentions = await fetchMentions(twAcc, MAX_MENTIONS);
  let replied = 0;

  for (const mention of mentions) {
    if (mention.authorId === twAcc.platformId) continue;
    if (await twCheckReplied(userId, mention.id, 'autoReply')) continue;

    const replyText = await buildReplyText(template, mention.text, `@${mention.authorHandle}`);
    const ok = await replyToTweet(twAcc, mention.id, replyText);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'autoReply');
      replied++;
    }
  }
  return replied;
}
