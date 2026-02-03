// app/api/cron/publish-scheduled-posts/route.ts
import { adminDb } from '@/lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
    try {
        const now = new Date();

        // 1) Find due scheduled posts
        const snapshot = await adminDb
            .collection('posts')
            .where('status', '==', 'scheduled')
            .where('scheduledTime', '<=', now)
            .limit(20) // safety limit per run
            .get();

        if (snapshot.empty) {
            return NextResponse.json({ success: true, processed: 0 });
        }

        const baseUrl = 'https://www.starlingpost.com';

        let processed = 0;
        const batch = adminDb.batch();

        for (const doc of snapshot.docs) {
            const post = doc.data() as any;
            const postId = doc.id;
            const userId = post.userId as string | undefined;

            if (!userId) {
                console.warn('Post without userId, skipping:', postId);
                batch.update(doc.ref, {
                    status: 'failed',
                    updatedAt: new Date(),
                    errorMessage: 'Missing userId in scheduled post',
                });
                continue;
            }

            const platforms: string[] = post.platforms || [];
            const caption: string = post.caption || '';
            const imageUrl: string | null = post.imageUrl || null;
            const videoUrl: string | null = post.videoUrl || null;
            const platformContent: any = post.platformContent || {};

            if (!caption || platforms.length === 0) {
                batch.update(doc.ref, {
                    status: 'failed',
                    updatedAt: new Date(),
                    errorMessage: 'Missing caption or platforms in scheduled post',
                });
                continue;
            }

            try {
                // 2) Call the same publish endpoint your "Publish Now" uses
                const res = await fetch(`${baseUrl}/api/posts/publish`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // signal internal call if you ever need to bypass getUserIdFromRequest
                        // 'x-internal-cron': '1',
                    },
                    body: JSON.stringify({
                        postId,
                        platforms,
                        caption,
                        imageUrl,
                        videoUrl,
                        platformContent,
                    }),
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || !data.success) {
                    console.error('Publish from cron failed:', postId, data);
                    batch.update(doc.ref, {
                        status: 'failed',
                        updatedAt: new Date(),
                        errorMessage:
                            data?.details ||
                            data?.error ||
                            'Publish API failed from cron',
                    });
                } else {
                    // publish route itself updates status to published/partially_published,
                    // but we also mark it as processed here to be safe 
                    batch.update(doc.ref, {
                        updatedAt: new Date(),
                    });
                }

                processed += 1;
            } catch (err: any) {
                console.error('Error calling publish API for', postId, err);
                batch.update(doc.ref, {
                    status: 'failed',
                    updatedAt: new Date(),
                    errorMessage: err?.message || 'Exception in cron publish',
                });
            }
        }

        await batch.commit();

        return NextResponse.json({
            success: true,
            processed,
        });
    } catch (err: any) {
        console.error('Cron publish error:', err);
        return NextResponse.json(
            { success: false, error: err?.message || 'Cron error' },
            { status: 500 },
        );
    }
}