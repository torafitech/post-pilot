import type { MetadataRoute } from 'next';
import { POSTS } from '@/lib/blog';

const BASE = 'https://www.starlingpost.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes = [
    { path: '/',          priority: 1.0, changeFrequency: 'weekly'  as const },
    { path: '/pricing',   priority: 0.9, changeFrequency: 'weekly'  as const },
    { path: '/about',     priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/blog',      priority: 0.6, changeFrequency: 'weekly'  as const },
    { path: '/changelog', priority: 0.5, changeFrequency: 'weekly'  as const },
    { path: '/privacy',   priority: 0.3, changeFrequency: 'yearly'  as const },
    { path: '/terms',     priority: 0.3, changeFrequency: 'yearly'  as const },
  ];

  const staticRoutes: MetadataRoute.Sitemap = routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const articleRoutes: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: new Date(post.updatedDate ?? post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...articleRoutes];
}
