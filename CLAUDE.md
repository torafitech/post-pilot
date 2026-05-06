# StarlingPost — Claude Code Reference

Project context map for future Claude Code CLI sessions. Keep this short and
factual — it's a map, not a tutorial.

## Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript strict
- **Styling**: Tailwind CSS 4 (dark theme by default — `bg-gray-950 text-white`)
- **Auth**: Firebase Auth (email/password) — `context/AuthContext.tsx`
- **DB**: Firestore (client SDK in pages, `lib/firebaseAdmin.ts` in API routes)
- **Charts**: Recharts (used on `/analytics`, `/analytics/youtube`, `/dashboard` analytics tab)
- **Icons**: lucide-react
- **Mobile**: Expo + RN in `mobile/` (separate workspace; excluded from root `tsc`)

## Routes

### Public

- `/` — landing page (server component for SEO + JSON-LD; client component `LandingPage`)
- `/login`, `/register` — Firebase Auth flows, dark themed, with forgot-password modal on /login
- `/privacy`, `/terms` — legal

### Authenticated

- `/dashboard` — totals, recent posts, scheduled queue widget, connected-account cards. Two tabs: Overview + Analytics.
- `/posts/create` — post composer wizard (Content → Platforms → Schedule → Preview)
- `/automation` — Link Me + Auto Reply rules CRUD + "Test Now" button
- `/tasks` — full pipeline view: Scheduled / Failed / Published / All. Has Retry + Delete.
- `/analytics` — unified hub aggregating per-platform metrics
- `/analytics/youtube` — YouTube deep dive (uses `/api/youtube/analytics` real data)
- `/admin`, `/admin/users` — admin tooling (gated)

All authenticated routes export `metadata.robots = noindex` via per-route `layout.tsx` files.

## Platform support

Source of truth: **`lib/platformConfig.ts`** + mirror in `mobile/src/lib/platformConfig.ts`.

```ts
export const ALL_PLATFORMS = ['youtube','twitter','linkedin','instagram','facebook','threads','tiktok'];
export const ENABLED_PLATFORMS = new Set(['youtube','twitter','linkedin']);
```

Disabled platforms render with a "Soon" lock badge across UI (dashboard, automation, create-post). To enable a platform: add it to `ENABLED_PLATFORMS` and provision env vars (see "Required env vars" below).

## API routes

### Auth (OAuth init + callback per platform)

- `app/api/auth/youtube/route.ts` + `callback/route.ts` (scopes: `youtube.upload`, `youtube.readonly`, `youtube`, `youtube.force-ssl`)
- `app/api/auth/twitter/oauth1/route.ts` + `callback/route.ts` (OAuth 1.0a — works on standard tier)
- `app/api/auth/linkedin/route.ts` + `callback/route.ts` (`w_member_social`)
- `app/api/auth/instagram/{route,callback}/route.ts` (Meta Graph API; gated)
- `app/api/auth/facebook/{route,callback}/route.ts` (Pages; gated)
- `app/api/auth/threads/{route,callback}/route.ts` (Meta Threads API; gated)
- `app/api/auth/tiktok/{route,callback}/route.ts` (TikTok Login Kit v2; gated)

### Posting

- `POST /api/posts/publish` — fan-out publish to selected platforms; writes per-platform docs to `users/{uid}/posts/{platformPostId}` with metrics
- `POST /api/posts/sync` — refresh metrics from each connected platform

### Automation

- `GET/POST /api/automation/link-me` and `link-me/[id]` (PATCH/DELETE)
- `GET/POST /api/automation/auto-reply` and `auto-reply/[id]` (PATCH/DELETE)
- `POST /api/automation/test-run` — runs Link Me / Auto Reply for the current user immediately
- `GET /api/cron/process-link-me` — daily cron
- `GET /api/cron/auto-reply` — daily cron
- `GET /api/cron/publish-scheduled-posts` — picks up scheduled posts whose time has passed

### Platform helpers (internal libs)

| Helper | Used by |
|---|---|
| `lib/twitterAutomation.ts` | test-run + crons (v1.1 mentions timeline) |
| `lib/youtubeAutomation.ts` | test-run + crons (uploads playlist scan) |
| `lib/linkedinAutomation.ts` | test-run + crons |
| `lib/instagramAutomation.ts` + `lib/instagramPost.ts` | gated; production code ready |
| `lib/facebookAutomation.ts` + `lib/facebookPost.ts` | gated |
| `lib/threadsAutomation.ts` + `lib/threadsPost.ts` | gated |
| `lib/tiktokAutomation.ts` + `lib/tiktokPost.ts` | gated |

## Firestore data model

```
users/{uid}
  email, displayName, mobile?, plan, planStatus, createdAt
  connectedAccounts: [
    { id, platform, platformId, accountName, accessToken,
      refreshToken?, oauthToken?, oauthTokenSecret?,
      authorUrn?, pageId?, connectedAt }
  ]
  /posts/{platformPostId}        ← metric records (per platform)
    platform, accountId, platformPostId, caption,
    publishedAt, metrics: { views?, impressions?, likes?, comments? }, lastSyncedAt?
  /linkMeRules/{ruleId}
    keyword, replyMessage, platforms[], isActive, totalMatches
  /autoReplyTemplates/{tplId}
    name, message, platforms[], isActive, useAI
  /linkMeReplies/{commentId}     ← dedup for Link Me cron
  /autoReplyReplies/{commentId}  ← dedup for Auto Reply cron

posts/{postId}                    ← top-level scheduler docs
  userId, caption, platforms[], imageUrl, videoUrl,
  status (draft/scheduled/publishing/published/partially_published/failed),
  scheduleMode, scheduledTime, publishedAt, platformPostIds, errors[]
```

