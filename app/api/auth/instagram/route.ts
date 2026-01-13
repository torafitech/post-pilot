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

  // uid is sent from Dashboard: /api/auth/instagram?uid=<firebase-uid>
  const uid = url.searchParams.get('uid') || '';

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set(
    'scope',
    [
      'instagram_basic',
      'instagram_content_publish',
      'pages_read_engagement',
      'business_management',
      'pages_show_list',
    ].join(','),
  );

  // Use state to carry uid
  if (uid) {
    authUrl.searchParams.set('state', uid);
  }

  return NextResponse.redirect(authUrl.toString());
}
