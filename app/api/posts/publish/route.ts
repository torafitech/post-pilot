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
      instagram: null as any,
      facebook: null as any,
      threads: null as any,
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

        const linkedinResult = await publishToLinkedin(
          userId,
          linkedinCaption,
          imageUrl || undefined,
          videoUrl || undefined,
        );
        results.linkedin = linkedinResult;
      } catch (error: any) {
        console.error('LinkedIn publish error:', error);
        results.errors.push({ platform: 'linkedin', error: error.message });
      }
    }

    // -----------------------
    // Publish to Instagram
    // -----------------------
    if (platforms.includes('instagram')) {
      try {
        console.log('Publishing to Instagram...');
        const igCaption = platformContent?.instagram?.caption?.trim() || caption;
        const igMediaUrl = imageUrl || videoUrl || undefined;
        const igMediaType = imageUrl ? 'image' : videoUrl ? 'video' : undefined;

        if (!igMediaUrl || !igMediaType) {
          results.errors.push({ platform: 'instagram', error: 'Instagram requires an image or video' });
        } else {
          const igResult = await publishToInstagram(userId, igCaption, igMediaUrl, igMediaType);
          results.instagram = igResult;
        }
      } catch (error: any) {
        console.error('Instagram publish error:', error);
        results.errors.push({ platform: 'instagram', error: error.message });
      }
    }

    // -----------------------
    // Publish to Facebook
    // -----------------------
    if (platforms.includes('facebook')) {
      try {
        console.log('Publishing to Facebook...');
        const fbCaption = platformContent?.facebook?.caption?.trim() || caption;
        const fbResult = await publishToFacebook(
          userId,
          fbCaption,
          imageUrl || undefined,
          videoUrl || undefined,
        );
        results.facebook = fbResult;
      } catch (error: any) {
        console.error('Facebook publish error:', error);
        results.errors.push({ platform: 'facebook', error: error.message });
      }
    }

    // -----------------------
    // Publish to Threads
    // -----------------------
    if (platforms.includes('threads')) {
      try {
        console.log('Publishing to Threads...');
        const thCaption = platformContent?.threads?.caption?.trim() || caption;
        const thResult = await publishToThreads(
          userId,
          thCaption,
          imageUrl || undefined,
          videoUrl || undefined,
        );
        results.threads = thResult;
      } catch (error: any) {
        console.error('Threads publish error:', error);
        results.errors.push({ platform: 'threads', error: error.message });
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
    if (results.instagram?.id) platformPostIds.instagram = results.instagram.id;
    if (results.facebook?.id) platformPostIds.facebook = results.facebook.id;
    if (results.threads?.id) platformPostIds.threads = results.threads.id;
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
          accountId: `linkedin_${userId}`,
          platformPostId: results.linkedin.id,
        },
        { merge: true },
      );
    }

    if (results.instagram?.id) {
      await userPostsRef.doc(results.instagram.id).set(
        {
          ...basePostData,
          platform: 'instagram',
          accountId: `instagram_${userId}`,
          platformPostId: results.instagram.id,
        },
        { merge: true },
      );
    }

    if (results.facebook?.id) {
      await userPostsRef.doc(results.facebook.id).set(
        {
          ...basePostData,
          platform: 'facebook',
          accountId: `facebook_${userId}`,
          platformPostId: results.facebook.id,
        },
        { merge: true },
      );
    }

    if (results.threads?.id) {
      await userPostsRef.doc(results.threads.id).set(
        {
          ...basePostData,
          platform: 'threads',
          accountId: `threads_${userId}`,
          platformPostId: results.threads.id,
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

// Helper: Publish to Threads (two-step container flow)
async function publishToThreads(
  userId: string,
  caption: string,
  imageUrl?: string,
  videoUrl?: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com';
  const response = await fetch(`${baseUrl}/api/threads/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-call': '1',
    },
    body: JSON.stringify({ _userId: userId, caption, imageUrl, videoUrl }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to publish to Threads');
  }

  return { id: data.threadsPostId };
}

// Helper: Publish to Facebook Page
async function publishToFacebook(
  userId: string,
  caption: string,
  imageUrl?: string,
  videoUrl?: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com';
  const response = await fetch(`${baseUrl}/api/facebook/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-call': '1',
    },
    body: JSON.stringify({ _userId: userId, caption, imageUrl, videoUrl }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to publish to Facebook');
  }

  return { id: data.facebookPostId };
}

// Helper: Publish to Instagram (two-step container API)
async function publishToInstagram(
  userId: string,
  caption: string,
  mediaUrl: string,
  mediaType: 'image' | 'video',
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com';
  const response = await fetch(`${baseUrl}/api/instagram/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-call': '1',
    },
    body: JSON.stringify({ _userId: userId, caption, mediaUrl, mediaType }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to publish to Instagram');
  }

  return { id: data.instagramPostId };
}

// Helper: Publish to Twitter (OAuth1, using /api/auth/twitter/post)
async function publishToTwitter(
  userId: string,
  caption: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  accountId?: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.starlingpost.com';
  const response = await fetch(`${baseUrl}/api/auth/twitter/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      accountId: accountId || undefined,
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
  videoUrl?: string,
) {
  const userSnap = await adminDb.collection('users').doc(userId).get();
  const accounts: any[] = userSnap.data()?.connectedAccounts || [];
  const liAcc = accounts.find((a: any) => a.platform === 'linkedin');

  if (!liAcc?.accessToken || !liAcc?.authorUrn) {
    throw new Error('LinkedIn account not connected or missing authorUrn');
  }

  const { accessToken, authorUrn } = liAcc;

  let videoAsset: string | null = null;
  let imageAsset: string | null = null;

  if (videoUrl) {
    try {
      videoAsset = await uploadLinkedInVideo(accessToken, authorUrn, videoUrl);
      console.log('[LI PUBLISH] Video asset registered:', videoAsset);
    } catch (err: any) {
      console.warn('[LI PUBLISH] Video upload failed, posting text-only:', err.message);
    }
  } else if (imageUrl) {
    try {
      imageAsset = await uploadLinkedInImage(accessToken, authorUrn, imageUrl);
    } catch (err: any) {
      console.warn('[LI PUBLISH] Image upload failed, posting text-only:', err.message);
    }
  }

  // v2 UGC Posts — no LinkedIn-Version header required
  const shareContent: any = {
    shareCommentary: { text: caption },
    shareMediaCategory: 'NONE',
  };

  if (videoAsset) {
    shareContent.shareMediaCategory = 'VIDEO';
    shareContent.media = [{
      status: 'READY',
      description: { text: caption.slice(0, 200) },
      media: videoAsset,
      title: { text: caption.slice(0, 100) },
    }];
  } else if (imageAsset) {
    shareContent.shareMediaCategory = 'IMAGE';
    shareContent.media = [{
      status: 'READY',
      description: { text: caption.slice(0, 200) },
      media: imageAsset,
      title: { text: 'Image' },
    }];
  }

  const postBody = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': shareContent,
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!postRes.ok) {
    const errText = await postRes.text();
    console.error('[LI PUBLISH] API error:', postRes.status, errText);
    throw new Error(`LinkedIn API error ${postRes.status}: ${errText}`);
  }

  const resJson = await postRes.json().catch(() => ({}));
  const postUrn = resJson.id || postRes.headers.get('x-restli-id') || '';
  console.log('[LI PUBLISH] Published, URN:', postUrn);
  return { id: postUrn };
}

async function uploadLinkedInImage(
  accessToken: string,
  authorUrn: string,
  imageUrl: string,
): Promise<string> {
  // Register image asset with v2 assets API (no version header needed)
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: authorUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  if (!registerRes.ok) throw new Error(`LinkedIn image init failed: ${await registerRes.text()}`);

  const regData = await registerRes.json();
  const uploadUrl: string = regData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const imageUrn: string  = regData.value?.asset;
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

async function uploadLinkedInVideo(
  accessToken: string,
  authorUrn: string,
  videoUrl: string,
): Promise<string> {
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-video'],
        owner: authorUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  if (!registerRes.ok) throw new Error(`LinkedIn video register failed: ${await registerRes.text()}`);

  const regData = await registerRes.json();
  const uploadUrl: string = regData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
  const videoUrn: string  = regData.value?.asset;
  if (!uploadUrl || !videoUrn) throw new Error('LinkedIn did not return video upload URL');

  const vidRes = await fetch(videoUrl);
  if (!vidRes.ok) throw new Error('Failed to download video for LinkedIn');
  const vidBuffer = await vidRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': vidRes.headers.get('content-type') || 'video/mp4',
    },
    body: vidBuffer,
  });

  if (!uploadRes.ok) throw new Error(`LinkedIn video upload failed: ${await uploadRes.text()}`);
  return videoUrn;
}
