# PostPilot Complete Architecture

## Full User Journey

### Step 1: User Connects Social Media Account

```
Dashboard
   ↓
User clicks "Connect Account"
   ↓
Selects platform (Twitter, Instagram, YouTube, LinkedIn)
   ↓
Clicks "Connect" button
   ↓
handleConnectAccount() is called
   ↓
Redirects to: /api/auth/{platform}
```

### Step 2: OAuth Initiation

```
/api/auth/{platform} (e.g., /api/auth/twitter)
   ↓
✓ Validates env variables
✓ Generates random state (CSRF protection)
✓ Stores state in httpOnly cookie
✓ Builds platform-specific OAuth URL with:
  - Redirect URI
  - Requested scopes
  - State for verification
   ↓
Redirects user to platform's login page
```

### Step 3: User Authenticates

```
Platform login page (Twitter, Instagram, YouTube, LinkedIn)
   ↓
User signs in with their credentials
   ↓
User sees permission screen
   ↓
User clicks "Allow" / "Grant Access"
   ↓
Platform generates authorization code
```

### Step 4: OAuth Callback

```
Platform redirects to: /api/auth/{platform}/callback?code=...&state=...
   ↓
/api/auth/{platform}/callback route receives request
   ↓
✓ Validates state matches stored state (CSRF check)
✓ Validates code is present
✓ Exchanges code for access token(s):
  POST to platform API with: code, client_id, client_secret
   ↓
✓ Receives: accessToken, refreshToken (usually)
   ↓
✓ Fetches user account info (username, profile, etc.)
   ↓
✓ Saves to Firestore:
  {platform}_connections/{userId} = {
    accessToken,
    refreshToken,
    userInfo...
  }
   ↓
Redirects to /dashboard?success={platform}_connected
```

### Step 5: User Creates Post

```
Dashboard
   ↓
User clicks "Create New Post"
   ↓
Goes to /posts/create page
   ↓
User writes caption
User uploads media (image/video)
User selects platforms (Twitter, Instagram, YouTube)
User clicks "Publish Immediately"
```

### Step 6: Post Gets Published

```
/posts/create page's handleSubmit()
   ↓
✓ Saves post to Firestore with status: "publishing"
   ↓
Calls: POST /api/posts/publish with:
{
  postId,
  platforms: ["twitter", "instagram"],
  caption,
  imageUrl,
  videoUrl
}
   ↓
/api/posts/publish route is called
   ↓
For each platform:
  ├─ Twitter
  │  ├─ Retrieves: twitter_connections/{userId}
  │  ├─ Gets: accessToken, refreshToken
  │  ├─ Creates TwitterApi client with token
  │  ├─ Posts tweet via: /api/auth/twitter/post
  │  └─ Returns: tweet ID
  │
  ├─ Instagram
  │  ├─ Retrieves: instagram_connections/{userId}
  │  ├─ Gets: accessToken, igBusinessAccountId
  │  ├─ Calls Instagram Graph API
  │  ├─ Posts image via: /api/instagram/publish
  │  └─ Returns: post ID
  │
  └─ YouTube
     ├─ Retrieves: youtube_connections/{userId}
     ├─ Gets: accessToken, refreshToken
     ├─ Creates youtube client
     ├─ Uploads video via: /api/auth/youtube/upload
     └─ Returns: video ID
   ↓
✓ Saves platformPostIds to Firestore
✓ Updates post status to "published"
   ↓
Shows success message to user
```

---

## File Structure & Responsibilities

```
app/
├── dashboard/
│   └── page.tsx .......................... User connections UI
│       └── handleConnectAccount() ........ Redirects to /api/auth/{platform}
│
├── posts/
│   └── create/
│       └── page.tsx ...................... Create post form
│           └── handleSubmit() ............ Calls /api/posts/publish
│
└── api/
    ├── posts/
    │   └── publish/
    │       └── route.ts ................. Orchestrates publishing to all platforms
    │           ├─ Calls /api/auth/twitter/post
    │           ├─ Calls /api/auth/youtube/upload
    │           └─ Calls /api/instagram/publish
    │
    ├── auth/
    │   ├── twitter/
    │   │   ├── route.ts ................. OAuth2 initiation
    │   │   ├── callback/
    │   │   │   └── route.ts ............ Token exchange + save
    │   │   └── post/
    │   │       └── route.ts ............ Uses token to POST tweet
    │   │
    │   ├── youtube/
    │   │   ├── route.ts ................. OAuth2 initiation
    │   │   ├── callback/
    │   │   │   └── route.ts ............ Token exchange + save
    │   │   └── upload/
    │   │       └── route.ts ............ Uses token to upload video
    │   │
    │   ├── instagram/
    │   │   ├── route.ts ................. OAuth2 initiation
    │   │   ├── callback/
    │   │   │   └── route.ts ............ Token exchange + save
    │   │   └── publish/
    │   │       └── route.ts ............ Uses token to POST image
    │   │
    │   └── linkedin/
    │       ├── route.ts ................. OAuth2 initiation (NEW)
    │       └── callback/
    │           └── route.ts ............ Token exchange + save
    │
    └── (Other platforms as needed)
```

