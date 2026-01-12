# OAuth Workflow Documentation

## Corrected Connection Flow

### ❌ OLD (What Was Wrong)
```
User clicks "Connect" → Creates fake tokens → Saves to Firestore
(No actual OAuth, no real account connection)
```

### ✅ NEW (Correct OAuth Flow)
```
User clicks "Connect" 
    ↓
Redirects to /api/auth/{platform} (e.g., /api/auth/twitter)
    ↓
OAuth route redirects to platform's login page
    ↓
User signs in to their social media account
    ↓
User grants permission to PostPilot
    ↓
Platform redirects back to /api/auth/{platform}/callback with auth code
    ↓
Callback exchanges code for access tokens
    ↓
Callback saves tokens + account info to Firestore
    ↓
Callback redirects to /dashboard with success message
```

---

## Implementation Details

### 1. Dashboard Connect Button
**File**: `app/dashboard/page.tsx` → `handleConnectAccount()`

```typescript
// User selects platform and clicks "Connect"
// Instead of fake tokens, redirect to OAuth route:

const oauthRoutes = {
  instagram: '/api/auth/instagram',
  youtube: '/api/auth/youtube',
  twitter: '/api/auth/twitter',
  linkedin: '/api/auth/linkedin',
  // etc...
};

// Redirect user to the OAuth initiation route
window.location.href = oauthRoutes[selectedPlatform];
```

### 2. OAuth Initiation Routes

Each platform has an initiation route that:
- Validates environment variables
- Generates OAuth state (for CSRF protection)
- Builds platform-specific OAuth URL
- Stores state in secure httpOnly cookie
- Redirects user to platform's login

**Examples**:
- `app/api/auth/twitter/route.ts` - Twitter OAuth2 initiation
- `app/api/auth/youtube/route.ts` - YouTube OAuth2 initiation
- `app/api/auth/instagram/route.ts` - Instagram OAuth initiation
- `app/api/auth/linkedin/route.ts` - LinkedIn OAuth initiation (just created)

### 3. OAuth Callback Routes

After user authenticates on the platform, they're redirected back to:
- `app/api/auth/{platform}/callback/route.ts`

Each callback:
1. **Validates** the OAuth response (checks state, error params, code)
2. **Exchanges** the authorization code for access tokens
3. **Gets** user account information (username, ID, etc.)
4. **Saves** tokens + info to Firestore
5. **Redirects** back to dashboard with success message

**Callback files**:
- `app/api/auth/twitter/callback/route.ts` - Saves to `twitter_connections` collection
- `app/api/auth/youtube/callback/route.ts` - Saves to `youtube_connections` collection
- `app/api/auth/instagram/callback/route.ts` - Saves to `instagram_connections` collection (FIXED)
- `app/api/auth/linkedin/callback/route.ts` - Saves to `linkedin_connections` collection

---

## Platform-Specific Details

### Twitter (OAuth2)
**Initiation**: `GET /api/auth/twitter`
- Generates PKCE code_verifier
- Creates auth URL with scopes: tweet.read, tweet.write, users.read, offline.access
- Stores state + code_verifier in cookies

**Callback**: `GET /api/auth/twitter/callback`
- Exchanges code + code_verifier for tokens
- Saves: `accessToken`, `refreshToken`, `expiresIn`, `twitterUserId`, `handle`, `name`
- Collection: `twitter_connections`

### YouTube (OAuth2)
**Initiation**: `GET /api/auth/youtube`
- Creates auth URL with scopes: youtube.upload, youtube, youtube.readonly
- Sets access_type: offline for refresh tokens

**Callback**: `GET /api/auth/youtube/callback`
- Exchanges code for tokens
- Gets channel info via YouTube API
- Saves: `accessToken`, `refreshToken`, `channelName`
- Collection: `youtube_connections`

### Instagram (OAuth2)
**Initiation**: `GET /api/auth/instagram`
- Creates auth URL with scopes: user_profile, user_media
- Uses Facebook Login (Meta SDK)

**Callback**: `GET /api/auth/instagram/callback` (FIXED)
- Exchanges code for short-lived token
- Converts to long-lived token
- Gets Instagram Business Account info
- Saves: `accessToken`, `igBusinessAccountId`, `username`, `name`
- Collection: `instagram_connections`

