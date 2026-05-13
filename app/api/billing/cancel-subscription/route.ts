import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { getRazorpay } from '@/lib/razorpay';
import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userDoc = await adminDb.collection('users').doc(userId).get();
  const profile = userDoc.data();

  const subscriptionId = profile?.subscriptionId;
  if (!subscriptionId)
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });

  // cancel at end of current billing cycle (cancel_at_cycle_end = 1)
  await getRazorpay().subscriptions.cancel(subscriptionId, true);

  await adminDb.collection('users').doc(userId).update({
    planStatus:    'cancelling',
    planUpdatedAt: new Date(),
  });

  return NextResponse.json({ success: true, message: 'Subscription will cancel at end of billing period' });
}
