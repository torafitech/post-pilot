// app/api/admin/metrics/route.ts
import { requireAdmin } from '@/lib/adminAuth';
import { adminDb } from '@/lib/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

type Timeframe = '24h' | '7d' | '30d' | 'all';

function getSince(timeframe: Timeframe): Timestamp | null {
    if (timeframe === 'all') return null;
    const now = new Date();
    if (timeframe === '24h') now.setDate(now.getDate() - 1);
    if (timeframe === '7d') now.setDate(now.getDate() - 7);
    if (timeframe === '30d') now.setDate(now.getDate() - 30);
    return Timestamp.fromDate(now);
}

export async function GET(req: NextRequest) {
    try {
        // 1) Ensure the caller is an admin
        await requireAdmin(req);

        // 2) Existing metrics logic
        const { searchParams } = new URL(req.url);
        const timeframe = (searchParams.get('timeframe') as Timeframe) || '7d';
        const since = getSince(timeframe);

        const usersRef = adminDb.collection('users');
        const usersSnap = await usersRef.get();

        const totalUsers = usersSnap.size;
        let newUsers = 0;
        let lastUserCreatedAt: Date | null = null;

        const userMeta: Record<string, { email?: string; mobile?: string; createdAt?: Date | null }> = {};


        usersSnap.forEach((doc) => {
            const data = doc.data() as any;
            const createdAt: Date | null =
                data.createdAt?.toDate?.() ??
                (data.createdAt ? new Date(data.createdAt) : null);

            if (createdAt) {
                if (!lastUserCreatedAt || createdAt > lastUserCreatedAt) {
                    lastUserCreatedAt = createdAt;
                }
                if (since && createdAt >= since.toDate()) {
                    newUsers += 1;
                }
            }

            userMeta[doc.id] = {
                email: data.email,
                mobile: data.mobile || data.mobile || data.mobileNumber, // adjust to your field name
                createdAt,
            };
        });

        let totalPosts = 0;
        let postsInTimeframe = 0;
        let lastPostAt: Date | null = null;

        const perUserStats: Record<
            string,
            {
                email?: string;
                mobile?: string;
                totalPosts: number;
                postsInTimeframe: number;
                lastPostAt?: string;
            }
        > = {};

        for (const userDoc of usersSnap.docs) {
            const userId = userDoc.id;
            const meta = userMeta[userId] || {};
            const postsRef = adminDb
                .collection('users')
                .doc(userId)
                .collection('posts');

            const postsSnap = await postsRef.get();

            let userTotal = 0;
            let userPeriod = 0;
            let userLastPost: Date | null = null;

            postsSnap.forEach((postDoc) => {
                const post = postDoc.data() as any;
                const publishedAt: Date | null =
                    post.publishedAt?.toDate?.() ??
                    (post.publishedAt ? new Date(post.publishedAt) : null);

                userTotal += 1;
                totalPosts += 1;

                if (publishedAt) {
                    if (!lastPostAt || publishedAt > lastPostAt) {
                        lastPostAt = publishedAt;
                    }
                    if (!userLastPost || publishedAt > userLastPost) {
                        userLastPost = publishedAt;
                    }
                    if (since && publishedAt >= since.toDate()) {
                        postsInTimeframe += 1;
                        userPeriod += 1;
                    }
                }
            });

            perUserStats[userId] = {
                email: meta.email,
                mobile: meta.mobile,
                totalPosts: userTotal,
                postsInTimeframe: userPeriod,
                // lastPostAt: userLastPost?.toString() || undefined,
            };
        }

        return NextResponse.json({
            success: true,
            timeframe,
            totals: {
                totalUsers,
                newUsers,
                totalPosts,
                postsInTimeframe,
                // lastUserCreatedAt: lastUserCreatedAt?.toISOString() ?? null,
                // lastPostAt: lastPostAt?.toISOString() ?? null,
            },
            perUser: perUserStats,
        });
    } catch (err: any) {
        console.error('[ADMIN METRICS] error', err);
        const msg = err?.message || 'Unknown error';

        // Map auth errors to 401/403
        if (msg.startsWith('Unauthorized')) {
            return NextResponse.json({ success: false, error: msg }, { status: 401 });
        }
        if (msg.startsWith('Forbidden')) {
            return NextResponse.json({ success: false, error: msg }, { status: 403 });
        }

        return NextResponse.json(
            { success: false, error: msg },
            { status: 500 },
        );
    }
}
