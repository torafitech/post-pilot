// app/api/automation/link-me/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';

// PATCH /api/automation/link-me/:id — update rule (toggle active, edit fields)
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
    const allowedFields = ['keyword', 'replyMessage', 'platforms', 'isActive'];
    const updates: Record<string, any> = { updatedAt: new Date() };

    for (const field of allowedFields) {
      if (field in body) {
        if (field === 'keyword' && typeof body.keyword === 'string') {
          updates.keyword = body.keyword.trim().toLowerCase();
        } else {
          updates[field] = body[field];
        }
      }
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

// DELETE /api/automation/link-me/:id — delete rule
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
