// app/api/twitter/tweets/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';
import { adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const maxResults = parseInt(url.searchParams.get('maxResults') || '25');

    console.log('[TWITTER TWEETS] Fetching for userId:', userId);

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
      console.log('[TWITTER TWEETS] No Twitter account connected');
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
      // First get the user ID
      const me = await client.v2.me();
      const twitterUserId = me.data.id;

      // Fetch user's tweets
      const tweets = await client.v2.userTimeline(twitterUserId, {
        max_results: maxResults,
        'tweet.fields': [
          'created_at',
          'public_metrics',
          'organic_metrics',
          'non_public_metrics',
          'context_annotations',
          'entities',
          'attachments',
          'referenced_tweets',
          'source'
        ].join(','),
        'media.fields': [
          'url',
          'preview_image_url',
          'type',
          'duration_ms',
          'height',
          'width',
          'alt_text'
        ].join(','),
        expansions: ['attachments.media_keys', 'referenced_tweets.id'],
      });

      // Format tweets
      const formattedTweets = tweets.data.data.map((tweet: any) => {
        const metrics = tweet.public_metrics || {};
        const organicMetrics = tweet.organic_metrics || {};
        
        // Calculate engagement rate
        const totalEngagements = 
          (metrics.like_count || 0) + 
          (metrics.retweet_count || 0) + 
          (metrics.reply_count || 0) + 
          (metrics.quote_count || 0);
        
        const impressions = organicMetrics.impression_count || metrics.impression_count || 0;
        const engagementRate = impressions > 0 ? (totalEngagements / impressions) * 100 : 0;

        // Get media attachments
        const media = tweet.attachments?.media_keys
          ?.map((key: string) => {
            const mediaObj = tweets.includes?.media?.find((m: any) => m.media_key === key);
            if (!mediaObj) return null;
            
            return {
              type: mediaObj.type,
              url: mediaObj.url || mediaObj.preview_image_url,
              previewImageUrl: mediaObj.preview_image_url,
              duration: mediaObj.duration_ms,
              altText: mediaObj.alt_text,
            };
          })
          .filter(Boolean) || [];

        return {
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          metrics: {
            likes: metrics.like_count || 0,
            retweets: metrics.retweet_count || 0,
            replies: metrics.reply_count || 0,
            quotes: metrics.quote_count || 0,
            impressions: impressions,
            engagementRate: parseFloat(engagementRate.toFixed(2)),
          },
          media,
          permalink: `https://twitter.com/${twitterAccount.accountName}/status/${tweet.id}`,
          source: tweet.source,
        };
      });

      console.log('[TWITTER TWEETS] Retrieved:', formattedTweets.length, 'tweets');

      return NextResponse.json({
        tweets: formattedTweets,
        count: formattedTweets.length,
        meta: tweets.meta,
      });
    } catch (twitterError: any) {
      console.error('[TWITTER TWEETS] Twitter API error:', {
        message: twitterError.message,
        code: twitterError.code,
        data: twitterError.data,
      });

      if (twitterError.code === 401 || twitterError.code === 403) {
        return NextResponse.json(
          { error: 'Twitter credentials expired, please reconnect', needsReauth: true },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch tweets' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[TWITTER TWEETS] Unexpected error:', error.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}