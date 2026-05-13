import Razorpay from 'razorpay';

let _client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (_client) return _client;
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

export const PLAN_IDS: Record<string, string> = {
  starter: process.env.RAZORPAY_PLAN_STARTER || '',
  growth:  process.env.RAZORPAY_PLAN_GROWTH  || '',
  agency:  process.env.RAZORPAY_PLAN_AGENCY  || '',
};

export const PLAN_AMOUNTS: Record<string, { usd: number; label: string }> = {
  starter: { usd: 9,  label: 'Starter' },
  growth:  { usd: 19, label: 'Growth'  },
  agency:  { usd: 49, label: 'Agency'  },
};
