// app/api/facebook/publish/route.ts
// Publish to a connected Facebook Page. Supports text, image, and video.
// Called internally by /api/posts/publish.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { publishFacebookPost } from '@/lib/facebookPost';

async function getFacebookAccount(userId: string) {
  const snap = await adminDb.collection('users').doc(userId).get();
  const accounts: any[] = snap.data()?.connectedAccounts || [];
  return accounts.find((a: any) => a.platform === 'facebook') || null;
}

export async function POST(request: NextRequest) {
  try {
    const isInternal = request.headers.get('x-internal-call') === '1';
    const body = await request.json();

    let userId: string | null = null;
    if (isInternal && body._userId) {
      userId = body._userId as string;
    } else {
      userId = await getUserIdFromRequest(request);
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { caption, imageUrl, videoUrl } = body as {
      caption?: string;
      imageUrl?: string | null;
      videoUrl?: string | null;
    };

    const fbAcc = await getFacebookAccount(userId);
    if (!fbAcc) {
      return NextResponse.json({ error: 'Facebook not connected' }, { status: 400 });
    }

    const result = await publishFacebookPost(fbAcc, {
      message: caption || '',
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Facebook publish failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, facebookPostId: result.postId });
  } catch (err: any) {
    console.error('Facebook publish error:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}
