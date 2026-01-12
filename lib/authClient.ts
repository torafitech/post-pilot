// lib/authClient.ts
'use client';

import { auth } from '@/lib/firebase';

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const currentUser = auth.currentUser;
  const token = currentUser ? await currentUser.getIdToken() : null;

  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, { ...init, headers });
}
