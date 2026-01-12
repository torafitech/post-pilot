// app/api/auth/twitter/post/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { adminDb } from '@/lib/firebaseAdmin';

// Helper: get Twitter account from users/{userId}/connectedAccounts
async function getTwitterAccount(userId: string) {
  const snap = await adminDb.collection('users').doc(userId).get();

  if (!snap.exists) return null;

  const userData = snap.data() as any;
  const accounts = userData.connectedAccounts || [];
  const twitterAccount = accounts.find(
    (acc: any) => acc.platform === 'twitter',
  );

  return twitterAccount || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mediaUrl, mediaType, userId } = body as {
      text?: string;
      mediaUrl?: string;                 // Cloudinary URL (image or video)
      mediaType?: 'image' | 'video';     // Must be sent by client
      userId?: string;                   // Firebase uid (required)
    };

    console.log('Twitter post request body:', body);

    // 1) Basic validation
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Missing userId in request body' },
        { status: 400 },
      );
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and cannot be empty' },
        { status: 400 },
      );
    }

    // 2) Load Twitter OAuth1 tokens from Firestore
    const twitterAccount = await getTwitterAccount(userId);

    if (!twitterAccount) {
      console.error('Twitter connection not found for user:', userId);
      return NextResponse.json(
        { error: 'Twitter not connected for this user' },
        { status: 400 },
      );
    }

    const { oauthToken, oauthTokenSecret } = twitterAccount;

    if (!oauthToken || !oauthTokenSecret) {
      console.error(
        'Missing OAuth1 tokens in Twitter account',
        twitterAccount,
      );
      return NextResponse.json(
        { error: 'Missing Twitter OAuth1 tokens' },
        { status: 400 },
      );
    }

    // 3) Create OAuth1 user client
    const appKey = process.env.TWITTER_APP_KEY!;
    const appSecret = process.env.TWITTER_APP_SECRET!;

    if (!appKey || !appSecret) {
      console.error('Missing Twitter app credentials in env');
      return NextResponse.json(
        { error: 'Twitter app credentials not configured' },
        { status: 500 },
      );
    }

    const userClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken: oauthToken,
      accessSecret: oauthTokenSecret,
    });

    const rwClient = userClient.readWrite;

    let mediaIds: string[] = [];

    // 4) Optional: download media (image or video) and upload to X
    if (mediaUrl && typeof mediaUrl === 'string') {
      try {
        console.log('Fetching media from URL for Twitter:', mediaUrl);

        const mediaResponse = await fetch(mediaUrl);
        if (!mediaResponse.ok) {
          console.error(
            'Failed to download media from Cloudinary:',
            mediaResponse.status,
            mediaResponse.statusText,
          );
        } else {
          const arrayBuffer = await mediaResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Infer MIME type from response headers
          const contentType =
            mediaResponse.headers.get('content-type') || 'application/octet-stream';

          console.log('Uploading media to Twitter with type:', contentType);

          let mediaId: string;

          // Decide based on mediaType or contentType
          const isVideo =
            mediaType === 'video' || contentType.startsWith('video/');

          if (isVideo) {
            // Video upload via v1.1 (twitter-api-v2 handles chunked upload)
            // X/Twitter expects mp4/H.264 with size/duration limits.[web:108][web:113]
            mediaId = await rwClient.v1.uploadMedia(buffer, {
              mimeType: 'video/mp4', // Cloudinary should deliver mp4 for videos
            } as any);
          } else {
            // Image upload (jpeg/png/webp)
            mediaId = await rwClient.v1.uploadMedia(buffer, {
              mimeType: contentType,
            } as any);
          }

          mediaIds.push(mediaId);
          console.log('Media uploaded successfully with ID:', mediaId);
        }
      } catch (err) {
        console.error('Error while fetching/uploading media to Twitter:', err);
        // Fall back to text-only tweet if media fails
      }
    }

    // 5) Build tweet payload
    const tweetPayload: any = { text };

    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds };
    }

    // 6) Post tweet using v2
    console.log('Publishing to Twitter...');
    const result = await rwClient.v2.tweet(tweetPayload);

    console.log('Tweet posted successfully:', result.data);

    return NextResponse.json({ success: true, tweet: result.data });
  } catch (err: any) {
    console.error('Twitter post error:', err);
    return NextResponse.json(
      {
        error: 'Failed to post tweet',
        details: err.message,
        twitterError: err.data,
      },
      { status: 500 },
    );
  }
}