**Important relationship**: `posts/{postId}.platformPostIds[platform]` →
`users/{uid}/posts/{value}` (the metric doc id). The dashboard now joins
both to display real metrics. (See "Group 8" in commit history.)

## Required env vars

| Var | Where used |
|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | client Firebase init |
| `FIREBASE_*` (admin) | `lib/firebaseAdmin.ts` |
| `OPENAI_API_KEY` | AI caption + auto-reply AI mode |
| `NEXT_PUBLIC_YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI` | YT OAuth |
| `TWITTER_APP_KEY`, `TWITTER_APP_SECRET` (+ user oauth tokens stored per account) | Twitter v1.1 |
| `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | LinkedIn |
| `NEXT_PUBLIC_META_APP_ID`, `META_APP_SECRET`, `META_GRAPH_VERSION` (default `v21.0`) | IG + FB + Threads |
| `INSTAGRAM_REDIRECT_URI`, `FACEBOOK_REDIRECT_URI` | callback URLs |
| `NEXT_PUBLIC_THREADS_APP_ID`, `THREADS_APP_SECRET`, `THREADS_REDIRECT_URI` | Threads |
| `NEXT_PUBLIC_TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` | TikTok |
| `NEXT_PUBLIC_CLOUDINARY_*` | media upload via `components/FileUpload.tsx` |

## Conventions

- **Toasts, not alerts.** `import { useToast } from '@/components/Toast'` then `toast.success/error/info(title, description?)`. Never `alert()`.
- **Auth fetch.** Client-side calls to authenticated API routes go through `authFetch` from `lib/authClient.ts` so the Firebase ID token is attached.
- **Dark theme everywhere.** Background `bg-gray-950`, card `bg-gray-900` border `border-gray-800`, text gradient cyan→blue for CTAs.
- **Platform iconography.** Per-platform icons in components mirror lucide-react: `Youtube`, `Twitter`, `Linkedin`, `Instagram`, `Facebook`, `Music` (TikTok), `MessageCircle` (Threads).
- **Filter chips.** Use the pattern in `app/tasks/page.tsx` — pill border tinted by status color, count badge inside.
- **Disabled state for gated platforms.** Lock icon + amber "Soon" pill + tooltip from `PLATFORM_DISABLED_REASON`.
- **No mock data.** If the data isn't real, render an empty state. Never invent metrics, growth %, or testimonials. Audit doc (`AUDIT.md`) called out 8 P0s here — don't reintroduce them.

## Common tasks (copy-paste recipes)

**Add a new authenticated page:**

1. `app/foo/page.tsx` — client component, dark theme
2. `app/foo/layout.tsx` — exports `metadata.robots = { index: false, follow: false }` and a passthrough component
3. Link from Navbar dropdown + `/dashboard` quick actions if user-facing

**Enable a new platform** (e.g. Instagram):

1. Add `'instagram'` to `ENABLED_PLATFORMS` in `lib/platformConfig.ts` (and mirror in `mobile/`)
2. Verify env vars (see table)
3. Wire its automation into `app/api/cron/{auto-reply,process-link-me}/route.ts` if not already (production code already exists in `lib/instagramAutomation.ts`)
4. Run through the create-post flow to confirm posting works

**Add a toast notification:**
```tsx
const { toast } = useToast();
toast.success('Saved');
toast.error('Could not save', err.message);
```

**Test automation locally** (without waiting for daily cron):
- Connect a YouTube/Twitter/LinkedIn account
- Add a Link Me rule or Auto Reply template
- Hit "Test Now" on `/automation` — runs immediately and surfaces a per-account diagnostic toast

**Sync metrics:**
- `/analytics` page → "Sync metrics" button hits `POST /api/posts/sync`
- Or the dashboard "Sync" button does the same

## Known gaps / pending

(From `AUDIT.md`. The P0/P1 items are all closed. These remain:)

- Premium/Stripe billing wiring (the modal is informational only)
- LinkedIn deep-dive analytics page (only YouTube has a deep dive today)
- Twitter deep-dive analytics page
- Real testimonials on the landing page (we ripped fake ones; re-add when we have permissioned quotes)
- Push notifications (mobile app + server-side)
- Background uploads for large IG/TikTok videos in mobile

## Don't-touch list

- `mobile/` is excluded from root `tsc` via `tsconfig.json`. Do not unexclude it; it has its own toolchain.
- `lib/firebaseAdmin.ts` is server-only. Never import from a client component.
- `app/page.tsx` ships AdSense via `next/script`. Don't move that script back to `app/layout.tsx` — it would run on authenticated pages.
- `components/Toast.tsx` ToastProvider must wrap any consumer; it's mounted once in `app/layout.tsx`.
- `components/Footer.tsx` hides itself on `/login`, `/register`, `/admin*`. Don't duplicate that logic in pages.

## Audit history

Full audit + 10 fix-groups shipped in commits `c54fe8c..db8b36f` on branch
`claude/romantic-margulis-98d2b7`. See `AUDIT.md` for the original report.
