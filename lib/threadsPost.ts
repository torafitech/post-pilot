// lib/threadsPost.ts
// Publish a Threads post (text, image, or video).
// REQUIRES scopes: threads_content_publish.
// Two-step container flow: create container → publish.

const THREADS_API = 'https://graph.threads.net/v1.0';

export interface ThPostInput {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

export async function publishThreadsPost(
  thAcc: any,
  input: ThPostInput,
): Promise<{ ok: boolean; threadId?: string; error?: string }> {
  const userId = thAcc.platformId;
  if (!userId) return { ok: false, error: 'Missing Threads user id.' };

  const params: Record<string, string> = {
    text: input.text || '',
    access_token: thAcc.accessToken,
  };
  if (input.videoUrl) {
    params.media_type = 'VIDEO';
    params.video_url = input.videoUrl;
  } else if (input.imageUrl) {
    params.media_type = 'IMAGE';
    params.image_url = input.imageUrl;
  } else {
    params.media_type = 'TEXT';
  }

  try {
    // Step 1: create container
    const initRes = await fetch(`${THREADS_API}/${userId}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });
    const initData = await initRes.json().catch(() => ({}));
    if (!initRes.ok || !initData.id) {
      return { ok: false, error: initData?.error?.message || `init ${initRes.status}` };
    }

    // Step 2: publish
    const pubRes = await fetch(`${THREADS_API}/${userId}/threads_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: initData.id,
        access_token: thAcc.accessToken,
      }),
    });
    const pubData = await pubRes.json().catch(() => ({}));
    if (!pubRes.ok) {
      return { ok: false, error: pubData?.error?.message || `publish ${pubRes.status}` };
    }
    return { ok: true, threadId: pubData.id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
