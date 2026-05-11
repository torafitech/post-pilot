// app/api/automation/link-me/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

const BETA_PLATFORMS = new Set(['youtube', 'twitter', 'linkedin', 'instagram', 'facebook', 'threads']);

// PATCH /api/automation/link-me/:id — update rule fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const updates: Record<string, any> = { updatedAt: new Date() };

    if ('keyword' in body) {
      const k = (body.keyword || '').toString().trim().toLowerCase();
      if (!k) return NextResponse.json({ error: 'Keyword cannot be empty' }, { status: 400 });
      updates.keyword = k;
    }
    if ('replyMessage' in body) {
      const m = (body.replyMessage || '').toString().trim();
      if (!m) return NextResponse.json({ error: 'Reply message cannot be empty' }, { status: 400 });
      updates.replyMessage = m;
    }
    if ('platforms' in body) {
      const ps = (Array.isArray(body.platforms) ? body.platforms : []).filter((p: string) => BETA_PLATFORMS.has(p));
      if (ps.length === 0) return NextResponse.json({ error: 'At least one valid platform required' }, { status: 400 });
      updates.platforms = ps;
    }
    if ('isActive' in body) {
      updates.isActive = !!body.isActive;
    }
    if ('postScope' in body) {
      updates.postScope = body.postScope === 'custom' ? 'custom' : 'recent';
    }
    if ('recentCount' in body) {
      const n = Number(body.recentCount);
      updates.recentCount = Math.min(Math.max(Number.isFinite(n) ? n : 5, 1), 10);
    }
    if ('customUrls' in body) {
      const urls = (Array.isArray(body.customUrls) ? body.customUrls : [])
        .filter((u: any) => typeof u === 'string' && u.trim())
        .slice(0, 20);
      updates.customUrls = urls;
    }

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('linkMeRules')
      .doc(id)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Link Me PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/automation/link-me/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  try {
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('linkMeRules')
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Link Me DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
