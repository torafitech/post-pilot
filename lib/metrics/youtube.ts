// lib/metrics/youtube.ts
import { PostMetrics } from '@/types/post';

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function fetchYouTubeMetrics(
  channelId: string, // not used now
  videoId: string,
): Promise<PostMetrics> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error('[YT METRICS] Missing YOUTUBE_API_KEY env');
    return {};
  }

  if (!videoId) {
    console.error('[YT METRICS] Missing videoId');
    return {};
  }

  const url =
    `${YT_API_BASE}/videos?` +
    new URLSearchParams({
      id: videoId,
      key: apiKey,
      part: 'statistics',
    }).toString();

  console.log('[YT METRICS] Fetching stats', { videoId, url });

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    console.error('[YT METRICS] YouTube stats error', res.status, text);
    return {};
  }

  const json: any = await res.json();
  console.log('[YT METRICS] API raw response', JSON.stringify(json));

  const item = json.items?.[0];
  if (!item) {
    console.warn('[YT METRICS] No items for videoId', videoId);
    return {};
  }

  const stats = item.statistics || {};
  console.log('[YT METRICS] Parsed statistics', stats);

  const metrics: PostMetrics = {
    views: Number(stats.viewCount || 0),
    likes: Number(stats.likeCount || 0),
    comments: Number(stats.commentCount || 0),
  };

  console.log('[YT METRICS] Final metrics object', metrics);

  return metrics;
}
