// lib/instagramPost.ts
// Publish image / Reel to Instagram Business / Creator account.
// REQUIRES scopes: instagram_content_publish.
// Two-step container flow (create → publish).

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export interface IgPostInput {
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
}

export async function publishInstagramPost(
  igAcc: any,
  input: IgPostInput,
): Promise<{ ok: boolean; mediaId?: string; error?: string }> {
  const igUserId = igAcc.platformId;
  if (!igUserId) return { ok: false, error: 'Missing Instagram business user id.' };
  if (!input.imageUrl && !input.videoUrl) {
    return { ok: false, error: 'Instagram requires an image or video.' };
  }

  const params: Record<string, string> = {
    caption: input.caption || '',
    access_token: igAcc.accessToken,
  };
  if (input.videoUrl) {
    params.media_type = 'REELS';
    params.video_url = input.videoUrl;
  } else if (input.imageUrl) {
    params.image_url = input.imageUrl;
  }

  try {
    const initRes = await fetch(`${GRAPH}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok) {
      return { ok: false, error: initData?.error?.message || `init ${initRes.status}` };
    }
    const creationId = initData.id;
    if (!creationId) return { ok: false, error: 'Instagram did not return a creation id.' };

    // Reels need the container to finish processing — the publish endpoint
    // will return a transient error if called too early. Caller can retry.
    const pubRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: igAcc.accessToken,
      }),
    });
    const pubData = await pubRes.json().catch(() => ({}));
    if (!pubRes.ok) {
      return { ok: false, error: pubData?.error?.message || `publish ${pubRes.status}` };
    }
    return { ok: true, mediaId: pubData.id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
