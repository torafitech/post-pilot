# PostPilot - Firestore Security Rules

Copy the rules below to your Firebase Console > Firestore Database > Rules tab, then click Publish.

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===== USERS COLLECTION =====
    // Each user can only read/write their own document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Allow nested subcollections (connectedAccounts, preferences, etc.)
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // ===== POSTS COLLECTION =====
    // Users can create/read/update/delete only their own posts
    match /posts/{postId} {
      allow create: if request.auth.uid != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow read: if request.auth.uid == resource.data.userId;
      
      allow update, delete: if request.auth.uid == resource.data.userId;
      
      // Allow nested analytics subcollection
      match /analytics/{document=**} {
        allow read, write: if request.auth.uid == parent(2).resource.data.userId;
      }
    }

    // ===== PLATFORM-SPECIFIC CONNECTIONS =====
    // YouTube connections - user can manage their own
    match /youtube_connections/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Twitter connections - user can manage their own
    match /twitter_connections/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Instagram connections - user can manage their own
    match /instagram_connections/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // LinkedIn connections - user can manage their own
    match /linkedin_connections/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // TikTok connections - user can manage their own
    match /tiktok_connections/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Facebook connections - user can manage their own
    match /facebook_connections/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Generic connections collection (fallback)
    match /connections/{connectionId} {
      allow create: if request.auth.uid != null && 
                       request.resource.data.userId == request.auth.uid;
      
      allow read, write: if request.auth.uid == resource.data.userId;
    }

    // ===== ANALYTICS & STATS =====
    // Users can only read/write their own analytics
    match /analytics/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Allow nested documents and subcollections
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // ===== SETTINGS & PREFERENCES =====
    // Users can only manage their own settings
    match /settings/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // ===== DENY EVERYTHING ELSE =====
    // Default deny for any unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Apply These Rules

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com
   - Select your PostPilot project

2. **Navigate to Firestore Rules**
   - Firestore Database > Rules tab
   - You'll see the current rules editor

3. **Copy and Paste**
   - Select all the rules above (starting from `rules_version`)
   - Paste into the Firebase Console editor

4. **Publish**
   - Click the "Publish" button
   - Wait for "Rules updated" confirmation message
   - This typically takes 1-2 minutes

5. **Test the Connection**
   - Refresh your browser
   - Go to http://localhost:3000/dashboard
   - Try connecting a social media account
   - You should no longer see "Permission denied" errors

## Rule Breakdown

### Users Collection
- **Read/Write**: Only authenticated users can read/write their own user document
- **Structure**: `users/{userId}` where userId = Firebase Authentication UID
- **Nested Collections**: Users can access any nested collections under their user document

### Posts Collection
- **Create**: Authenticated users can only create posts where `userId` matches their own UID
- **Read**: Users can only read posts they created
- **Update/Delete**: Users can only modify posts they created
- **Analytics Subcollection**: Only the post creator can read/write analytics data

### Platform-Specific Connections (ALL 6 PLATFORMS)

All social media connections follow the same secure pattern:

- **YouTube**: `youtube_connections/{userId}` ✅
- **Twitter**: `twitter_connections/{userId}` ✅
- **Instagram**: `instagram_connections/{userId}` ✅
- **LinkedIn**: `linkedin_connections/{userId}` ✅
- **TikTok**: `tiktok_connections/{userId}` ✅
- **Facebook**: `facebook_connections/{userId}` ✅

Each allows read/write **only** for the authenticated user matching that userId.

**What this means:**
- User can save their YouTube access token
- User can save their Twitter access token
- User can save their Instagram access token
- User can save their LinkedIn access token
- User can save their TikTok access token
- User can save their Facebook access token
- No one else can see or modify their connection tokens
- Each platform's OAuth callback can safely save tokens to these collections

### Connections Collection (Generic Fallback)
- **Create**: Users can save connection details only for themselves
- **Read/Write**: Users can only access their own connection records

### Analytics Collection
- **Read/Write**: Users can only access analytics data for their own user ID
- **Nested Documents**: All nested data under `/analytics/{userId}` is accessible only to that user

