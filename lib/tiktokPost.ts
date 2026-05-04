// lib/tiktokPost.ts
// Initiate a TikTok video upload via the Content Posting API.
// REQUIRES scopes: video.upload, video.publish (TikTok Developer
// approval needed for production use).
//
// This implementation uses the PULL_FROM_URL flow which is simpler than
// chunked uploads — TikTok will fetch the video from the provided URL.

const TIKTOK_API = 'https://open.tiktokapis.com/v2';

export interface TtPostInput {
  videoUrl: string;       // public URL TikTok can fetch
  title?: string;
  description?: string;
  privacy?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
}

export async function publishTikTokVideo(
  ttAcc: any,
  input: TtPostInput,
): Promise<{ ok: boolean; publishId?: string; error?: string }> {
  if (!input.videoUrl) return { ok: false, error: 'TikTok requires a public video URL.' };

  try {
    const res = await fetch(`${TIKTOK_API}/post/publish/video/init/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ttAcc.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: input.title || input.description || '',
          privacy_level: input.privacy || 'PUBLIC_TO_EVERYONE',
          disable_comment: false,
          disable_duet: false,
          disable_stitch: false,
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: input.videoUrl,
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || `TikTok ${res.status}` };
    }
    return { ok: true, publishId: data?.data?.publish_id };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
