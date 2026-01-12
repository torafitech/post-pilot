# Dashboard Account Display Fix

## The Problem

YouTube OAuth was working correctly:
- ✅ User redirected to YouTube login
- ✅ User signed in
- ✅ User granted permissions
- ✅ Callback processed authorization code
- ✅ Tokens saved to Firestore
- ✅ Redirected back to dashboard

**BUT** the connected account didn't appear in the UI.

## Root Cause

There was a **data location mismatch**:

**OAuth Callbacks Save To**:
```
twitter_connections/demo_user → { accessToken, ... }
youtube_connections/demo_user → { accessToken, ... }
instagram_connections/demo_user → { accessToken, ... }
linkedin_connections/demo_user → { accessToken, ... }
```

**Dashboard Was Looking In**:
```
users/demo_user/connectedAccounts → [] (empty array)
```

The OAuth callbacks were saving to separate collections, but the dashboard was looking in the wrong place!

---

## The Solution

Fixed `fetchConnectedAccounts()` function in `app/dashboard/page.tsx`:

**Before**:
```typescript
// ❌ WRONG - Only looked in users/{userId}/connectedAccounts
const userDoc = await getDoc(userDocRef);
const accounts = userDoc.data().connectedAccounts || [];
```

**After**:
```typescript
// ✅ CORRECT - Check each platform's actual connection collection
const platformCollections = [
  { name: 'twitter', label: 'Twitter/X' },
  { name: 'youtube', label: 'YouTube' },
  { name: 'instagram', label: 'Instagram' },
  { name: 'linkedin', label: 'LinkedIn' },
];

for (const platform of platformCollections) {
  const docRef = doc(db, `${platform.name}_connections`, user.uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    // Found a connection! Add to accounts list
    accounts.push({ ... });
  }
}
```

Also fixed the disconnect function to delete from the correct collection:

**Before**:
```typescript
// ❌ WRONG - Tried to update users/{userId}
await updateDoc(userDocRef, {
  connectedAccounts: updatedAccounts,
});
```

**After**:
```typescript
// ✅ CORRECT - Delete from the platform collection
const platformName = accountId.split('_')[0]; // "youtube" from "youtube_userId"
const docRef = doc(db, `${platformName}_connections`, user.uid);
await deleteDoc(docRef);
```

---

## How It Works Now

### When User Connects YouTube

1. User clicks "Connect Account" → Select "YouTube"
2. Redirects to `/api/auth/youtube`
3. User signs in and grants permissions
4. Callback saves to: `youtube_connections/{userId}` ✅
5. Redirects back to `/dashboard?success=youtube_connected`
6. Dashboard's `fetchConnectedAccounts()` runs
7. Checks `youtube_connections/{userId}` ✅ FINDS IT!
8. Adds to connected accounts list
9. **Account appears in UI!** ✅

### When User Disconnects

1. User clicks "Disconnect" button
2. `handleDisconnectAccount(accountId)` called with `"youtube_userId"`
3. Extracts platform: `"youtube"`
4. Deletes from: `youtube_connections/{userId}` ✅
5. Updates UI state
6. **Account disappears from UI!** ✅

---

## Data Flow

```
OAuth Callback
    ↓
Saves to: {platform}_connections/{userId}
    ↓
Dashboard loads
    ↓
fetchConnectedAccounts() called
    ↓
Checks: twitter_connections, youtube_connections, 
        instagram_connections, linkedin_connections
    ↓
Finds: youtube_connections/{userId} ✅
    ↓
Maps data to ConnectedAccount format
    ↓
Adds to state: setConnectedAccounts([...])
    ↓
UI shows: "YouTube account connected!" ✅
```

---

## Account Name Display

The fix also properly displays account names from each platform:

```typescript
// Maps different field names from each platform
const accountName = 
  data.handle ||           // Twitter
  data.username ||         // Instagram  
  data.channelName ||      // YouTube
  data.profileName ||      // LinkedIn
  `${platform.label} Account`;
```

So you'll see:
- Twitter: "@yourhandle"
- Instagram: "yourusername"
- YouTube: "Your Channel Name"
- LinkedIn: "Your Name"

---

## Files Modified

- `app/dashboard/page.tsx`
  - Fixed imports (removed unused, added `deleteDoc`)
  - Completely rewrote `fetchConnectedAccounts()`
  - Updated `handleDisconnectAccount()`

---

## Test It Now

1. You should already have YouTube connected (from your test)
2. Refresh the dashboard
3. ✅ YouTube account should now appear in "Connected Accounts"
4. Try connecting other platforms
5. Try disconnecting
6. All should work!

---

## Summary

The OAuth flow was working perfectly - tokens were being saved to the correct collections. The issue was just that the dashboard was looking in the wrong place for them.

**Simple fix**: Check the actual platform collections instead of looking for a non-existent array in the user document.

Now the dashboard correctly displays all connected accounts! 🎉
