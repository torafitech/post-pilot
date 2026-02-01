// app/admin/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext'; // you already use this elsewhere
import { useEffect, useState } from 'react';

type Timeframe = '24h' | '7d' | '30d' | 'all';

interface AdminMetricsResponse {
    success: boolean;
    timeframe: Timeframe;
    totals: {
        totalUsers: number;
        newUsers: number;
        totalPosts: number;
        postsInTimeframe: number;
        lastUserCreatedAt: string | null;
        lastPostAt: string | null;
    };
    perUser: {
        [userId: string]: {
            email?: string;
            mobile?: string;
            totalPosts: number;
            postsInTimeframe: number;
            lastPostAt?: string;
        };
    };
}

export default function AdminDashboardPage() {
    const { user, loading: authLoading } = useAuth(); // assumes similar shape to your dashboard
    const [timeframe, setTimeframe] = useState<Timeframe>('7d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AdminMetricsResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const loadMetrics = async (tf: Timeframe) => {
        if (!user) {
            setError('Not logged in');
            setData(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Get Firebase ID token for this user
            const token = await user.getIdToken();

            const res = await fetch(`/api/admin/metrics?timeframe=${tf}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const json = (await res.json()) as AdminMetricsResponse & { error?: string };

            if (!res.ok || !json.success) {
                throw new Error(json.error || `Request failed with ${res.status}`);
            }

            setData(json);
        } catch (err: any) {
            console.error('[ADMIN] loadMetrics error', err);
            setError(err.message || 'Failed to load metrics');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            setError('Not logged in');
            setLoading(false);
            return;
        }
        loadMetrics(timeframe);
    }, [timeframe, user, authLoading]);

    if (authLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p className="text-sm text-slate-500">Checking admin access…</p>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <p className="text-sm text-slate-500">Please log in as admin to view this page.</p>
            </main>
        );
    }

    const totals = data?.totals;
    const perUserArray =
        data
            ? Object.entries(data.perUser).map(([userId, v]) => ({
                userId,
                ...v,
            }))
            : [];

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-xs text-slate-500">
                            Internal metrics for PostPilot: users, posts, and activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600">Timeframe:</span>
                        {(['24h', '7d', '30d', 'all'] as Timeframe[]).map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1 rounded-full border text-xs ${timeframe === tf
                                    ? 'bg-sky-600 text-white border-sky-600'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {tf === '24h'
                                    ? 'Last 24h'
                                    : tf === '7d'
                                        ? 'Last 7d'
                                        : tf === '30d'
                                            ? 'Last 30d'
                                            : 'All time'}
                            </button>
                        ))}
                    </div>
                </header>

                {loading && (
                    <div className="py-10 text-center text-sm text-slate-500">
                        Loading admin metrics…
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
                        {error}
                    </div>
                )}

                {!loading && data && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard
                                label="Total users"
                                value={totals?.totalUsers ?? 0}
                                helper={`New in period: ${totals?.newUsers ?? 0}`}
                            />
                            <StatCard
                                label="Total posts"
                                value={totals?.totalPosts ?? 0}
                                helper={`In period: ${totals?.postsInTimeframe ?? 0}`}
                            />
                            <StatCard
                                label="Last user registered"
                                value={
                                    totals?.lastUserCreatedAt
                                        ? new Date(totals.lastUserCreatedAt).toLocaleString()
                                        : '—'
                                }
                            />
                            <StatCard
                                label="Last post created"
                                value={
                                    totals?.lastPostAt
                                        ? new Date(totals.lastPostAt).toLocaleString()
                                        : '—'
                                }
                            />
                        </div>

                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Users & posts (per user)
                                </h2>
                                <span className="text-[11px] text-slate-500">
                                    Timeframe:{' '}
                                    {timeframe === 'all'
                                        ? 'All time'
                                        : timeframe === '24h'
                                            ? 'Last 24 hours'
                                            : timeframe === '7d'
                                                ? 'Last 7 days'
                                                : 'Last 30 days'}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px]">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-600">
                                                User ID
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-600">
                                                Email
                                            </th><th className="px-4 py-2 text-left font-semibold text-slate-600">
                                                mobile
                                            </th>

                                            <th className="px-4 py-2 text-left font-semibold text-slate-600">
                                                Total posts
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-600">
                                                Posts in period
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-slate-600">
                                                Last post time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {perUserArray.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-4 py-6 text-center text-slate-400"
                                                >
                                                    No users found.
                                                </td>
                                            </tr>
                                        )}
                                        {perUserArray.map((u) => (
                                            <tr key={u.userId} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 font-mono text-[10px] text-slate-600">
                                                    {u.userId}
                                                </td>
                                                <td className="px-4 py-2 text-slate-700">
                                                    {u.email || '—'}
                                                </td>
                                                <td className="px-4 py-2 text-slate-700">
                                                    {u.mobile || '—'}
                                                </td>
                                                <td className="px-4 py-2 text-slate-700">
                                                    {u.totalPosts}
                                                </td>
                                                <td className="px-4 py-2 text-slate-700">
                                                    {u.postsInTimeframe}
                                                </td>
                                                <td className="px-4 py-2 text-slate-500">
                                                    {u.lastPostAt
                                                        ? new Date(u.lastPostAt).toLocaleString()
                                                        : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}

function StatCard({
    label,
    value,
    helper,
}: {
    label: string;
    value: number | string;
    helper?: string;
}) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] text-slate-500 mb-1">{label}</p>
            <p className="text-xl font-semibold text-slate-900">{value}</p>
            {helper ? (
                <p className="text-[10px] text-slate-400 mt-1">{helper}</p>
            ) : null}
        </div>
    );
}
