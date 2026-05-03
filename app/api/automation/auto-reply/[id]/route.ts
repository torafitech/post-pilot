// app/api/automation/auto-reply/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

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
    const allowed = ['name', 'message', 'platforms', 'isActive', 'useAI'];
    const updates: Record<string, any> = { updatedAt: new Date() };
    for (const f of allowed) {
      if (f in body) updates[f] = body[f];
    }

    await adminDb
      .collection('users')
      .doc(userId)
      .collection('autoReplyTemplates')
      .doc(id)
      .update(updates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
