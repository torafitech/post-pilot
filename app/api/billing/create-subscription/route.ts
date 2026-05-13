import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { razorpay, PLAN_IDS, PLAN_AMOUNTS } from '@/lib/razorpay';
import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { planKey } = await req.json();

  if (!['starter', 'growth', 'agency'].includes(planKey))
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

  const planId = PLAN_IDS[planKey];
  if (!planId)
    return NextResponse.json({ error: `Razorpay plan ID not configured for ${planKey}` }, { status: 500 });

  // fetch user profile for prefill
  const userDoc = await adminDb.collection('users').doc(userId).get();
  const profile = userDoc.data();

  const subscription = await razorpay.subscriptions.create({
    plan_id:         planId,
    total_count:     120, // 10 years max — effectively indefinite
    quantity:        1,
    customer_notify: 1,
    notes: {
      userId,
      planKey,
    },
  });

  return NextResponse.json({
    subscriptionId: subscription.id,
    keyId:          process.env.RAZORPAY_KEY_ID,
    planKey,
    planLabel:      PLAN_AMOUNTS[planKey].label,
    prefill: {
      email: profile?.email || '',
      name:  profile?.displayName || '',
      contact: profile?.mobile || '',
    },
  });
}
