import { auth } from './firebase';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function publishPost(payload: {
  caption: string;
  platforms: string[];
  platformContent?: Record<string, unknown>;
}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/posts/publish`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, userId: auth.currentUser?.uid }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Publish failed');
  }
  return res.json();
}

export async function getConnections() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/connections`, { headers });
  if (!res.ok) throw new Error('Failed to load connections');
  return res.json();
}

export async function getScheduledPosts() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BASE_URL}/api/posts/sync`, { headers });
  if (!res.ok) throw new Error('Failed to load posts');
  return res.json();
}
