// app/api/automation/test-run/route.ts
// Immediately runs Link Me or Auto Reply for the authenticated user.
// Scans the user's recent activity directly on each connected platform
// (YouTube channel uploads, Twitter mentions timeline) — not limited to
// posts published via StarlingPost. Iterates every connected account of
// each supported platform. Returns diagnostics so the UI can show what
// was actually scanned.
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

interface AccountStat {
  platform: 'youtube' | 'twitter';
  accountId: string;
  scanned: number;        // videos / mentions
  comments: number;       // comments seen (YT only)
  matched: number;        // comments matching a keyword (link-me) / non-self mentions (auto-reply)
  replied: number;        // actually replied to
  skippedDedup: number;   // already in dedup collection
  errors: string[];
}

interface RunStats {
  accounts: AccountStat[];
  notes: string[];
}

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

function buildMessage(verb: string, total: number, stats: RunStats): string {
  const totalLabel = `${verb} ${total} comment${total !== 1 ? 's' : ''}.`;
  const lines: string[] = [];

  for (const acc of stats.accounts) {
    if (acc.platform === 'youtube') {
      lines.push(
        `YouTube (${shortId(acc.accountId)}): scanned ${acc.scanned} video${acc.scanned !== 1 ? 's' : ''}, ` +
        `${acc.comments} comment${acc.comments !== 1 ? 's' : ''}, ` +
        `${acc.matched} match${acc.matched !== 1 ? 'es' : ''}, ` +
        `${acc.replied} replied` +
        (acc.skippedDedup ? `, ${acc.skippedDedup} already replied` : '') +
        (acc.errors.length ? ` — ${acc.errors[0]}` : ''),
      );
    } else {
      lines.push(
        `Twitter (${shortId(acc.accountId)}): scanned ${acc.scanned} mention${acc.scanned !== 1 ? 's' : ''}, ` +
        `${acc.matched} match${acc.matched !== 1 ? 'es' : ''}, ` +
        `${acc.replied} replied` +
        (acc.skippedDedup ? `, ${acc.skippedDedup} already replied` : '') +
        (acc.errors.length ? ` — ${acc.errors[0]}` : ''),
      );
    }
  }
  for (const note of stats.notes) lines.push(note);

  return lines.length ? `${totalLabel}\n${lines.join('\n')}` : totalLabel;
}

function shortId(id: string) {
  if (!id) return '—';
  return id.length > 10 ? id.slice(0, 6) + '…' + id.slice(-3) : id;
}

// ── Link Me ───────────────────────────────────────────────────────────────────

async function runLinkMe(userId: string) {
  const rulesSnap = await adminDb
    .collection('users').doc(userId)
    .collection('linkMeRules')
    .where('isActive', '==', true)
    .get();

  if (rulesSnap.empty) {
    return { matched: 0, message: 'No active Link Me rules found.', stats: { accounts: [], notes: [] } as RunStats };
  }

  const rules = rulesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const accounts = await loadConnectedAccounts(userId);
  const stats: RunStats = { accounts: [], notes: [] };
  let matched = 0;

  const ytRules = rules.filter((r: any) => r.platforms?.includes('youtube'));
  if (ytRules.length) {
    const ytAccounts = accounts.filter((a: any) => a.platform === 'youtube');
    if (!ytAccounts.length) stats.notes.push('No YouTube account connected.');
    for (const ytAcc of ytAccounts) {
      const acc: AccountStat = { platform: 'youtube', accountId: ytAcc.platformId, scanned: 0, comments: 0, matched: 0, replied: 0, skippedDedup: 0, errors: [] };
      try {
        await lmYouTube(userId, ytRules, ytAcc, acc);
      } catch (err: any) {
        acc.errors.push(err.message);
        console.error('[TEST-RUN LinkMe YT]', ytAcc.platformId, err.message);
      }
      stats.accounts.push(acc);
      matched += acc.replied;
    }
  }

  const twRules = rules.filter((r: any) => r.platforms?.includes('twitter'));
  if (twRules.length) {
    const twAccounts = accounts.filter((a: any) => a.platform === 'twitter');
    if (!twAccounts.length) stats.notes.push('No Twitter account connected.');
    for (const twAcc of twAccounts) {
      const acc: AccountStat = { platform: 'twitter', accountId: twAcc.platformId, scanned: 0, comments: 0, matched: 0, replied: 0, skippedDedup: 0, errors: [] };
      try {
        await lmTwitter(userId, twRules, twAcc, acc);
      } catch (err: any) {
        acc.errors.push(err.message);
        console.error('[TEST-RUN LinkMe TW]', twAcc.platformId, err.message);
      }
      stats.accounts.push(acc);
      matched += acc.replied;
    }
  }

  if (rules.some((r: any) => r.platforms?.includes('linkedin'))) {
    stats.notes.push('LinkedIn automation is coming soon — those rules were skipped.');
  }

  return { matched, message: buildMessage('Replied to', matched, stats), stats };
}

