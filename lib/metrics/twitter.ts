// lib/metrics/twitter.ts
import { TwitterApi } from 'twitter-api-v2';
import { PostMetrics } from '@/types/post';

export async function fetchTwitterMetrics(
  twitterUserId: string,   // unused here
  tweetId: string,
  oauthToken: string,
  oauthTokenSecret: string,
): Promise<PostMetrics> {
  if (!oauthToken || !oauthTokenSecret) return {};

  const appKey = process.env.TWITTER_APP_KEY!;
  const appSecret = process.env.TWITTER_APP_SECRET!;
  if (!appKey || !appSecret) return {};

  const userClient = new TwitterApi({
    appKey,
    appSecret,
    accessToken: oauthToken,
    accessSecret: oauthTokenSecret,
  });

  const rwClient = userClient.readOnly;

  const res = await rwClient.v2.singleTweet(tweetId, {
    'tweet.fields': ['public_metrics'],
  }); // returns public_metrics with like_count, reply_count, etc. [web:83][web:87][web:125]

  const pm = (res.data as any)?.public_metrics;
  if (!pm) return {};

  const metrics: PostMetrics = {
    likes: pm.like_count ?? 0,
    comments: pm.reply_count ?? 0,
  };

  return metrics;
}
