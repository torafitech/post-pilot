import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    const redirectUri =
      process.env.TWITTER_REDIRECT_URI ||
      'http://localhost:3000/api/auth/twitter/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Twitter env vars missing' },
        { status: 500 },
      );
    }

    const twitterClient = new TwitterApi({
      clientId,
      clientSecret,
    });

    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(
      redirectUri,
      {
        scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
      },
    );

    const res = NextResponse.redirect(url);

    // Store state and codeVerifier in httpOnly cookies
    res.cookies.set('twitter_oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    res.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res;
  } catch (error: any) {
    console.error('Twitter OAuth start error:', error);
    return NextResponse.json(
      { error: 'Failed to start Twitter OAuth' },
      { status: 500 },
    );
  }
}
