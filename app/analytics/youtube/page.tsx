// app/analytics/youtube/page.tsx
// Real analytics from /api/youtube/analytics — no mock metrics. If we
// haven't computed something legitimately (e.g. subscriber-growth %),
// we don't render a fake badge for it.
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowLeft, Eye, ThumbsUp, MessageCircle, Clock, TrendingUp, Users,
  Video, RefreshCw, AlertCircle, ExternalLink,
} from 'lucide-react';

interface YTVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  watchTime: number;
}

interface YTAnalyticsResponse {
  channelInfo: {
    channelId: string;
    channelName: string;
    subscriberCount: number;
    viewCount: number;
    videoCount: number;
    profileImageUrl: string;
    customUrl?: string;
  };
  videos: YTVideo[];
  videoMetrics: {
    totalViews: number;
    totalLikes: number;
    totalComments: number;
    totalWatchTime: number;     // seconds
    avgViewDuration: number;
    engagementRate: number;     // percent
    topVideo: YTVideo | null;
    recentVideos: YTVideo[];
  };
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function fmtHours(seconds: number): string {
  const h = seconds / 3600;
  if (h >= 1) return `${h.toFixed(1)}h`;
  const m = seconds / 60;
  return `${Math.round(m)}m`;
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

export default function YouTubeAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<YTAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const fetchAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setNeedsReauth(false);
    try {
      const res = await fetch(`/api/youtube/analytics?userId=${user.uid}`);
      const body = await res.json();
      if (!res.ok) {
        if (body?.needsReauth) setNeedsReauth(true);
        throw new Error(body?.error || 'Failed to load YouTube analytics');
      }
      setData(body as YTAnalyticsResponse);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); /* eslint-disable-next-line */ }, [user?.uid]);

  // Recent activity time-series (per-video, ordered oldest -> newest)
  const trend = useMemo(() => {
    if (!data) return [];
    return [...data.videos]
      .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
      .slice(-12)
      .map((v) => ({
        label: new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Views:    v.views,
        Likes:    v.likes,
        Comments: v.comments,
      }));
  }, [data]);

  const top5 = useMemo(() => {
    if (!data) return [];
    return [...data.videos]
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
      .map((v) => ({ name: v.title.length > 28 ? v.title.slice(0, 27) + '…' : v.title, Views: v.views, Likes: v.likes }));
  }, [data]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-9 h-9 text-red-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading YouTube analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <h2 className="text-lg font-bold text-white">Couldn't load analytics</h2>
          </div>
          <p className="text-gray-400 text-sm mb-5">{error}</p>
          <div className="flex gap-2">
            {needsReauth ? (
              <Link
                href="/dashboard"
                className="flex-1 px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-sm font-medium text-center hover:bg-red-500/30 transition-colors"
              >
                Reconnect YouTube
              </Link>
            ) : (
              <button
                onClick={fetchAnalytics}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl"
              >
                Try again
              </button>
            )}
            <Link
              href="/dashboard"
              className="px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-xl"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const ch = data.channelInfo;
  const m = data.videoMetrics;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-gray-800/60">
              <ArrowLeft size={20} className="text-gray-400" />
            </Link>
            {ch.profileImageUrl && (
              <img src={ch.profileImageUrl} alt="" className="w-12 h-12 rounded-full ring-2 ring-red-500/30" />
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate">{ch.channelName}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {ch.customUrl && <span className="truncate">{ch.customUrl}</span>}
                <a
                  href={`https://www.youtube.com/channel/${ch.channelId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-red-400"
                >
                  <ExternalLink size={11} /> View on YouTube
                </a>
              </div>
            </div>
          </div>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Stat row — only metrics we can prove */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat label="Subscribers"  value={fmtNum(ch.subscriberCount)} icon={<Users size={16} />}        accent="from-red-500/20 to-red-500/5"     iconColor="text-red-400" />
          <Stat label="Total Views"  value={fmtNum(ch.viewCount)}       icon={<Eye size={16} />}          accent="from-cyan-500/20 to-cyan-500/5"   iconColor="text-cyan-400" />
          <Stat label="Videos"       value={fmtNum(ch.videoCount)}      icon={<Video size={16} />}        accent="from-purple-500/20 to-purple-500/5" iconColor="text-purple-400" />
          <Stat label="Engagement"   value={`${m.engagementRate.toFixed(2)}%`} icon={<TrendingUp size={16} />} accent="from-emerald-500/20 to-emerald-500/5" iconColor="text-emerald-400" />
        </div>

        {/* Engagement totals row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Stat label="Likes (last 100 videos)"     value={fmtNum(m.totalLikes)}    icon={<ThumbsUp size={16} />}      accent="from-pink-500/15 to-pink-500/5"   iconColor="text-pink-400" small />
          <Stat label="Comments (last 100 videos)"  value={fmtNum(m.totalComments)} icon={<MessageCircle size={16} />} accent="from-blue-500/15 to-blue-500/5"   iconColor="text-blue-400"   small />
          <Stat label="Total runtime"               value={fmtHours(m.totalWatchTime)} icon={<Clock size={16} />}      accent="from-amber-500/15 to-amber-500/5" iconColor="text-amber-400"  small />
          <Stat label="Avg video length"            value={fmtHours(m.avgViewDuration)} icon={<Clock size={16} />}     accent="from-gray-500/15 to-gray-500/5"   iconColor="text-gray-400"   small />
        </div>

        {/* Recent video trend */}
        {trend.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
            <h2 className="text-sm font-bold text-white mb-1">Recent video performance</h2>
            <p className="text-xs text-gray-500 mb-5">
              Views, likes and comments on your last {trend.length} uploads
            </p>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="ytViews"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} /><stop offset="95%" stopColor="#22d3ee" stopOpacity={0} /></linearGradient>
                  <linearGradient id="ytLikes"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} /><stop offset="95%" stopColor="#f472b6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="ytComments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.35} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={42} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                <Area type="monotone" dataKey="Views"    stroke="#22d3ee" fill="url(#ytViews)"    strokeWidth={2} />
                <Area type="monotone" dataKey="Likes"    stroke="#f472b6" fill="url(#ytLikes)"    strokeWidth={2} />
                <Area type="monotone" dataKey="Comments" stroke="#34d399" fill="url(#ytComments)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top videos */}
        {top5.length > 0 && (
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-1">Top 5 videos by views</h2>
              <p className="text-xs text-gray-500 mb-5">From your most recent 100 uploads</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={top5} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={170} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Bar dataKey="Views" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="Likes" fill="#f472b6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {m.topVideo && (
              <div className="bg-gradient-to-br from-red-500/10 to-pink-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col">
                <p className="text-[10px] uppercase tracking-widest font-bold text-red-300 mb-3">Top performer</p>
                {m.topVideo.thumbnail && (
                  <img src={m.topVideo.thumbnail} alt="" className="rounded-xl mb-3 aspect-video object-cover" />
                )}
                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{m.topVideo.title}</h3>
                <div className="grid grid-cols-3 gap-2 mt-auto">
                  <Stat3 label="Views"    value={fmtNum(m.topVideo.views)} />
                  <Stat3 label="Likes"    value={fmtNum(m.topVideo.likes)} />
                  <Stat3 label="Comments" value={fmtNum(m.topVideo.comments)} />
                </div>
                <a
                  href={`https://www.youtube.com/watch?v=${m.topVideo.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 text-xs font-medium"
                >
                  Watch on YouTube <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Recent videos table */}
        {m.recentVideos.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-sm font-bold text-white">Recent uploads</h2>
            </div>
            <div className="divide-y divide-gray-800/60">
              {m.recentVideos.map((v) => (
                <a
                  key={v.id}
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-800/30 transition-colors"
                >
                  {v.thumbnail && (
                    <img src={v.thumbnail} alt="" className="w-20 aspect-video rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-1">{v.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(v.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Eye size={11} />{fmtNum(v.views)}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={11} />{fmtNum(v.likes)}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} />{fmtNum(v.comments)}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.videos.length === 0 && (
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
            <Video size={36} className="text-gray-700 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1">No videos yet</h3>
            <p className="text-gray-500 text-sm">Upload to your channel to see analytics here.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label, value, icon, accent, iconColor, small,
}: {
  label: string; value: string; icon: React.ReactNode;
  accent: string; iconColor: string; small?: boolean;
}) {
  return (
    <div className={`bg-gradient-to-br ${accent} border border-gray-800 rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-2.5">
        <span className={`text-xs font-semibold uppercase tracking-wider text-gray-400`}>{label}</span>
        <span className={iconColor}>{icon}</span>
      </div>
      <p className={`font-bold text-white ${small ? 'text-xl' : 'text-3xl'}`}>{value}</p>
    </div>
  );
}

function Stat3({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900/60 rounded-lg px-2 py-1.5 text-center">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
    </div>
  );
}
