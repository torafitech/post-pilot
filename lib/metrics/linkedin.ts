// lib/metrics/linkedin.ts
import { PostMetrics } from '@/types/post';

const LI_REST_BASE = 'https://api.linkedin.com/rest';

export async function fetchLinkedinMetrics(
  authorUrn: string,     // e.g. "urn:li:person:xxxx" or org
  postUrn: string,       // e.g. "urn:li:ugcPost:xxxx" or "urn:li:share:xxxx"
  accessToken?: string,
): Promise<PostMetrics> {
  if (!accessToken) return {};

  const metrics: PostMetrics = {};

  // Using Social Metadata API for summary (reactions + comments). [web:89]
  const encodedUrn = encodeURIComponent(postUrn);
  const url = `${LI_REST_BASE}/socialMetadata?q=entityUrn&entityUrn=${encodedUrn}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  if (!res.ok) {
    console.error('LinkedIn metrics error', await res.text());
    return metrics;
  }

  const json: any = await res.json();

  // The exact shape depends on your access; adapt as needed. [web:89]
  // Example mapping (pseudo; adjust to real response):
  const summary = json.elements?.[0]?.summary || json.summary || {};

  if (typeof summary.totalComments === 'number') {
    metrics.comments = summary.totalComments;
  }
  if (typeof summary.totalReactions === 'number') {
    metrics.likes = summary.totalReactions; // reactions ~ likes
  }

  // You can extend PostMetrics with fields like impressions, clicks, etc.,
  // if your plan / API response exposes them.

  return metrics;
}
