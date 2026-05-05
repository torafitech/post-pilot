// mobile/src/lib/api.ts
// Thin HTTP client that attaches the current Firebase user's ID token
// as a Bearer header. Points at the deployed Next.js backend.
import Constants from 'expo-constants';
import { auth } from './firebase';

const BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string) || 'https://www.starlingpost.com';

export class ApiError extends Error {
  constructor(public status: number, public body: any) {
    super(typeof body === 'string' ? body : body?.error || `HTTP ${status}`);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string>) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const text = await res.text();
  let body: any = text;
  try { body = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export const api = {
  get:    <T = any>(path: string) => request<T>(path),
  post:   <T = any>(path: string, body?: any) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch:  <T = any>(path: string, body?: any) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const API_BASE = BASE;
