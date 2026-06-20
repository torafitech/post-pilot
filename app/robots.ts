import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/admin', '/posts', '/automation', '/login', '/register'],
    },
    sitemap: 'https://www.starlingpost.com/sitemap.xml',
    host: 'https://www.starlingpost.com',
  };
}
