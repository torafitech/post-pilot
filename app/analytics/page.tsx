// app/analytics/page.tsx
// Unified analytics hub. Aggregates per-platform totals from
// users/{uid}/posts (the metrics docs that /api/posts/publish writes
// after a successful publish + that /api/posts/sync refreshes), then
// links into the per-platform deep dives.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection, getDocs,
} from 'firebase/firestore';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowLeft, ArrowUpRight, BarChart2, Eye, Heart, Lock,
  MessageCircle, RefreshCw, ThumbsUp, TrendingUp,
  Youtube, Twitter, Linkedin, Instagram, Facebook, Music,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { authFetch } from '@/lib/authClient';
import { db } from '@/lib/firebase';
import {
  ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_DISABLED_REASON,
  PLATFORM_LABEL, type Platform,
} from '@/lib/platformConfig';

// ── Types & maps ─────────────────────────────────────────────────────────

interface PostDoc {
  id: string;
  platform: string;
  caption: string;
  publishedAt?: any;
  metrics?: { views?: number; impressions?: number; likes?: number; comments?: number };
}

const PLATFORM_META: Record<Platform, { Icon: any; color: string; chartColor: string; deepLink: string | null }> = {
  youtube:   { Icon: Youtube,        color: 'text-red-400',     chartColor: '#f87171', deepLink: '/analytics/youtube' },
  twitter:   { Icon: Twitter,        color: 'text-sky-400',     chartColor: '#38bdf8', deepLink: null },
  linkedin:  { Icon: Linkedin,       color: 'text-blue-400',    chartColor: '#60a5fa', deepLink: null },
  instagram: { Icon: Instagram,      color: 'text-pink-400',    chartColor: '#f472b6', deepLink: null },
  facebook:  { Icon: Facebook,       color: 'text-indigo-400',  chartColor: '#818cf8', deepLink: null },
  threads:   { Icon: MessageCircle,  color: 'text-gray-200',    chartColor: '#e5e7eb', deepLink: null },
  tiktok:    { Icon: Music,          color: 'text-fuchsia-400', chartColor: '#e879f9', deepLink: null },
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span><span className="font-bold">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<PostDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Pull per-platform metrics docs that publish writes.
      const snap = await getDocs(collection(db, 'users', user.uid, 'posts'));
      const list: PostDoc[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setPosts(list);
    } catch (err: any) {
      toast.error('Could not load analytics', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    if (!user || syncing) return;
    setSyncing(true);
    try {
      const res = await authFetch('/api/posts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      if (!res.ok) throw new Error(`Sync failed (${res.status})`);
      toast.success('Metrics refreshed');
      await load();
    } catch (err: any) {
      toast.error('Sync failed', err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Per-platform aggregates
  const perPlatform = useMemo(() => {
    return ALL_PLATFORMS.map((pl) => {
      const ps = posts.filter((p) => p.platform?.toLowerCase() === pl);
      const views    = ps.reduce((s, p) => s + (p.metrics?.views ?? p.metrics?.impressions ?? 0), 0);
      const likes    = ps.reduce((s, p) => s + (p.metrics?.likes ?? 0), 0);
      const comments = ps.reduce((s, p) => s + (p.metrics?.comments ?? 0), 0);
      return { platform: pl, posts: ps.length, views, likes, comments };
    });
  }, [posts]);

  const totals = useMemo(() => {
    return perPlatform.reduce(
      (acc, p) => ({
        posts:    acc.posts    + p.posts,
        views:    acc.views    + p.views,
        likes:    acc.likes    + p.likes,
        comments: acc.comments + p.comments,
      }),
      { posts: 0, views: 0, likes: 0, comments: 0 },
    );
  }, [perPlatform]);

  // Trend: last 12 published posts (any platform), oldest -> newest
  const trend = useMemo(() => {
    const withDates = posts
      .filter((p) => p.publishedAt?.toDate)
      .map((p) => ({ ...p, _date: p.publishedAt.toDate() as Date }))
      .sort((a, b) => a._date.getTime() - b._date.getTime())
      .slice(-12);
    return withDates.map((p) => ({
      label:    p._date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      Views:    p.metrics?.views ?? p.metrics?.impressions ?? 0,
      Likes:    p.metrics?.likes ?? 0,
      Comments: p.metrics?.comments ?? 0,
    }));
  }, [posts]);

  if (authLoading || (loading && !posts.length)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  const hasAnyData = totals.posts > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-7 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-gray-800/60 transition-colors">
              <ArrowLeft size={20} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500/10">
                  <TrendingUp className="text-emerald-400" size={20} />
                </span>
                Analytics
              </h1>
              <p className="text-gray-500 text-sm mt-1 ml-12">
                Aggregated reach, engagement, and per-platform performance.
              </p>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync metrics'}
          </button>
        </div>

        {/* Empty hint */}
        {!hasAnyData && (
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-8 mb-8 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <BarChart2 className="text-emerald-400" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">No analytics yet</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Publish a post via StarlingPost or hit <strong className="text-gray-300">Sync metrics</strong> to
                refresh from connected platforms. Metrics show up once we successfully fetch them.
              </p>
            </div>
            <Link
              href="/posts/create"
              className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-sm font-semibold whitespace-nowrap"
            >
              Create post →
            </Link>
          </div>
        )}

        {/* Totals row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat label="Posts"    value={fmtNum(totals.posts)}    icon={<BarChart2 size={16} />}     accent="from-cyan-500/15 to-cyan-500/5"     iconColor="text-cyan-400" />
          <Stat label="Views"    value={fmtNum(totals.views)}    icon={<Eye size={16} />}            accent="from-purple-500/15 to-purple-500/5" iconColor="text-purple-400" />
          <Stat label="Likes"    value={fmtNum(totals.likes)}    icon={<Heart size={16} />}          accent="from-pink-500/15 to-pink-500/5"     iconColor="text-pink-400" />
          <Stat label="Comments" value={fmtNum(totals.comments)} icon={<MessageCircle size={16} />}  accent="from-emerald-500/15 to-emerald-500/5" iconColor="text-emerald-400" />
        </div>

        {/* Trend chart */}
        {trend.length > 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-bold text-white">Engagement trend</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Views, likes and comments on your last {trend.length} published posts (oldest → newest)
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="aViews"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.35} /><stop offset="95%" stopColor="#a855f7" stopOpacity={0} /></linearGradient>
                  <linearGradient id="aLikes"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} /><stop offset="95%" stopColor="#f472b6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="aComments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.35} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={42} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Area type="monotone" dataKey="Views"    stroke="#a855f7" fill="url(#aViews)"    strokeWidth={2} />
                <Area type="monotone" dataKey="Likes"    stroke="#f472b6" fill="url(#aLikes)"    strokeWidth={2} />
                <Area type="monotone" dataKey="Comments" stroke="#34d399" fill="url(#aComments)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-platform breakdown */}
        {hasAnyData && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-white mb-1">Platform comparison</h2>
            <p className="text-xs text-gray-500 mb-5">Total views and likes across each connected platform</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={perPlatform.filter((p) => p.posts > 0 || ENABLED_PLATFORMS.has(p.platform))} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="platform"
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => PLATFORM_LABEL[v as Platform]?.replace(' / X', '') || v}
                />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={42} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Bar dataKey="views"    name="Views"    fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="likes"    name="Likes"    fill="#f472b6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="comments" name="Comments" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Per-platform cards (deep links + scope notes) */}
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Per-platform</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {perPlatform.map((p) => {
            const meta = PLATFORM_META[p.platform];
            const enabled = ENABLED_PLATFORMS.has(p.platform);
            return (
              <div
                key={p.platform}
                className={`bg-gray-900 border rounded-2xl p-5 transition-colors ${enabled ? 'border-gray-800 hover:border-gray-700' : 'border-gray-800 opacity-70'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <meta.Icon size={18} className={meta.color} />
                    <span className="text-sm font-semibold text-white">
                      {PLATFORM_LABEL[p.platform]}
                    </span>
                  </div>
                  {!enabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                      <Lock size={10} /> Soon
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Mini label="Posts" value={fmtNum(p.posts)} />
                  <Mini label="Views" value={fmtNum(p.views)} />
                  <Mini label="Likes" value={fmtNum(p.likes)} />
                </div>

                {meta.deepLink ? (
                  <Link
                    href={meta.deepLink}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-800/60 hover:bg-gray-800 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <span>Deep dive</span>
                    <ArrowUpRight size={13} />
                  </Link>
                ) : !enabled ? (
                  <p className="text-[11px] text-amber-300/80 leading-snug">
                    {PLATFORM_DISABLED_REASON[p.platform] || 'Coming soon.'}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-600">
                    Detailed dashboard coming soon.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label, value, icon, accent, iconColor,
}: {
  label: string; value: string; icon: React.ReactNode;
  accent: string; iconColor: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${accent} border border-gray-800 rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/40 rounded-lg px-2 py-1.5 text-center">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}
