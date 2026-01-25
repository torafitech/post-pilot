// lib/metrics/youtube.ts
import { PostMetrics } from '@/types/post';

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

export async function fetchYouTubeMetrics(
  channelId: string, // not used now
  videoId: string,
): Promise<PostMetrics> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  console.log('[YT METRICS] Starting fetchYouTubeMetrics', {
    hasApiKey: !!apiKey,
    videoId,
    channelId,
    nodeEnv: process.env.NODE_ENV,
  });

  if (!apiKey) {
    console.error('[YT METRICS] Missing YOUTUBE_API_KEY env');
    return {};
  }

  if (!videoId) {
    console.error('[YT METRICS] Missing videoId');
    return {};
  }

  const params = new URLSearchParams({
    id: videoId,
    key: apiKey,
    part: 'statistics',
  });

  const url = `${YT_API_BASE}/videos?${params.toString()}`;

  console.log('[YT METRICS] Fetching stats from YouTube', {
    videoId,
    url,
  });

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    console.error('[YT METRICS] Network/Fetch error calling YouTube', {
      error: err,
    });
    return {};
  }

  console.log('[YT METRICS] YouTube response status', {
    status: res.status,
    ok: res.ok,
  });

  if (!res.ok) {
    const text = await res.text().catch((err) => {
      console.error('[YT METRICS] Error reading error body', { err });
      return '';
    });

    console.error('[YT METRICS] YouTube stats error', {
      status: res.status,
      statusText: res.statusText,
      body: text,
    });

    return {};
  }

  let json: any;
  try {
    json = await res.json();
  } catch (err) {
    console.error('[YT METRICS] Failed to parse JSON from YouTube', {
      error: err,
    });
    return {};
  }

  console.log('[YT METRICS] API raw response (truncated)', {
    kind: json.kind,
    etag: json.etag,
    itemCount: json.items?.length,
  });

  const item = json.items?.[0];
  if (!item) {
    console.warn('[YT METRICS] No items for videoId', { videoId, json });
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
