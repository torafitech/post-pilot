// app/api/auth/threads/route.ts
// Initiates Meta Threads OAuth.
// REQUIRES env: NEXT_PUBLIC_THREADS_APP_ID, THREADS_REDIRECT_URI (optional)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const uid = url.searchParams.get('uid') || '';

  const clientId = process.env.NEXT_PUBLIC_THREADS_APP_ID;
  const redirectUri =
    process.env.THREADS_REDIRECT_URI ||
    `${origin}/api/auth/threads/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_THREADS_APP_ID' }, { status: 500 });
  }

  const authUrl = new URL('https://threads.net/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set(
    'scope',
    [
      'threads_basic',
      'threads_content_publish',
      'threads_manage_replies',
      'threads_read_replies',
    ].join(','),
  );
  if (uid) authUrl.searchParams.set('state', uid);

  return NextResponse.redirect(authUrl.toString());
}
