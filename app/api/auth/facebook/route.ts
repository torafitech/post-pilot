// app/api/auth/facebook/route.ts
// Initiates Facebook OAuth for Page management.
// REQUIRES env: NEXT_PUBLIC_META_APP_ID, FACEBOOK_REDIRECT_URI (optional)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;
  const uid = url.searchParams.get('uid') || '';

  const clientId = process.env.NEXT_PUBLIC_META_APP_ID;
  const redirectUri =
    process.env.FACEBOOK_REDIRECT_URI ||
    `${origin}/api/auth/facebook/callback`;

  if (!clientId) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_META_APP_ID' }, { status: 500 });
  }

  const authUrl = new URL(
    `https://www.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}/dialog/oauth`,
  );
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set(
    'scope',
    [
      'pages_show_list',
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_manage_engagement',
      'pages_read_user_content',
    ].join(','),
  );
  if (uid) authUrl.searchParams.set('state', uid);

  return NextResponse.redirect(authUrl.toString());
}
