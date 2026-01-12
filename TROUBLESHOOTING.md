# PostPilot - Troubleshooting Guide

## 🔴 Firebase Permission Errors

### Error: "Missing or insufficient permissions"

This error occurs when trying to connect accounts or save posts to Firestore.

### ✅ Solution

1. **Go to Firebase Console**
   - Navigate to Firestore Database
   - Click on "Rules" tab

2. **Copy and Paste the Correct Rules**
   - See `FIRESTORE_RULES.md` in the project root
   - Replace all existing rules with the content from that file

3. **Publish the Rules**
   - Click "Publish" button
   - Wait for deployment (1-2 minutes)

4. **Test the Connection**
   - Refresh your browser
   - Try connecting an account again

---

## 📋 Common Issues & Fixes

### Issue 1: Can't Connect Social Media Accounts

**Symptom**: Button click does nothing or shows "Missing or insufficient permissions"

**Root Cause**: Firestore rules don't allow writes to `users` collection

**Fix**:
```
Follow the Firebase Permission Errors section above
```

---

### Issue 2: Posts Not Saving

**Symptom**: Click "Schedule Post" but nothing happens

**Root Cause**: Either Firestore rules issue OR missing data validation

**Debug Steps**:
```javascript
// Open browser console (F12)
// Try manually in console:
const { addDoc, collection } = require('firebase/firestore');
const { db } = require('@/lib/firebase');

const postsRef = collection(db, 'posts');
addDoc(postsRef, {
  userId: 'test_uid',
  caption: 'test',
  platforms: ['instagram'],
  status: 'scheduled',
  createdAt: new Date(),
}).then(() => console.log('Success!')).catch(err => console.error(err));
```

---

### Issue 3: Can't Upload Files to Cloudinary

**Symptom**: File upload progress bar appears but doesn't complete

**Root Cause**: Invalid Cloudinary credentials

**Fix**:
1. Check `components/FileUpload.tsx` line 28-29
2. Verify Cloudinary `cloudName` and `uploadPreset`
3. In Cloudinary Dashboard:
   - Go to Settings > Upload
   - Create unsigned upload preset
   - Use that preset in FileUpload component

---

### Issue 4: Connected Accounts Show But Don't Save

**Symptom**: Account appears in list but disappears on page refresh

**Root Cause**: Browser caching or localStorage issue

**Fix**:
```javascript
// Clear browser cache
// In console:
localStorage.clear();
sessionStorage.clear();

// Hard refresh
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

---

### Issue 5: Dashboard Shows "No Connected Accounts"

**Symptom**: Just logged in but no saved accounts appear

**Root Cause**: Firestore hasn't synced yet OR wrong user UID

**Fix**:
1. Check Firestore Console:
   - Go to `users` collection
   - Find your user document by UID
   - Check if `connectedAccounts` array exists

2. If it doesn't exist:
   - Try connecting an account again
   - This will create the array

3. If it exists but doesn't show:
   - Check browser console for fetch errors
   - Verify user UID matches in document

---

### Issue 6: Platform-Specific Content Not Auto-Generating

**Symptom**: Write caption but platform fields stay empty

**Root Cause**: JavaScript state not updating

**Fix**:
```javascript
// This is normal - click Next tab and come back
// Content generates on mount and caption change

// Or manually update by clicking in the platform fields
```

---

### Issue 7: File Upload Component Not Showing

**Symptom**: Media upload section appears blank

**Root Cause**: FileUpload component not imported or missing

**Fix**:
```tsx
// In /app/posts/create/page.tsx, line should be:
import FileUpload from '@/components/FileUpload';

// And in JSX:
<FileUpload
  onUploadComplete={(url, type) => {
    if (type === 'image') {
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } else {
      setFormData((prev) => ({ ...prev, videoUrl: url }));
    }
  }}
  acceptedTypes="image,video"
  maxSizeMB={100}
/>
```

---

### Issue 8: OAuth/Platform Connection Not Working

**Symptom**: "Connect" button for YouTube, Instagram, etc. does nothing

**Root Cause**: OAuth endpoints not implemented (this is expected for MVP)

**Current Status**: 
- ✅ Connected accounts saved to Firestore (local storage)
- 🔄 Real OAuth integration (Todo - requires API keys)

**Workaround for Testing**:
- The mock connection saves data to Firestore
- You can use this for testing post creation
- Real OAuth will be implemented in phase 2

---

## 🔍 Debugging Checklist

### Before reporting an issue, verify:

- [ ] Firestore rules are updated (see FIRESTORE_RULES.md)
- [ ] Browser cache is cleared
- [ ] Firebase credentials in .env.local are correct
- [ ] User is properly authenticated
- [ ] Check browser console for error messages
- [ ] Check Firestore console for data

### Get More Details:

```javascript
// In browser console
// Check authentication
firebase.auth().currentUser
// Check Firestore documents
db.collection('users').doc(uid).get().then(doc => console.log(doc.data()))
```

---

## 📊 Firestore Data Structure

Verify your Firestore has this structure:

```
firestore/
├── users/
│   └── {userId}/
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── createdAt: timestamp
│       └── connectedAccounts: array
│           └── [0]
│               ├── id: string
│               ├── platform: string
│               ├── accountName: string
│               ├── accessToken: string
│               └── connectedAt: timestamp
│
└── posts/
    └── {postId}/
        ├── userId: string
        ├── caption: string
        ├── platforms: array
        ├── platformContent: object
        ├── imageUrl: string
        ├── videoUrl: string
        ├── status: string (scheduled/published/failed)
        ├── createdAt: timestamp
        └── updatedAt: timestamp
```

---

## 🚀 Quick Fixes Checklist

| Issue | Fix | Time |
|-------|-----|------|
| Permission Errors | Update Firestore Rules | 2 min |
| Can't Connect | Check Firestore Rules | 2 min |
| Posts Not Saving | Verify userId in form | 1 min |
| File Upload Failed | Check Cloudinary credentials | 3 min |
| No Connected Accounts | Refresh page / clear cache | 1 min |
| Images/Videos Not Uploading | Check file size < 100MB | 1 min |

---

## 📞 Need Help?

1. Check FIRESTORE_RULES.md - most issues are permissions
2. Check console errors (F12 > Console)
3. Verify Firestore documents exist
4. Check .env.local has all Firebase credentials
5. Try clearing cache and reloading

---

**Status**: All features implemented ✅
**Known Limitations**: Real OAuth requires platform API keys (Phase 2)
