import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

const SETUP_SECRET = 'postpilot-admin-setup-9baf6c3c8e7f4e3e9a1c';

export async function POST(req: NextRequest) {
  try {
    if (!SETUP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'ADMIN_SETUP_SECRET not configured' },
        { status: 500 },
      );
    }

    const secret = req.headers.get('x-admin-setup-secret');
    if (secret !== SETUP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const { uid, isAdmin } = await req.json();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Missing uid' },
        { status: 400 },
      );
    }

    await adminAuth.setCustomUserClaims(uid, { isAdmin: !!isAdmin });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[ADMIN SETUP] error', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
