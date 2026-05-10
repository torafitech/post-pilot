// app/api/auth/linkedin/post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, text, imageUrl } = body as {
      userId: string;
      text: string;
      imageUrl?: string;
    };

    if (!userId || !text) {
      return NextResponse.json(
        { error: 'Missing userId or text' },
        { status: 400 },
      );
    }

    const userSnap = await adminDb.collection('users').doc(userId).get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    // If image is provided, upload it first then attach
    let imageAsset: string | null = null;
    if (imageUrl) {
      try {
        imageAsset = await uploadLinkedInImage(accessToken, authorUrn, imageUrl);
      } catch (err: any) {
        console.warn('LinkedIn image upload failed, posting text-only:', err.message);
      }
    }

    const postBody: any = {
      author: authorUrn,
      commentary: text,
      visibility: 'PUBLIC',
      lifecycleState: 'PUBLISHED',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      isReshareDisabledByAuthor: false,
    };

    if (imageAsset) {
      postBody.content = {
        media: {
          id: imageAsset,
        },
      };
    }

    const postRes = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202501',
      },
      body: JSON.stringify(postBody),
    });

    const postJson = await postRes.json().catch(() => ({}));

    if (!postRes.ok) {
      console.error('LinkedIn post error:', postJson);
      return NextResponse.json(
        { error: 'Failed to publish to LinkedIn', details: postJson },
        { status: 500 },
      );
    }

    const postUrn = postJson.id || postJson.urn || postJson.entityUrn;

    return NextResponse.json({ ok: true, linkedinPostUrn: postUrn });
  } catch (err: any) {
    console.error('LinkedIn post route error:', err);
    return NextResponse.json(
      { error: 'LinkedIn post route failed', details: err.message },
      { status: 500 },
    );
  }
}

async function uploadLinkedInImage(
  accessToken: string,
  authorUrn: string,
  imageUrl: string,
): Promise<string> {
  // Step 1: Initialize upload
  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202501',
    },
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: authorUrn,
      },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`LinkedIn image init failed: ${err}`);
  }

  const initData = await initRes.json();
  const uploadUrl: string = initData.value?.uploadUrl;
  const imageUrn: string = initData.value?.image;

  if (!uploadUrl || !imageUrn) {
    throw new Error('LinkedIn did not return upload URL');
  }

  // Step 2: Download image from Cloudinary
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error('Failed to download image for LinkedIn');

  const imgBuffer = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';

  // Step 3: Upload binary to LinkedIn
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': contentType,
    },
    body: imgBuffer,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`LinkedIn image upload failed: ${err}`);
  }

  return imageUrn;
}
