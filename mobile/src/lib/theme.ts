// mobile/src/lib/theme.ts
// Centralized colors so navigation + charts stay in sync.

export const theme = {
  bg:        '#0a0a0a',
  bgCard:    '#111113',
  bgElev:    '#17171a',
  border:    '#1f1f23',
  text:      '#f4f4f5',
  textDim:   '#a1a1aa',
  textMuted: '#52525b',
  brand:     '#a855f7',
  accent:    '#22d3ee',
  green:     '#34d399',
  red:       '#f87171',
  amber:     '#fbbf24',
  pink:      '#f472b6',
  blue:      '#60a5fa',
  indigo:    '#818cf8',
};

export const platformColors: Record<string, string> = {
  youtube:   '#f87171',
  twitter:   '#38bdf8',
  linkedin:  '#60a5fa',
  instagram: '#f472b6',
  facebook:  '#818cf8',
  threads:   '#e5e7eb',
  tiktok:    '#e879f9',
};

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
