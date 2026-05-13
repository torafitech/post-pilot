# StarlingPost Test Findings
_Generated: 2026-05-09_

## Live Endpoint Results
| Endpoint | Expected | Got (from code) | Status |
|----------|----------|-----------------|--------|
| GET / | 200 | 200 | PASS |
| GET /login | 200 | 200 | PASS |
| GET /register | 200 | 200 | PASS |
| GET /api/connections | 401 | 401 | PASS |
| POST /api/posts/publish (empty) | 401 | 401 | PASS |
| GET /api/automation/link-me | 401 | 401 | PASS |
| GET /api/automation/auto-reply | 401 | 401 | PASS |
| GET /api/twitter/user | 401 | **400 — no auth, returns "Missing userId"** | FAIL |
| GET /api/youtube/channel-info | 401 | **400 — no auth, returns "Missing userId"** | FAIL |
| GET /api/cron/process-link-me | 401 | 401 | PASS |
| GET /api/cron/auto-reply | 401 | 401 | PASS |
| GET /api/cron/publish-scheduled-posts | 401 | 401 | PASS |
| GET /api/auth/youtube | redirect | redirect to Google | PASS |
| GET /api/auth/twitter | redirect | redirect to Twitter | PASS |
| POST /api/ai/enhance (unauthed) | 401 | **200 — NO AUTH** | FAIL |
| POST /api/ai/time-slots (unauthed) | 401 | **200 — NO AUTH** | FAIL |

---

## Code Analysis Gaps

### CRITICAL

- **AI enhance: no auth** — `app/api/ai/enhance/route.ts:5` — any unauthenticated POST triggers GPT-4o-mini calls. Open OpenAI cost sink.
- **AI time-slots: no auth** — `app/api/ai/time-slots/route.ts:87` — publicly callable, same issue.
- **LinkedIn callback still has demo_user** — `app/api/auth/linkedin/route.ts:73` — `let userId = 'demo_user'` fallback. Tokens saved under wrong user on any session failure.
- **Twitter OAuth2 callback has demo_user** — `app/api/auth/twitter/callback/route.ts:67` — identical pattern.
- **LinkedIn publish broken — authorUrn never stored** — `app/api/auth/linkedin/post/route.ts:32` checks `linkedinAccount?.authorUrn` but the LinkedIn init route never stores it. Every LinkedIn publish returns 400.

### HIGH

- **Twitter/YouTube user endpoints accept arbitrary userId with no auth** — `app/api/twitter/user/route.ts:14`, `app/api/youtube/channel-info/route.ts:15` — userId from query string, no token verification. Any caller can read another user's account metadata.
- **YouTube token refresh swallows failure** — `app/api/auth/youtube/upload/route.ts:83` — catch swallows error and continues with stale token. Returns opaque 401 from Google instead of clean reauth signal.
- **LinkedIn OAuth initiation route may not exist** — dashboard links to `/api/auth/linkedin?uid=...` but tester found this resolves to callback handler. LinkedIn OAuth flow may never start.
- **LinkedIn scope missing w_member_social** — without this scope LinkedIn API rejects all comment automation with 403.
- **Cron INTERNAL_CRON_SECRET empty-string breaks scheduled posts** — `app/api/cron/publish-scheduled-posts/route.ts:77` — sends `INTERNAL_CRON_SECRET || ''`. If env var unset, cron call to publish endpoint is rejected → scheduled posts silently fail.

### MEDIUM

- **Scheduled posts timezone bug** — `app/posts/create/page.tsx:452` — `new Date(\`\${date}T\${time}\`)` uses browser local timezone, cron uses UTC. Posts fire at wrong time for non-UTC users.
- **OAuth tokens readable in browser** — no GET on `/api/connections/[platform]`; dashboard reads Firestore directly client-side, exposing access tokens to any XSS.
- **Twitter post + YouTube upload helpers have no auth guard** — `app/api/auth/twitter/post/route.ts:21`, `app/api/auth/youtube/upload/route.ts:16` — publicly callable with only userId in body.
- **Dashboard reconnect banner fires every load** — `app/dashboard/page.tsx:132` — no persistent dismissal state.
- **JSON.parse on raw LLM output** — `app/api/ai/enhance/route.ts:136` — unvalidated GPT output; rate limit errors expose raw message to client.

---

## Summary
**5 critical, 5 high, 5 medium gaps.**

Key blockers: AI endpoints burn OpenAI with no auth; LinkedIn entirely non-functional (no initiation route, authorUrn not stored, missing w_member_social scope); Twitter OAuth callback corrupts tokens to demo_user.
