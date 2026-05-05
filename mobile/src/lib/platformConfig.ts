// mobile/src/lib/platformConfig.ts
// Mirror of the web platformConfig — keep these two files in sync until
// we extract a shared package.

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

export const PLATFORM_DISABLED_REASON: Partial<Record<Platform, string>> = {
  instagram: 'Pending Meta App Review for instagram_content_publish + instagram_manage_comments scopes.',
  facebook:  'Pending Meta App Review for pages_manage_posts + pages_manage_engagement scopes.',
  threads:   'Pending Meta Threads API rollout.',
  tiktok:    'Pending TikTok Developer partner approval.',
};

export function isPlatformEnabled(p: string): boolean {
  return ENABLED_PLATFORMS.has(p as Platform);
}
