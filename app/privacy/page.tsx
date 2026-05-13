import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Information we collect',
    body: [
      'Account information you provide: email address, display name, and mobile number.',
      'Data from connected social accounts: post metadata, performance metrics (views, likes, comments), and follower counts. We do not store your social media passwords — only OAuth access tokens required to act on your behalf.',
      'Usage data: which features you use, pages you visit, and errors encountered — used to improve the product.',
    ],
  },
  {
    title: 'How we use data',
    body: [
      'To provide core features: publishing posts, syncing analytics, and running automation rules on your behalf.',
      'To improve the product: aggregate, anonymised usage data helps us understand what to build next.',
      'To provide support: access to your account data allows us to diagnose issues when you contact us.',
      'We do not sell your personal data to third parties.',
    ],
  },
  {
    title: 'Data sharing',
    body: [
      'We share data only with service providers required to operate StarlingPost: Firebase (Firestore, Auth), Vercel (hosting and cron), OpenAI (AI features).',
      'All providers are contractually bound to appropriate data protection obligations.',
      'We will comply with lawful requests from authorities where required by applicable law.',
    ],
  },
  {
    title: 'Data retention',
    body: [
      'Your data is retained for as long as your account is active.',
      'If you delete your account, we delete your Firestore document and all sub-collections (posts, automation rules, dedup records) immediately.',
      'Backup and log data may persist for up to 30 days after deletion.',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'Access: request a copy of the data we hold about you.',
      'Correction: update your display name and mobile via the Profile page. Email corrections require contacting support.',
      'Deletion: delete your account from Settings → Danger Zone. This removes all associated data.',
      'For any other requests, contact support@starlingpost.com.',
    ],
  },
  {
    title: 'Security',
    body: [
      'OAuth tokens are stored encrypted in Firestore. Passwords are managed by Firebase Authentication and never stored by us.',
      'All data is transmitted over HTTPS. We do not log OAuth tokens in plaintext.',
    ],
  },
  {
    title: 'Contact',
    body: [
      'Questions about this Privacy Policy: support@starlingpost.com.',
      'For data deletion or access requests, include your registered email address in the subject line.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] grain pt-20">
      <div className="max-w-[780px] mx-auto px-6 md:px-10 py-20">

        {/* Header */}
        <div className="mb-16 border-b border-stone-800 pb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">Legal</p>
          <h1
            className="font-display italic text-stone-100 leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Privacy Policy
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            Effective date: 1 March 2025 · Last updated: 12 May 2025
          </p>
        </div>

        {/* Intro */}
        <p className="text-stone-400 text-sm leading-relaxed mb-12">
          This Privacy Policy explains how StarlingPost (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects, uses,
          and protects information when you use our service at starlingpost.com.
        </p>

        {/* Sections */}
        <div className="space-y-0 border border-stone-800">
          {SECTIONS.map((s, idx) => (
            <div key={s.title} className={`px-8 py-8 ${idx < SECTIONS.length - 1 ? 'border-b border-stone-800' : ''}`}>
              <h2
                className="font-display italic text-stone-100 mb-5"
                style={{ fontSize: '1.25rem', fontVariationSettings: '"opsz" 80' }}
              >
                {s.title}
              </h2>
              <ul className="space-y-3">
                {s.body.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-1 h-1 rounded-full bg-stone-700 mt-2 flex-shrink-0" />
                    <p className="text-stone-400 text-sm leading-relaxed">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-stone-800 flex items-center justify-between">
          <Link href="/terms" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            Terms of service →
          </Link>
          <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
            ← Home
          </Link>
        </div>

      </div>
    </main>
  );
}
