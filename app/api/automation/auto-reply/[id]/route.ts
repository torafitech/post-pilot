// app/api/automation/auto-reply/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

const BETA_PLATFORMS = new Set(['youtube', 'twitter', 'linkedin', 'instagram', 'facebook', 'threads']);

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

    if ('name' in body) {
      const n = (body.name || '').toString().trim();
      if (!n) return NextResponse.json({ error: 'Template name cannot be empty' }, { status: 400 });
      updates.name = n;
    }
    if ('message' in body) {
      updates.message = (body.message || '').toString().trim();
    }
    if ('platforms' in body) {
      const ps = (Array.isArray(body.platforms) ? body.platforms : []).filter((p: string) => BETA_PLATFORMS.has(p));
      if (ps.length === 0) return NextResponse.json({ error: 'At least one valid platform required' }, { status: 400 });
      updates.platforms = ps;
    }
    if ('isActive' in body) {
      updates.isActive = !!body.isActive;
    }
    if ('useAI' in body) {
      updates.useAI = !!body.useAI;
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

    if (updates.useAI === false && 'message' in updates && !updates.message) {
      return NextResponse.json({ error: 'Message is required when not using AI' }, { status: 400 });
    }

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('autoReplyTemplates')
      .doc(id)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Auto Reply PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
      .collection('autoReplyTemplates')
      .doc(id)
      .delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Auto Reply DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
