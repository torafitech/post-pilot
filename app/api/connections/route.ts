import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const userId = 'demo_user';

    // Get all accounts from users/{userId}/connectedAccounts
    const snap = await adminDb
      .collection('users')
      .doc(userId)
      .get();

    if (!snap.exists) {
      return NextResponse.json({
        instagram: null,
        youtube: null,
        twitter: null,
        linkedin: null,
      });
    }

    const userData = snap.data() as any;
    const accounts = userData.connectedAccounts || [];

    // Map accounts by platform
    const result: any = {
      instagram: null,
      youtube: null,
      twitter: null,
      linkedin: null,
    };

    accounts.forEach((acc: any) => {
      if (acc.platform === 'instagram') result.instagram = acc;
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
