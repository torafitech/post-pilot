import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { adminDb, adminFieldValue, adminAuth } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const origin = `${url.protocol}//${url.host}`;

    if (error) {
      console.error('Twitter OAuth error param:', error);
      return NextResponse.redirect(
        `${origin}/dashboard?error=twitter_oauth_denied`,
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${origin}/dashboard?error=twitter_no_code_or_state`,
      );
    }

    const storedState = request.cookies.get('twitter_oauth_state')?.value;
    const codeVerifier = request.cookies.get('twitter_code_verifier')?.value;

    if (!storedState || storedState !== state) {
      console.error('Twitter OAuth state mismatch', { state, storedState });
      return NextResponse.redirect(
        `${origin}/dashboard?error=twitter_state_mismatch`,
      );
    }

    if (!codeVerifier) {
      console.error('Missing codeVerifier cookie for state', state);
      return NextResponse.redirect(
        `${origin}/dashboard?error=twitter_missing_code_verifier`,
      );
    }

    const clientId = process.env.TWITTER_CLIENT_ID!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET!;
    const redirectUri =
      process.env.TWITTER_REDIRECT_URI ||
      'https://www.starlingpost.com/api/auth/twitter/callback';

    const twitterClient = new TwitterApi({ clientId, clientSecret });

    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri,
    });

    const me = await loggedClient.v2.me();

    // Get authenticated user ID from Firebase session
    const sessionCookie = request.cookies.get('__session')?.value;
    let userId = 'demo_user'; // fallback

    if (sessionCookie) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        userId = decodedClaims.uid;
        console.log('✅ Got userId from session cookie:', userId);
      } catch (err) {
        console.log('⚠️ Could not verify session cookie, using demo_user');
      }
    }

    // Save to users/{userId}/connectedAccounts array
    await adminDb
      .collection('users')
      .doc(userId)
      .set(
        {
          connectedAccounts: adminFieldValue.arrayUnion({
            id: `twitter_${me.data.id}`,
            platform: 'twitter',
            platformId: me.data.id,
            accountName: me.data.username,
            accountLabel: me.data.name,
            accessToken,
            refreshToken: refreshToken || null,
            expiresIn: expiresIn || null,
            connectedAt: new Date(),
          }),
        },
        { merge: true },
      );

    const redirectUrl =
      `${origin}/dashboard?success=twitter_connected` +
      `&twitter_connected=true`;

    const res = NextResponse.redirect(redirectUrl);

    res.cookies.set('twitter_oauth_state', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    res.cookies.set('twitter_code_verifier', '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return res;
  } catch (err: any) {
    console.error('Twitter callback error:', err);
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(
      `${origin}/dashboard?error=twitter_callback_failed`,
    );
  }
}
