// app/api/twitter/user/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log('[TWITTER USER] Fetching for userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Get Twitter account from Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as any;
    const connectedAccounts = userData.connectedAccounts || [];
    
    const twitterAccount = connectedAccounts.find(
      (acc: any) => acc.platform === 'twitter' || acc.platform === 'twitter/x'
    );

    if (!twitterAccount) {
      console.log('[TWITTER USER] No Twitter account connected');
      return NextResponse.json(
        { error: 'Twitter account not connected' },
        { status: 404 }
      );
    }

    const { oauthToken, oauthTokenSecret } = twitterAccount;

    if (!oauthToken || !oauthTokenSecret) {
      return NextResponse.json(
        { error: 'Missing OAuth credentials' },
        { status: 401 }
      );
    }

    // Initialize Twitter client
    const client = new TwitterApi({
      appKey: process.env.TWITTER_APP_KEY!,
      appSecret: process.env.TWITTER_APP_SECRET!,
      accessToken: oauthToken,
      accessSecret: oauthTokenSecret,
    });

    try {
      // Fetch user data from Twitter API v2
      const me = await client.v2.me({
        'user.fields': [
          'description',
          'profile_image_url',
          'verified',
          'public_metrics',
          'created_at',
          'location',
          'url',
          'protected',
          'name',
          'username'
        ].join(',')
      });

      const user = me.data;
      const metrics = user.public_metrics || {};

      // Format response
      const userInfo = {
        userId: user.id,
        username: user.username,
        name: user.name,
        description: user.description || '',
        profileImageUrl: user.profile_image_url?.replace('_normal', '') || null,
        verified: user.verified || false,
        followerCount: metrics.followers_count || 0,
        followingCount: metrics.following_count || 0,
        tweetCount: metrics.tweet_count || 0,
        listedCount: metrics.listed_count || 0,
        createdAt: user.created_at || '',
        location: user.location || '',
        url: user.url || '',
        protected: user.protected || false,
      };

      console.log('[TWITTER USER] Successfully fetched:', {
        username: userInfo.username,
        followers: userInfo.followerCount,
        tweets: userInfo.tweetCount,
      });

      return NextResponse.json(userInfo);
    } catch (twitterError: any) {
      console.error('[TWITTER USER] Twitter API error:', {
        message: twitterError.message,
        code: twitterError.code,
        data: twitterError.data,
      });

      // Check if token is invalid/expired
      if (twitterError.code === 401 || twitterError.code === 403) {
        return NextResponse.json(
          { error: 'Twitter credentials expired, please reconnect', needsReauth: true },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch Twitter user data' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[TWITTER USER] Unexpected error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}