# StarlingPost — Senior-Dev Audit

Static review across Landing / Auth / Dashboard / Analytics / Automation / Create.
Severity scale: **P0** = ship-blocker (broken / legal / data-correctness),
**P1** = real bug or significant UX hole, **P2** = polish / nice-to-have.

---

## P0 — Ship blockers

### A. Broken pages / dead links

1. **`/content/youtube` is functionally empty.** Calls `/api/youtube/videos` which doesn't exist (404), and even if data loaded, `<VideoList />` is **commented out** in JSX (line 114). The page does nothing. Either delete it or wire it up.
2. **Dashboard "Settings" quick action** links to `/settings` which doesn't exist. Same for the Navbar dropdown's "Your Profile" → `/profile` and "Settings" → `/settings`. Three dead links.
3. **`YouTubeConnectionStatus.TSX`** — uppercase extension. Will silently fail on case-sensitive filesystems (Linux/Vercel) if imported as `.tsx`.

### B. Fake / misleading data shown to users

4. **`/analytics/youtube` shows hardcoded mock metrics** as if real:
   ```ts
   subscriberChange: 12.5, // This should come from your API
   videoChange: 2,
   viewChange: 8.3,
   watchTime: 1250,
   watchTimeChange: 15.2,
   ```
   You explicitly asked "no mock". This violates that and misleads users.
5. **Landing JSON-LD ships fake review aggregate**: `aggregateRating: 4.8 / 412 reviews`. Google can de-index for fake structured data — this is a **manual-action risk**.
6. **Landing testimonials** have fabricated creators with specific subscriber counts ("Priya Sharma · 280K subscribers" etc.). Either real with permission, or replace with anonymized / hypothetical framing.
7. **"Trusted by 10,000+ creators"** repeated twice on landing — same misleading-claim concern.

### C. Data model inconsistency

8. **Dashboard analytics likely show zero metrics.** Create-post writes to `posts/{id}` (top-level). Publish API also writes per-platform copies to `users/{uid}/posts/{platformPostId}` with `metrics`. Dashboard reads top-level `posts` but reads `metrics` from those docs — which never get populated unless `/api/posts/sync` syncs back, and the dashboard never calls sync on its own. So views/likes/comments will be **0 forever** for users who don't manually trigger sync.

---

## P1 — Real bugs / significant UX

### Auth flow

9. **Three duplicate auth pages**: `/login`, `/register`, `/auth`. The `/auth` page is half-baked legacy (light-on-dark, inconsistent) and should be deleted.
10. **Light-themed auth pages on a dark site.** `/login` and `/register` use `bg-slate-50` / `bg-gray-50` while the rest of the app is `bg-gray-950`. Jarring transition.
11. **Login error mapping is stale.** Firebase deprecated `auth/wrong-password` and `auth/user-not-found` and replaced both with `auth/invalid-credential` (mid-2023). The current branches will never fire.
12. **No "Forgot password" link** anywhere. Real blocker for any user who forgets.
13. **Register forces phone collection.** Mobile is required to sign up. If the only reason is verification later, defer to settings. Otherwise drop the friction.
14. **Footer + Navbar render on auth pages** alongside the page's own logo block. Triple branding.
15. **AdSense script in `<head>` of root layout** runs on every page including authenticated dashboard, automation, admin. Slows down logged-in app and is wrong for dashboard context. Move to landing-only.

### Navbar

16. **Notifications bell does nothing.** No `onClick`, no panel, no notification system at all. Either build or remove.
17. **Mobile "Account" button** opens the *desktop* dropdown which is `absolute right-0` of the desktop user button — won't position correctly on mobile.
18. **"Upgrade" button + Premium modal**: Premium tier UI exists but no Stripe / billing wiring (premium modal is informational only). Confusing for users who click it.

### Dashboard

19. **"Recent Posts" filter row will overflow** with 7 platforms once new platforms become enabled. Should wrap or use a select on small screens.
20. **`<Link href="#" onClick={...}>`** for the Analytics quick action — wrong primitive. Causes scroll-to-top + URL fragment + Next router noise. Use a `<button>` or scroll into the analytics section.
21. **Reconnect banner** shows for *all* users with YouTube even after they reconnect (it just always shows until the session ends). Persist a "reconnected after force-ssl rollout" flag once they re-auth.
22. **No empty-state CTA for connected accounts** — if a user has zero accounts, they see disabled placeholder rows but nothing nudges them to start with YT/Twitter/LinkedIn.

### Analytics

