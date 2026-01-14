// lib/metrics/instagram.ts
import { PostMetrics } from '@/types/post';

const IG_GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export async function fetchInstagramMetrics(
  igUserId: string,    // kept for future use
  mediaId: string,
  accessToken?: string,
): Promise<PostMetrics> {
  if (!accessToken) return {};

  const metrics: PostMetrics = {};

  // 1) Insights: reach, impressions, saves, video views, engagement
  const insightMetrics = ['impressions', 'reach', 'saved', 'engagement', 'video_views'];
  const insightsUrl =
    `${IG_GRAPH_BASE}/${mediaId}/insights?` +
    `metric=${insightMetrics.join(',')}&access_token=${encodeURIComponent(accessToken)}`;

  const insightsRes = await fetch(insightsUrl);
  if (insightsRes.ok) {
    const json: any = await insightsRes.json();
    for (const entry of json.data || []) {
      const val = entry.values?.[0]?.value ?? 0;
      switch (entry.name) {
        case 'reach':
          metrics.reach = val;
          break;
        case 'impressions':
          metrics.impressions = val;
          break;
        case 'saved':
          metrics.saves = val;
          break;
        case 'video_views':
          metrics.views = val;
          break;
        case 'engagement':
          // you can add metrics.engagement if you extend type
          break;
      }
    }
  } else {
    console.error('IG insights error', await insightsRes.text());
  }

  // 2) Media node: like_count, comments_count [web:114][web:117]
  const mediaUrl =
    `${IG_GRAPH_BASE}/${mediaId}?fields=like_count,comments_count&access_token=` +
    encodeURIComponent(accessToken);

  const mediaRes = await fetch(mediaUrl);
  if (mediaRes.ok) {
    const mediaJson: any = await mediaRes.json();
    if (typeof mediaJson.like_count === 'number') {
      metrics.likes = mediaJson.like_count;
    }
    if (typeof mediaJson.comments_count === 'number') {
      metrics.comments = mediaJson.comments_count;
    }
  } else {
    console.error('IG media error', await mediaRes.text());
  }

  return metrics;
}
