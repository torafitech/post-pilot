# StarlingPost — Platform Integration Progress

Last updated: 2026-05-11

## Legend
- ✅ Done
- 🔄 In progress
- ❌ Not started
- ⛔ Blocked (external approval required)

---

## Platform Status

### YouTube ✅ Full
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ✅ | `/api/auth/youtube` + callback |
| Publish | ✅ | `/api/auth/youtube/upload` (video upload) |
| Analytics | ✅ | `/api/youtube/analytics`, deep-dive page |
| Link Me automation | ✅ | Wired in cron + test-run |
| Auto Reply automation | ✅ | Wired in cron + test-run |
| Post creator UI | ✅ | Title, description, tags fields |

---

### Twitter / X ✅ Full
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ✅ | OAuth 1.0a + OAuth2 |
| Publish | ✅ | `/api/auth/twitter/post` |
| Analytics | ✅ | `/api/twitter/tweets`, `/api/twitter/user` |
| Link Me automation | ✅ | Mentions-based |
| Auto Reply automation | ✅ | Mentions-based |
| Post creator UI | ✅ | 280 char cap, validation |

---

### LinkedIn ✅ Full
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ✅ | `/api/auth/linkedin` + callback |
| Publish | ✅ | UGC Posts v2, image + video |
| Analytics | ❌ | No deep-dive page yet |
| Link Me automation | ✅ | Wired in cron + test-run |
| Auto Reply automation | ✅ | Wired in cron + test-run |
| Post creator UI | ✅ | Caption field |

---

### Instagram ⛔ Pending Meta App Review
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ✅ | `/api/auth/instagram` + callback |
| Publish | ✅ | Container API — image + video (Reels) |
| Analytics | ✅ | `lib/metrics/instagram.ts` |
| Wired to publish endpoint | ✅ | `/api/posts/publish` calls `/api/instagram/publish` |
| Post creator UI | ✅ | Platform card, caption, validation (requires media) |
| Link Me automation | ❌ | Needs `instagram_manage_comments` scope (Meta review) |
| Auto Reply automation | ❌ | Same scope blocker |
| **Env vars needed** | | `NEXT_PUBLIC_META_APP_ID`, `META_APP_SECRET`, `INSTAGRAM_REDIRECT_URI` |

---

### Facebook ⛔ Pending Meta App Review
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ✅ | `/api/auth/facebook` + `/api/auth/facebook/callback` |
| Publish | ✅ | `lib/facebookPost.ts` → text, image, video via Pages API |
| Publish API route | ✅ | `/api/facebook/publish` |
| Analytics | ✅ | `lib/metrics/facebook.ts` |
| Wired to publish endpoint | ✅ | `/api/posts/publish` calls `/api/facebook/publish` |
| Post creator UI | ✅ | Platform card, caption, validation |
| Link Me automation | ✅ | `lib/facebookAutomation.ts`, wired in process-link-me cron |
| Auto Reply automation | ✅ | Wired in auto-reply cron |
| **Env vars needed** | | `NEXT_PUBLIC_META_APP_ID`, `META_APP_SECRET`, `FACEBOOK_REDIRECT_URI` |
| **Blocker** | | Meta App Review: `pages_manage_posts`, `pages_manage_engagement` |

---

### Threads ⛔ Pending Meta App Review
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ✅ | `/api/auth/threads` + `/api/auth/threads/callback` |
| Publish | ✅ | `lib/threadsPost.ts` — two-step container flow (text/image/video) |
| Publish API route | ✅ | `/api/threads/publish` |
| Analytics | ❌ | No metrics lib yet |
| Wired to publish endpoint | ✅ | `/api/posts/publish` calls `/api/threads/publish` |
| Post creator UI | ✅ | Platform card (500 char cap), caption, validation |
| Link Me automation | ✅ | `lib/threadsAutomation.ts`, wired in process-link-me cron |
| Auto Reply automation | ✅ | Wired in auto-reply cron |
| **Env vars needed** | | `NEXT_PUBLIC_THREADS_APP_ID`, `THREADS_APP_SECRET`, `THREADS_REDIRECT_URI` |
| **Notes** | | Threads is a SEPARATE Meta app from Instagram/Facebook. Different OAuth endpoint: `threads.net/oauth/authorize` |

---

### TikTok ❌ Not Started (Post-Beta)
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ❌ | TikTok Login Kit v2 |
| Publish | ❌ | Direct Post API |
| All else | ❌ | |
| **Env vars needed** | | `NEXT_PUBLIC_TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI` |

---

### Pinterest ❌ Auth only (Post-Beta)
| Area | Status | Notes |
|------|--------|-------|
| OAuth | ✅ | Auth route exists, no callback |
| Everything else | ❌ | |

---

## Vercel Environment Variables Checklist

### Currently needed
| Variable | Platform | Status |
|----------|----------|--------|
| `NEXT_PUBLIC_META_APP_ID` | Instagram + Facebook | ✅ Add if not present |
| `META_APP_SECRET` | Instagram + Facebook | ✅ Add if not present |
| `META_GRAPH_VERSION` | Instagram + Facebook | Optional, defaults `v21.0` |
| `INSTAGRAM_REDIRECT_URI` | Instagram | ✅ `https://starlingpost.com/api/auth/instagram/callback` |
| `FACEBOOK_REDIRECT_URI` | Facebook | ➕ Add: `https://starlingpost.com/api/auth/facebook/callback` |

### Add now (Threads)
| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_THREADS_APP_ID` | Separate Meta app for Threads |
| `THREADS_APP_SECRET` | |
| `THREADS_REDIRECT_URI` | `https://starlingpost.com/api/auth/threads/callback` |

---

## Meta App Review — Required Permissions

Submit for review at [developers.facebook.com](https://developers.facebook.com):

### Instagram (existing app)
- `instagram_basic` ✅ (no review needed)
- `instagram_content_publish` ⛔ **Needs review**
- `instagram_manage_comments` ⛔ **Needs review** (for automation)
- `pages_show_list` ✅
- `pages_read_engagement` ✅

### Facebook (same app, new permissions)
- `pages_show_list` ✅
- `pages_manage_posts` ⛔ **Needs review**
- `pages_read_engagement` ✅
- `pages_manage_engagement` ⛔ **Needs review** (for automation)
- `pages_read_user_content` ✅

---

## Next Steps

1. **Add to Vercel env vars:**
   - `FACEBOOK_REDIRECT_URI` = `https://starlingpost.com/api/auth/facebook/callback`
   - `NEXT_PUBLIC_THREADS_APP_ID` = from Meta Developers → Threads app
   - `THREADS_APP_SECRET`
   - `THREADS_REDIRECT_URI` = `https://starlingpost.com/api/auth/threads/callback`
2. **Submit Meta App Review** for:
   - `pages_manage_posts`, `pages_manage_engagement` (Facebook)
   - `instagram_content_publish`, `instagram_manage_comments` (Instagram)
   - `threads_content_publish`, `threads_manage_replies` (Threads)
3. **Create Threads app** on [developers.facebook.com](https://developers.facebook.com) — separate from the Meta/Instagram/Facebook app
4. **Build Threads analytics** (`lib/metrics/threads.ts`) — minor, no external blocker
5. **Build Instagram automation** (once `instagram_manage_comments` approved)
6. **Build TikTok** — post-beta, needs partner approval
