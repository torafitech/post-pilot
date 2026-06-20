import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { POSTS, getPost } from '@/lib/blog';
import { JsonLd } from '@/components/JsonLd';

const BASE = 'https://www.starlingpost.com';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${BASE}/blog/${slug}`,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedDate ?? post.date,
      authors: [post.author],
    },
  };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Article content ─────────────────────────────────────────────────────────

function ArticleWhyCrossPosting() {
  return (
    <>
      <p>
        Every platform is a different distribution engine. YouTube is a search engine. Twitter/X is
        a recency machine. LinkedIn rewards professional dwell time. When you paste the same text
        into all three, you are optimising for none of them.
      </p>

      <h2>How each algorithm works</h2>

      <h3>YouTube</h3>
      <p>
        YouTube indexes video titles and descriptions for search. The first 100 characters of your
        description appear in search results — treat them like a meta description. Keyword placement
        in the title matters; emotional hooks matter less than search intent alignment. A description
        that says "In this video, I cover…" followed by nothing is a wasted indexing opportunity.
      </p>
      <p>
        YouTube also tracks audience retention. A video with a weak hook (the first 30 seconds) will
        see retention drop, which suppresses recommendation placement regardless of like count.
      </p>

      <h3>Twitter/X</h3>
      <p>
        Twitter operates on recency and engagement velocity. Posts that receive replies and
        quote-tweets within the first hour are pushed further. The 280-character limit means your
        hook is everything — there is no "continue reading" cushion. Hashtags on Twitter are largely
        decorative; they do not drive meaningful discovery. Images add reach; links in the body of
        a tweet can suppress reach (platform prefers content that keeps users on-site).
      </p>

      <h3>LinkedIn</h3>
      <p>
        LinkedIn's algorithm weighs dwell time heavily. A post that makes someone stop and read for
        15 seconds scores better than one that gets a quick like and a scroll-past. The first three
        lines of your post are the preview — they must create enough friction that the reader clicks
        "see more." Early comments (especially from non-followers) are a stronger signal than likes.
        External links in the post body reduce reach; put links in the first comment instead.
      </p>

      <h2>What to change per platform</h2>

      <p>
        <strong>Title/hook:</strong> Write a platform-native opening. YouTube title = keyword +
        curiosity gap. Twitter first line = the payoff (not the setup). LinkedIn first line =
        contrarian statement or specific number that triggers curiosity.
      </p>
      <p>
        <strong>Length:</strong> YouTube descriptions can use up to 5,000 characters for full
        context and keyword density. Twitter works best under 200 characters for the main post.
        LinkedIn sweet spot is 150–300 words for text-only posts.
      </p>
      <p>
        <strong>Hashtags:</strong> YouTube: 3–5 specific hashtags in the description. Twitter:
        skip them or use 1 at most. LinkedIn: 3 relevant professional hashtags maximum.
      </p>
      <p>
        <strong>CTA placement:</strong> YouTube CTAs belong in the video and in the description
        (subscribe, timestamps). Twitter CTAs go in a reply thread. LinkedIn CTAs work best as the
        closing line of the post body.
      </p>

      <h2>What to keep the same</h2>

      <p>
        Your core idea, your perspective, and your data points stay constant. What changes is the
        format and presentation layer. StarlingPost's AI enhancement takes your single caption and
        rewrites the opening hook, adjusts length, and applies platform-specific hashtag logic — so
        you keep the substance while the format adapts automatically.
      </p>

      <h2>The compound effect</h2>

      <p>
        Platforms do not talk to each other. Reaching 10,000 people on YouTube with an optimised
        video description does not hurt your LinkedIn reach, and vice versa. The only cost of
        platform-native formatting is time — and that is the problem StarlingPost exists to solve.
      </p>
    </>
  );
}

function ArticleAutomationWithoutBot() {
  return (
    <>
      <p>
        Auto-reply tools fail in one of three ways: they reply instantly (feels robotic), they reply
        with generic copy (feels dismissive), or they reply to every comment ever posted on every
        post (feels desperate). Getting automation right means solving all three.
      </p>

      <h2>Variable 1: timing</h2>

      <p>
        Instant replies are the clearest signal that a machine is responding. A human cannot read,
        process, and reply to a comment in under three seconds. Platforms like YouTube and LinkedIn
        have shown that overly rapid auto-replies can reduce comment engagement on subsequent posts
        — audiences learn that replies are automated and stop expecting meaningful interaction.
      </p>
      <p>
        StarlingPost's automation runs on a cron schedule rather than real-time webhooks. This is a
        deliberate choice: cron-based processing introduces a natural delay (minutes to hours rather
        than milliseconds), which makes replies feel less mechanical. The tradeoff is that you do
        not get sub-second response times — but for most creators, that is not the goal.
      </p>

      <h2>Variable 2: personalisation</h2>

      <p>
        The minimum bar for personalisation is the commenter's username. "Thanks, Alex!" reads
        differently than "Thanks for watching!" — even if the rest of the message is templated.
        StarlingPost supports <code>{'{username}'}</code> substitution in all template replies.
      </p>
      <p>
        The next level is contextual AI replies. Instead of a fixed template, you give the AI a
        brief instruction ("respond warmly and ask what they found most useful") and it generates a
        unique reply per comment based on what the commenter actually wrote. These replies vary
        enough that they do not pattern-match as automated, even to close readers.
      </p>
      <p>
        What does not work: templated replies that do not vary at all, especially on platforms like
        LinkedIn where the same followers see your posts repeatedly. They will notice the identical
        reply on five different posts.
      </p>

      <h2>Variable 3: scope</h2>

      <p>
        Scoping your automation to specific posts is more important than the reply content itself.
        Replying to every comment on every post you have ever published is not relationship
        building — it is noise generation. Comments on old posts often come from users who found
        your content through search; a prompt auto-reply might actually confuse them.
      </p>
      <p>
        Practical scope options that work well:
      </p>
      <ul>
        <li><strong>Last 7 days:</strong> catches active posts while ignoring the archive</li>
        <li><strong>Specific post URL:</strong> for launch content where you want high engagement density</li>
        <li><strong>Last N posts:</strong> useful for consistent content cadences where every recent post matters</li>
      </ul>

      <h2>Deduplication</h2>

      <p>
        No comment should ever receive two auto-replies. StarlingPost tracks replied comment IDs in
        Firestore — each automation type (Link Me, Auto Reply) has its own dedup collection. When
        the cron runs, it checks whether a comment ID has already been processed before sending a
        reply. This prevents double-replies even if the same comment appears in two separate cron
        runs.
      </p>

      <h2>When to skip automation entirely</h2>

      <p>
        Threads and replies to negative or nuanced comments should not be automated. If someone
        leaves a detailed critique, a templated reply makes the situation worse. Auto-reply rules
        work best for high-volume, positive or neutral comment patterns — "where's the link?", "how
        do I sign up?", "great video, keep it up". Anything that requires judgment belongs in your
        manual queue.
      </p>
    </>
  );
}

function ArticleLinkedIn2025() {
  return (
    <>
      <p>
        LinkedIn's content algorithm in 2025 is significantly different from what it was in 2022.
        Several formats that were reliable growth drivers have declined sharply. The following is
        based on patterns visible in public post performance data and LinkedIn's own creator
        documentation.
      </p>

      <h2>What changed</h2>

      <h3>Carousels (PDF documents) are declining</h3>
      <p>
        In 2022 and 2023, PDF-format carousels were the highest-engagement content type on
        LinkedIn. They drove shares, saves, and follows better than almost any other format. That
        edge has narrowed considerably. LinkedIn added native carousel posts (image-based, not PDF)
        in 2024, fragmenting the format. PDF carousels still work, but they no longer outperform
        good text posts the way they used to.
      </p>

      <h3>External links suppress reach</h3>
      <p>
        LinkedIn's algorithm continues to penalise posts that contain external links in the post
        body. The platform prefers content that keeps users on LinkedIn. The established workaround
        — putting the link in the first comment — still works. If you want to drive traffic to an
        article or product page, reference it in the post and drop the URL in a comment immediately
        after publishing.
      </p>

      <h3>Native video is back</h3>
      <p>
        LinkedIn's native video push in late 2024 brought improved reach for uploaded video
        (not YouTube links — native uploads). Captions matter: a significant share of LinkedIn
        users watch video without audio. Without captions, you lose a large portion of your
        potential audience.
      </p>

      <h2>What still works</h2>

      <h3>Text-only posts with a strong hook</h3>
      <p>
        The highest-reach format on LinkedIn in 2025 is a text-only post with a first line
        designed to make the reader click "see more." This is not clickbait — it is structural.
        LinkedIn shows roughly 3 lines of preview text. Your opening three lines determine whether
        someone reads the rest. Effective hooks share a counter-intuitive finding, a specific
        number, or a brief personal story opening.
      </p>
      <p>
        Examples that work:
      </p>
      <ul>
        <li>"I reviewed 200 LinkedIn posts. Only 12 got traction. Here's what they had in common:"</li>
        <li>"We cut our posting frequency from 5x to 2x per week. Reach went up 40%."</li>
        <li>"Three years ago I had 800 followers. I've never used a growth hack."</li>
      </ul>
      <p>
        Note the absence of "I'm excited to announce" or "Thrilled to share." Those phrases are
        correlated with low-reach posts, partly because they signal promotional content and partly
        because they waste the hook.
      </p>

      <h3>Early comments from outside your network</h3>
      <p>
        LinkedIn's algorithm treats comments from people outside your direct network as a stronger
        signal than comments from first connections. This is why posts that reach non-followers in
        the first hour tend to compound. Responding to comments quickly (within the first 2–3 hours)
        also extends the post's lifespan in the feed.
      </p>

      <h3>Consistency over virality</h3>
      <p>
        LinkedIn's algorithm rewards posting cadence. Accounts that post 2–4 times per week
        consistently show higher baseline reach than accounts that post sporadically, even if the
        sporadic posts occasionally go viral. The platform appears to build a "trust score" for
        accounts that behave predictably.
      </p>

      <h2>Posting times</h2>
      <p>
        The most-cited window for LinkedIn is Tuesday through Thursday, 8–10am in your audience's
        primary timezone. This is broadly accurate but audience-dependent. LinkedIn's own analytics
        show when your specific followers are most active — that data should override general
        guidance.
      </p>

      <h2>Hashtags</h2>
      <p>
        Use 3 hashtags maximum. More than 5 is associated with reduced reach, possibly because it
        signals low-quality or spam-adjacent content. Hashtag discovery on LinkedIn is less
        important than it used to be — most reach comes through your network and the algorithm,
        not hashtag browsing.
      </p>
    </>
  );
}

function ArticleBuildingStarlingPost() {
  return (
    <>
      <p>
        StarlingPost is a multi-platform social media scheduling and automation tool built on
        Next.js 16 (App Router), Firebase, and Vercel. This post covers the architecture decisions
        that shaped it, including several we would make differently if we started today.
      </p>

      <h2>Framework: Next.js App Router</h2>

      <p>
        We chose Next.js 16 with the App Router over a separate backend because the deployment
        model on Vercel makes API routes a first-class citizen. OAuth callback routes,
        publish endpoints, cron triggers, and webhook handlers all live in <code>app/api/</code>
        alongside the frontend. There is no separate server to deploy or maintain.
      </p>
      <p>
        The tradeoff: API routes in Next.js run as serverless functions, which means cold starts.
        For endpoints that handle OAuth callbacks (user is actively waiting), cold starts are
        noticeable. For cron endpoints, they do not matter. We accepted this tradeoff because it
        simplified the deployment stack significantly.
      </p>
      <p>
        React 19 is paired with the App Router. Server Components handle data fetching and
        rendering for SEO-critical pages; Client Components handle interactivity (the post
        composer, automation rule editor, etc.). The split is mostly clean with a few places where
        we had to lift state or wrap client UIs in server shells.
      </p>

      <h2>Database and auth: Firebase</h2>

      <p>
        Firebase Auth handles user identity. We chose it primarily because it provides OAuth sign-in
        providers out of the box and handles token refresh automatically. The alternative — building
        auth on top of NextAuth.js or a custom JWT flow — would have required significantly more
        implementation work.
      </p>
      <p>
        Firestore stores everything: user profiles, connected platform accounts (with OAuth tokens),
        scheduled posts, automation rules, and dedup tracking for auto-replies. The schema for
        connected accounts is an array on the user document:
      </p>
      <pre><code>{`users/{uid}
  connectedAccounts[]: {
    platform, platformId, accountName,
    accessToken, refreshToken,
    oauthToken, oauthTokenSecret  // Twitter OAuth 1.0a
  }`}</code></pre>
      <p>
        This works well for querying all accounts for a user in a single read. The downside: if a
        user connects 20 accounts across platforms, the user document grows large. For the scale
        we are targeting (solo creators and small agencies), this is not a problem in practice.
      </p>

      <h2>The Twitter OAuth nightmare</h2>

      <p>
        Twitter/X requires two separate OAuth flows depending on what you are doing:
      </p>
      <ul>
        <li>
          <strong>OAuth 2.0 (PKCE):</strong> Required for the v2 API endpoints — reading tweets,
          user lookup, analytics. Access tokens are short-lived and require refresh.
        </li>
        <li>
          <strong>OAuth 1.0a:</strong> Required for the v1.1 API endpoints — specifically for
          posting tweets via <code>twitter-api-v2</code>. Uses <code>oauthToken</code> and{' '}
          <code>oauthTokenSecret</code>, which do not expire.
        </li>
      </ul>
      <p>
        We ended up maintaining two separate auth flows in the codebase: one for OAuth 2.0
        (reading, analytics) and one for OAuth 1.0a (posting). Both sets of tokens live on the
        same connected account record. This is inelegant but unavoidable — Twitter's API tier
        restrictions force the split.
      </p>

      <h2>YouTube integration</h2>

      <p>
        YouTube uses the Google OAuth 2.0 flow via <code>googleapis</code>. The YouTube Data API v3
        handles channel info, video lists, analytics, and comment management. The scope requirements
        are specific: <code>youtube.readonly</code> for data access,{' '}
        <code>youtube.force-ssl</code> for write operations.
      </p>
      <p>
        Video upload is stubbed — the architecture supports it but media handling is pending. The
        file size constraints for direct upload via the API versus a resumable upload session
        require separate handling that we have not yet built.
      </p>

      <h2>Automation: cron over webhooks</h2>

      <p>
        Comment automation runs on a daily cron job via Vercel Scheduled Functions. We chose
        polling over webhooks deliberately:
      </p>
      <ul>
        <li>
          Webhooks require each platform to call a publicly accessible endpoint — which means
          authentication, signature verification, and handling platform-specific payload formats
          for six different APIs.
        </li>
        <li>
          Cron polling is simpler to implement, debug, and scale. The tradeoff is latency: replies
          go out on a schedule, not in real time. For the use cases we target (keyword auto-reply,
          templated responses), a daily cadence is acceptable.
        </li>
      </ul>

      <h2>AI: OpenAI gpt-4o-mini</h2>

      <p>
        We chose <code>gpt-4o-mini</code> over <code>gpt-4o</code> for cost. Caption enhancement
        runs per-post, per-platform — at scale, the per-token cost difference is significant.
        The quality difference for short-form copywriting tasks (caption rewriting, hashtag
        generation, CTA suggestions) is minimal.
      </p>
      <p>
        Each platform has its own system prompt specifying length constraints, tone, hashtag style,
        and what to include or avoid. The AI call returns enhanced text, hashtag suggestions, and a
        CTA, all in a single completion.
      </p>

      <h2>What we would change</h2>

      <p>
        If we were starting fresh today, we would use a separate jobs queue (something like
        Upstash QStash or BullMQ on a long-running instance) instead of Vercel cron. Serverless
        cron functions have execution time limits that constrain how much processing we can do per
        run. A queue-based approach would let us spread work across many small function invocations
        with proper retry logic and progress tracking.
      </p>
      <p>
        We would also separate the connected account tokens into their own Firestore subcollection
        rather than embedding them in the user document — cleaner access patterns and better
        security boundary (token reads do not require reading the full user profile).
      </p>
    </>
  );
}

function ArticleYouTubeCommunityPosts() {
  return (
    <>
      <p>
        Community Posts are YouTube's native text-and-media format for channel pages — distinct
        from video content. Most creators ignore them or use them infrequently. That is a missed
        opportunity: Community Posts sit in your subscribers' home feed the same way YouTube Shorts
        do, and they require no video production.
      </p>

      <h2>Availability</h2>

      <p>
        Community Posts are available to channels with 500 or more subscribers. Previously the
        threshold was 1,000 — YouTube lowered it in late 2023 to expand creator tools to smaller
        channels. If your channel has 500+ subscribers and you do not see the Community tab,
        check YouTube Studio settings or wait 24 hours after reaching the threshold.
      </p>

      <h2>Post formats</h2>

      <p>
        Community Posts support five formats:
      </p>
      <ul>
        <li>
          <strong>Text only:</strong> Plain text, up to 4,096 characters. Good for opinions,
          announcements, behind-the-scenes updates.
        </li>
        <li>
          <strong>Image:</strong> Single image with optional text. High share rate.
        </li>
        <li>
          <strong>Multi-image:</strong> Up to 5 images in a swipeable carousel. Useful for
          step-by-step content or before/after comparisons.
        </li>
        <li>
          <strong>Poll:</strong> Up to 5 options, 7-day duration. Polls consistently drive the
          highest engagement rate among all Community Post formats — they require a single tap to
          respond.
        </li>
        <li>
          <strong>Video clip:</strong> Link to one of your own YouTube videos or a YouTube Short.
          Useful for driving views to older content.
        </li>
      </ul>

      <h2>Engagement patterns</h2>

      <p>
        Community Posts surface in subscribers' home feeds and in the Community tab on your channel
        page. Unlike videos, they do not benefit from YouTube's recommendation system — they only
        reach your existing subscriber base (plus a small discovery component via search and channel
        page visits).
      </p>
      <p>
        This is actually an advantage for engagement rate measurement. A video's reach is heavily
        influenced by recommendation placement, making engagement rate noisy. A Community Post
        reaches a known audience: your subscribers. A high comment rate on a Community Post is a
        reliable signal that your audience cares about the topic.
      </p>
      <p>
        Polls generate the most comments and reactions per impression, because responding requires
        minimal effort. Image posts generate the most shares. Text-only posts with strong opinions
        or questions generate the most replies.
      </p>

      <h2>How to use them intentionally</h2>

      <h3>Tease upcoming videos</h3>
      <p>
        Post a Community update 24–48 hours before publishing a video. A single line of text plus
        a poll asking what aspect viewers are most curious about serves two purposes: it drives
        watch notification clicks when the video drops, and it tells you what your audience wants
        to see covered.
      </p>

      <h3>Maintain presence between uploads</h3>
      <p>
        If your upload cadence is weekly or slower, Community Posts let you stay in subscribers'
        feeds between videos without the production overhead. A text post with a relevant
        observation or question takes 2 minutes to write and keeps the algorithm aware your channel
        is active.
      </p>

      <h3>Survey your audience</h3>
      <p>
        Polls are the fastest market research tool available to a creator. "Which topic should I
        cover next?" or "Which format do you prefer — long-form tutorials or quick tips?" gives you
        real data from your actual audience, not from assumed demographics.
      </p>

      <h3>Re-promote evergreen content</h3>
      <p>
        Most channels have high-quality older videos that no longer appear in recommendations.
        A Community Post linking back to an older video with a brief explanation of why it is still
        relevant can drive a meaningful spike in views — particularly if the post includes a poll
        or question that invites engagement.
      </p>

      <h2>Timing</h2>

      <p>
        YouTube Studio's Audience tab shows when your subscribers are most active. Community Posts
        benefit from the same timing logic as videos: posting when your subscribers are online
        increases the chance of immediate engagement, which the algorithm uses to determine how
        widely to surface the post.
      </p>
      <p>
        Unlike Twitter, there is no hard recency penalty for Community Posts — they remain
        accessible on your channel's Community tab indefinitely. But feed distribution is
        time-sensitive: a post that gets 50 comments in the first two hours will reach more of your
        subscriber base than one that gets 50 comments spread over a week.
      </p>

      <h2>What does not work</h2>

      <p>
        Cross-posting identical content from other platforms into Community Posts rarely performs
        well. YouTube's audience expects a different register than Twitter or LinkedIn — more
        conversational, more community-focused, less professional. A LinkedIn post about industry
        trends will feel out of place in a YouTube Community tab unless you adapt it substantially.
      </p>
    </>
  );
}

const ARTICLE_CONTENT: Record<string, () => React.ReactNode> = {
  'why-cross-posting-kills-reach': ArticleWhyCrossPosting,
  'automation-without-looking-like-a-bot': ArticleAutomationWithoutBot,
  'linkedin-posting-guide-2025': ArticleLinkedIn2025,
  'building-starlingpost': ArticleBuildingStarlingPost,
  'youtube-community-posts-guide': ArticleYouTubeCommunityPosts,
};

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const Content = ARTICLE_CONTENT[slug];
  if (!Content) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.updatedDate ?? post.date,
    author: { '@type': 'Organization', name: post.author, url: BASE },
    publisher: {
      '@type': 'Organization',
      name: 'StarlingPost',
      url: BASE,
      logo: { '@type': 'ImageObject', url: `${BASE}/images/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${BASE}/blog/${slug}` },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${BASE}/blog/${slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-[#0a0a0b] grain pt-20">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />

      <div className="max-w-[720px] mx-auto px-6 md:px-10 py-20">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 mb-12">
          <Link href="/" className="hover:text-stone-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-stone-400 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-stone-500 truncate">{post.tag}</span>
        </nav>

        {/* Header */}
        <header className="mb-16 border-b border-stone-800 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#d4ff3a] border border-[#d4ff3a]/30 px-2 py-0.5">
              {post.tag}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-600">
              {post.readTime} read
            </span>
          </div>

          <h1
            className="font-display italic text-stone-100 leading-[0.95] mb-6"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontVariationSettings: '"opsz" 80' }}
          >
            {post.title}
          </h1>

          <p className="text-stone-400 text-base leading-relaxed mb-8">{post.excerpt}</p>

          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-600">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>·</span>
            <span>{post.author}</span>
          </div>
        </header>

        {/* Article body */}
        <article className="prose-article">
          <Content />
        </article>

        {/* Footer nav */}
        <div className="mt-20 pt-10 border-t border-stone-800 flex items-center justify-between">
          <Link
            href="/blog"
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 hover:text-stone-300 transition-colors"
          >
            ← All articles
          </Link>
          <Link
            href="/register"
            className="bg-[#d4ff3a] text-[#0a0a0b] px-6 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] transition-colors"
          >
            Try StarlingPost →
          </Link>
        </div>
      </div>
    </main>
  );
}
