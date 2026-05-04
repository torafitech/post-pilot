// lib/platformConfig.ts
// Single source of truth for which platforms are wired in.
// Disabled platforms keep their full backend code paths but are hidden
// or shown as "Coming soon" in UI, and skipped in automation backends.

export const ALL_PLATFORMS = [
  'youtube',
  'twitter',
  'linkedin',
  'instagram',
  'facebook',
  'threads',
  'tiktok',
] as const;

export type Platform = typeof ALL_PLATFORMS[number];

export const ENABLED_PLATFORMS = new Set<Platform>([
  'youtube',
  'twitter',
  'linkedin',
]);

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: 'YouTube',
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  tiktok: 'TikTok',
};

// User-facing reason why a platform is locked behind "Coming soon".
export const PLATFORM_DISABLED_REASON: Partial<Record<Platform, string>> = {
  instagram: 'Pending Meta App Review for instagram_content_publish + instagram_manage_comments scopes.',
  facebook:  'Pending Meta App Review for pages_manage_posts + pages_manage_engagement scopes.',
  threads:   'Pending Meta Threads API rollout for full posting + reply scopes.',
  tiktok:    'Pending TikTok Developer partner approval for video.publish + comment.create scopes.',
};

export function isPlatformEnabled(p: string): boolean {
  return ENABLED_PLATFORMS.has(p as Platform);
}
