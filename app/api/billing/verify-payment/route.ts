import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, planKey } = await req.json();

  if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature || !planKey)
    return NextResponse.json({ error: 'Missing payment fields' }, { status: 400 });

  // verify HMAC signature
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body   = `${razorpay_payment_id}|${razorpay_subscription_id}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

  if (expected !== razorpay_signature)
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });

  // update Firestore
  await adminDb.collection('users').doc(userId).update({
    plan:               planKey,
    planStatus:         'active',
    subscriptionId:     razorpay_subscription_id,
    lastPaymentId:      razorpay_payment_id,
    planActivatedAt:    new Date(),
    planUpdatedAt:      new Date(),
  });

  return NextResponse.json({ success: true, plan: planKey });
}
