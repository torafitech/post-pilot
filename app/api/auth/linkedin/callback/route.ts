// app/api/auth/linkedin/callback/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    console.error('[LI CB] OAuth error from LinkedIn:', oauthError);
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_oauth_denied`);
  }

  const code = url.searchParams.get('code');
  if (!code) {
    console.error('[LI CB] No code in callback');
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_no_code`);
  }

  const userId = url.searchParams.get('state');
  if (!userId) {
    console.error('[LI CB] No state/uid in callback');
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_no_state`);
  }

  const clientId     = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri  = process.env.LINKEDIN_REDIRECT_URI || `${origin}/api/auth/linkedin/callback`;

  if (!clientId || !clientSecret) {
    console.error('[LI CB] Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET env vars');
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_not_configured`);
  }

  // 1) Exchange code for access token
  let accessToken: string;
  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('[LI CB] Token exchange failed:', tokenData);
      return NextResponse.redirect(`${origin}/dashboard?error=linkedin_token_failed`);
    }
    accessToken = tokenData.access_token;
    console.log('[LI CB] Token exchange OK');
  } catch (err: any) {
    console.error('[LI CB] Token exchange threw:', err.message);
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_token_failed`);
  }

  // 2) Fetch profile via OIDC userinfo endpoint
  let linkedinMemberId: string;
  let profileName: string;
  try {
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await profileRes.json();
    console.log('[LI CB] userinfo response:', JSON.stringify(profile));
    linkedinMemberId = profile.sub || profile.id || '';
    profileName =
      profile.name ||
      `${profile.given_name || ''} ${profile.family_name || ''}`.trim() ||
      'LinkedIn Profile';
    if (!linkedinMemberId) {
      console.error('[LI CB] No member ID in userinfo');
      return NextResponse.redirect(`${origin}/dashboard?error=linkedin_profile_failed`);
    }
  } catch (err: any) {
    console.error('[LI CB] userinfo fetch threw:', err.message);
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_profile_failed`);
  }

  const authorUrn = `urn:li:person:${linkedinMemberId}`;

  // 3) Save to Firestore
  try {
    await adminDb.collection('users').doc(userId).set(
      {
        connectedAccounts: adminFieldValue.arrayUnion({
          id:           `linkedin_${linkedinMemberId}`,
          platform:     'linkedin',
          platformId:   linkedinMemberId,
          authorUrn,
          accountName:  profileName,
          accountLabel: profileName,
          accessToken,
          connectedAt:  new Date(),
        }),
      },
      { merge: true },
    );
    console.log('[LI CB] Saved account for userId:', userId);
  } catch (err: any) {
    console.error('[LI CB] Firestore write failed:', err.message);
    return NextResponse.redirect(`${origin}/dashboard?error=linkedin_save_failed`);
  }

  return NextResponse.redirect(`${origin}/dashboard?success=linkedin_connected`);
}
