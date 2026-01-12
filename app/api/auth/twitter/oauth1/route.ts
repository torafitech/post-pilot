// app/api/auth/twitter/oauth1/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const uid = url.searchParams.get('uid');

    if (!uid) {
      return NextResponse.redirect(`${url.origin}/login?error=twitter_no_uid`);
    }

    const appKey = process.env.TWITTER_APP_KEY!;
    const appSecret = process.env.TWITTER_APP_SECRET!;
    const callbackUrl =
      process.env.TWITTER_OAUTH1_CALLBACK_URL ||
      `${url.origin}/api/auth/twitter/oauth1/callback`;

    const client = new TwitterApi({ appKey, appSecret });

    const { url: authUrl, oauth_token, oauth_token_secret } =
      await client.generateAuthLink(callbackUrl, { linkMode: 'authorize' });

    const res = NextResponse.redirect(authUrl);

    res.cookies.set('twitter_oauth_token', oauth_token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.cookies.set('twitter_oauth_token_secret', oauth_token_secret, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.cookies.set('twitter_uid', uid, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('Twitter OAuth1 start error:', error);
    return NextResponse.json(
      { error: 'Failed to start Twitter OAuth1' },
      { status: 500 },
    );
  }
}