async function lmYouTube(userId: string, rules: any[], ytAcc: any, acc: AccountStat) {
  const youtube = buildYouTubeClient(ytAcc);
  const videoIds = await fetchRecentVideoIds(ytAcc, MAX_VIDEOS);
  acc.scanned = videoIds.length;
  if (!videoIds.length) {
    acc.errors.push('No recent videos found on this channel.');
    return;
  }

  for (const videoId of videoIds) {
    try {
      const res = await youtube.commentThreads.list({
        part: ['snippet'], videoId, maxResults: MAX_COMMENTS_PER_VIDEO, order: 'time',
      });
      const threads = res.data.items || [];
      acc.comments += threads.length;

      for (const thread of threads) {
        const commentId = thread.id!;
        const text = (thread.snippet?.topLevelComment?.snippet?.textDisplay || '').toLowerCase();
        const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
        if (authorChannelId === ytAcc.platformId) continue;

        const rule = rules.find((r: any) => text.includes(r.keyword.toLowerCase()));
        if (!rule) continue;
        acc.matched++;

        if (await checkYTReplied(userId, commentId, 'linkMe')) {
          acc.skippedDedup++;
          continue;
        }

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
          acc.replied++;
        } catch (err: any) {
          acc.errors.push(`reply: ${err.message}`);
          console.error('[TEST-RUN LinkMe YT reply]', err.message);
        }
      }
    } catch (err: any) {
      // commentsDisabled etc — don't blow up the whole run
      const msg = err.errors?.[0]?.reason || err.message;
      if (!acc.errors.includes(msg)) acc.errors.push(msg);
      console.error('[TEST-RUN LinkMe YT video]', videoId, err.message);
    }
  }
}

async function lmTwitter(userId: string, rules: any[], twAcc: any, acc: AccountStat) {
  const mentions = await fetchMentions(twAcc, MAX_MENTIONS);
  acc.scanned = mentions.length;

  for (const mention of mentions) {
    if (mention.authorId === twAcc.platformId) continue;

    const rule = rules.find((r: any) =>
      mention.text.toLowerCase().includes(r.keyword.toLowerCase()),
    );
    if (!rule) continue;
    acc.matched++;

    if (await twCheckReplied(userId, mention.id, 'linkMe')) {
      acc.skippedDedup++;
      continue;
    }

    const ok = await replyToTweet(twAcc, mention.id, rule.replyMessage);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'linkMe');
      await adminDb
        .collection('users').doc(userId)
        .collection('linkMeRules').doc(rule.id)
        .update({ totalMatches: (rule.totalMatches || 0) + 1 });
      acc.replied++;
    }
  }
}

// ── Auto Reply ────────────────────────────────────────────────────────────────