23. **No unified `/analytics` page.** You listed Analytics as a priority area; today only `/analytics/youtube` exists. Twitter and LinkedIn have no dedicated analytics page even though both are first-class platforms.
24. **YT analytics page is light-themed**, breaking dark-theme consistency.
25. **`<YouTubeAnalyticsDashboard />` component** is rendered without passing `channelStats` — it likely fetches its own data, so the parent's `setChannelStats` is dead code.

### Automation

26. **No "Reset" / "Clear" action** in the form sheet for Auto Reply when toggling between AI mode and template mode — switching can leave stale state.
27. **Pin a comment** route exists (`/api/auth/youtube/pin-comment`) but nothing in the UI calls it. Either ship the feature or remove the route.
28. **Auto Reply runs on every non-self comment unconditionally.** Could spam-reply if you have many comments. Add a "max replies per run" guard or per-user rate limit.

### Create Post

29. **`alert()` for every error and success message** (~12 instances). Native browser alerts are intrusive and non-themed. Use a toast component.
30. **Caption character counter only updates per-platform**, not on the main caption editor — easy to type 5000 chars and only realize at the platforms tab.
31. **Image upload uses `imageUrl` string field.** Where does the URL come from? The flow assumes Cloudinary or similar but I see no upload step in this file — `<FileUpload />` must wire it. If `FileUpload` isn't doing the upload, this field stays empty.
32. **AI enhancement uses `alert()`** to surface errors. Should be inline.
33. **Tab navigation has no keyboard support** (left/right arrow). Standard pattern for tabbed wizards.

### Tasks (gap)

34. **No `/tasks` page exists** even though you listed it as a priority area. Scheduled posts only appear in a sidebar widget on the dashboard, capped at recent ones. No way to view all scheduled / failed / drafts in one place. Major gap if "Tasks" was meant to be a proper task management view.

---

## P2 — Polish / nice-to-have

35. **`/admin` and `/admin/users`** render under Navbar/Footer like normal pages — Footer especially looks weird inside an admin tool.
36. **No favicon for dark theme.** `/favicon.ico` is fine but `apple-touch-icon` referenced in layout but not in `/public` (verify).
37. **`<a>` vs `<Link>` mixing** in landing CTAs — couple of places use `<a href>` instead of Next `<Link>`, causes full page reloads.
38. **No skeleton loaders.** Every page uses a spinner. Skeletons feel snappier and reduce CLS.
39. **No loading state on dashboard's `Sync` button** — it sets `syncing` but the button doesn't show it visually.
40. **Console.log statements left in callbacks** in registration / OAuth callbacks. Cleanup before prod.
41. **Duplicated platform-icon mapping** — every screen redefines its own `platformIcons` object. Centralize to `lib/platformConfig`.
42. **`react-phone-number-input` styling clashes** with the dark theme on register page (input is light, label is light, but the rest of the page later goes dark — once register itself is themed dark, this needs custom CSS).
43. **No `noindex` on `/dashboard`, `/automation`, `/admin`** — currently they are `index: true` via root layout's metadata template. Auth-gated pages shouldn't be indexed.
44. **No CSP / security headers.** `next.config` should set `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`. Especially important since you embed AdSense + run third-party OAuth flows.

---

## Suggested fix order (one PR per group)

| Order | Group                                       | Severity | Effort |
| ----- | ------------------------------------------- | -------- | ------ |
| 1     | Delete dead pages, fix dead links           | P0       | XS     |
| 2     | Replace fake metrics + JSON-LD claims       | P0       | S      |
| 3     | Real testimonials (remove or rewrite)       | P0       | XS     |
| 4     | Auth flow: theme + dedupe + forgot password | P1       | M      |
| 5     | Toast component → kill `alert()`            | P1       | M      |
| 6     | Build `/tasks` (scheduled / failed / drafts)| P1       | M      |
| 7     | Build unified `/analytics` index            | P1       | M      |
| 8     | Sync metrics from per-platform docs         | P0       | S      |
| 9     | Navbar bell + mobile menu                   | P1       | S      |
| 10    | Polish (skeletons, CSP, noindex auth pages) | P2       | M      |

---

## What I'd do *first* (today, in this branch)

The cheapest wins with the biggest user-visible impact:

1. Delete `/auth` and `/content/youtube` (dead).
2. Add toast component, replace all `alert()` calls.
3. Remove fake `aggregateRating` from JSON-LD.
4. Fix dashboard Settings/Profile dead links (remove or build placeholders).
5. Theme the auth pages dark to match the app.
6. Fix Firebase login error mapping.
7. Add a "Forgot password" flow.

Steps 1-6 should be one commit. Step 7 is a separate small commit.

Tell me which of these you want me to start on (or "do all of them" and I'll work through the list).
