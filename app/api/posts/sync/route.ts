// app/api/posts/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { SocialPost, PostMetrics } from '@/types/post';
import { fetchYouTubeMetrics } from '@/lib/metrics/youtube';
import { fetchTwitterMetrics } from '@/lib/metrics/twitter';
import { fetchLinkedinMetrics } from '@/lib/metrics/linkedin';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const { userId } = body;
    console.log('[SYNC] Called with userId', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 },
      );
    }

    const postsSnap = await adminDb
      .collection('users')
      .doc(userId)
      .collection('posts')
      .where('platformPostId', '!=', null)
      .limit(50)
      .get();

    console.log('[SYNC] Posts found:', postsSnap.size);

    const userSnap = await adminDb.collection('users').doc(userId).get();
    const userData = userSnap.exists ? (userSnap.data() as any) : {};
    const connectedAccounts = userData.connectedAccounts || [];

    const updates: string[] = [];
    const rateLimitHits: any[] = [];

    for (const postDoc of postsSnap.docs) {
      const data = postDoc.data() as SocialPost;
      console.log('[SYNC] Processing post', postDoc.id, {
        platform: data.platform,
        accountId: data.accountId,
        platformPostId: data.platformPostId,
      });

      try {
        const metrics = await fetchPlatformMetrics(
          data.platform,
          data.accountId,
          data.platformPostId,
          connectedAccounts,
        );

        console.log('[SYNC] Metrics returned for post', postDoc.id, metrics);

        await adminDb
          .collection('users')
          .doc(userId)
          .collection('posts')
          .doc(postDoc.id)
          .update({
            metrics: { ...(data.metrics || {}), ...metrics },
            lastSyncedAt: new Date(),
          });

        updates.push(postDoc.id);
      } catch (err: any) {
        if (err?.code === 429 || err?.status === 429) {
          console.warn('[SYNC] Rate limit for', data.platform, 'post', postDoc.id);
          rateLimitHits.push({
            platform: data.platform,
            postId: postDoc.id,
            info: err?.rateLimit || err?.data || null,
          });
          continue;
        }

        console.error('[SYNC] Metrics fetch error for post', postDoc.id, err);
      }
    }

    console.log('[SYNC] Done. Updated posts:', updates);

    return NextResponse.json({
      success: true,
      updated: updates.length,
      rateLimitHits,
    });
  } catch (error: any) {
    console.error('sync posts error', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

function getAccount(platform: string, connectedAccounts: any[]): any | null {
  const key = platform.toLowerCase();
  return connectedAccounts.find((a: any) => a.platform?.toLowerCase() === key) || null;
}

async function fetchPlatformMetrics(
  platform: string,
  accountId: string,
  platformPostId: string,
  connectedAccounts: any[],
): Promise<PostMetrics> {
  const key = platform?.toLowerCase();

  switch (key) {
    case 'youtube': {
      return fetchYouTubeMetrics(accountId, platformPostId);
    }
    case 'twitter': {
      const twAcc = getAccount('twitter', connectedAccounts);
      if (!twAcc) {
        console.warn('[SYNC] No twitter account found for metrics');
        return {};
      }
      return fetchTwitterMetrics(
        twAcc.platformId,
        platformPostId,
        twAcc.oauthToken,
        twAcc.oauthTokenSecret,
      );
    }
    case 'linkedin': {
      const liAcc = getAccount('linkedin', connectedAccounts);
      if (!liAcc) {
        console.warn('[SYNC] No linkedin account found for metrics');
        return {};
      }
      return fetchLinkedinMetrics(
        liAcc.authorUrn || accountId,
        platformPostId,
        liAcc.accessToken,
      );
    }
    default:
      console.warn('[SYNC] Unknown or unsupported platform, skipping:', platform);
      return {};
  }
}
