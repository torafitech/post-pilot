// Pre-launch / founding-member config.
// ⚠️ seatsClaim is still a placeholder — confirm before ad spend goes live.
// Single source of truth for landing-page launch pricing + waitlist form options.

export const LAUNCH_PRICING = {
  currency: '₹',
  regularPrice: 1499,     // strikethrough "regular" price
  foundingPrice: 999,     // founding member price
  period: '/ month',
  seatsClaim: 'First 100 members', // PLACEHOLDER — scarcity line
  lockNote: 'Locked for life. Price never increases while your subscription stays active.',
} as const;

export const FOUNDING_INCLUDES = [
  'Every connected account included — no per-channel fees',
  'One-click posting to all connected platforms',
  'Centralised dashboard across every platform',
  'Auto-reply capture + link-in-bio for inbound leads',
  'AI-written descriptions with SEO-friendly tags',
  'Founding price locked for life',
];

export const BUSINESS_TYPES = [
  'Developer',
  'Designer',
  'Consultant',
  'Marketer',
  'Other',
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const WAITLIST_COLLECTION = 'waitlist_registrations';

export const CTA_LABEL = 'Get Early Access — Founding Member Pricing';

export const CONFIRMATION_COPY =
  "You're on the list — we'll notify you the moment StarlingPost launches, and your founding member price is locked in.";
