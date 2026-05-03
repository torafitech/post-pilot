import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snap = await adminDb.collection('users').doc(userId).get();

    if (!snap.exists) {
      return NextResponse.json({ youtube: null, twitter: null, linkedin: null });
    }

    const userData = snap.data() as any;
    const accounts = userData.connectedAccounts || [];

    const result: any = { youtube: null, twitter: null, linkedin: null };

    accounts.forEach((acc: any) => {
      if (acc.platform === 'youtube') result.youtube = acc;
      if (acc.platform === 'twitter') result.twitter = acc;
      if (acc.platform === 'linkedin') result.linkedin = acc;
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
