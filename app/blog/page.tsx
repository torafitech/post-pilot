import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { POSTS } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Strategy, automation guides, and platform deep-dives from the StarlingPost team — for creators who post to YouTube, Twitter/X, and LinkedIn.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog · StarlingPost',
    description:
      'Strategy, automation guides, and platform deep-dives from the StarlingPost team.',
    url: 'https://www.starlingpost.com/blog',
  },
};

const BASE = 'https://www.starlingpost.com';

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/blog` },
  ],
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogPage() {
  const [featured, ...rest] = POSTS;

  return (
    <main className="min-h-screen bg-[#0a0a0b] grain pt-20">
      <JsonLd data={breadcrumbSchema} />

      <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-20">

        {/* Header */}
        <div className="mb-16 border-b border-stone-800 pb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-4">Blog</p>
          <h1
            className="font-display italic text-stone-100 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Notes on social,<br />automation & craft.
          </h1>
        </div>

        {/* Featured post */}
        <div className="mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-600 mb-6">Featured</p>
          <Link href={`/blog/${featured.slug}`} className="group block border border-stone-800 p-8 md:p-10 hover:border-stone-600 transition-colors">
            <div className="flex items-center gap-3 mb-5">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#d4ff3a] border border-[#d4ff3a]/30 px-2 py-0.5">
                {featured.tag}
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600">{featured.readTime} read</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700">{formatDate(featured.date)}</span>
            </div>
            <h2
              className="font-display italic text-stone-100 leading-tight mb-4 group-hover:text-[#d4ff3a] transition-colors"
              style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontVariationSettings: '"opsz" 80' }}
            >
              {featured.title}
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed max-w-[600px]">{featured.excerpt}</p>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 group-hover:text-[#d4ff3a] transition-colors">
              Read article →
            </div>
          </Link>
        </div>

        {/* Post grid */}
        <div className="border border-stone-800">
          {rest.map((post, idx) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={`group flex flex-col md:flex-row md:items-start gap-4 md:gap-8 px-7 py-6 hover:bg-stone-900/40 transition-colors ${idx < rest.length - 1 ? 'border-b border-stone-800' : ''}`}
            >
              <div className="md:w-32 flex-shrink-0">
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600">{formatDate(post.date)}</p>
                <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 mt-1">{post.readTime}</p>
              </div>
              <div className="flex-1">
                <span className="inline-block font-mono text-[9px] uppercase tracking-[0.2em] text-stone-500 border border-stone-800 px-2 py-0.5 mb-3">
                  {post.tag}
                </span>
                <h3
                  className="font-display italic text-stone-100 leading-tight mb-2 group-hover:text-[#d4ff3a] transition-colors"
                  style={{ fontSize: '1.2rem', fontVariationSettings: '"opsz" 80' }}
                >
                  {post.title}
                </h3>
                <p className="text-stone-500 text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
              </div>
              <div className="hidden md:block font-mono text-[10px] uppercase tracking-[0.2em] text-stone-700 group-hover:text-[#d4ff3a] transition-colors pt-0.5 flex-shrink-0">
                →
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