---

## Database Collections

```
Firestore /
├── users/
│   └── {userId}/
│       ├── displayName, email, ...
│       └── connectedAccounts: []  (legacy, can be deprecated)
│
├── twitter_connections/
│   └── {userId}/
│       ├── accessToken ............ REAL token from Twitter
│       ├── refreshToken ........... REAL refresh token
│       ├── expiresIn
│       ├── twitterUserId
│       ├── handle
│       ├── name
│       └── updatedAt
│
├── instagram_connections/
│   └── {userId}/
│       ├── accessToken ............ REAL token from Meta
│       ├── igBusinessAccountId
│       ├── username
│       ├── name
│       └── updatedAt
│
├── youtube_connections/
│   └── {userId}/
│       ├── accessToken ............ REAL token from Google
│       ├── refreshToken
│       ├── channelName
│       └── updatedAt
│
├── linkedin_connections/
│   └── {userId}/
│       ├── accessToken ............ REAL token from LinkedIn
│       ├── profileName
│       └── updatedAt
│
└── posts/
    └── {postId}/
        ├── userId
        ├── caption
        ├── platforms: ["twitter", "instagram"]
        ├── imageUrl
        ├── videoUrl
        ├── status: "published" | "scheduled" | "failed"
        ├── publishedAt
        ├── platformPostIds: {
        │   ├── twitter: "123456789"
        │   └── instagram: "987654321"
        │ }
        ├── createdAt
        └── updatedAt
```

---

## Security Flow

### CSRF Protection (OAuth)
```
1. Initiation route generates random state
   state = randomString()
   
2. State stored in httpOnly cookie (JS can't access)
   res.cookies.set('oauth_state', state, { httpOnly: true })
   
3. User redirected to platform with state in URL
   https://platform.com/oauth?state=xyz123&...
   
4. After user auth, platform redirects back with state
   /callback?state=xyz123&code=...
   
5. Callback validates: stored_state === returned_state
   if not match: CSRF attack detected, redirect to error
```

### Token Security
```
1. Tokens stored ONLY in Firestore (backend)
2. Never sent to client-side (browser)
3. Only backend APIs can read tokens
4. Backend APIs use tokens to post to platforms
5. Client never has direct access to tokens
```

---

## What Each Route Does

### OAuth Initiation (`/api/auth/{platform}`)
- Receives: Nothing (GET request)
- Does: Generates state, builds OAuth URL
- Returns: Redirect to platform login

### OAuth Callback (`/api/auth/{platform}/callback`)
- Receives: code, state from platform
- Does: Exchange code for tokens, save to Firestore
- Returns: Redirect to dashboard with success message

### Post to Platform (`/api/auth/twitter/post`, `/api/instagram/publish`, etc.)
- Receives: caption, imageUrl, videoUrl
- Does: Get tokens from Firestore, post to platform API
- Returns: Post ID from platform

### Publish Orchestrator (`/api/posts/publish`)
- Receives: postId, platforms, caption, media URLs
- Does: Call each platform's posting API
- Returns: Success/error for each platform

---

## Token Lifecycle

```
Connection Created:
  OAuth flow → Get real token from platform → Save to Firestore
              (Token saved, ready for 30+ days typically)

When Posting:
  App retrieves token from Firestore
  Uses token with platform API
  Posts content
  Returns success/failure

Token Expiration:
  OAuth2 tokens typically expire in 1-30 days
  Can use refresh token to get new token
  Should handle token refresh in posting APIs
```

---

## Error Handling

```
OAuth Flow Errors:
├─ Missing env vars → Redirect to error page
├─ User denies permission → error_code from platform
├─ State mismatch → Potential CSRF attack
├─ Token exchange fails → Platform API error
└─ Firestore save fails → Database error

Posting Errors:
├─ Account not connected → Error message
├─ Token expired → Need user to reconnect
├─ API rate limit → Retry logic
├─ Invalid media URL → Image/video fetch failed
└─ Platform API down → Service error
```

---

## Summary: Complete OAuth + Posting System

✅ **OAuth Connections**: Real platform authentication with user consent
✅ **Secure Tokens**: Stored backend-only, never exposed to client
✅ **CSRF Protection**: State validation prevents attacks
✅ **Account Management**: Users can connect/disconnect accounts
✅ **Real Posting**: Posts go to actual social media accounts
✅ **Error Handling**: Clear feedback when things go wrong
✅ **Multi-Platform**: Same flow works for any platform

Your PostPilot app now has a complete, secure, multi-platform social media publishing system! 🚀
