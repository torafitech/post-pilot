// lib/metrics/facebook.ts
import { PostMetrics } from '@/types/post';

const FB_GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export async function fetchFacebookMetrics(
  pageId: string,         // page id (not strictly needed here)
  postId: string,         // fb post id
  accessToken?: string,
): Promise<PostMetrics> {
  if (!accessToken) return {};

  const metricList = [
    'post_impressions',
    'post_impressions_unique',
    'post_engaged_users',
    'post_video_views',
  ];

  const url = `${FB_GRAPH_BASE}/${postId}/insights` +
              `?metric=${metricList.join(',')}&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error('FB insights error', await res.text());
    return {};
  }

  const json: any = await res.json();
  const out: PostMetrics = {};

  for (const entry of json.data || []) {
    const val = entry.values?.[0]?.value ?? 0;
    switch (entry.name) {
      case 'post_impressions':
        out.impressions = val;
        break;
      case 'post_impressions_unique':
        out.reach = val;
        break;
      case 'post_video_views':
        out.views = val;
        break;
      // you can map engaged_users into a custom field if desired
    }
  }

  return out;
}
