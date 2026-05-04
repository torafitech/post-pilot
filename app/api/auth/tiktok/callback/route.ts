// app/api/auth/tiktok/callback/route.ts
// Exchanges authorization code for access + refresh tokens, fetches
// the user's open_id and display name, and stores them.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

const TIKTOK_API = 'https://open.tiktokapis.com';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  try {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const state = url.searchParams.get('state') || '';
    const stateUid = state.split('.')[0];

    if (error) return NextResponse.redirect(`${origin}/dashboard?error=tiktok_oauth_denied`);
    if (!code) return NextResponse.redirect(`${origin}/dashboard?error=tiktok_no_code`);
    if (!stateUid) return NextResponse.redirect(`${origin}/dashboard?error=tiktok_no_user`);

    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
    const redirectUri =
      process.env.TIKTOK_REDIRECT_URI ||
      `${origin}/api/auth/tiktok/callback`;

    if (!clientKey || !clientSecret) {
      return NextResponse.redirect(`${origin}/dashboard?error=tiktok_config_missing`);
    }

    // Exchange code for token
    const tokenRes = await fetch(`${TIKTOK_API}/v2/oauth/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('TikTok token error:', tokenData);
      return NextResponse.redirect(`${origin}/dashboard?error=tiktok_token_failed`);
    }

    const accessToken: string = tokenData.access_token;
    const refreshToken: string = tokenData.refresh_token || '';
    const openId: string = tokenData.open_id || '';
    const expiresIn: number = tokenData.expires_in || 0;

    // Fetch profile (display name, avatar)
    const meRes = await fetch(`${TIKTOK_API}/v2/user/info/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: ['open_id', 'display_name', 'avatar_url'] }),
    });
    const meData = await meRes.json().catch(() => ({}));
    const user = meData?.data?.user || {};
    const accountName = user.display_name || 'TikTok';

    if (!openId && !user.open_id) {
      return NextResponse.redirect(`${origin}/dashboard?error=tiktok_user_failed`);
    }

    await adminDb.collection('users').doc(stateUid).set(
      {
        connectedAccounts: adminFieldValue.arrayUnion({
          id: `tiktok_${openId || user.open_id}`,
          platform: 'tiktok',
          platformId: openId || user.open_id,
          accountName,
          accountLabel: accountName,
          accessToken,
          refreshToken,
          tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
          connectedAt: new Date(),
        }),
      },
      { merge: true },
    );

    return NextResponse.redirect(`${origin}/dashboard?success=tiktok_connected`);
  } catch (err: any) {
    console.error('TikTok callback error:', err);
    return NextResponse.redirect(`${origin}/dashboard?error=tiktok_callback_failed`);
  }
}
