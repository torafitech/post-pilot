// app/api/auth/linkedin/route.ts
// Initiates LinkedIn OAuth — redirects the browser to LinkedIn's authorization page.
// The callback is handled by /api/auth/linkedin/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid');
  const origin = `${url.protocol}//${url.host}`;

  if (!uid) {
    console.warn('LinkedIn auth initiation: missing uid');
    return NextResponse.redirect(`${origin}/login?error=missing_uid`);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    console.error('LinkedIn auth initiation: LINKEDIN_CLIENT_ID not set');
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_not_configured`);
  }

  const redirectUri =
    process.env.LINKEDIN_REDIRECT_URI ||
    `${origin}/api/auth/linkedin/callback`;

  // r_liteprofile + r_emailaddress = standard LinkedIn OAuth (v2/me endpoint)
  // w_member_social = post + comment (Link Me / Auto Reply)
  const scopes = [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social',
  ];

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: uid,
    scope: scopes.join(' '),
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  console.log('LinkedIn auth redirecting to authorization URL for uid:', uid);

  return NextResponse.redirect(authUrl);
}
