# PostPilot - Diagnostic Checklist

## ✅ Verify Your Setup

Run this checklist to ensure everything is configured correctly:

### 1. Firebase Configuration
```
File: .env.local

Check these variables exist:
□ NEXT_PUBLIC_FIREBASE_API_KEY
□ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
□ NEXT_PUBLIC_FIREBASE_PROJECT_ID
□ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
□ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
□ NEXT_PUBLIC_FIREBASE_APP_ID

Command to verify:
cat .env.local | grep FIREBASE
```

### 2. Cloudinary Configuration
```
File: components/FileUpload.tsx (line 28-29)

Check these exist:
□ cloudName: "datrs1ouj"
□ uploadPreset: "postpilot_upload"

How to fix:
1. Go to https://cloudinary.com/console
2. Copy your Cloud Name
3. Go to Settings > Upload
4. Create unsigned upload preset
5. Update FileUpload.tsx with your values
```

### 3. Firestore Rules
```
Current Status: Check Firebase Console

Steps:
1. Go Firebase Console > Firestore Database > Rules
2. Paste content from FIRESTORE_RULES.md
3. Click "Publish"
4. Wait for "Rules Updated" message

Verify:
□ Rules published successfully
□ No errors showing
□ Timestamp shows recent update
```

### 4. Database Collections
```
Required Collections in Firestore:
□ users/ - User profiles
□ posts/ - Scheduled/published posts
□ connections/ (optional) - Connection logs

Verify in Firebase Console:
1. Firestore Database > Collections tab
2. Should see at least "users" collection
3. Users should have documents with your test email
```

### 5. Authentication
```
Enable in Firebase Console:
□ Email/Password authentication enabled
□ Users can sign up (Authentication > Sign-up restrictions unchecked)

Test:
1. Go to http://localhost:3000/register
2. Create test account
3. Check Firestore users collection - document should appear
4. Login and verify redirect to /dashboard
```

---

## 🔍 Quick Diagnostic Commands

### Check Firestore Connection
```javascript
// In browser console (F12 > Console)
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Replace with your actual UID
const userRef = doc(db, 'users', 'YOUR_UID_HERE');
const userSnap = await getDoc(userRef);
console.log(userSnap.data());
```

### Check Authentication
```javascript
// In browser console
import { auth } from '@/lib/firebase';
console.log('Current user:', auth.currentUser);
console.log('User UID:', auth.currentUser?.uid);
```

### Check Cloudinary Upload
```javascript
// FileUpload component test
// Open http://localhost:3000/posts/create
// Drag a file into the upload area
// Check browser Network tab for cloudinary upload
```

---

## 📋 File Location Reference

| Feature | File | Status |
|---------|------|--------|
| Landing Page | app/page.tsx | ✅ Complete |
| Registration | app/register/page.tsx | ✅ Complete |
| Login | app/login/page.tsx | ✅ Complete |
| Dashboard | app/dashboard/page.tsx | ✅ Complete + Error Handling |
| Create Post | app/posts/create/page.tsx | ✅ Complete with FileUpload |
| File Upload | components/FileUpload.tsx | ✅ Complete |
| Auth Context | context/AuthContext.tsx | ✅ Complete |
| Firestore Rules | FIRESTORE_RULES.md | ⚠️ Needs Manual Setup |
| API Connections | app/api/connections/manage/route.ts | ✅ Complete |
| Firebase Config | lib/firebase.ts | ✅ Complete |

---

## 🚨 Most Common Issues & Solutions

### #1 - Permission Denied Error
**How to recognize**: 
```
Error: FirebaseError: Missing or insufficient permissions
```
**Why it happens**: Firestore rules not updated

**Fix in 3 steps**:
1. Copy FIRESTORE_RULES.md content
2. Firestore Console > Rules tab > Paste > Publish
3. Refresh browser and retry

---

### #2 - File Upload Not Working
**How to recognize**:
- Upload button appears blank
- Drag-drop doesn't respond
- Network shows no cloudinary request

**Why it happens**: FileUpload component not imported or Cloudinary credentials wrong

**Fix**:
1. Check `/app/posts/create/page.tsx` imports
2. Verify line: `import FileUpload from '@/components/FileUpload';`
3. Check Cloudinary credentials in FileUpload.tsx
4. If still broken, reinstall component from components/FileUpload.tsx

---

### #3 - Dashboard Shows No Accounts
**How to recognize**:
- Dashboard loads but "No connected accounts" appears
- Connected accounts list is empty

**Why it happens**: 
- First time (expected) - create first account
- Subsequent times - Firestore fetch failed

**Fix**:
1. Try connecting an account (should create array in Firestore)
2. If still broken: Browser F12 > Console > Copy errors
3. Check Firestore users > your-uid > connectedAccounts field

---

### #4 - Login Redirects to /login Loop
**How to recognize**:
- Click login, form submits
- Redirects back to login page
- No error message

**Why it happens**: Auth context not loading user data from Firestore

**Fix**:
1. Check browser console for errors
2. Verify Firestore rules allow `users/{uid}` reads for authenticated users
3. Verify user exists in Firestore users collection
4. Hard refresh (Ctrl+Shift+R)

---

## 📞 Getting Help

1. **Check this file first** - 90% of issues documented
2. **Check TROUBLESHOOTING.md** - More detailed fixes
3. **Check browser console** - Error messages there
4. **Check Firestore Console** - Verify data exists
5. **Check Firebase Authentication** - Verify user exists

---

## ✨ How to Verify Everything Works

### Full User Journey Test

```
Step 1: Register
□ Go to http://localhost:3000/register
□ Enter: email, password, display name
□ Click Register
□ Verify: Auto-redirects to /dashboard
□ Check Firestore: users/{uid} document created

Step 2: Connect Account
□ Click "Add Connection" button
□ Select platform (e.g., YouTube)
□ Click "Connect YouTube"
□ Verify: No permission error
□ Check Firestore: connectedAccounts array updated

Step 3: Create Post
□ Click "Create Post" in sidebar
□ Upload image/video (drag into FileUpload area)
□ Verify: Cloudinary URL appears in hidden imageUrl field
□ Write caption
□ Select platforms
□ Click "Next"
□ Verify: Platform-specific fields show
□ Click "Next" to Schedule
□ Click "Schedule Post"
□ Check Firestore: Post document created in posts collection

Step 4: Verify Storage
□ Firestore posts/{postId} should have:
  - userId
  - caption
  - platforms array
  - platformContent object
  - imageUrl (Cloudinary URL)
  - status: "scheduled"
  - createdAt: timestamp
```

---

## 🎯 Success Criteria

When working correctly, you should see:

✅ Register → Auto-login → Dashboard works without errors
✅ Connect Account button works (no permission errors)
✅ File upload shows Cloudinary upload widget
✅ Create post saves to Firestore with all fields
✅ Platform-specific fields populate automatically
✅ All pages load without 404 or 500 errors
✅ No console errors (F12 > Console tab is clean)

---

**Last Updated**: After implementation of FileUpload restoration + Firestore rules fix
**Version**: PostPilot v1.0
**Status**: Feature Complete, awaiting Firestore rules deployment
