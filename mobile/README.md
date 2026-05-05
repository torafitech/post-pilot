# StarlingPost Mobile

Expo + React Native + TypeScript mobile app for StarlingPost. iOS + Android from one codebase, talking to the existing Next.js backend.

## Stack

- **Expo SDK 52** (managed workflow, EAS Build for store releases)
- **React Native 0.76** with the new architecture enabled
- **TypeScript** strict mode
- **NativeWind v4** (Tailwind CSS for RN)
- **React Navigation v7** (native stack + bottom tabs)
- **Firebase JS SDK** with AsyncStorage persistence
- **expo-web-browser** for OAuth flows that reuse the web auth routes
- **expo-image-picker** for media selection
- **react-native-gifted-charts** for the dashboard trend chart

## Setup

```bash
cd mobile
npm install
```

### 1. Plug in Firebase config

Open `app.json` and replace the `expo.extra.firebase*` placeholders with your Firebase Web app config (the same one the web app uses):

```jsonc
"extra": {
  "apiBaseUrl": "https://www.starlingpost.com",
  "firebaseApiKey": "AIza...",
  "firebaseAuthDomain": "starlingpost.firebaseapp.com",
  "firebaseProjectId": "starlingpost",
  "firebaseStorageBucket": "starlingpost.appspot.com",
  "firebaseMessagingSenderId": "...",
  "firebaseAppId": "..."
}
```

### 2. Run the dev server

```bash
npx expo start
```

Then press `i` for iOS Simulator, `a` for Android emulator, or scan the QR with the Expo Go app.

### 3. Type check

```bash
npm run type-check
```

## Architecture

```
mobile/
├── App.tsx                      # Root with providers (Auth, SafeArea, Gesture)
├── app.json                     # Expo config + Firebase env via expo.extra
├── src/
│   ├── lib/
│   │   ├── firebase.ts          # Firebase init with AsyncStorage persistence
│   │   ├── auth.ts              # AuthProvider + useAuth hook
│   │   ├── api.ts               # Bearer-token HTTP client → Next.js backend
│   │   ├── platformConfig.ts    # Mirror of web platform config
│   │   └── theme.ts             # Colors + formatters
│   ├── navigation/
│   │   ├── RootNavigator.tsx    # Decides Auth vs Main based on user
│   │   ├── AuthNavigator.tsx    # Login + SignUp stack
│   │   ├── MainStackNavigator.tsx # Wraps tabs + pushable screens
│   │   └── MainTabNavigator.tsx # 5 tabs with floating "+" Create button
│   ├── components/
│   │   ├── Screen.tsx           # SafeArea + scroll + pull-to-refresh wrapper
│   │   ├── Button.tsx           # Primary / secondary / ghost / danger variants
│   │   ├── PostCard.tsx         # Post tile (status, metrics, platform)
│   │   ├── PlatformIcon.tsx     # Platform iconography
│   │   └── StatCard.tsx         # Stat tile for dashboard
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── SignUpScreen.tsx
│       ├── DashboardScreen.tsx  # Totals + chart + connected accounts + recent posts
│       ├── PostsScreen.tsx      # Filtered list (all / published / scheduled / failed)
│       ├── CreatePostScreen.tsx # Caption + media + platforms + schedule
│       ├── AutomationScreen.tsx # Link Me + Auto Reply CRUD + Test Now
│       ├── AccountsScreen.tsx   # Connect via in-app browser, list, disconnect
│       └── ProfileScreen.tsx    # Account info + sign out + links
```

## How OAuth works

The mobile app **reuses your Next.js OAuth routes** rather than implementing each provider natively. When the user taps "Connect YouTube":

1. We call `WebBrowser.openAuthSessionAsync('https://www.starlingpost.com/api/auth/youtube?uid=<firebase-uid>')`.
2. The user authenticates in an in-app browser.
3. The Next.js callback route stores the new `connectedAccount` in Firestore under `users/{uid}`.
4. When the browser closes, the mobile app refetches `users/{uid}` from Firestore and shows the new account.

This means **no new OAuth credentials** to configure for mobile — it inherits whatever the web app already has approved.

## Backend contract

Mobile uses these existing Next.js routes (auth via `Authorization: Bearer <Firebase ID token>`):

- `GET /api/automation/link-me` / `POST` / `PATCH /:id` / `DELETE /:id`
- `GET /api/automation/auto-reply` / `POST` / `PATCH /:id` / `DELETE /:id`
- `POST /api/automation/test-run` — runs Link Me / Auto Reply now
- `POST /api/posts` — creates a post (requires existing endpoint; if your API differs, update `src/screens/CreatePostScreen.tsx`)

`getUserIdFromRequest` in the Next.js codebase already handles `Authorization: Bearer ...` tokens, so no backend changes are needed.

## Building for stores

```bash
npm install -g eas-cli
eas login
eas build:configure   # only first time
eas build --platform ios       # produces .ipa
eas build --platform android   # produces .aab
eas submit --platform ios
eas submit --platform android
```

You'll need:

- **Apple Developer account** ($99/yr) and an App Store Connect app record
- **Google Play Developer account** ($25 one-time) and a Play Console app record
- App icons at `mobile/assets/icon.png` (1024×1024) and `mobile/assets/adaptive-icon.png` (Android)

## Known limitations / TODO

- **Image / video upload** in Create Post sends the local URI to the backend; if your backend expects multipart upload to Cloudinary or Firebase Storage, swap the call in `CreatePostScreen.onSubmit` for an actual upload step before calling `POST /api/posts`.
- **Push notifications** are not wired yet. Add `expo-notifications` + your APNs/FCM creds when you want post-failure / scheduled-publish alerts.
- **Deep linking back to the app from OAuth** uses the `starlingpost://` scheme. For production you'll want to register Universal Links / App Links via the Apple / Google site association files served by your Next.js domain.
- **Background uploads** for large videos need `expo-task-manager` + `expo-background-fetch`. Not required for v1 but worth adding for IG/TikTok video posts.
- Disabled platforms (Instagram, Facebook, Threads, TikTok) appear with a "Soon" badge — flip them on by editing `src/lib/platformConfig.ts` once the backend has the corresponding scopes approved.
