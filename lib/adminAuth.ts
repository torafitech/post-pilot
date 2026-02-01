// lib/adminAuth.ts
import { adminAuth } from '@/lib/firebaseAdmin';
import { NextRequest } from 'next/server';

export async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const idToken = authHeader.split(' ')[1];
  const decoded = await adminAuth.verifyIdToken(idToken);

  if (!decoded.isAdmin) {
    throw new Error('Forbidden');
  }

  return decoded;
}
