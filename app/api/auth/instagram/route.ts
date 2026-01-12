// app/api/auth/instagram/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI ||
    `${origin}/api/auth/instagram/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'Missing NEXT_PUBLIC_META_APP_ID' },
      { status: 500 },
    );
  }

  // Basic Instagram OAuth (for an Instagram app configured with Facebook Login)
  const authUrl = new URL('https://api.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'user_profile,user_media');
  authUrl.searchParams.set('response_type', 'code');

  return NextResponse.redirect(authUrl.toString());
}
