// app/api/threads/publish/route.ts
// Publish to a connected Threads account. Supports text, image, and video.
// Called internally by /api/posts/publish.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { publishThreadsPost } from '@/lib/threadsPost';

async function getThreadsAccount(userId: string) {
  const snap = await adminDb.collection('users').doc(userId).get();
  const accounts: any[] = snap.data()?.connectedAccounts || [];
  return accounts.find((a: any) => a.platform === 'threads') || null;
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

    const thAcc = await getThreadsAccount(userId);
    if (!thAcc) {
      return NextResponse.json({ error: 'Threads not connected' }, { status: 400 });
    }

    const result = await publishThreadsPost(thAcc, {
      text: caption || '',
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Threads publish failed' }, { status: 400 });
    }

    return NextResponse.json({ success: true, threadsPostId: result.threadId });
  } catch (err: any) {
    console.error('Threads publish error:', err);
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 });
  }
}
