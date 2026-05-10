import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

const v2Headers = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  'X-Restli-Protocol-Version': '2.0.0',
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  const userSnap = await adminDb.collection('users').doc(userId).get();
  const accounts: any[] = userSnap.data()?.connectedAccounts || [];
  const liAcc = accounts.find((a: any) => a.platform === 'linkedin');

  if (!liAcc?.accessToken || !liAcc?.authorUrn) {
    return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 });
  }

  const { accessToken, authorUrn } = liAcc;
  const headers = v2Headers(accessToken);

  // Fetch recent UGC posts by author — v2 API, no LinkedIn-Version header required
  const encodedUrn = encodeURIComponent(authorUrn);
  const postsRes = await fetch(
    `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(${encodedUrn})&sortBy=LAST_MODIFIED&count=10`,
    { headers },
  );

  if (!postsRes.ok) {
    const err = await postsRes.text();
    console.error('[LI POSTS] fetch failed', postsRes.status, err);
    return NextResponse.json({ error: 'Failed to fetch LinkedIn posts', details: err }, { status: postsRes.status });
  }

  const postsData = await postsRes.json();
  const elements: any[] = postsData.elements || [];

  // Fetch social actions (likes + comments) for each post — cap at 5 to stay fast
  const recentPosts = await Promise.all(
    elements.slice(0, 5).map(async (post: any) => {
      const postUrn = post.id as string;
      let likes = 0;
      let comments = 0;

      try {
        const saRes = await fetch(
          `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}`,
          { headers },
        );
        if (saRes.ok) {
          const sa = await saRes.json();
          likes    = sa.likesSummary?.totalLikes                    || 0;
          comments = sa.commentsSummary?.totalFirstLevelComments     || 0;
        }
      } catch { /* social actions optional */ }

      const caption =
        post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '';
      const createdMs = post.created?.time || post.firstPublishedAt || 0;
      const publishedAt = createdMs ? new Date(createdMs).toISOString() : '';
      const postId = postUrn.split(':').pop() || postUrn;

      return {
        id: postUrn,
        title: caption.slice(0, 140) || 'LinkedIn post',
        url: `https://www.linkedin.com/feed/update/${postUrn}/`,
        likes,
        comments,
        views: 0, // impressions require MDP
        publishedAt,
      };
    }),
  );

  const totalLikes    = recentPosts.reduce((s, p) => s + p.likes,    0);
  const totalComments = recentPosts.reduce((s, p) => s + p.comments, 0);

  return NextResponse.json({
    postCount:    elements.length,
    totalLikes,
    totalComments,
    recentPosts,
  });
}
