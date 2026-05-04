// app/api/auth/tiktok/route.ts
// Initiates TikTok OAuth (Login Kit v2).
// REQUIRES env: NEXT_PUBLIC_TIKTOK_CLIENT_KEY, TIKTOK_REDIRECT_URI (optional)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const uid = url.searchParams.get('uid') || '';

  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
  const redirectUri =
    process.env.TIKTOK_REDIRECT_URI ||
    `${origin}/api/auth/tiktok/callback`;

  if (!clientKey) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_TIKTOK_CLIENT_KEY' }, { status: 500 });
  }

  const csrf = Math.random().toString(36).slice(2);
  const state = uid ? `${uid}.${csrf}` : csrf;

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', clientKey);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set(
    'scope',
    [
      'user.info.basic',
      'user.info.profile',
      'video.list',
      'video.upload',
      'video.publish',
      'comment.list',
    ].join(','),
  );
  authUrl.searchParams.set('state', state);

  return NextResponse.redirect(authUrl.toString());
}
