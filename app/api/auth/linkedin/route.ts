import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue, adminAuth } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    const origin = `${url.protocol}//${url.host}`;

    if (error) {
      console.error('LinkedIn OAuth error param:', error);
      return NextResponse.redirect(
        `${origin}/dashboard?error=linkedin_oauth_denied`,
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${origin}/dashboard?error=linkedin_no_code`,
      );
    }

    const clientId = process.env.LINKEDIN_CLIENT_ID!;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
    const redirectUri =
      process.env.LINKEDIN_REDIRECT_URI ||
      'https://www.starlingpost.com/api/auth/linkedin/callback';

    const tokenRes = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error('LinkedIn token error:', tokenData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=linkedin_token_failed`,
      );
    }

    const accessToken = tokenData.access_token as string;

    // Fetch profile name
    const profileRes = await fetch(
      'https://api.linkedin.com/v2/me?projection=(localizedFirstName,localizedLastName)',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const profile = await profileRes.json();
    const profileName = `${profile.localizedFirstName || ''} ${
      profile.localizedLastName || ''
    }`.trim() || 'LinkedIn Profile';

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
            id: `linkedin_${userId}`,
            platform: 'linkedin',
            platformId: 'linkedin',
            accountName: profileName,
            accountLabel: profileName,
            accessToken,
            connectedAt: new Date(),
          }),
        },
        { merge: true },
      );

    const redirectUrl =
      `${origin}/dashboard?success=linkedin_connected` +
      `&linkedin_connected=true`;

    return NextResponse.redirect(redirectUrl);
  } catch (err: any) {
    console.error('LinkedIn callback error:', err);
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(
      `${origin}/dashboard?error=linkedin_callback_failed`,
    );
  }
}
