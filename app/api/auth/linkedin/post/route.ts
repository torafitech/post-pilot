// app/api/auth/linkedin/post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, text } = body as {
      userId: string;
      text: string;
    };

    if (!userId || !text) {
      return NextResponse.json(
        { error: 'Missing userId or text' },
        { status: 400 },
      );
    }

    // 1) Load LinkedIn account for this user
    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    const userData = userSnap.data() || {};
    const connectedAccounts = (userData.connectedAccounts || []) as any[];
    const linkedinAccount = connectedAccounts.find(
      (acc) => acc.platform === 'linkedin',
    );

    if (!linkedinAccount?.accessToken || !linkedinAccount?.authorUrn) {
      return NextResponse.json(
        { error: 'LinkedIn account not connected' },
        { status: 400 },
      );
    }

    const accessToken = linkedinAccount.accessToken as string;
    const authorUrn = linkedinAccount.authorUrn as string;

    // 2) Create a simple text post using LinkedIn Posts API (REST)
    // Requires correct Marketing Developer Program + permissions on your app. [web:87][web:91]
    const postRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn, // e.g. urn:li:person:xxxx or org
        commentary: text,
        visibility: 'PUBLIC',
        lifecycleState: 'PUBLISHED',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        isReshareDisabledByAuthor: false,
      }),
    });

    const postJson = await postRes.json();

    if (!postRes.ok) {
      console.error('LinkedIn post error:', postJson);
      return NextResponse.json(
        { error: 'Failed to publish to LinkedIn', details: postJson },
        { status: 500 },
      );
    }

    // LinkedIn returns a URN like "urn:li:ugcPost:123..." or "urn:li:share:..."
    const postUrn = postJson.id || postJson.urn || postJson.entityUrn;

    return NextResponse.json({
      ok: true,
      linkedinPostUrn: postUrn,
    });
  } catch (err: any) {
    console.error('LinkedIn post route error:', err);
    return NextResponse.json(
      { error: 'LinkedIn post route failed', details: err.message },
      { status: 500 },
    );
  }
}
