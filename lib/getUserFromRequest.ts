// lib/getUserFromRequest.ts
import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

export async function getUserIdFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const [, token] = authHeader.split(' '); // "Bearer <token>"

  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (e) {
    console.error('verifyIdToken error', e);
    return null;
  }
}
