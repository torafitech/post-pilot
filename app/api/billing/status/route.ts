import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { razorpay } from '@/lib/razorpay';
import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userDoc = await adminDb.collection('users').doc(userId).get();
  const profile = userDoc.data();

  if (!profile?.subscriptionId)
    return NextResponse.json({ plan: profile?.plan || 'trial', planStatus: profile?.planStatus || 'trial', subscription: null });

  try {
    const sub = await razorpay.subscriptions.fetch(profile.subscriptionId);
    return NextResponse.json({
      plan:           profile.plan,
      planStatus:     profile.planStatus,
      subscription: {
        id:              sub.id,
        status:          sub.status,
        currentStart:    sub.current_start,
        currentEnd:      sub.current_end,
        chargeAt:        sub.charge_at,
        totalCount:      sub.total_count,
        paidCount:       sub.paid_count,
      },
    });
  } catch {
    return NextResponse.json({ plan: profile.plan, planStatus: profile.planStatus, subscription: null });
  }
}