### LinkedIn (OAuth2 - Just Created)
**Initiation**: `GET /api/auth/linkedin`
- Creates auth URL with scopes: openid, profile, email

**Callback**: `GET /api/auth/linkedin/callback`
- Exchanges code for tokens
- Gets profile name
- Saves: `accessToken`, `profileName`
- Collection: `linkedin_connections`

---

## Database Structure

### twitter_connections
```javascript
{
  userId: "demo_user",
  provider: "twitter",
  accessToken: "string",
  refreshToken: "string",
  expiresIn: number,
  twitterUserId: "string",
  handle: "string",
  name: "string",
  updatedAt: timestamp
}
```

### youtube_connections
```javascript
{
  userId: "demo_user",
  provider: "youtube",
  accessToken: "string",
  refreshToken: "string",
  channelName: "string",
  updatedAt: timestamp
}
```

### instagram_connections
```javascript
{
  userId: "demo_user",
  provider: "instagram",
  accessToken: "string",
  igBusinessAccountId: "string",
  username: "string",
  name: "string",
  updatedAt: timestamp
}
```

### linkedin_connections
```javascript
{
  userId: "demo_user",
  provider: "linkedin",
  accessToken: "string",
  profileName: "string",
  updatedAt: timestamp
}
```

---

## Security Features

### CSRF Protection
- Each OAuth initiation generates a random `state` value
- State stored in httpOnly cookie (can't be accessed by JS)
- Callback validates that returned state matches stored state
- Prevents attackers from redirecting to malicious callback URLs

### Token Security
- Access tokens stored in Firestore (database)
- Tokens never exposed to client-side code
- Only backend APIs can access and use tokens
- Used only when posting to social media

### Authorization
- User must be authenticated to see dashboard
- OAuth callbacks validate user authentication
- Only authenticated users can save connections

---

## Testing the OAuth Flow

### Test Twitter Connection
1. Dashboard → Click "Connect Account"
2. Select "Twitter/X"
3. Click "Connect"
4. You're redirected to Twitter login page
5. Sign in with your Twitter account
6. Grant permissions to PostPilot
7. Redirected back to dashboard with success message
8. Your Twitter account appears in "Connected Accounts"

### Test Instagram Connection
1. Dashboard → Click "Connect Account"
2. Select "Instagram"
3. Click "Connect"
4. Redirected to Facebook Login page
5. Sign in with your Meta/Facebook account
6. Grant permissions (Business Account access)
7. Redirected back to dashboard with success message
8. Your Instagram account appears in list

### Verify Tokens Saved
1. Go to Firebase Console
2. Firestore → twitter_connections / instagram_connections / youtube_connections
3. You should see document with userId "demo_user"
4. Contains: accessToken, refreshToken, user info, etc.

---

## Environment Variables Needed

```env
# Twitter OAuth2
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_secret
TWITTER_REDIRECT_URI=http://localhost:3000/api/auth/twitter/callback

# YouTube OAuth2
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback

# Instagram (Meta)
NEXT_PUBLIC_META_APP_ID=your_app_id
META_APP_SECRET=your_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/api/auth/instagram/callback

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
```

---

## What Changed

| File | Change |
|------|--------|
| `app/dashboard/page.tsx` | Fixed handleConnectAccount to redirect to OAuth routes |
| `app/api/auth/instagram/callback/route.ts` | Completed with full token exchange logic |
| `app/api/auth/linkedin/route.ts` | ✨ NEW - LinkedIn OAuth initiation |
| `app/api/auth/tiktok/route.ts` | ✨ NEW - Stub (not implemented) |
| `app/api/auth/facebook/route.ts` | ✨ NEW - Stub (not implemented) |
| `app/api/auth/pinterest/route.ts` | ✨ NEW - Stub (not implemented) |

---

## Summary

✅ **Before**: Click "Connect" → Fake tokens saved to database
✅ **After**: Click "Connect" → Real OAuth flow → Real tokens from platform → Saved to database

Your app now has **real OAuth authentication** that securely connects to actual social media accounts!
