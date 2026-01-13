// app/api/auth/instagram/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

const GRAPH_API_BASE =
  process.env.NEXT_PUBLIC_GRAPH_API_URL || 'https://graph.facebook.com/v18.0';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  try {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const stateUid = url.searchParams.get('state'); // firebase uid from /api/auth/instagram

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

    if (!stateUid) {
      console.error('Missing uid in OAuth state');
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_no_user`,
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

    // 1) Exchange code for short-lived token
    console.log('🔄 Exchanging Instagram auth code for token...');
    const tokenRes = await fetch(`${GRAPH_API_BASE}/oauth/access_token`, {
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
      console.error('Instagram token exchange failed:', tokenData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_token_failed`,
      );
    }

    let accessToken: string = tokenData.access_token;
    console.log('✅ Got short-lived token');

    // 2) Convert to long-lived token (best effort)
    console.log('🔄 Converting to long-lived token...');
    const longLivedRes = await fetch(
      `${GRAPH_API_BASE}/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${clientId}` +
        `&client_secret=${clientSecret}` +
        `&access_token=${accessToken}`,
    );

    const longLivedData = await longLivedRes.json();
    if (longLivedRes.ok && longLivedData.access_token) {
      accessToken = longLivedData.access_token;
      console.log('✅ Got long-lived token');
    } else {
      console.log('⚠️ Could not get long-lived token, using short-lived');
    }

    // 3) Get user’s Pages
    console.log('🔄 Fetching user pages...');
    const pagesRes = await fetch(
      `${GRAPH_API_BASE}/me/accounts?access_token=${accessToken}`,
    );
    const pagesData = await pagesRes.json();

    if (!pagesRes.ok || !pagesData.data || !pagesData.data.length) {
      console.error('Failed to get user pages:', pagesData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_pages_failed`,
      );
    }

    // For now use first page
    const page = pagesData.data[0];
    const pageId: string = page.id;
    console.log('✅ Got page:', pageId);

    // 4) From Page, get Instagram Business Account
    console.log('🔄 Fetching Instagram Business Account from page...');
    const igRes = await fetch(
      `${GRAPH_API_BASE}/${pageId}` +
        `?fields=instagram_business_account{name,username,id}` +
        `&access_token=${accessToken}`,
    );
    const igData = await igRes.json();

    if (
      !igRes.ok ||
      !igData.instagram_business_account ||
      !igData.instagram_business_account.id
    ) {
      console.error('Failed to get Instagram business account:', igData);
      return NextResponse.redirect(
        `${origin}/dashboard?error=instagram_business_failed`,
      );
    }

    const igBusiness = igData.instagram_business_account;
    const igBusinessAccountId: string = igBusiness.id;
    const igUsername: string = igBusiness.username || '';
    const igName: string = igBusiness.name || igUsername;

    console.log('✅ Got IG Business account:', igBusinessAccountId, igUsername);

    // 5) Save connection in Firestore under users/{uid}
    const userIdToUse = stateUid;

    console.log(
      '💾 Saving Instagram connection to Firestore for uid:',
      userIdToUse,
    );
    await adminDb
      .collection('users')
      .doc(userIdToUse)
      .set(
        {
          connectedAccounts: adminFieldValue.arrayUnion({
            id: `instagram_${igBusinessAccountId}`,
            platform: 'instagram',
            platformId: igBusinessAccountId, // used for /{id}/media
            accountName: igUsername,
            accountLabel: igName,
            pageId, // FB Page ID we used
            accessToken,
            connectedAt: new Date(),
          }),
        },
        { merge: true },
      );

    console.log('✅ Instagram account connected successfully');

    return NextResponse.redirect(
      `${origin}/dashboard?success=instagram_connected&instagram_connected=true`,
    );
  } catch (err: any) {
    console.error('Instagram callback error:', err);
    return NextResponse.redirect(
      `${origin}/dashboard?error=instagram_callback_failed`,
    );
  }
}