async function runAutoReply(userId: string) {
  const tplSnap = await adminDb
    .collection('users').doc(userId)
    .collection('autoReplyTemplates')
    .where('isActive', '==', true)
    .get();

  if (tplSnap.empty) {
    return { replied: 0, message: 'No active Auto Reply templates found.', stats: { accounts: [], notes: [] } as RunStats };
  }

  const templates = tplSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
  const accounts = await loadConnectedAccounts(userId);
  const stats: RunStats = { accounts: [], notes: [] };
  let replied = 0;

  const ytTemplate = templates.find((t: any) => t.platforms?.includes('youtube'));
  if (ytTemplate) {
    const ytAccounts = accounts.filter((a: any) => a.platform === 'youtube');
    if (!ytAccounts.length) stats.notes.push('No YouTube account connected.');
    for (const ytAcc of ytAccounts) {
      const acc: AccountStat = { platform: 'youtube', accountId: ytAcc.platformId, scanned: 0, comments: 0, matched: 0, replied: 0, skippedDedup: 0, errors: [] };
      try {
        await arYouTube(userId, ytTemplate, ytAcc, acc);
      } catch (err: any) {
        acc.errors.push(err.message);
        console.error('[TEST-RUN AR YT]', ytAcc.platformId, err.message);
      }
      stats.accounts.push(acc);
      replied += acc.replied;
    }
  }

  const twTemplate = templates.find((t: any) => t.platforms?.includes('twitter'));
  if (twTemplate) {
    const twAccounts = accounts.filter((a: any) => a.platform === 'twitter');
    if (!twAccounts.length) stats.notes.push('No Twitter account connected.');
    for (const twAcc of twAccounts) {
      const acc: AccountStat = { platform: 'twitter', accountId: twAcc.platformId, scanned: 0, comments: 0, matched: 0, replied: 0, skippedDedup: 0, errors: [] };
      try {
        await arTwitter(userId, twTemplate, twAcc, acc);
      } catch (err: any) {
        acc.errors.push(err.message);
        console.error('[TEST-RUN AR TW]', twAcc.platformId, err.message);
      }
      stats.accounts.push(acc);
      replied += acc.replied;
    }
  }

  if (templates.some((t: any) => t.platforms?.includes('linkedin'))) {
    stats.notes.push('LinkedIn automation is coming soon — those templates were skipped.');
  }

  return { replied, message: buildMessage('Sent', replied, stats), stats };
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

async function arYouTube(userId: string, template: any, ytAcc: any, acc: AccountStat) {
  const youtube = buildYouTubeClient(ytAcc);
  const videoIds = await fetchRecentVideoIds(ytAcc, MAX_VIDEOS);
  acc.scanned = videoIds.length;
  if (!videoIds.length) {
    acc.errors.push('No recent videos found on this channel.');
    return;
  }

  for (const videoId of videoIds) {
    try {
      const res = await youtube.commentThreads.list({
        part: ['snippet'], videoId, maxResults: MAX_COMMENTS_PER_VIDEO, order: 'time',
      });
      const threads = res.data.items || [];
      acc.comments += threads.length;

      for (const thread of threads) {
        const commentId = thread.id!;
        const commentText = thread.snippet?.topLevelComment?.snippet?.textDisplay || '';
        const authorName = thread.snippet?.topLevelComment?.snippet?.authorDisplayName || '';
        const authorChannelId = thread.snippet?.topLevelComment?.snippet?.authorChannelId?.value || '';
        if (authorChannelId === ytAcc.platformId) continue;
        acc.matched++;

        if (await checkYTReplied(userId, commentId, 'autoReply')) {
          acc.skippedDedup++;
          continue;
        }

        const replyText = await buildReplyText(template, commentText, authorName);
        try {
          await youtube.comments.insert({
            part: ['snippet'],
            requestBody: { snippet: { parentId: commentId, textOriginal: replyText } },
          });
          await markYTReplied(userId, commentId, 'autoReply');
          acc.replied++;
        } catch (err: any) {
          acc.errors.push(`reply: ${err.message}`);
          console.error('[TEST-RUN AR YT reply]', err.message);
        }
      }
    } catch (err: any) {
      const msg = err.errors?.[0]?.reason || err.message;
      if (!acc.errors.includes(msg)) acc.errors.push(msg);
      console.error('[TEST-RUN AR YT video]', videoId, err.message);
    }
  }
}

async function arTwitter(userId: string, template: any, twAcc: any, acc: AccountStat) {
  const mentions = await fetchMentions(twAcc, MAX_MENTIONS);
  acc.scanned = mentions.length;

  for (const mention of mentions) {
    if (mention.authorId === twAcc.platformId) continue;
    acc.matched++;

    if (await twCheckReplied(userId, mention.id, 'autoReply')) {
      acc.skippedDedup++;
      continue;
    }

    const replyText = await buildReplyText(template, mention.text, `@${mention.authorHandle}`);
    const ok = await replyToTweet(twAcc, mention.id, replyText);
    if (ok) {
      await twMarkReplied(userId, mention.id, 'autoReply');
      acc.replied++;
    }
  }
}
