// lib/postScopeUtils.ts
// Utilities for parsing post URLs into platform-native IDs/URNs.

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
  } catch {}
  return null;
}

export function extractTweetId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('twitter.com') || u.hostname.includes('x.com')) {
      const m = u.pathname.match(/\/status\/(\d+)/);
      return m?.[1] ?? null;
    }
  } catch {}
  return null;
}

export function extractLinkedInPostUrn(url: string): string | null {
  try {
    const u = new URL(url);
    // /feed/update/urn:li:ugcPost:12345/ or /feed/update/urn:li:share:12345/
    const urnMatch = u.pathname.match(/\/(urn:li:[^/?]+)/);
    if (urnMatch) return decodeURIComponent(urnMatch[1]);
    // /posts/...-activity-12345-XXXX/ (modern share URLs)
    const activityMatch = u.pathname.match(/activity-(\d+)/);
    if (activityMatch) return `urn:li:ugcPost:${activityMatch[1]}`;
  } catch {}
  return null;
}

export function parsePostUrls(urls: string[], platform: string): string[] {
  const ids: string[] = [];
  for (const url of urls) {
    let id: string | null = null;
    if (platform === 'youtube') id = extractYouTubeVideoId(url);
    else if (platform === 'twitter') id = extractTweetId(url);
    else if (platform === 'linkedin') id = extractLinkedInPostUrn(url);
    if (id) ids.push(id);
  }
  return [...new Set(ids)];
}
