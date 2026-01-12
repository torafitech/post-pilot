// app/api/auth/youtube/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid'); // passed from client

  if (!uid) {
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
    state: uid, // IMPORTANT: carries Firebase uid
    prompt: 'consent',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}
