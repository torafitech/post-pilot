import { adminDb } from '@/lib/firebaseAdmin';
import { getUserIdFromRequest } from '@/lib/getUserFromRequest';
import { NextRequest, NextResponse } from 'next/server';

// Main publish endpoint that posts to all selected platforms
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { postId, platforms, caption, imageUrl, videoUrl, platformContent } =
      body as {
        postId: string;
        platforms: string[];
        caption: string;
        imageUrl?: string | null;
        videoUrl?: string | null;
        platformContent?: any;
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
      instagram: null as any,
      linkedin: null as any,
      tiktok: null as any,
      facebook: null as any,
      errors: [] as any[],
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
    // Publish to Instagram
    // -----------------------
    if (platforms.includes('instagram')) {
      try {
        console.log('Publishing to Instagram...');
        const instaCaption =
          platformContent?.instagram?.caption?.trim() || caption;

        const instaMediaUrl = videoUrl || imageUrl || undefined;
        const instaMediaType =
          videoUrl ? 'video' : imageUrl ? 'image' : undefined;

        if (!instaMediaUrl || !instaMediaType) {
          console.log('Skipping Instagram: no mediaUrl/mediaType');
        } else {
          const instagramResult = await publishToInstagram(
            userId,
            instaCaption,
            instaMediaUrl,
            instaMediaType,
          );
          results.instagram = instagramResult;
        }
      } catch (error: any) {
        console.error('Instagram publish error:', error);
        results.errors.push({ platform: 'instagram', error: error.message });
      }
    }


    // TODO: Implement linkedin / tiktok / facebook similarly using userId

    // Update post status in Firestore
    const platformPostIds: any = {};
    if (results.twitter?.id) platformPostIds.twitter = results.twitter.id;
    if (results.youtube?.id) platformPostIds.youtube = results.youtube.id;
    if (results.instagram?.id) platformPostIds.instagram = results.instagram.id;

    await adminDb.collection('posts').doc(postId).update({
      status:
        results.errors.length === 0 ? 'published' : 'partially_published',
      platformPostIds,
      publishedAt: new Date(),
      errors: results.errors,
    });

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
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
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

  return { id: data.videoId };
}

// Helper: Publish to Instagram (image or video)
async function publishToInstagram(
  userId: string,
  caption: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/instagram/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-call': '1',
    },
    body: JSON.stringify({
      _userId: userId,
      mediaUrl: mediaUrl || null,
      mediaType: mediaType || null,
      caption,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Instagram publish failed:', data); // <— LOG FULL DETAILS
    throw new Error(
      data.error ||
        (data.details && data.details.error && data.details.error.message) ||
        'Failed to publish to Instagram',
    );
  }

  return { id: data.instagramPostId };
}
