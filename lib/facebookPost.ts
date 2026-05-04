// lib/facebookPost.ts
// Publish a post (text, link, photo, or video) to a Facebook Page.
// REQUIRES scopes: pages_manage_posts.

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export interface FbPostInput {
  message: string;
  link?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export async function publishFacebookPost(
  fbAcc: any,
  input: FbPostInput,
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  const pageId = fbAcc.platformId;
  if (!pageId) return { ok: false, error: 'Missing Facebook page id.' };

  // Photo path: POST /{page-id}/photos with url + caption (published=true)
  if (input.imageUrl) {
    return await postToEndpoint(`${GRAPH}/${pageId}/photos`, {
      url: input.imageUrl,
      caption: input.message,
      access_token: fbAcc.accessToken,
    });
  }
  // Video path: POST /{page-id}/videos with file_url + description
  if (input.videoUrl) {
    return await postToEndpoint(`${GRAPH}/${pageId}/videos`, {
      file_url: input.videoUrl,
      description: input.message,
      access_token: fbAcc.accessToken,
    });
  }
  // Text / link path: POST /{page-id}/feed
  const params: Record<string, string> = {
    message: input.message,
    access_token: fbAcc.accessToken,
  };
  if (input.link) params.link = input.link;
  return await postToEndpoint(`${GRAPH}/${pageId}/feed`, params);
}

async function postToEndpoint(
  url: string,
  params: Record<string, string>,
): Promise<{ ok: boolean; postId?: string; error?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || `${res.status}` };
    }
    return { ok: true, postId: data.id || data.post_id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