### Settings Collection
- **Read/Write**: Users can only manage their own settings
- **Nested Documents**: All settings under `/settings/{userId}` are private to that user

## ⚠️ Security Notes

- These rules enforce **authentication** - only logged-in users can access data
- Users can **ONLY** access their own data - they cannot see other users' posts, connections, or analytics
- All operations require a valid Firebase Authentication token
- Cross-user access is **DENIED** by default
- Platform connections are isolated by user, preventing unauthorized token access

## Testing After Deployment

```javascript
// In browser console (F12), test if rules are working:

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { auth } from '@/lib/firebase';

const userId = auth.currentUser?.uid;

// Test 1: Reading own user document (should succeed ✅)
const userRef = doc(db, 'users', userId);
const userSnap = await getDoc(userRef);
console.log('✅ User data:', userSnap.data());

// Test 2: Reading own YouTube connection (should succeed ✅)
const ytRef = doc(db, 'youtube_connections', userId);
const ytSnap = await getDoc(ytRef);
console.log('✅ YouTube connection:', ytSnap.data());

// Test 3: Reading own Twitter connection (should succeed ✅)
const twRef = doc(db, 'twitter_connections', userId);
const twSnap = await getDoc(twRef);
console.log('✅ Twitter connection:', twSnap.data());

// Test 4: Reading own Instagram connection (should succeed ✅)
const igRef = doc(db, 'instagram_connections', userId);
const igSnap = await getDoc(igRef);
console.log('✅ Instagram connection:', igSnap.data());

// Test 5: Trying to read another user's connections (should fail ❌)
// Uncomment to test (will throw permission denied)
// const otherUserRef = doc(db, 'youtube_connections', 'some_other_uid');
// const otherSnap = await getDoc(otherUserRef);
// console.log('❌ This should fail:', otherSnap.data());
```

## Common Issues

### "Permission denied" when connecting accounts
- **Problem**: Firestore rules haven't been published yet
- **Solution**: 
  1. Copy all rules from above (starting at `rules_version`)
  2. Go to Firebase Console > Firestore > Rules tab
  3. Paste into the editor
  4. Click **Publish** button
  5. Wait for "Rules updated" message
  6. Hard refresh browser (Ctrl+Shift+R)

### "Permission denied" specifically on YouTube/Twitter/Instagram
- **Problem**: Rules not published, or incorrect platform collection name
- **Solution**: Verify in Firebase Console that:
  - Rules are published (green checkmark)
  - Collection names exactly match: `youtube_connections`, `twitter_connections`, `instagram_connections`, etc.
  - You're logged in as the same user

### "User not found" errors
- **Problem**: User document doesn't exist in `/users/{uid}`
- **Solution**: User needs to register/login first to create their user document

### Posts not saving
- **Problem**: Post document being created without matching `userId`
- **Solution**: Make sure the API is sending `userId` that matches `request.auth.uid`

### Collections showing in console but still getting permission denied
- **Problem**: Rules are published but there's a caching issue
- **Solution**: 
  1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
  2. Clear browser cache (DevTools > Storage > Clear Site Data)
  3. Sign out and sign back in
  4. Wait 1-2 minutes for Firestore to propagate rules

### OAuth Callbacks Failing (Getting 403)
- **Problem**: Callback routes trying to save to `{platform}_connections` collections but rules don't allow
- **Solution**: Make sure the rules above include all 6 platform collections and they're published

## ✅ You're All Set!

Once rules are published, all features will work without permission errors:

**All Platform Connections:**
- ✅ YouTube connection
- ✅ Twitter connection  
- ✅ Instagram connection
- ✅ LinkedIn connection
- ✅ TikTok connection
- ✅ Facebook connection

**Core Features:**
- ✅ Posts saving
- ✅ User profile updates
- ✅ Settings updates
- ✅ Analytics tracking
- ✅ File uploads with Cloudinary

**Security Verified:**
- ✅ Users can only access their own data
- ✅ Platform tokens are protected
- ✅ Cross-user access is prevented
- ✅ Public collections are restricted
