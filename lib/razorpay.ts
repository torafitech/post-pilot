import Razorpay from 'razorpay';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
}

export const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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
