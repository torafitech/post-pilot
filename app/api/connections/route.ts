import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED = ['youtube', 'twitter', 'linkedin', 'instagram', 'facebook', 'threads'] as const;

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const empty: Record<string, any> = {};
    SUPPORTED.forEach((p) => { empty[p] = null; });

    const snap = await adminDb.collection('users').doc(userId).get();
    if (!snap.exists) return NextResponse.json(empty);

    const userData = snap.data() as any;
    const accounts = userData.connectedAccounts || [];

    const result = { ...empty };
    accounts.forEach((acc: any) => {
      if (SUPPORTED.includes(acc.platform)) result[acc.platform] = acc;
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Connections fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to load connections' },
      { status: 500 },
    );
  }
}
