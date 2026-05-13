const ENTRIES = [
  {
    version: 'v0.8',
    date: '2025-05-12',
    tag: 'Latest',
    tagColor: '#d4ff3a' as const,
    changes: [
      { type: 'feat', text: 'Analytics split into Platform Analytics (live APIs) and StarlingPost Activity tabs' },
      { type: 'feat', text: 'Profile, Settings, Billing, and Signout pages added' },
      { type: 'feat', text: 'Editorial redesign across dashboard, automation, login, and register pages' },
      { type: 'fix',  text: 'Navbar now contextual per page — removes redundant buttons on sub-pages' },
      { type: 'feat', text: 'Cross-platform performance ranking in analytics (avg views/likes per post)' },
    ],
  },
  {
    version: 'v0.7',
    date: '2025-05-01',
    tag: 'Dashboard',
    tagColor: '#7dd3fc' as const,
    changes: [
      { type: 'feat', text: 'Full dashboard redesign — stat ledger, connected accounts grid, editorial typography' },
      { type: 'feat', text: 'Instagram, Facebook, Threads parity in dashboard and automation pages' },
      { type: 'feat', text: 'Live account health dots (citron = healthy, coral = reauth needed)' },
      { type: 'fix',  text: 'Removed unused Calendar and Users icon imports causing TypeScript warnings' },
    ],
  },
  {
    version: 'v0.6',
    date: '2025-04-18',
    tag: 'Platforms',
    tagColor: '#f9a8d4' as const,
    changes: [
      { type: 'feat', text: 'Instagram, Facebook, Threads whitelisted across all backend API routes' },
      { type: 'feat', text: 'LinkedIn auto-reply partially wired (posting done, automation cron partial)' },
      { type: 'feat', text: 'Multi-account support per platform — connect up to N accounts per platform' },
      { type: 'feat', text: 'OAuth flows for all 6 platforms (Pinterest and TikTok: auth only)' },
    ],
  },
  {
    version: 'v0.5',
    date: '2025-04-05',
    tag: 'Automation',
    tagColor: '#f87171' as const,
    changes: [
      { type: 'feat', text: 'Link Me: keyword-triggered auto-reply with dedup tracking' },
      { type: 'feat', text: 'Auto Reply: template + AI contextual reply mode with {username} substitution' },
      { type: 'feat', text: 'Scope selector: recent posts, last N posts, or custom post URL' },
      { type: 'feat', text: 'Cron: daily midnight processing for both automation types' },
    ],
  },
  {
    version: 'v0.4',
    date: '2025-03-22',
    tag: 'AI',
    tagColor: '#d4ff3a' as const,
    changes: [
      { type: 'feat', text: 'AI caption enhancement via OpenAI GPT-4o-mini — platform-specific prompts' },
      { type: 'feat', text: 'Optimal posting time recommendations (engagement score algorithm)' },
      { type: 'feat', text: 'Tone analysis: returns enhanced text + hashtags + CTA suggestions' },
    ],
  },
  {
    version: 'v0.3',
    date: '2025-03-10',
    tag: 'Publishing',
    tagColor: '#93c5fd' as const,
    changes: [
      { type: 'feat', text: 'Multi-platform publish endpoint — atomic publish to Twitter + YouTube + LinkedIn' },
      { type: 'feat', text: 'Post scheduling — Firestore-backed, Vercel cron triggers at scheduled time' },
      { type: 'feat', text: 'Platform-specific content customisation (caption, title, hashtags per platform)' },
      { type: 'feat', text: 'YouTube video upload stubbed — media handling pending' },
    ],
  },
  {
    version: 'v0.1',
    date: '2025-02-28',
    tag: 'Foundation',
    tagColor: '#a8a29e' as const,
    changes: [
      { type: 'feat', text: 'Next.js 16 App Router scaffold with Firebase Auth and Firestore' },
      { type: 'feat', text: 'Twitter OAuth 1.0a + OAuth 2.0 flows' },
      { type: 'feat', text: 'YouTube Data API v3 integration — channel info and video analytics' },
      { type: 'feat', text: 'Base Firestore schema: users, posts, automation rules, dedup collections' },
    ],
  },
];

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  feat: { label: 'feat', color: '#d4ff3a' },
  fix:  { label: 'fix',  color: '#ff5e3a' },
  perf: { label: 'perf', color: '#7dd3fc' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] grain pt-20">
      <div className="max-w-[780px] mx-auto px-6 md:px-10 py-20">

        {/* Header */}
        <div className="mb-16 border-b border-stone-800 pb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">Changelog</p>
          <h1
            className="font-display italic text-stone-100 leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            What's changed.
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600">
            All product updates, newest first.
          </p>
        </div>

        {/* Entries */}
        <div className="space-y-0">
          {ENTRIES.map((entry, eIdx) => (
            <div
              key={entry.version}
              className={`grid grid-cols-[auto_1fr] gap-8 ${eIdx < ENTRIES.length - 1 ? 'border-b border-stone-800 pb-12 mb-12' : ''}`}
            >
              {/* Left: version + date */}
              <div className="w-28 flex-shrink-0 pt-0.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="font-display italic text-stone-100"
                    style={{ fontSize: '1.35rem', fontVariationSettings: '"opsz" 80' }}
                  >
                    {entry.version}
                  </span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700">{formatDate(entry.date)}</p>
                <span
                  className="inline-block mt-3 font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border"
                  style={{ borderColor: `${entry.tagColor}40`, color: entry.tagColor }}
                >
                  {entry.tag}
                </span>
              </div>

              {/* Right: changes list */}
              <div className="space-y-3">
                {entry.changes.map((c, cIdx) => {
                  const t = TYPE_LABEL[c.type] || TYPE_LABEL.feat;
                  return (
                    <div key={cIdx} className="flex items-start gap-3">
                      <span
                        className="font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 border flex-shrink-0 mt-0.5"
                        style={{ borderColor: `${t.color}40`, color: t.color }}
                      >
                        {t.label}
                      </span>
                      <p className="text-stone-400 text-sm leading-relaxed">{c.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-16 pt-8 border-t border-stone-800 flex items-center justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700">
            StarlingPost is in active beta
          </p>
          <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700">
            <span className="w-1 h-1 rounded-full bg-[#d4ff3a]" />
            Actively updated
          </span>
        </div>

      </div>
    </main>
  );
}
