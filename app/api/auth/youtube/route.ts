// app/api/auth/youtube/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');

  console.log('YouTube auth START', {
    url: request.url,
    uid,
    origin: url.origin,
    clientId: process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID,
    redirectEnv: process.env.YOUTUBE_REDIRECT_URI,
  });

  if (!uid) {
    console.warn('YouTube auth missing uid');
    return NextResponse.redirect(`${url.origin}/login?error=missing_uid`);
  }

  const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!;
  const redirectUri =
    process.env.YOUTUBE_REDIRECT_URI ||
    `${url.origin}/api/auth/youtube/callback`;

  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube',
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    scope: scopes.join(' '),
    include_granted_scopes: 'true',
    state: uid,
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log('YouTube auth redirecting to', authUrl);

  return NextResponse.redirect(authUrl);
}
