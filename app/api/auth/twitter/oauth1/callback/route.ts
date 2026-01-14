// app/api/auth/twitter/oauth1/callback/route.ts
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const oauth_token = url.searchParams.get('oauth_token');
    const oauth_verifier = url.searchParams.get('oauth_verifier');

    const origin = `${url.protocol}//${url.host}`;

    if (!oauth_token || !oauth_verifier) {
      return NextResponse.redirect(
        `${origin}/dashboard?error=twitter_oauth1_missing_params`,
      );
    }

    const storedToken = request.cookies.get('twitter_oauth_token')?.value;
    const storedTokenSecret =
      request.cookies.get('twitter_oauth_token_secret')?.value;
    const uid = request.cookies.get('twitter_uid')?.value;

    if (!uid) {
      console.error('Missing twitter_uid cookie');
      return NextResponse.redirect(
        `${origin}/login?error=twitter_no_uid`,
      );
    }

    if (!storedToken || !storedTokenSecret || storedToken !== oauth_token) {
      console.error('Twitter OAuth1 token mismatch');
      return NextResponse.redirect(
        `${origin}/dashboard?error=twitter_oauth1_token_mismatch`,
      );
    }

    const appKey = process.env.TWITTER_APP_KEY!;
    const appSecret = process.env.TWITTER_APP_SECRET!;

    const tempClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken: storedToken,
      accessSecret: storedTokenSecret,
    });

    const {
      client: loggedClient,
      accessToken,
      accessSecret,
    } = await tempClient.login(oauth_verifier);

    const me = await loggedClient.v2.me();


    // app/api/auth/twitter/oauth1/callback/route.ts (or similar)
    const connection = {
      id: `twitter_${uid}`,
      platform: 'twitter',
      platformId: me.data.id,   // from Twitter API
      accountName: me.data.username,
      accountLabel: me.data.name,
      oauthToken: accessToken,
      oauthTokenSecret: accessSecret,
      connectedAt: new Date(),
    };


    await adminDb
      .collection('users')
      .doc(uid)
      .set(
        { connectedAccounts: adminFieldValue.arrayUnion(connection) },
        { merge: true },
      );

    const redirectUrl =
      `${origin}/dashboard?success=twitter_oauth1_connected&twitter_oauth1_connected=true`;

    const res = NextResponse.redirect(redirectUrl);

    // Clear temp cookies
    for (const name of [
      'twitter_oauth_token',
      'twitter_oauth_token_secret',
      'twitter_uid',
    ]) {
      res.cookies.set(name, '', {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }

    return res;
  } catch (err) {
    console.error('Twitter OAuth1 callback error:', err);
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(
      `${origin}/dashboard?error=twitter_oauth1_callback_failed`,
    );
  }
}
