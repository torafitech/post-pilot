export interface BlogPost {
  slug: string;
  date: string;
  updatedDate?: string;
  tag: string;
  title: string;
  excerpt: string;
  readTime: string;
  author: string;
}

export const POSTS: BlogPost[] = [
  {
    slug: 'why-cross-posting-kills-reach',
    date: '2025-04-18',
    tag: 'Strategy',
    title: 'Why copy-pasting the same post to every platform kills your reach',
    excerpt:
      'Each platform has its own algorithm, audience expectation, and optimal format. A thread that performs on Twitter is not a YouTube description. Here is what to change and what to keep.',
    readTime: '5 min',
    author: 'StarlingPost',
  },
  {
    slug: 'automation-without-looking-like-a-bot',
    date: '2025-04-03',
    tag: 'Automation',
    title: "Auto-replies that don't look automated",
    excerpt:
      'The difference between an auto-reply that builds trust and one that alienates your audience comes down to three variables: timing, personalisation, and scope.',
    readTime: '4 min',
    author: 'StarlingPost',
  },
  {
    slug: 'linkedin-posting-guide-2025',
    date: '2025-03-22',
    tag: 'Platform guides',
    title: 'LinkedIn in 2025: what actually gets reach',
    excerpt:
      "LinkedIn's algorithm changed significantly. Carousels are dead. Native documents still work. Text-only posts with strong hooks outperform everything else. What this means for your content strategy.",
    readTime: '6 min',
    author: 'StarlingPost',
  },
  {
    slug: 'building-starlingpost',
    date: '2025-03-10',
    tag: 'Product',
    title: 'How we built StarlingPost: the technical decisions behind a multi-platform posting tool',
    excerpt:
      'Next.js App Router, Firebase, and the Twitter OAuth 1.0a vs 2.0 nightmare. An honest account of the architectural choices we made and the ones we wish we had made differently.',
    readTime: '8 min',
    author: 'StarlingPost',
  },
  {
    slug: 'youtube-community-posts-guide',
    date: '2025-02-28',
    tag: 'Platform guides',
    title: 'YouTube Community Posts: the underrated channel for creator engagement',
    excerpt:
      'Most creators treat Community Posts as an afterthought. The data shows they drive more direct subscriber interaction than video comments. Here is how to use them intentionally.',
    readTime: '5 min',
    author: 'StarlingPost',
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
