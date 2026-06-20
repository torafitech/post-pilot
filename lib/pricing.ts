export type PlanKey = 'starter' | 'growth' | 'agency';

export interface Plan {
  key: PlanKey;
  label: string;
  price: string;
  priceNum: number;
  per: string;
  highlight: boolean;
  desc: string;
  cta: string;
  limit: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    key: 'starter',
    label: 'Starter',
    price: '$9',
    priceNum: 9,
    per: '/ month',
    highlight: false,
    desc: 'For individuals getting started with multi-platform posting.',
    cta: 'Start 14-day trial',
    limit: '3 connected accounts',
    features: [
      '3 connected accounts',
      '30 posts per month',
      '3 automation rules',
      'Post scheduling',
      'AI caption enhancement',
      'Link Me auto-reply',
      'Daily analytics sync',
    ],
  },
  {
    key: 'growth',
    label: 'Growth',
    price: '$19',
    priceNum: 19,
    per: '/ month',
    highlight: true,
    desc: 'For creators and personal brands posting seriously across platforms.',
    cta: 'Start 14-day trial',
    limit: '10 connected accounts',
    features: [
      '10 connected accounts',
      'Unlimited posts',
      'Unlimited automation rules',
      'Post scheduling',
      'AI caption enhancement',
      'Link Me auto-reply',
      'Live platform analytics',
      'Optimal post timing AI',
      'Multi-account per platform',
    ],
  },
  {
    key: 'agency',
    label: 'Agency',
    price: '$49',
    priceNum: 49,
    per: '/ month',
    highlight: false,
    desc: 'For agencies and teams managing multiple clients or brands.',
    cta: 'Start 14-day trial',
    limit: 'Unlimited accounts',
    features: [
      'Unlimited accounts',
      'Multiple workspaces',
      'Unlimited posts & rules',
      'All Growth features',
      'Team seats',
      'API access',
      'Priority support',
    ],
  },
];

export type ComparisonVal = boolean | string;

export interface ComparisonRow {
  feature: string;
  starter: ComparisonVal;
  growth: ComparisonVal;
  agency: ComparisonVal;
}

export const COMPARISON: ComparisonRow[] = [
  { feature: 'Connected accounts',            starter: '3',        growth: '10',        agency: 'Unlimited' },
  { feature: 'Posts per month',               starter: '30',       growth: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Automation rules',              starter: '3',        growth: 'Unlimited', agency: 'Unlimited' },
  { feature: 'Platforms (3 live + 3 coming)', starter: '6',        growth: '6',         agency: '6'         },
  { feature: 'Post scheduling',               starter: true,       growth: true,        agency: true        },
  { feature: 'AI caption enhancement',        starter: true,       growth: true,        agency: true        },
  { feature: 'Link Me auto-reply',            starter: true,       growth: true,        agency: true        },
  { feature: 'Live platform analytics',       starter: false,      growth: true,        agency: true        },
  { feature: 'Optimal post timing',           starter: false,      growth: true,        agency: true        },
  { feature: 'Multi-account per platform',    starter: false,      growth: true,        agency: true        },
  { feature: 'Multiple workspaces',           starter: false,      growth: false,       agency: true        },
  { feature: 'Priority support',              starter: false,      growth: false,       agency: true        },
  { feature: 'API access',                    starter: false,      growth: false,       agency: true        },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const PRICING_FAQ: FaqItem[] = [
  {
    q: 'Is there a free tier?',
    a: 'No free tier — every plan starts with a 14-day free trial, no credit card required. After the trial, choose the plan that fits. API calls, AI processing, and cron jobs all have real costs; a free tier would mean subsidising non-paying users indefinitely.',
  },
  {
    q: 'What happens after the 14-day trial?',
    a: 'Your account is paused. All your data, posts, and automation rules are preserved for 30 days. Subscribe at any time to resume from exactly where you left off.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'Beta is live on YouTube, Twitter/X, and LinkedIn. Instagram, Facebook, and Threads are coming soon.',
  },
  {
    q: 'What counts as a post?',
    a: 'One post creation = one post, regardless of how many platforms it publishes to. Publishing to all three live platforms simultaneously counts as 1 post.',
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. Cancel any time and you keep access until the end of your billing period. No lock-in, no cancellation fees.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes. Upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.',
  },
];

export const HOMEPAGE_FAQ: FaqItem[] = [
  {
    q: 'Which platforms are supported?',
    a: 'Beta is live on YouTube, Twitter/X, and LinkedIn. Instagram, Facebook, and Threads are coming soon.',
  },
  {
    q: 'Can I connect multiple accounts on the same platform?',
    a: 'Yes. Starter plan: 3 accounts total. Growth: 10. Agency: unlimited. Multi-account per platform is available on Growth and Agency plans.',
  },
  {
    q: 'How does AI enhancement work?',
    a: 'Your caption goes to OpenAI gpt-4o-mini with per-platform rules (length, tone, hashtag style). You see a side-by-side and accept or reject each suggestion.',
  },
  {
    q: 'Does comment auto-reply actually work?',
    a: 'Yes — on YouTube, Twitter/X, and LinkedIn. Instagram, Facebook, and Threads automation is coming soon.',
  },
  {
    q: 'Is this safe to run on my real accounts?',
    a: 'OAuth is scoped read/write only. Dedup tracking ensures the same comment is never replied to twice. Any rule can be paused instantly.',
  },
];

export const LIVE_PLATFORMS = ['YouTube', 'Twitter/X', 'LinkedIn'] as const;
export const COMING_SOON_PLATFORMS = ['Instagram', 'Facebook', 'Threads'] as const;
