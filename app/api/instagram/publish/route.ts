// app/api/instagram/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

const GRAPH_API_BASE =
  process.env.NEXT_PUBLIC_GRAPH_API_URL || 'https://graph.facebook.com/v18.0';

// Helper function to get account from users/{userId}/connectedAccounts
async function getInstagramAccount(userId: string) {
  const snap = await adminDb
    .collection('users')
    .doc(userId)
    .get();

  if (!snap.exists) {
    return null;
  }

  const userData = snap.data() as any;
  const accounts = userData.connectedAccounts || [];
  const instagramAccount = accounts.find((acc: any) => acc.platform === 'instagram');

  return instagramAccount || null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, caption } = body as { imageUrl?: string; caption?: string };

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL required for Instagram' },
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

    const containerRes = await fetch(
      `${GRAPH_API_BASE}/${igBusinessAccountId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption || '',
          access_token: accessToken,
        }),
      },
    );
    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      return NextResponse.json(
        { error: 'Failed to create media container', details: containerData },
        { status: 400 },
      );
    }

    const creationId = containerData.id as string;

    await new Promise((resolve) => setTimeout(resolve, 2000));

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
