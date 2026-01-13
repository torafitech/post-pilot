// app/api/instagram/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

const GRAPH_API_BASE =
  process.env.NEXT_PUBLIC_GRAPH_API_URL || 'https://graph.facebook.com/v18.0';

// Helper: get account from users/{userId}/connectedAccounts
async function getInstagramAccount(userId: string) {
  const snap = await adminDb.collection('users').doc(userId).get();

  if (!snap.exists) {
    return null;
  }

  const userData = snap.data() as any;
  const accounts = userData.connectedAccounts || [];
  const instagramAccount = accounts.find(
    (acc: any) => acc.platform === 'instagram',
  );

  return instagramAccount || null;
}

export async function POST(request: NextRequest) {
  try {
    const isInternal = request.headers.get('x-internal-call') === '1';
    const body = await request.json();

    let userId: string | null = null;

    if (isInternal && body._userId) {
      // Trusted internal server-to-server call
      userId = body._userId as string;
    } else {
      userId = await getUserIdFromRequest(request);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      mediaUrl,
      mediaType,
      caption,
    }: {
      mediaUrl?: string | null;
      mediaType?: 'image' | 'video' | null;
      caption?: string;
    } = body;

    if (!mediaUrl || !mediaType) {
      return NextResponse.json(
        { error: 'mediaUrl and mediaType are required' },
        { status: 400 },
      );
    }

    const instagramAccount = await getInstagramAccount(userId);

    if (!instagramAccount) {
      return NextResponse.json(
        { error: 'Instagram not connected' },
        { status: 400 },
      );
    }

    const { accessToken, platformId: igBusinessAccountId } = instagramAccount;

    // Build container payload based on mediaType
    let containerPayload: any = {
      caption: caption || '',
      access_token: accessToken,
    };

    if (mediaType === 'image') {
      containerPayload.image_url = mediaUrl;
    } else if (mediaType === 'video') {
      // Video / Reels publishing via Graph API[web:151]
      containerPayload.video_url = mediaUrl;
      containerPayload.media_type = 'REELS'; // adjust if you want feed video instead[web:151]
    } else {
      return NextResponse.json(
        { error: 'Unsupported mediaType for Instagram' },
        { status: 400 },
      );
    }

    // 1) Create media container
    const containerRes = await fetch(
      `${GRAPH_API_BASE}/${igBusinessAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(containerPayload),
      },
    );
    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      return NextResponse.json(
        {
          error: 'Failed to create media container',
          details: containerData,
        },
        { status: 400 },
      );
    }

    const creationId = containerData.id as string;

    // 2) Poll media status until FINISHED (fix for "Media ID is not available")[web:170][web:178]
    let status = 'IN_PROGRESS';
    const maxAttempts = 10; // ~50s max
    let attempts = 0;

    while (status !== 'FINISHED' && attempts < maxAttempts) {
      attempts += 1;

      const statusRes = await fetch(
        `${GRAPH_API_BASE}/${creationId}?fields=status_code&access_token=${accessToken}`,
      );
      const statusData = await statusRes.json();

      if (statusRes.ok && statusData.status_code) {
        status = statusData.status_code as string;
        console.log(
          `Instagram container status attempt ${attempts}:`,
          status,
        );

        if (status === 'FINISHED') {
          break;
        }
        if (status === 'ERROR') {
          return NextResponse.json(
            {
              error: 'Media processing failed',
              details: statusData,
            },
            { status: 400 },
          );
        }
      } else {
        console.warn('Failed to get container status', statusData);
      }

      // Wait 5 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (status !== 'FINISHED') {
      return NextResponse.json(
        {
          error: 'Media not ready after waiting',
          details: { status, attempts },
        },
        { status: 400 },
      );
    }

    // 3) Publish the media
    const publishRes = await fetch(
      `${GRAPH_API_BASE}/${igBusinessAccountId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      },
    );
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      return NextResponse.json(
        { error: 'Failed to publish post', details: publishData },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      instagramPostId: publishData.id,
      creationId,
    });
  } catch (error: any) {
    console.error('Instagram publish error:', error);
    return NextResponse.json(
      { error: 'Server error', details: error.message },
      { status: 500 },
    );
  }
}
