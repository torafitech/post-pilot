// app/api/auth/instagram/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue, adminAuth } from '@/lib/firebaseAdmin';

const GRAPH_API_BASE =
  process.env.NEXT_PUBLIC_GRAPH_API_URL || 'https://graph.facebook.com/v18.0';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('Instagram OAuth error:', error);
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_oauth_denied`,
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_no_code`,
      );
    }

    const clientId = process.env.NEXT_PUBLIC_META_APP_ID!;
    const clientSecret = process.env.META_APP_SECRET!;
    const redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI ||
      `${origin}/api/auth/instagram/callback`;

    if (!clientId || !clientSecret) {
      console.error('Missing Instagram env vars');
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_config_missing`,
      );
    }

    // Step 1: Exchange code for short-lived access token
    console.log('🔄 Exchanging Instagram auth code for token...');
    const tokenRes = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code: code,
        }).toString(),
      }
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Instagram token exchange failed:', tokenData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_token_failed`,
      );
    }

    let accessToken = tokenData.access_token;
    console.log('✅ Got short-lived token');

    // Step 2: Exchange short-lived token for long-lived token
    console.log('🔄 Converting to long-lived token...');
    const longLivedRes = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&access_token=${accessToken}`
    );

    const longLivedData = await longLivedRes.json();

    if (longLivedData.access_token) {
      accessToken = longLivedData.access_token;
      console.log('✅ Got long-lived token');
    }

    // Step 3: Get Instagram Business Account info
    console.log('🔄 Fetching Instagram Business Account...');
    const meRes = await fetch(
      `${GRAPH_API_BASE}/me?fields=id,name,username&access_token=${accessToken}`
    );

    const meData = await meRes.json();

    if (!meRes.ok || !meData.id) {
      console.error('Failed to get user info:', meData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_me_failed`,
      );
    }

    const userId = 'demo_user'; // TODO: Use real authenticated user

    // Get authenticated user ID from Firebase session
    const sessionCookie = request.cookies.get('__session')?.value;

    if (sessionCookie) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
        const actualUserId = decodedClaims.uid;
        console.log('✅ Got userId from session cookie:', actualUserId);
        // Use actual user ID instead of demo_user
        const userIdToUse = actualUserId;

        console.log('💾 Saving Instagram connection to Firestore...');
        await adminDb
          .collection('users')
          .doc(userIdToUse)
          .set(
            {
              connectedAccounts: adminFieldValue.arrayUnion({
                id: `instagram_${meData.id}`,
                platform: 'instagram',
                platformId: meData.id,
                accountName: meData.username,
                accountLabel: meData.name,
                accessToken: accessToken,
                connectedAt: new Date(),
              }),
            },
            { merge: true }
          );

        console.log('✅ Instagram account connected successfully');

        return NextResponse.redirect(
          `${origin}/dashboard?success=instagram_connected&instagram_connected=true`
        );
      } catch (sessionErr) {
        console.log('⚠️ Could not verify session cookie, using demo_user as fallback');
      }
    }

    console.log('💾 Saving Instagram connection to Firestore...');
    await adminDb
      .collection('users')
      .doc(userId)
      .set(
        {
          connectedAccounts: adminFieldValue.arrayUnion({
            id: `instagram_${meData.id}`,
            platform: 'instagram',
            platformId: meData.id,
            accountName: meData.username,
            accountLabel: meData.name,
            accessToken: accessToken,
            connectedAt: new Date(),
          }),
        },
        { merge: true }
      );

    console.log('✅ Instagram account connected successfully');

    return NextResponse.redirect(
      `${origin}/dashboard?success=instagram_connected&instagram_connected=true`
    );
  } catch (err: any) {
    console.error('Instagram callback error:', err);
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    return NextResponse.redirect(
      `${origin}/dashboard?error=instagram_callback_failed`,
    );
  }
}
