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
    const { text, imageUrl, userId } = body as {
      text?: string;
      imageUrl?: string; // Cloudinary URL
      userId?: string;   // Firebase uid (required)
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

    const userClient = new TwitterApi({
      appKey,
      appSecret,
      accessToken: oauthToken,
      accessSecret: oauthTokenSecret,
    });

    const rwClient = userClient.readWrite;

    let mediaIds: string[] = [];

    // 4) Optional: download image and upload to X (v1 media upload)
    if (imageUrl && typeof imageUrl === 'string') {
      try {
        console.log('Fetching image from URL for Twitter:', imageUrl);

        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          console.error(
            'Failed to download image from Cloudinary:',
            imageResponse.status,
            imageResponse.statusText,
          );
        } else {
          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Get content-type from response headers
          const contentType =
            imageResponse.headers.get('content-type') || 'image/jpeg';

          console.log('Uploading media to Twitter with type:', contentType);

          // 🔑 IMPORTANT: Must specify type when uploading Buffer
          const mediaId = await rwClient.v1.uploadMedia(buffer, {
            type: contentType as any,
          });

          mediaIds.push(mediaId);
          console.log('Media uploaded successfully with ID:', mediaId);
        }
      } catch (err) {
        console.error('Error while fetching/uploading image to Twitter:', err);
        // fall back to text-only tweet
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
