// app/api/auth/linkedin/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;

    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI ||
      `${origin}/api/auth/linkedin/callback`;

    if (!clientId) {
      console.error('Missing LINKEDIN_CLIENT_ID env var');
      return NextResponse.json(
        { error: 'LinkedIn env vars missing' },
        { status: 500 },
      );
    }

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(7);

    // Build LinkedIn OAuth URL
    const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('scope', 'openid profile email');

    // Store state in httpOnly cookie
    const res = NextResponse.redirect(authUrl.toString());
    res.cookies.set('linkedin_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    });

    console.log('🔀 Redirecting to LinkedIn OAuth:', authUrl.toString());
    return res;
  } catch (error: any) {
    console.error('LinkedIn OAuth start error:', error);
    return NextResponse.json(
      { error: 'Failed to start LinkedIn OAuth' },
      { status: 500 },
    );
  }
}
