// app/api/auth/threads/callback/route.ts
// Exchanges code for short-lived token, then upgrades to a long-lived
// (~60d) token; stores threads user id + name.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

const THREADS_API = 'https://graph.threads.net';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  try {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const stateUid = url.searchParams.get('state');

    if (error) return NextResponse.redirect(`${origin}/dashboard?error=threads_oauth_denied`);
    if (!code) return NextResponse.redirect(`${origin}/dashboard?error=threads_no_code`);
    if (!stateUid) return NextResponse.redirect(`${origin}/dashboard?error=threads_no_user`);

    const clientId = process.env.NEXT_PUBLIC_THREADS_APP_ID!;
    const clientSecret = process.env.THREADS_APP_SECRET!;
    const redirectUri =
      process.env.THREADS_REDIRECT_URI ||
      `${origin}/api/auth/threads/callback`;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/dashboard?error=threads_config_missing`);
    }

    // Short-lived token
    const tokenRes = await fetch(`${THREADS_API}/oauth/access_token`, {
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
      return NextResponse.redirect(`${origin}/dashboard?error=threads_token_failed`);
    }
    let accessToken: string = tokenData.access_token;
    const userIdFromToken: string = String(tokenData.user_id || '');

    // Long-lived token (~60 days)
    const longRes = await fetch(
      `${THREADS_API}/access_token?grant_type=th_exchange_token` +
        `&client_secret=${clientSecret}&access_token=${accessToken}`,
    );
    const longData = await longRes.json();
    if (longRes.ok && longData.access_token) accessToken = longData.access_token;

    // Fetch profile
    const meRes = await fetch(
      `${THREADS_API}/v1.0/me?fields=id,username,name&access_token=${accessToken}`,
    );
    const meData = await meRes.json();
    const platformId = String(meData.id || userIdFromToken || '');
    const accountName = meData.username || meData.name || 'Threads';

    if (!platformId) {
      return NextResponse.redirect(`${origin}/dashboard?error=threads_user_failed`);
    }

    await adminDb.collection('users').doc(stateUid).set(
      {
        connectedAccounts: adminFieldValue.arrayUnion({
          id: `threads_${platformId}`,
          platform: 'threads',
          platformId,
          accountName,
          accountLabel: accountName,
          accessToken,
          connectedAt: new Date(),
        }),
      },
      { merge: true },
    );

    return NextResponse.redirect(`${origin}/dashboard?success=threads_connected`);
  } catch (err: any) {
    console.error('Threads callback error:', err);
    return NextResponse.redirect(`${origin}/dashboard?error=threads_callback_failed`);
  }
}
