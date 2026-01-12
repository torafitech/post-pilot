// lib/firebaseAdmin.ts
import * as admin from 'firebase-admin';

declare global {
  // Allow global var in dev to avoid re‑init error
  // eslint-disable-next-line no-var
  var _firebaseAdminApp: admin.app.App | undefined;
}

if (!global._firebaseAdminApp) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase admin environment variables');
  }

  global._firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export const adminApp = global._firebaseAdminApp;
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminFieldValue = admin.firestore.FieldValue;
