// app/api/admin/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

// Very simple protection: a secret header
const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;

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
