'use client';

import { PremiumModal } from '@/components/PremiumModal';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { DashboardPost, SocialPost } from '@/types/post';
import {
  collection, doc, getDoc, getDocs, limit,
  orderBy, query, updateDoc, where,
} from 'firebase/firestore';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowUpRight, BarChart2, Bot, Calendar, CheckCircle2, Clock, Eye,
  Globe, Heart, Linkedin, MessageCircle, PlusCircle, RefreshCw,
  Settings, ThumbsUp, TrendingUp, Twitter, Users, Video, Youtube,
  Zap, Link2, AlertCircle, X, Instagram, Facebook, Music, Lock,
} from 'lucide-react';
import { ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_DISABLED_REASON, PLATFORM_LABEL } from '@/lib/platformConfig';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedAccount {
  id: string;
  platform: string;
  platformId?: string;
  accountName: string;
  accessToken: string;
  connectedAt: Date;
}

const PLATFORMS = ALL_PLATFORMS;
type Platform = typeof PLATFORMS[number];

const platformMeta: Record<Platform, {
  Icon: React.ElementType; color: string; bg: string; border: string;
  label: string; chartColor: string;
}> = {
  youtube:   { Icon: Youtube,   color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'YouTube',     chartColor: '#f87171' },
  twitter:   { Icon: Twitter,   color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/30',     label: 'Twitter/X',   chartColor: '#38bdf8' },
  linkedin:  { Icon: Linkedin,  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    label: 'LinkedIn',    chartColor: '#60a5fa' },
  instagram: { Icon: Instagram, color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/30',    label: 'Instagram',   chartColor: '#f472b6' },
  facebook:  { Icon: Facebook,  color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  border: 'border-indigo-500/30',  label: 'Facebook',    chartColor: '#818cf8' },
  threads:   { Icon: MessageCircle, color: 'text-gray-200', bg: 'bg-gray-500/10',   border: 'border-gray-500/30',    label: 'Threads',     chartColor: '#e5e7eb' },
  tiktok:    { Icon: Music,     color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', label: 'TikTok',      chartColor: '#e879f9' },
};

const oauthRoute: Record<Platform, (uid: string) => string> = {
  youtube:   uid => `/api/auth/youtube?uid=${encodeURIComponent(uid)}`,
  twitter:   uid => `/api/auth/twitter/oauth1?uid=${encodeURIComponent(uid)}`,
  linkedin:  uid => `/api/auth/linkedin?uid=${encodeURIComponent(uid)}`,
  instagram: uid => `/api/auth/instagram?uid=${encodeURIComponent(uid)}`,
  facebook:  uid => `/api/auth/facebook?uid=${encodeURIComponent(uid)}`,
  threads:   uid => `/api/auth/threads?uid=${encodeURIComponent(uid)}`,
  tiktok:    uid => `/api/auth/tiktok?uid=${encodeURIComponent(uid)}`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function untilTime(d: Date) {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return 'Due now';
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (days > 0) return `${days}d ${h % 24}h`;
  if (h > 0)   return `${h}h ${m % 60}m`;
  return `${m}m`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span><span className="font-bold">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [postFilter, setPostFilter] = useState<'all' | Platform>('all');
  const [reconnectBanner, setReconnectBanner] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    Promise.all([fetchAccounts(), fetchPosts()]).finally(() => setLoading(false));
  }, [user, authLoading]); // eslint-disable-line

  const fetchAccounts = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return;
    const list: ConnectedAccount[] = (snap.data()?.connectedAccounts || []).map((a: any) => ({
      id: a.id,
      platform: a.platform?.toLowerCase(),
      platformId: a.platformId,
      accountName: a.accountName || a.accountLabel || a.platform,
      accessToken: a.accessToken || '',
      connectedAt: a.connectedAt?.toDate?.() ?? new Date(),
    }));
    setAccounts(list);
    // Warn if YouTube was connected without force-ssl scope
    const ytOld = list.find(a => a.platform === 'youtube');
    if (ytOld) setReconnectBanner(true); // always show until re-auth; dismissed per session
  };

  const fetchPosts = async () => {
    if (!user) return;

    // Pull both: top-level scheduler docs (status, scheduled time,
    // platforms list) AND per-platform metric docs that publish writes
    // to users/{uid}/posts. Merge metrics into the scheduler docs by
    // matching platformPostIds[platform] -> doc id of the metric record.
    const [schedSnap, metricsSnap] = await Promise.all([
      getDocs(query(
        collection(db, 'posts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(200),
      )),
      getDocs(collection(db, 'users', user.uid, 'posts')),
    ]);

    // Build lookup: platformPostId -> aggregated metrics (sum across
    // platforms for the same scheduler post).
    const metricsByPlatformPostId: Record<string, any> = {};
    metricsSnap.forEach((d) => {
      metricsByPlatformPostId[d.id] = (d.data() as any).metrics || {};
    });

    const list: SocialPost[] = [];
    schedSnap.forEach((d) => {
      const data = d.data() as any;
      const platformPostIds: Record<string, string> = data.platformPostIds || {};
      // Aggregate metrics across every platform-specific copy.
      const merged: Record<string, number> = {};
      for (const platformId of Object.values(platformPostIds)) {
        const m = metricsByPlatformPostId[platformId];
        if (!m) continue;
        for (const [k, v] of Object.entries(m)) {
          if (typeof v === 'number') merged[k] = (merged[k] || 0) + v;
        }
      }
      const finalMetrics = Object.keys(merged).length ? merged : data.metrics;
      list.push({ id: d.id, ...data, metrics: finalMetrics } as any);
    });

    setPosts(list);
  };

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await fetch('/api/posts/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });
      await fetchPosts();
    } finally { setSyncing(false); }
  };

  const handleConnect = (platform: Platform) => {
    if (!user) return;
    window.location.href = oauthRoute[platform](user.uid);
  };

  const handleDisconnect = async (accountId: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const filtered = (snap.data()?.connectedAccounts || []).filter((a: any) => a.id !== accountId);
      await updateDoc(ref, { connectedAccounts: filtered });
    }
    setAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const published = useMemo(() =>
    posts.filter(p => p.publishedAt && typeof p.publishedAt.toDate === 'function')
      .sort((a, b) => b.publishedAt!.toDate().getTime() - a.publishedAt!.toDate().getTime()),
    [posts]);

  const scheduled = useMemo(() =>
    posts.filter(p => p.status === 'scheduled' && p.scheduledTime && typeof p.scheduledTime.toDate === 'function')
      .sort((a, b) => a.scheduledTime!.toDate().getTime() - b.scheduledTime!.toDate().getTime()),
    [posts]);

  const filtered = useMemo(() =>
    postFilter === 'all' ? published : published.filter(p => p.platform?.toLowerCase() === postFilter),
    [published, postFilter]);

  const totalViews    = useMemo(() => published.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0), [published]);
  const totalLikes    = useMemo(() => published.reduce((s, p) => s + (p.metrics?.likes || 0), 0), [published]);
  const totalComments = useMemo(() => published.reduce((s, p) => s + (p.metrics?.comments || 0), 0), [published]);

  // Per-platform breakdown for analytics — only enabled platforms or
  // ones that already have published posts.
  const platformStats = useMemo(() => {
    return PLATFORMS
      .filter(pl => ENABLED_PLATFORMS.has(pl) || published.some(p => p.platform?.toLowerCase() === pl))
      .map(pl => {
        const plPosts = published.filter(p => p.platform?.toLowerCase() === pl);
        return {
          platform: pl,
          posts:    plPosts.length,
          views:    plPosts.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0),
          likes:    plPosts.reduce((s, p) => s + (p.metrics?.likes || 0), 0),
          comments: plPosts.reduce((s, p) => s + (p.metrics?.comments || 0), 0),
        };
      });
  }, [published]);

  // Monthly post frequency (last 8 months)
  const postsByMonth = useMemo(() => {
    const map: Record<string, { month: string; YouTube: number; 'Twitter/X': number; LinkedIn: number }> = {};
    published.forEach(p => {
      const d = p.publishedAt!.toDate();
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: key, YouTube: 0, 'Twitter/X': 0, LinkedIn: 0 };
      const pl = p.platform?.toLowerCase();
      if (pl === 'youtube') map[key].YouTube++;
      else if (pl === 'twitter') map[key]['Twitter/X']++;
      else if (pl === 'linkedin') map[key].LinkedIn++;
    });
    return Object.values(map).slice(-8);
  }, [published]);

  // Views trend (last 8 published posts per platform)
  const viewsTrend = useMemo(() => {
    return published.slice(0, 12).reverse().map((p, i) => ({
      idx: i + 1,
      views: p.metrics?.views || p.metrics?.impressions || 0,
      likes: p.metrics?.likes || 0,
      comments: p.metrics?.comments || 0,
    }));
  }, [published]);

  // accounts by platform (multiple per platform supported)
  const accountsByPlatform = useMemo(() => {
    const map: Partial<Record<Platform, ConnectedAccount[]>> = {};
    accounts.forEach(a => {
      if (PLATFORMS.includes(a.platform as Platform)) {
        const pl = a.platform as Platform;
        if (!map[pl]) map[pl] = [];
        map[pl]!.push(a);
      }
    });
    return map;
  }, [accounts]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-800 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Reconnect banner ── */}
        {reconnectBanner && accounts.some(a => a.platform === 'youtube') && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Action required:</span> Re-connect your YouTube account to enable comment automation (Link Me & Auto Reply).
              The new connection grants the <code className="text-xs bg-amber-500/10 px-1 py-0.5 rounded">youtube.force-ssl</code> scope needed to post comments.
              <button
                onClick={() => handleConnect('youtube')}
                className="ml-3 underline hover:text-amber-200 transition-colors"
              >
                Reconnect now →
              </button>
            </div>
            <button onClick={() => setReconnectBanner(false)} className="text-amber-400 hover:text-amber-200">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">{greet}</p>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {userProfile?.displayName || user.email?.split('@')[0] || 'Creator'}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Tab switcher */}
            <div className="flex p-1 bg-gray-900 border border-gray-800 rounded-xl">
              {(['overview', 'analytics'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >{t}</button>
              ))}
            </div>

            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
            <button onClick={() => setShowPremium(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-sm font-medium transition-colors">
              <Zap size={14} /> Upgrade
            </button>
            <Link href="/posts/create"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all">
              <PlusCircle size={14} /> Create Post
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Posts',    value: fmtNum(published.length),               sub: 'Published',        icon: <Video size={16} />,       glow: 'bg-cyan-500' },
            { label: 'Total Views',    value: fmtNum(totalViews),                     sub: 'Views & impressions',icon: <Eye size={16} />,         glow: 'bg-purple-500' },
            { label: 'Engagements',    value: fmtNum(totalLikes + totalComments),      sub: 'Likes + comments', icon: <Heart size={16} />,       glow: 'bg-pink-500' },
            { label: 'In Queue',       value: fmtNum(scheduled.length),               sub: 'Scheduled posts',  icon: <Clock size={16} />,       glow: 'bg-amber-500' },
          ].map(s => (
            <div key={s.label} className="relative overflow-hidden rounded-2xl p-5 bg-gray-900 border border-gray-800">
              <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${s.glow}`} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</span>
                <span className="text-gray-700">{s.icon}</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs text-gray-600 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Platform cards (multi-account) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Connected Accounts</h2>
            <span className="text-xs text-gray-600">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {PLATFORMS.map(pl => {
              const meta = platformMeta[pl];
              const enabled = ENABLED_PLATFORMS.has(pl);
              const plAccounts = accountsByPlatform[pl] || [];
              const plPosts = published.filter(p => p.platform?.toLowerCase() === pl);
              const plViews = plPosts.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0);
              const plLikes = plPosts.reduce((s, p) => s + (p.metrics?.likes || 0), 0);

              return (
                <div
                  key={pl}
                  className={`relative bg-gray-900 border rounded-2xl p-5 transition-colors ${
                    !enabled
                      ? 'border-gray-800 opacity-60'
                      : plAccounts.length
                        ? 'border-gray-800 hover:border-gray-700'
                        : 'border-dashed border-gray-800'
                  }`}
                >
                  {!enabled && (
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-semibold uppercase tracking-wide"
                      title={PLATFORM_DISABLED_REASON[pl] || 'Coming soon'}
                    >
                      <Lock size={10} /> Soon
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                        <meta.Icon size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{meta.label}</div>
                        <div className="text-xs text-gray-600">{plAccounts.length} account{plAccounts.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    {enabled && (
                      <button
                        onClick={() => handleConnect(pl)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          plAccounts.length
                            ? `${meta.bg} ${meta.color} border ${meta.border} hover:opacity-80`
                            : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                        }`}
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  {plAccounts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {plAccounts.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between px-3 py-2 bg-gray-800/60 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                            <span className="text-xs text-gray-300 truncate">{acc.accountName}</span>
                          </div>
                          <button onClick={() => handleDisconnect(acc.id)} className="text-gray-700 hover:text-red-400 ml-2 flex-shrink-0 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!enabled ? (
                    <div className="text-[11px] text-amber-300/80 leading-snug">
                      {PLATFORM_DISABLED_REASON[pl] || 'Integration coming soon.'}
                    </div>
                  ) : plAccounts.length === 0 ? (
                    <button onClick={() => handleConnect(pl)}
                      className="w-full py-2 rounded-xl border border-dashed border-gray-700 text-gray-600 hover:text-gray-400 text-xs transition-colors">
                      Connect {meta.label}
                    </button>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: plPosts.length, l: 'Posts' },
                        { v: fmtNum(plViews), l: 'Views' },
                        { v: fmtNum(plLikes), l: 'Likes' },
                      ].map(s => (
                        <div key={s.l} className="bg-gray-800/40 rounded-xl p-2 text-center">
                          <div className="text-sm font-bold text-white">{s.v}</div>
                          <div className="text-[10px] text-gray-600">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Recent posts */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 size={15} className="text-emerald-400" /> Recent Posts
                </h2>
                <div className="flex gap-1">
                  {(['all', ...PLATFORMS] as const).map(f => (
                    <button key={f} onClick={() => setPostFilter(f as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        postFilter === f ? 'bg-gray-700 text-white' : 'text-gray-600 hover:text-gray-300'
                      }`}>
                      {f === 'all' ? 'All' : platformMeta[f as Platform].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-gray-800/60">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-14 gap-2">
                    <Video size={28} className="text-gray-800" />
                    <p className="text-sm text-gray-600">No published posts yet.</p>
                    <Link href="/posts/create" className="text-xs text-cyan-400 hover:text-cyan-300">Create your first post →</Link>
                  </div>
                ) : filtered.slice(0, 10).map(post => {
                  const meta = platformMeta[post.platform?.toLowerCase() as Platform];
                  const date = post.publishedAt?.toDate();
                  const views = post.metrics?.views || post.metrics?.impressions || 0;
                  const likes = post.metrics?.likes || 0;
                  const comments = post.metrics?.comments || 0;
                  return (
                    <div key={post.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${meta?.bg || 'bg-gray-800'} ${meta?.color || 'text-gray-400'}`}>
                        {meta ? <meta.Icon size={15} /> : <Globe size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-1 font-medium">{post.caption || 'Untitled post'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {date && <span className="text-xs text-gray-600">{timeAgo(date)}</span>}
                          <span className="flex items-center gap-1 text-xs text-gray-600"><Eye size={10} />{fmtNum(views)}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-600"><Heart size={10} />{fmtNum(likes)}</span>
                          {comments > 0 && <span className="flex items-center gap-1 text-xs text-gray-600"><MessageCircle size={10} />{fmtNum(comments)}</span>}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                        <CheckCircle2 size={9} /> Live
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scheduled + automation */}
            <div className="space-y-4">
              {/* Scheduled */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar size={15} className="text-amber-400" /> Scheduled
                  </h2>
                  <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{scheduled.length}</span>
                </div>
                <div className="divide-y divide-gray-800/60 max-h-64 overflow-y-auto">
                  {scheduled.length === 0 ? (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <Clock size={22} className="text-gray-800" />
                      <p className="text-xs text-gray-600">No posts queued.</p>
                      <Link href="/posts/create" className="text-xs text-cyan-400">Schedule one →</Link>
                    </div>
                  ) : scheduled.map(post => {
                    const date = post.scheduledTime!.toDate();
                    const urgent = date.getTime() - Date.now() < 2 * 3600000;
                    const pls = post.platforms?.length ? post.platforms : [post.platform];
                    return (
                      <div key={post.id} className="px-5 py-3 hover:bg-gray-800/30 transition-colors">
                        <div className="flex -space-x-1 mb-1.5">
                          {pls.slice(0, 3).map((pl: string, i: number) => {
                            const m = platformMeta[pl?.toLowerCase() as Platform];
                            return (
                              <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center ring-1 ring-gray-900 ${m?.bg || 'bg-gray-800'} ${m?.color || 'text-gray-500'}`}>
                                {m ? <m.Icon size={10} /> : <Globe size={10} />}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-white line-clamp-1">{post.caption || 'Untitled'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={9} className={urgent ? 'text-red-400' : 'text-amber-400'} />
                          <span className={`text-[10px] font-medium ${urgent ? 'text-red-400' : 'text-amber-400'}`}>{untilTime(date)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automation quicklinks */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot size={15} className="text-purple-400" /> Automation
                  </h2>
                  <Link href="/automation" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    Manage <ArrowUpRight size={11} />
                  </Link>
                </div>
                {[
                  { icon: <Link2 size={13} />, label: 'Link Me', color: 'text-orange-400', href: '/automation' },
                  { icon: <MessageCircle size={13} />, label: 'Auto-Reply', color: 'text-emerald-400', href: '/automation' },
                  { icon: <ThumbsUp size={13} />, label: 'Auto-Pin', color: 'text-yellow-400', href: '/posts/create' },
                ].map(item => (
                  <Link key={item.label} href={item.href}
                    className="flex items-center gap-2.5 py-2 hover:bg-gray-800/50 rounded-lg px-2 transition-colors">
                    <span className={item.color}>{item.icon}</span>
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <ArrowUpRight size={10} className="ml-auto text-gray-700" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">

            {/* Platform breakdown bar chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-1">Platform Performance</h2>
              <p className="text-xs text-gray-600 mb-5">Total views and likes by platform</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={platformStats} barSize={28} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="platform" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => platformMeta[v as Platform]?.label || v} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={40} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Bar dataKey="views"  name="Views"  fill="#60a5fa" radius={[4,4,0,0]} />
                  <Bar dataKey="likes"  name="Likes"  fill="#f472b6" radius={[4,4,0,0]} />
                  <Bar dataKey="comments" name="Comments" fill="#34d399" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Posting frequency area chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-1">Posting Frequency</h2>
              <p className="text-xs text-gray-600 mb-5">Posts published per platform by month</p>
              {postsByMonth.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-gray-700">
                  <BarChart2 size={32} />
                  <p className="text-sm">Publish some posts to see trends.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={postsByMonth}>
                    <defs>
                      {PLATFORMS.map(pl => (
                        <linearGradient key={pl} id={`grad-${pl}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={platformMeta[pl].chartColor} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={platformMeta[pl].chartColor} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                    <Area type="monotone" dataKey="YouTube"   stroke={platformMeta.youtube.chartColor}  fill={`url(#grad-youtube)`}  strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="Twitter/X" stroke={platformMeta.twitter.chartColor}  fill={`url(#grad-twitter)`}  strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="LinkedIn"  stroke={platformMeta.linkedin.chartColor} fill={`url(#grad-linkedin)`} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Engagement trend (last 12 posts) */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-1">Engagement Trend</h2>
              <p className="text-xs text-gray-600 mb-5">Views, likes and comments on your last 12 posts</p>
              {viewsTrend.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-2 text-gray-700">
                  <TrendingUp size={32} />
                  <p className="text-sm">No engagement data yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={viewsTrend}>
                    <defs>
                      <linearGradient id="gradViews"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} /><stop offset="95%" stopColor="#818cf8" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gradLikes"    x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} /><stop offset="95%" stopColor="#f472b6" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gradComments" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3} /><stop offset="95%" stopColor="#34d399" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="idx" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `Post ${v}`} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={40} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                    <Area type="monotone" dataKey="views"    name="Views"    stroke="#818cf8" fill="url(#gradViews)"    strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="likes"    name="Likes"    stroke="#f472b6" fill="url(#gradLikes)"    strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="comments" name="Comments" stroke="#34d399" fill="url(#gradComments)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Per-platform stat cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              {platformStats.map(s => {
                const meta = platformMeta[s.platform as Platform];
                return (
                  <div key={s.platform} className={`bg-gray-900 border ${meta.border} rounded-2xl p-5`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center`}>
                        <meta.Icon size={17} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{meta.label}</div>
                        <div className="text-xs text-gray-600">{(accountsByPlatform[s.platform as Platform] || []).length} account(s)</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Posts',    value: s.posts    },
                        { label: 'Views',    value: s.views    },
                        { label: 'Likes',    value: s.likes    },
                        { label: 'Comments', value: s.comments },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600">{row.label}</span>
                          <span className="font-bold text-white">{fmtNum(row.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/posts/create"
            className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-cyan-600/30 to-blue-600/20 border border-cyan-500/20 text-cyan-300 hover:border-opacity-60 transition-all hover:scale-[1.01]"
          >
            <PlusCircle size={16} />
            <span className="text-sm font-semibold">Create Post</span>
          </Link>
          <Link
            href="/tasks"
            className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-amber-600/30 to-orange-600/20 border border-amber-500/20 text-amber-300 hover:border-opacity-60 transition-all hover:scale-[1.01]"
          >
            <Calendar size={16} />
            <span className="text-sm font-semibold">Tasks</span>
          </Link>
          <Link
            href="/automation"
            className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-purple-600/30 to-pink-600/20 border border-purple-500/20 text-purple-300 hover:border-opacity-60 transition-all hover:scale-[1.01]"
          >
            <Bot size={16} />
            <span className="text-sm font-semibold">Automation</span>
          </Link>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/20 text-emerald-300 hover:border-opacity-60 transition-all hover:scale-[1.01]"
          >
            <TrendingUp size={16} />
            <span className="text-sm font-semibold">Analytics</span>
          </button>
        </div>

      </div>
      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}
