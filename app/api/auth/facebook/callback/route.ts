// app/api/auth/facebook/callback/route.ts
// Exchanges code → user token → long-lived token, then stores the
// FIRST managed Page along with its page-specific access token.
// Page tokens (returned by /me/accounts) are long-lived already and
// scoped to the Page.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  try {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const stateUid = url.searchParams.get('state');

    if (error) return NextResponse.redirect(`${origin}/dashboard?error=facebook_oauth_denied`);
    if (!code) return NextResponse.redirect(`${origin}/dashboard?error=facebook_no_code`);
    if (!stateUid) return NextResponse.redirect(`${origin}/dashboard?error=facebook_no_user`);

    const clientId = process.env.NEXT_PUBLIC_META_APP_ID!;
    const clientSecret = process.env.META_APP_SECRET!;
    const redirectUri =
      process.env.FACEBOOK_REDIRECT_URI ||
      `${origin}/api/auth/facebook/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/dashboard?error=facebook_config_missing`);
    }

    // Exchange code → short-lived user token
    const tokenRes = await fetch(`${GRAPH}/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return NextResponse.redirect(`${origin}/dashboard?error=facebook_token_failed`);
    }
    let userToken: string = tokenData.access_token;

    // Upgrade to long-lived user token
    const longRes = await fetch(
      `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
        `&client_id=${clientId}&client_secret=${clientSecret}` +
        `&fb_exchange_token=${userToken}`,
    );
    const longData = await longRes.json();
    if (longRes.ok && longData.access_token) userToken = longData.access_token;

    // List managed Pages with their per-page tokens
    const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${userToken}`);
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok || !pagesData.data?.length) {
      return NextResponse.redirect(`${origin}/dashboard?error=facebook_no_pages`);
    }
    const page = pagesData.data[0];

    await adminDb.collection('users').doc(stateUid).set(
      {
        connectedAccounts: adminFieldValue.arrayUnion({
          id: `facebook_${page.id}`,
          platform: 'facebook',
          platformId: page.id,
          accountName: page.name || 'Facebook Page',
          accountLabel: page.name || 'Facebook Page',
          accessToken: page.access_token, // page-scoped, long-lived
          connectedAt: new Date(),
        }),
      },
      { merge: true },
    );

    return NextResponse.redirect(`${origin}/dashboard?success=facebook_connected`);
  } catch (err: any) {
    console.error('Facebook callback error:', err);
    return NextResponse.redirect(`${origin}/dashboard?error=facebook_callback_failed`);
  }
}
