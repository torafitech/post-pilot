import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { NextRequest, NextResponse } from 'next/server';

// Main publish endpoint that posts to all selected platforms
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Allow internal cron calls with a secret + explicit userId in body
    const internalSecret = request.headers.get('x-internal-secret');
    const isInternalCall =
      internalSecret &&
      internalSecret === process.env.INTERNAL_CRON_SECRET &&
      body.userId;

    let userId: string | null = null;

    if (isInternalCall) {
      userId = body.userId as string;
    } else {
      userId = await getUserIdFromRequest(request);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, platforms, caption, imageUrl, videoUrl, platformContent } =
      body as {
        postId: string;
        platforms: string[];
        caption: string;
        imageUrl?: string | null;
        videoUrl?: string | null;
        platformContent?: any;
        userId?: string;
      };

    if (!postId || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing postId or platforms' },
        { status: 400 },
      );
    }

    const results = {
      twitter: null as any,
      youtube: null as any,
      linkedin: null as any,
      errors: [] as any[],
    };

    const { autoPinComment, pinnedCommentText } = body as {
      autoPinComment?: boolean;
      pinnedCommentText?: string;
    };

    // -----------------------
    // Publish to Twitter (X)
    // -----------------------
    if (platforms.includes('twitter')) {
      try {
        console.log('Publishing to Twitter...');
        const twitterCaption =
          platformContent?.twitter?.caption?.trim() || caption;

        // Prefer video for Twitter if present; else image
        const twitterMediaUrl = (videoUrl || imageUrl) || undefined;
        const twitterMediaType =
          videoUrl ? 'video' : imageUrl ? 'image' : undefined;

        const twitterResult = await publishToTwitter(
          userId,
          twitterCaption,
          twitterMediaUrl,
          twitterMediaType,
        );
        results.twitter = twitterResult;
      } catch (error: any) {
        console.error('Twitter publish error:', error);
        results.errors.push({ platform: 'twitter', error: error.message });
      }
    }

    // -----------------------
    // Publish to YouTube
    // -----------------------
    if (platforms.includes('youtube')) {
      try {
        console.log('Publishing to YouTube...');
        const ytTitle =
          platformContent?.youtube?.title?.trim() || caption || 'Untitled';
        const ytDescription =
          platformContent?.youtube?.description?.trim() || caption;

        const youtubeResult = await publishToYoutube(
          userId,
          ytTitle,
          ytDescription,
          videoUrl || undefined,
        );
        results.youtube = youtubeResult;
      } catch (error: any) {
        console.error('YouTube publish error:', error);
        results.errors.push({ platform: 'youtube', error: error.message });
      }
    }

    // -----------------------
    // Publish to LinkedIn
    // -----------------------
    if (platforms.includes('linkedin')) {
      try {
        console.log('Publishing to LinkedIn...');
        const linkedinCaption =
          platformContent?.linkedin?.caption?.trim() || caption;
        const linkedinMediaUrl = imageUrl || undefined;

        const linkedinResult = await publishToLinkedin(
          userId,
          linkedinCaption,
          linkedinMediaUrl,
        );
        results.linkedin = linkedinResult;
      } catch (error: any) {
        console.error('LinkedIn publish error:', error);
        results.errors.push({ platform: 'linkedin', error: error.message });
      }
    }

    // -----------------------
    // Auto-pin first comment
    // -----------------------
    if (autoPinComment && pinnedCommentText?.trim()) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com';
      if (results.youtube?.id) {
        try {
          await fetch(`${baseUrl}/api/auth/youtube/pin-comment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': process.env.INTERNAL_CRON_SECRET || '',
            },
            body: JSON.stringify({
              userId,
              videoId: results.youtube.id,
              commentText: pinnedCommentText.trim(),
            }),
          });
        } catch (err: any) {
          console.warn('Auto-pin YouTube comment failed:', err.message);
        }
      }
    }

    // Update post status in Firestore
    const platformPostIds: any = {};
    if (results.twitter?.id) platformPostIds.twitter = results.twitter.id;
    if (results.youtube?.id) platformPostIds.youtube = results.youtube.id;
    if (results.linkedin?.id) platformPostIds.linkedin = results.linkedin.id;
    await adminDb.collection('posts').doc(postId).update({
      status:
        results.errors.length === 0 ? 'published' : 'partially_published',
      platformPostIds,
      publishedAt: new Date(),
      errors: results.errors,
    });
    // 🔹 Also store per‑platform posts under the user for metrics sync
    const userPostsRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('posts');

    const basePostData = {
      caption,
      createdAt: new Date(),
      publishedAt: new Date(),
      metrics: {},
    };

    // Twitter
    if (results.twitter?.id) {
      await userPostsRef.doc(results.twitter.id).set(
        {
          ...basePostData,
          platform: 'twitter',
          accountId: `twitter_${userId}`,      // or twitterAccount.platformId if you prefer
          platformPostId: results.twitter.id, // tweet id
        },
        { merge: true },
      );
    }

    if (results.youtube?.id) {
      await userPostsRef.doc(results.youtube.id).set(
        {
          ...basePostData,
          platform: 'youtube',
          accountId: `youtube_${userId}`,
          platformPostId: results.youtube.id,
        },
        { merge: true },
      );
    }

    if (results.linkedin?.id) {
      await userPostsRef.doc(results.linkedin.id).set(
        {
          ...basePostData,
          platform: 'linkedin',
          accountId: `linkedin_${userId}`, // or actual member/organization id
          platformPostId: results.linkedin.id, // URN returned by LinkedIn
        },
        { merge: true },
      );
    }


    return NextResponse.json({
      success: results.errors.length === 0,
      results,
    });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json(
      {
        error: 'Failed to publish post',
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Helper: Publish to Twitter (OAuth1, using /api/auth/twitter/post)
async function publishToTwitter(
  userId: string,
  caption: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com';
  const response = await fetch(`${baseUrl}/api/auth/twitter/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,          // required for account lookup
      text: caption,
      mediaUrl: mediaUrl || undefined,
      mediaType: mediaType || undefined,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to publish to Twitter');
  }

  return { id: data.tweet?.id };
}

// Helper: Publish to YouTube
async function publishToYoutube(
  userId: string,
  title: string,
  description: string,
  videoUrl?: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com';
  const response = await fetch(`${baseUrl}/api/auth/youtube/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      title,
      description,
      videoUrl: videoUrl || undefined,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to publish to YouTube');
  }

  return { id: data.videoId }; // ✅ this is the real videoId
}


async function publishToLinkedin(
  userId: string,
  caption: string,
  imageUrl?: string,
) {
  // Load LinkedIn account directly — avoid HTTP hop to /api/auth/linkedin/post
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const accounts: any[] = userSnap.data()?.connectedAccounts || [];
  const liAcc = accounts.find((a: any) => a.platform === 'linkedin');

  if (!liAcc?.accessToken || !liAcc?.authorUrn) {
    throw new Error('LinkedIn account not connected or missing authorUrn');
  }

  const { accessToken, authorUrn } = liAcc;

  // Optionally upload image
  let imageAsset: string | null = null;
  if (imageUrl) {
    try {
      imageAsset = await uploadLinkedInImage(accessToken, authorUrn, imageUrl);
    } catch (err: any) {
      console.warn('[LI PUBLISH] Image upload failed, posting text-only:', err.message);
    }
  }

  const postBody: any = {
    author: authorUrn,
    commentary: caption,
    visibility: 'PUBLIC',
    lifecycleState: 'PUBLISHED',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
  };

  if (imageAsset) {
    postBody.content = { media: { id: imageAsset } };
  }

  const postRes = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202411',
    },
    body: JSON.stringify(postBody),
  });

  if (!postRes.ok) {
    const errText = await postRes.text();
    console.error('[LI PUBLISH] API error:', postRes.status, errText);
    throw new Error(`LinkedIn API error ${postRes.status}: ${errText}`);
  }

  // URN is in the x-restli-id header; body is typically empty on 201
  const postUrn =
    postRes.headers.get('x-restli-id') ||
    postRes.headers.get('x-linkedin-id') ||
    (await postRes.text().then(t => t.trim() || undefined).catch(() => undefined));

  console.log('[LI PUBLISH] Published, URN:', postUrn);
  return { id: postUrn };
}

async function uploadLinkedInImage(
  accessToken: string,
  authorUrn: string,
  imageUrl: string,
): Promise<string> {
  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202411',
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: authorUrn } }),
  });

  if (!initRes.ok) throw new Error(`LinkedIn image init failed: ${await initRes.text()}`);

  const initData = await initRes.json();
  const uploadUrl: string = initData.value?.uploadUrl;
  const imageUrn: string  = initData.value?.image;
  if (!uploadUrl || !imageUrn) throw new Error('LinkedIn did not return upload URL');

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error('Failed to download image for LinkedIn');
  const imgBuffer = await imgRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
    },
    body: imgBuffer,
  });

  if (!uploadRes.ok) throw new Error(`LinkedIn image upload failed: ${await uploadRes.text()}`);
  return imageUrn;
}
