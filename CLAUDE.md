# PostPilot — Claude Context

## Project Goal
Centralised social media platform: users post to multiple platforms in one click (2 Instagram, 3 FB, 5 YouTube, 3 Twitter etc). Beta targets: YouTube, Twitter/X, LinkedIn. Pipeline after beta: Instagram, Facebook, Threads.

## Tech Stack
- **Framework**: Next.js 16 App Router, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Framer Motion, Lucide icons, Recharts
- **Backend**: Next.js API routes (no separate server)
- **DB/Auth**: Firebase (Firestore + Auth), Firebase Admin SDK
- **AI**: OpenAI gpt-4o-mini (caption enhance, auto-reply)
- **Cron**: Vercel scheduled jobs (daily midnight)
- **Social APIs**: twitter-api-v2, googleapis (YouTube v3), Meta OAuth2, LinkedIn OAuth2

## Key Features

### 1. Multi-Platform Posting
- Create once, publish to multiple accounts per platform
- Platform-specific customization (different captions, hashtags, titles)
- Schedule posts (stored in Firestore, Vercel cron publishes at time)
- API: `POST /api/posts/publish`

### 2. AI Enhancement
- Caption enhancement via OpenAI — returns enhanced text + hashtags + CTA + tone analysis
- Platform-specific prompts (max length, tone, style rules per platform)
- Optimal posting time recommendations (engagement score algorithm)
- API: `POST /api/ai/enhance`, `POST /api/ai/time-slots`

### 3. Link Me (Keyword-triggered auto-reply)
- User sets keyword + reply message + target platforms
- Cron scans recent comments/mentions, matches keywords, auto-replies
- Dedup tracking so same comment never replied twice
- Rule analytics (totalMatches counter)
- Scope: recent posts OR last N posts OR custom post URL
- API: `/api/automation/link-me`, cron: `/api/cron/process-link-me`

### 4. Auto Reply (Template + AI)
- Template with name + message + platforms
- Toggle `useAI` → OpenAI generates contextual reply instead of template
- `{username}` placeholder substitution
- Scope: recent posts OR last N posts OR custom post URL
- API: `/api/automation/auto-reply`, cron: `/api/cron/auto-reply`

### 5. Centralised Dashboard
- Connected account cards per platform
- Scheduled posts list
- Multi-platform analytics charts (Recharts area/bar)
- Platform-specific analytics detail pages (YouTube, Twitter)
- Metrics: views, likes, comments, reach, engagement rate, growth

### 6. Connect/Disconnect Accounts
- Multiple accounts per platform supported
- OAuth flows: Twitter (OAuth1.0a + OAuth2), YouTube, Instagram/Meta, LinkedIn, Facebook, Pinterest, TikTok
- Stored in `users/{uid}/connectedAccounts[]` in Firestore

## Firestore Schema

```
users/{uid}
  uid, email, displayName, mobile, createdAt, plan, planStatus
  connectedAccounts[]: { platform, platformId, accountName, accessToken, refreshToken, oauthToken, oauthTokenSecret }

users/{uid}/linkMeRules/{ruleId}
  keyword, replyMessage, platforms[], isActive, totalMatches, createdAt, updatedAt

users/{uid}/autoReplyTemplates/{templateId}
  name, message, platforms[], useAI, isActive, createdAt, updatedAt

users/{uid}/linkMeReplies/{commentId}    # dedup
users/{uid}/autoReplyReplies/{commentId} # dedup

users/{uid}/posts/{platformPostId}
  platform, accountId, platformPostId, caption, createdAt, publishedAt, metrics

posts/{postId}   # scheduled posts
  userId, status, caption, imageUrl, videoUrl
  platformContent: { twitter, youtube, linkedin }
  platforms[], scheduledTime, platformPostIds, publishedAt, errors[]
```

## API Routes

| Group | Endpoints |
|-------|-----------|
| OAuth | `/api/auth/[platform]` + `/api/auth/[platform]/callback` |
| Publish | `POST /api/posts/publish` (Twitter+YouTube+LinkedIn atomic) |
| Sync | `/api/posts/sync` |
| AI | `POST /api/ai/enhance`, `POST /api/ai/time-slots` |
| Link Me | CRUD `/api/automation/link-me`, `/api/automation/link-me/[id]` |
| Auto Reply | CRUD `/api/automation/auto-reply`, `/api/automation/auto-reply/[id]` |
| Crons | `/api/cron/publish-scheduled-posts`, `/api/cron/process-link-me`, `/api/cron/auto-reply` |
| Analytics | `/api/twitter/tweets`, `/api/twitter/user`, `/api/youtube/analytics`, `/api/youtube/channel-info` |
| Connections | `/api/connections`, `/api/connections/[platform]`, `/api/connections/manage` |
| Test | `POST /api/automation/test-run` |

## Key File Locations

| Purpose | Path |
|---------|------|
| Auth context + UserProfile type | `context/AuthContext.tsx` |
| Firebase client | `lib/firebase.ts` |
| Firebase admin | `lib/firebaseAdmin.ts` |
| Twitter automation helpers | `lib/twitterAutomation.ts` |
| YouTube automation helpers | `lib/youtubeAutomation.ts` |
| YouTube service (profile/analytics) | `lib/services/platforms/youtube.service.ts` |
| Platform types | `types/platform.ts` |
| Post types | `types/post.ts` |
| Publish endpoint | `app/api/posts/publish/route.ts` |
| Link Me cron | `app/api/cron/process-link-me/route.ts` |
| Auto Reply cron | `app/api/cron/auto-reply/route.ts` |
| Dashboard page | `app/dashboard/page.tsx` |
| Post creator | `app/posts/create/page.tsx` |
| Automation page | `app/automation/page.tsx` |

## Current Limitations / In Progress
- LinkedIn comments NOT wired in automation crons (only YouTube + Twitter)
- YouTube video upload (`/api/auth/youtube/upload`) is stubbed — media handling TODO
- Pinterest, TikTok: auth only, publishing not implemented
- No billing/subscription integration (plan field exists, unused)
- Growth rate calculation is TODO
- Cron frequency: daily midnight only (not real-time — polling-based)
- No webhooks for real-time comment notifications

## Beta Scope (Fully Targeting)
- YouTube ✅
- Twitter/X ✅
- LinkedIn ✅ (posting done, automation partial)

## Post-Beta Pipeline
- Instagram, Facebook, Threads
