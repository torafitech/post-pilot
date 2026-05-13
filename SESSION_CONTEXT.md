# StarlingPost — Session Context & Work Done

## Project
Multi-platform social media posting app. Beta targets: YouTube, Twitter/X, LinkedIn.
Domain: starlingpost.com | Repo: github.com/torafitech/post-pilot | Deploy: Vercel

## Stack
Next.js 16 App Router · React 19 · TypeScript 5 · Tailwind CSS 4
Firebase (Firestore + Auth) · OpenAI gpt-4o-mini · Vercel cron
twitter-api-v2 · googleapis (YouTube v3) · LinkedIn v2 REST API

---

## Work Completed This Session

### 1. Dashboard — Full Redesign (`app/dashboard/page.tsx`)
- Live data fetched from YouTube Analytics API and Twitter User API per account
- Per-account health badges: Live / Error / Reconnect
- Expandable account rows showing 5 recent posts (thumbnail, views, likes, comments, external link)
- Subscriber/follower counts from live APIs
- Post count from YouTube `channelInfo.videoCount`, Twitter `tweetCount`
- Automation status panel: active Link Me rules + Auto Reply template counts from Firestore
- Analytics tab: Followers added as 4th bar in platform performance chart
- LinkedIn shows "Analytics unavailable / LinkedIn MDP required" instead of zeros
- `lastSync` timestamp shown in header

### 2. Twitter API Routes — accountId Support
- `app/api/twitter/user/route.ts` — added `?accountId=` param to target specific account
- `app/api/twitter/tweets/route.ts` — same
- Dashboard passes accountId per account row (multi-account safe)
- Twitter views/likes/comments aggregated from recent 10 tweets (was hardcoded 0)

### 3. LinkedIn OAuth Flow — Fixed End-to-End
**Auth initiation** (`app/api/auth/linkedin/route.ts`):
- Scopes: `openid profile email w_member_social` (OpenID Connect product enabled)
- `uid` passed as OAuth `state` param

**Callback** (`app/api/auth/linkedin/callback/route.ts`):
- Reads `userId` from `state` param (not `__session` cookie — this app uses JWT not session cookies)
- Profile fetch via OIDC `/v2/userinfo` endpoint (`sub` = member ID, `name` = display name)
- Granular error handling with specific error codes per step
- `export const dynamic = 'force-dynamic'` added

### 4. LinkedIn Posting — Fixed (`app/api/posts/publish/route.ts`)
- Switched from `/rest/posts` (requires versioned header) to `/v2/ugcPosts` (stable, no version header)
- Image upload switched from `/rest/images` to `/v2/assets?action=registerUpload`
- Post URN read from response body `.id` field (v2 returns it in body unlike REST API)
- Removed HTTP hop: `publishToLinkedin` now calls LinkedIn API directly (was calling own `/api/auth/linkedin/post` route)
- **Text posts**: working
- **Image posts**: working (v2 assets upload)
- **Video posts**: NOT implemented (LinkedIn chunked upload is complex, future work)

### 5. LinkedIn Automation (`lib/linkedinAutomation.ts`)
- API version bumped to `202604` (still uses `/rest` for automation endpoints)
- If automation also fails with version errors, switch those to v2 as well

---

## Known Issues / Pending

| Issue | Status |
|-------|--------|
| Twitter 402 CreditsDepleted | Twitter API billing needs top-up in developer portal |
| LinkedIn MDP analytics | Personal profile stats require MDP approval — not available via standard OAuth |
| LinkedIn video posting | Not implemented — requires chunked multipart upload |
| LinkedIn automation API version | `lib/linkedinAutomation.ts` still uses `/rest` — may need v2 migration if version errors appear |
| YouTube video upload | Stubbed — media handling TODO |

---

## Key Environment Variables (Vercel)

```
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...        (set as sensitive)
LINKEDIN_REDIRECT_URI=https://starlingpost.com/api/auth/linkedin/callback
CRON_SECRET=...
INTERNAL_CRON_SECRET=...
OPENAI_API_KEY=...
TWITTER_APP_KEY=...
TWITTER_APP_SECRET=...
NEXT_PUBLIC_API_URL=https://www.starlingpost.com
```

## LinkedIn Developer Portal Settings (Required)
- Authorized Redirect URLs: `https://starlingpost.com/api/auth/linkedin/callback`
- Products enabled: Sign In with LinkedIn (OpenID Connect) + Share on LinkedIn

---

## Firestore Collections
```
users/{uid}
  connectedAccounts[]: { id, platform, platformId, accountName, accessToken,
                         authorUrn (LinkedIn), oauthToken/oauthTokenSecret (Twitter) }

users/{uid}/linkMeRules/{id}       — keyword trigger rules
users/{uid}/autoReplyTemplates/{id} — auto-reply templates
users/{uid}/linkMeReplies/{commentId}    — dedup
users/{uid}/autoReplyReplies/{commentId} — dedup

posts/{postId}   — scheduled/published posts
  userId, status, caption, imageUrl, videoUrl, platforms[],
  platformContent: { twitter, youtube, linkedin },
  scheduledTime, publishedAt, platformPostIds, errors[]
```

## Last Commits
```
b0ca23e fix(linkedin): switch to v2/ugcPosts + v2/assets — no version header needed
7a62ea1 fix(linkedin): version 202604 (April 2026)
8f3d5f7 fix(dashboard): LinkedIn shows 'analytics unavailable' instead of zeros
db2f003 fix(linkedin): granular error handling in callback
46ae0e6 fix(linkedin): read userId from state param in callback
36abeb8 fix(dashboard): expand all accounts + live post count from YouTube API
e3d8929 feat(dashboard): live platform metrics + expandable account cards
b20f104 fix(twitter): accountId support + aggregate tweet metrics on dashboard
```
