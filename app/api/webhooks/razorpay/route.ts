import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Razorpay sends webhook signature in X-Razorpay-Signature header
function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
}

async function findUserBySubscriptionId(subscriptionId: string): Promise<string | null> {
  const snap = await adminDb.collection('users').where('subscriptionId', '==', subscriptionId).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });

  const rawBody  = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  if (!verifyWebhookSignature(rawBody, signature, secret))
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });

  const event = JSON.parse(rawBody);
  const eventType: string = event.event;
  const payload = event.payload;

  const subscriptionId: string | undefined =
    payload?.subscription?.entity?.id ||
    payload?.payment?.entity?.description;

  if (!subscriptionId) return NextResponse.json({ ok: true });

  const userId = await findUserBySubscriptionId(subscriptionId);
  if (!userId) return NextResponse.json({ ok: true });

  const ref = adminDb.collection('users').doc(userId);

  switch (eventType) {
    case 'subscription.charged':
      // successful renewal payment
      await ref.update({
        planStatus:     'active',
        lastPaymentId:  payload?.payment?.entity?.id || '',
        planUpdatedAt:  new Date(),
      });
      break;

    case 'subscription.activated':
      await ref.update({ planStatus: 'active', planUpdatedAt: new Date() });
      break;

    case 'subscription.cancelled':
      await ref.update({ plan: 'expired', planStatus: 'cancelled', subscriptionId: null, planUpdatedAt: new Date() });
      break;

    case 'subscription.completed':
      await ref.update({ plan: 'expired', planStatus: 'completed', planUpdatedAt: new Date() });
      break;

    case 'subscription.halted':
      // payment failed repeatedly — Razorpay halts subscription
      await ref.update({ planStatus: 'halted', planUpdatedAt: new Date() });
      break;

    case 'payment.failed':
      // optional: mark for retry notification
      await ref.update({ planStatus: 'payment_failed', planUpdatedAt: new Date() });
      break;
  }

  return NextResponse.json({ ok: true });
}
