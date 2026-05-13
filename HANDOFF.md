# StarlingPost — Session Handoff

Last updated: 2026-05-13  
Branch: `master` (up to date with origin)  
Last commit: `787b80e` — perf(ai): collapse 8 OpenAI calls → 2

---

## What was completed this session

### Design system applied across all pages
Every page now uses the editorial system: `bg-[#0a0a0b] grain`, Fraunces italic headings (`font-display italic`), JetBrains Mono labels (`font-mono text-[10px] uppercase tracking-[0.25em]`), hairline `border border-stone-800` containers, citron `#d4ff3a` CTAs, coral `#ff5e3a` errors. Zero `rounded-xl`, zero `bg-gray-*`, zero cyan/purple/emerald accents anywhere.

Pages redesigned: login, register, automation, dashboard (analytics restructure), navbar, footer, profile, settings, billing, signout, about, blog, pricing, changelog, privacy, terms, **create post** (last two commits this session).

### Pricing model change
No free tier. 14-day trial on signup. Three paid plans: Starter $9 / Growth $19 / Agency $49. `register` page says "Start your free trial." Billing page shows trial countdown from `userProfile.createdAt + 14 days`.

### AI enhance — 8 calls → 2 calls (`787b80e`)
`app/api/ai/enhance/route.ts` now makes exactly 2 OpenAI calls:
- **Call 1** (`response_format: json_object`): returns `enhancedCaption` + `platformCaptions` (all 6 platforms with platform-specific copy, hashtags, YouTube title/tags)
- **Call 2** (`response_format: json_object`): returns `platformTimes` for all selected platforms in one shot

Frontend (`app/posts/create/page.tsx` → `handleAiEnhance`) applies `platformCaptions` directly into `platformContent` state — real per-platform AI copy, not string-slice fallback.

---

## What still needs doing

### High priority
- [ ] **Billing integration** — Stripe or Razorpay. Plan field exists in Firestore (`users/{uid}.plan`). All upgrade buttons exist but are `disabled` with "Billing coming soon". Need: checkout session, webhook to update plan, cancel flow.
- [ ] **LinkedIn automation** — `app/api/cron/process-link-me/route.ts` and `app/api/cron/auto-reply/route.ts` only scan YouTube + Twitter comments. LinkedIn comments not wired. `lib/linkedinAutomation.ts` may need creating.
- [ ] **YouTube video upload** — `/api/auth/youtube/upload` is stubbed. Media upload to YouTube via resumable upload API not implemented.

### Medium priority
- [ ] **Real-time comment polling** — Cron runs daily at midnight only. Should be more frequent (every 15–30 min) or use webhooks where available.
- [ ] **Growth rate calculation** — `TODO` in dashboard analytics. Formula: `((thisWeek - lastWeek) / lastWeek) * 100`.
- [ ] **Pinterest / TikTok** — Auth only, no publishing implemented.
- [ ] **Blog posts** — `/app/blog/[slug]/page.tsx` doesn't exist. Blog index links to slugs that 404. Need individual post pages (even static MDX).

### Low priority
- [ ] Remove `FINDINGS.md` and `SESSION_CONTEXT.md` from repo root (untracked, likely stale agent output).
- [ ] `console.log` cleanup in API routes (lots of emoji logs left in place).
- [ ] `alert()` calls in create post page should be replaced with inline error UI.

---

## Key file locations

| What | Path |
|------|------|
| Auth context + UserProfile type | `context/AuthContext.tsx` |
| AI enhance API | `app/api/ai/enhance/route.ts` |
| Create post wizard | `app/posts/create/page.tsx` |
| Dashboard (analytics split) | `app/dashboard/page.tsx` |
| Billing page | `app/billing/page.tsx` |
| Link Me cron | `app/api/cron/process-link-me/route.ts` |
| Auto Reply cron | `app/api/cron/auto-reply/route.ts` |
| Publish endpoint | `app/api/posts/publish/route.ts` |

## Design tokens (never deviate)
```
bg:       #0a0a0b  (ink)
accent:   #d4ff3a  (citron)
error:    #ff5e3a  (coral)
border:   border-stone-800  (hairline)
heading:  font-display italic  (Fraunces)
label:    font-mono text-[10px] uppercase tracking-[0.25em]
texture:  grain  (CSS class on bg containers)
radius:   NONE — no rounded-xl, no rounded-2xl
```
