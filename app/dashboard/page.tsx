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
  ArrowUpRight, BarChart2, Bot, Calendar, CheckCircle2, ChevronDown, ChevronUp,
  Clock, Eye, ExternalLink, Globe, Heart, Linkedin, MessageCircle,
  PlusCircle, RefreshCw, Settings, ThumbsUp, TrendingUp, Twitter, Users,
  Video, Youtube, Zap, Link2, AlertCircle, X, Activity, WifiOff,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedAccount {
  id: string;
  platform: string;
  platformId?: string;
  accountName: string;
  connectedAt: Date;
}

interface LiveAccountData {
  subscribers?: number;
  followers?: number;
  postCount?: number;
  views?: number;
  likes?: number;
  comments?: number;
  recentPosts?: RecentPost[];
  needsReauth?: boolean;
  error?: string;
  analyticsUnavailable?: boolean;
}

interface RecentPost {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

interface AutomationStats {
  linkMeActive: number;
  autoReplyActive: number;
}

const PLATFORMS = ['youtube', 'twitter', 'linkedin'] as const;
type Platform = typeof PLATFORMS[number];

const platformMeta: Record<Platform, {
  Icon: React.ElementType; color: string; bg: string; border: string;
  label: string; chartColor: string;
}> = {
  youtube:  { Icon: Youtube,  color: 'text-red-400',  bg: 'bg-red-500/10',  border: 'border-red-500/30',  label: 'YouTube',   chartColor: '#f87171' },
  twitter:  { Icon: Twitter,  color: 'text-sky-400',  bg: 'bg-sky-500/10',  border: 'border-sky-500/30',  label: 'Twitter/X', chartColor: '#38bdf8' },
  linkedin: { Icon: Linkedin, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', label: 'LinkedIn',  chartColor: '#60a5fa' },
};

const oauthRoute: Record<Platform, (uid: string) => string> = {
  youtube:  uid => `/api/auth/youtube?uid=${encodeURIComponent(uid)}`,
  twitter:  uid => `/api/auth/twitter/oauth1?uid=${encodeURIComponent(uid)}`,
  linkedin: uid => `/api/auth/linkedin?uid=${encodeURIComponent(uid)}`,
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

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
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

// ─── Account health badge ─────────────────────────────────────────────────────

function HealthBadge({ needsReauth, error, loading }: { needsReauth?: boolean; error?: string; loading?: boolean }) {
  if (loading) return <span className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />;
  if (needsReauth) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">
      <WifiOff size={8} /> Reconnect
    </span>
  );
  if (error) return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
      <AlertCircle size={8} /> Error
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
      <CheckCircle2 size={8} /> Live
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Base data
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremium, setShowPremium] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [postFilter, setPostFilter] = useState<'all' | Platform>('all');
  const [reconnectBanner, setReconnectBanner] = useState(false);

  // Live data
  const [liveData, setLiveData] = useState<Record<string, LiveAccountData>>({});
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Automation stats
  const [autoStats, setAutoStats] = useState<AutomationStats>({ linkMeActive: 0, autoReplyActive: 0 });

  // Expandable accounts
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    Promise.all([fetchAccounts(), fetchPosts(), fetchAutoStats()]).finally(() => setLoading(false));
  }, [user, authLoading]); // eslint-disable-line

  // Fetch live data after accounts load
  useEffect(() => {
    if (accounts.length > 0 && user) {
      fetchLiveData(accounts);
    }
  }, [accounts]); // eslint-disable-line

  const fetchAccounts = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return;
    const list: ConnectedAccount[] = (snap.data()?.connectedAccounts || []).map((a: any) => ({
      id: a.id,
      platform: a.platform?.toLowerCase(),
      platformId: a.platformId,
      accountName: a.accountName || a.accountLabel || a.platform,
      connectedAt: a.connectedAt?.toDate?.() ?? new Date(),
    }));
    setAccounts(list);
    if (list.some(a => a.platform === 'youtube')) setReconnectBanner(false);
  };

  const fetchPosts = async () => {
    if (!user) return;
    const snap = await getDocs(query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(200),
    ));
    const list: SocialPost[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as any));
    setPosts(list);
  };

  const fetchAutoStats = async () => {
    if (!user) return;
    try {
      const [lmSnap, arSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'users', user.uid, 'linkMeRules'),
          where('isActive', '==', true),
        )),
        getDocs(query(
          collection(db, 'users', user.uid, 'autoReplyTemplates'),
          where('isActive', '==', true),
        )),
      ]);
      setAutoStats({ linkMeActive: lmSnap.size, autoReplyActive: arSnap.size });
    } catch { /* ignore */ }
  };

  const fetchLiveData = useCallback(async (accs: ConnectedAccount[]) => {
    if (!user) return;
    setLiveLoading(true);
    const updates: Record<string, LiveAccountData> = {};

    await Promise.allSettled(accs.map(async (acc) => {
      if (acc.platform === 'youtube') {
        try {
          const res = await fetch(`/api/youtube/analytics?userId=${user.uid}&accountId=${acc.id}`);
          const json = await res.json();
          if (json.needsReauth) {
            updates[acc.id] = { needsReauth: true };
          } else if (res.ok && json.channelInfo) {
            const recentPosts: RecentPost[] = (json.videoMetrics?.recentVideos || []).map((v: any) => ({
              id: v.id,
              title: v.title,
              url: `https://www.youtube.com/watch?v=${v.id}`,
              thumbnail: v.thumbnail,
              views: v.views || 0,
              likes: v.likes || 0,
              comments: v.comments || 0,
              publishedAt: v.publishedAt,
            }));
            updates[acc.id] = {
              subscribers: json.channelInfo.subscriberCount || 0,
              postCount: json.channelInfo.videoCount || recentPosts.length,
              views: json.videoMetrics?.totalViews || 0,
              likes: json.videoMetrics?.totalLikes || 0,
              comments: json.videoMetrics?.totalComments || 0,
              recentPosts,
            };
          } else {
            updates[acc.id] = { error: json.error || 'Failed to fetch' };
          }
        } catch (e: any) {
          updates[acc.id] = { error: e.message };
        }
      }

      if (acc.platform === 'twitter') {
        try {
          const res = await fetch(`/api/twitter/user?userId=${user.uid}&accountId=${acc.id}`);
          const json = await res.json();
          if (json.needsReauth) {
            updates[acc.id] = { needsReauth: true };
          } else if (res.ok && json.followerCount !== undefined) {
            let recentPosts: RecentPost[] = [];
            let aggViews = 0, aggLikes = 0, aggComments = 0;
            try {
              const tr = await fetch(`/api/twitter/tweets?userId=${user.uid}&accountId=${acc.id}&maxResults=10`);
              const tj = await tr.json();
              recentPosts = (tj.tweets || []).map((t: any) => ({
                id: t.id,
                title: t.text?.slice(0, 140) || 'Tweet',
                url: t.permalink || `https://twitter.com/${json.username}/status/${t.id}`,
                views:    t.metrics?.impressions || 0,
                likes:    t.metrics?.likes       || 0,
                comments: t.metrics?.replies     || 0,
                publishedAt: t.createdAt,
              }));
              aggViews    = recentPosts.reduce((s, t) => s + t.views,    0);
              aggLikes    = recentPosts.reduce((s, t) => s + t.likes,    0);
              aggComments = recentPosts.reduce((s, t) => s + t.comments, 0);
            } catch { /* tweets optional */ }
            updates[acc.id] = {
              followers: json.followerCount || 0,
              postCount: json.tweetCount    || 0,
              views:    aggViews,
              likes:    aggLikes,
              comments: aggComments,
              recentPosts,
            };
          } else {
            updates[acc.id] = { error: json.error || 'Failed to fetch' };
          }
        } catch (e: any) {
          updates[acc.id] = { error: e.message };
        }
      }

      if (acc.platform === 'linkedin') {
        // LinkedIn personal profile analytics require MDP (Marketing Developer Platform)
        // Standard OAuth only gives profile identity, not follower/engagement stats
        updates[acc.id] = { analyticsUnavailable: true };
      }
    }));

    setLiveData(prev => ({ ...prev, ...updates }));
    setLastSync(new Date());
    setLiveLoading(false);
  }, [user]);

  const handleSync = async () => {
    await Promise.all([fetchPosts(), fetchAutoStats()]);
    await fetchLiveData(accounts);
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
    setLiveData(prev => { const n = { ...prev }; delete n[accountId]; return n; });
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
    postFilter === 'all' ? published : published.filter(p => {
      const pl = p.platform?.toLowerCase();
      const pls = p.platforms?.map(x => x.toLowerCase());
      return pl === postFilter || pls?.includes(postFilter);
    }),
    [published, postFilter]);

  // Aggregate live stats across all accounts
  const liveTotals = useMemo(() => {
    let totalFollowers = 0;
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    accounts.forEach(acc => {
      const d = liveData[acc.id];
      if (!d) return;
      totalFollowers += d.subscribers ?? d.followers ?? 0;
      totalViews += d.views ?? 0;
      totalLikes += d.likes ?? 0;
      totalComments += d.comments ?? 0;
    });
    return { totalFollowers, totalViews, totalLikes, totalComments };
  }, [accounts, liveData]);

  // Firestore fallback totals
  const firestoreTotals = useMemo(() => ({
    views:    published.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0),
    likes:    published.reduce((s, p) => s + (p.metrics?.likes || 0), 0),
    comments: published.reduce((s, p) => s + (p.metrics?.comments || 0), 0),
  }), [published]);

  const displayViews    = liveTotals.totalViews    > 0 ? liveTotals.totalViews    : firestoreTotals.views;
  const displayLikes    = liveTotals.totalLikes    > 0 ? liveTotals.totalLikes    : firestoreTotals.likes;
  const displayComments = liveTotals.totalComments > 0 ? liveTotals.totalComments : firestoreTotals.comments;

  // Per-platform breakdown for analytics
  const platformStats = useMemo(() => {
    return PLATFORMS.map(pl => {
      const plAccounts = accounts.filter(a => a.platform === pl);
      const plPosts = published.filter(p => {
        const singlePl = p.platform?.toLowerCase();
        const multiPl = p.platforms?.map(x => x.toLowerCase());
        return singlePl === pl || multiPl?.includes(pl);
      });
      const liveViews    = plAccounts.reduce((s, a) => s + (liveData[a.id]?.views    ?? 0), 0);
      const liveLikes    = plAccounts.reduce((s, a) => s + (liveData[a.id]?.likes    ?? 0), 0);
      const liveComments = plAccounts.reduce((s, a) => s + (liveData[a.id]?.comments ?? 0), 0);
      const livePostCount = plAccounts.reduce((s, a) => s + (liveData[a.id]?.postCount ?? 0), 0);
      const fsViews    = plPosts.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0);
      const fsLikes    = plPosts.reduce((s, p) => s + (p.metrics?.likes || 0), 0);
      const fsComments = plPosts.reduce((s, p) => s + (p.metrics?.comments || 0), 0);
      return {
        platform:  pl,
        posts:     livePostCount > 0 ? livePostCount : plPosts.length,
        views:     liveViews    > 0 ? liveViews    : fsViews,
        likes:     liveLikes    > 0 ? liveLikes    : fsLikes,
        comments:  liveComments > 0 ? liveComments : fsComments,
        followers: plAccounts.reduce((s, a) => s + (liveData[a.id]?.subscribers ?? liveData[a.id]?.followers ?? 0), 0),
      };
    });
  }, [published, accounts, liveData]);

  // Monthly posting frequency
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

  const viewsTrend = useMemo(() => {
    return published.slice(0, 12).reverse().map((p, i) => ({
      idx: i + 1,
      views:    p.metrics?.views || p.metrics?.impressions || 0,
      likes:    p.metrics?.likes || 0,
      comments: p.metrics?.comments || 0,
    }));
  }, [published]);

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

  const hasAnyReauthNeeded = useMemo(() =>
    accounts.some(a => liveData[a.id]?.needsReauth), [accounts, liveData]);

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

        {/* ── Reauth banner ── */}
        {hasAnyReauthNeeded && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Action required:</span> One or more connected accounts need to be re-authenticated.
              Check the account cards below and click <strong>Reconnect</strong>.
            </div>
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
            {lastSync && (
              <p className="text-[11px] text-gray-600 mt-1 flex items-center gap-1">
                <Activity size={10} className="text-emerald-500" />
                Live data synced {timeAgo(lastSync)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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

            <button onClick={handleSync} disabled={liveLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white text-sm transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={liveLoading ? 'animate-spin' : ''} />
              {liveLoading ? 'Syncing…' : 'Sync'}
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

        {/* ── Live stat cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Followers',
              value: liveLoading ? '…' : fmtNum(liveTotals.totalFollowers),
              sub: 'Across all accounts',
              icon: <Users size={16} />,
              glow: 'bg-cyan-500',
              live: true,
            },
            {
              label: 'Total Views',
              value: liveLoading ? '…' : fmtNum(displayViews),
              sub: 'Views & impressions',
              icon: <Eye size={16} />,
              glow: 'bg-purple-500',
              live: liveTotals.totalViews > 0,
            },
            {
              label: 'Engagements',
              value: liveLoading ? '…' : fmtNum(displayLikes + displayComments),
              sub: 'Likes + comments',
              icon: <Heart size={16} />,
              glow: 'bg-pink-500',
              live: liveTotals.totalLikes > 0,
            },
            {
              label: 'Scheduled',
              value: fmtNum(scheduled.length),
              sub: 'Pending posts',
              icon: <Clock size={16} />,
              glow: 'bg-amber-500',
              live: false,
            },
          ].map(s => (
            <div key={s.label} className="relative overflow-hidden rounded-2xl p-5 bg-gray-900 border border-gray-800">
              <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full blur-3xl opacity-10 ${s.glow}`} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</span>
                <span className="text-gray-700">{s.icon}</span>
              </div>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-600">{s.sub}</span>
                {s.live && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">LIVE</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Connected Accounts (expandable) ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Connected Accounts</h2>
            <span className="text-xs text-gray-600">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLATFORMS.map(pl => {
              const meta = platformMeta[pl];
              const plAccounts = accountsByPlatform[pl] || [];
              const plStats = platformStats.find(s => s.platform === pl)!;

              return (
                <div key={pl} className={`bg-gray-900 border rounded-2xl overflow-hidden ${
                  plAccounts.length ? 'border-gray-800 hover:border-gray-700' : 'border-dashed border-gray-800'
                } transition-colors`}>
                  {/* Platform header */}
                  <div className="flex items-center justify-between p-5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}>
                        <meta.Icon size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{meta.label}</div>
                        <div className="text-xs text-gray-600">{plAccounts.length} account{plAccounts.length !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
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
                  </div>

                  {/* Per-account rows */}
                  {plAccounts.length > 0 && (
                    <div className="px-5 space-y-2 mb-4">
                      {plAccounts.map(acc => {
                        const ld = liveData[acc.id];
                        const isExpanded = expandedAccount === acc.id;
                        const count = ld?.subscribers ?? ld?.followers;
                        const countLabel = pl === 'youtube' ? 'subscribers' : 'followers';

                        return (
                          <div key={acc.id} className="rounded-xl border border-gray-800 overflow-hidden">
                            {/* Account row */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-800/60">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <HealthBadge
                                  needsReauth={ld?.needsReauth}
                                  error={ld?.error}
                                  loading={liveLoading && !ld}
                                />
                                <span className="text-xs text-gray-300 truncate font-medium">{acc.accountName}</span>
                                {count !== undefined && (
                                  <span className="text-[10px] text-gray-500 flex-shrink-0">
                                    {fmtNum(count)} {countLabel}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                {ld?.needsReauth && (
                                  <button
                                    onClick={() => handleConnect(pl)}
                                    className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                  >Reconnect</button>
                                )}
                                {ld && !ld.needsReauth && (
                                  <button
                                    onClick={() => setExpandedAccount(isExpanded ? null : acc.id)}
                                    className="text-gray-600 hover:text-gray-300 transition-colors"
                                  >
                                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                )}
                                <button onClick={() => handleDisconnect(acc.id)} className="text-gray-700 hover:text-red-400 transition-colors">
                                  <X size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Expanded: recent posts */}
                            {isExpanded && ld && (ld.recentPosts?.length ?? 0) === 0 && (
                              <div className="border-t border-gray-800 px-3 py-3 text-center text-xs text-gray-600">
                                No recent posts found for this account.
                              </div>
                            )}
                            {isExpanded && ld?.recentPosts && ld.recentPosts.length > 0 && (
                              <div className="border-t border-gray-800 divide-y divide-gray-800/60">
                                {ld.recentPosts.slice(0, 5).map(rp => (
                                  <div key={rp.id} className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-gray-800/30 transition-colors">
                                    {rp.thumbnail && (
                                      <img src={rp.thumbnail} alt="" className="w-12 h-8 rounded object-cover flex-shrink-0 bg-gray-800" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] text-gray-300 line-clamp-2 leading-tight">{rp.title}</p>
                                      <div className="flex items-center gap-2.5 mt-1 text-[10px] text-gray-600">
                                        <span className="flex items-center gap-1"><Eye size={9} />{fmtNum(rp.views)}</span>
                                        <span className="flex items-center gap-1"><Heart size={9} />{fmtNum(rp.likes)}</span>
                                        {rp.comments > 0 && <span className="flex items-center gap-1"><MessageCircle size={9} />{fmtNum(rp.comments)}</span>}
                                      </div>
                                    </div>
                                    <a
                                      href={rp.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-700 hover:text-gray-400 flex-shrink-0 mt-0.5 transition-colors"
                                    >
                                      <ExternalLink size={11} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary stats or connect CTA */}
                  <div className="px-5 pb-5">
                    {plAccounts.length === 0 ? (
                      <button onClick={() => handleConnect(pl)}
                        className="w-full py-2 rounded-xl border border-dashed border-gray-700 text-gray-600 hover:text-gray-400 text-xs transition-colors">
                        Connect {meta.label}
                      </button>
                    ) : plAccounts.every(a => liveData[a.id]?.analyticsUnavailable) ? (
                      <div className="text-center py-2">
                        <p className="text-[10px] text-gray-600">Analytics unavailable</p>
                        <p className="text-[9px] text-gray-700 mt-0.5">LinkedIn MDP access required</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { v: fmtNum(plStats.followers), l: 'Followers' },
                          { v: plStats.posts, l: 'Posts' },
                          { v: fmtNum(plStats.views), l: 'Views' },
                          { v: fmtNum(plStats.likes), l: 'Likes' },
                        ].map(s => (
                          <div key={s.l} className="bg-gray-800/40 rounded-xl p-2 text-center">
                            <div className="text-sm font-bold text-white">{s.v}</div>
                            <div className="text-[10px] text-gray-600">{s.l}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                  const primaryPl = (post.platform || post.platforms?.[0] || '').toLowerCase();
                  const meta = platformMeta[primaryPl as Platform];
                  const date = post.publishedAt?.toDate();
                  const views    = post.metrics?.views || post.metrics?.impressions || 0;
                  const likes    = post.metrics?.likes || 0;
                  const comments = post.metrics?.comments || 0;
                  const reach    = post.metrics?.reach || 0;
                  return (
                    <div key={post.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 ${meta?.bg || 'bg-gray-800'} ${meta?.color || 'text-gray-400'}`}>
                        {meta ? <meta.Icon size={15} /> : <Globe size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-1 font-medium">{post.caption || 'Untitled post'}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {date && <span className="text-xs text-gray-600">{timeAgo(date)}</span>}
                          <span className="flex items-center gap-1 text-xs text-gray-600"><Eye size={10} />{fmtNum(views)}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-600"><Heart size={10} />{fmtNum(likes)}</span>
                          {comments > 0 && <span className="flex items-center gap-1 text-xs text-gray-600"><MessageCircle size={10} />{fmtNum(comments)}</span>}
                          {reach > 0 && <span className="flex items-center gap-1 text-xs text-gray-600"><Users size={10} />{fmtNum(reach)}</span>}
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

            {/* Right column */}
            <div className="space-y-4">
              {/* Scheduled */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Calendar size={15} className="text-amber-400" /> Scheduled
                  </h2>
                  <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{scheduled.length}</span>
                </div>
                <div className="divide-y divide-gray-800/60 max-h-52 overflow-y-auto">
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

              {/* Automation status */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot size={15} className="text-purple-400" /> Automation
                  </h2>
                  <Link href="/automation" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                    Manage <ArrowUpRight size={11} />
                  </Link>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Link2 size={12} className="text-orange-400" />
                      <span className="text-xs text-gray-400">Link Me Rules</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      autoStats.linkMeActive > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-800 text-gray-600'
                    }`}>
                      {autoStats.linkMeActive} active
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <MessageCircle size={12} className="text-emerald-400" />
                      <span className="text-xs text-gray-400">Auto Reply</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      autoStats.autoReplyActive > 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-gray-800 text-gray-600'
                    }`}>
                      {autoStats.autoReplyActive} active
                    </span>
                  </div>
                </div>

                <Link href="/automation"
                  className="flex items-center justify-center gap-2 py-2 w-full rounded-xl border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 text-xs transition-colors">
                  <Settings size={11} /> Configure rules
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">

            {/* Platform breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-white">Platform Performance</h2>
                {liveTotals.totalViews > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Live data</span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-5">Views, likes and followers by platform</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={platformStats} barSize={24} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="platform" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => platformMeta[v as Platform]?.label || v} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={40} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Bar dataKey="views"     name="Views"     fill="#60a5fa" radius={[4,4,0,0]} />
                  <Bar dataKey="likes"     name="Likes"     fill="#f472b6" radius={[4,4,0,0]} />
                  <Bar dataKey="comments"  name="Comments"  fill="#34d399" radius={[4,4,0,0]} />
                  <Bar dataKey="followers" name="Followers" fill="#fb923c" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Posting frequency */}
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
                    <Area type="monotone" dataKey="YouTube"   stroke={platformMeta.youtube.chartColor}  fill="url(#grad-youtube)"  strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="Twitter/X" stroke={platformMeta.twitter.chartColor}  fill="url(#grad-twitter)"  strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="LinkedIn"  stroke={platformMeta.linkedin.chartColor} fill="url(#grad-linkedin)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Engagement trend */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white mb-1">Engagement Trend</h2>
              <p className="text-xs text-gray-600 mb-5">Views, likes and comments across your last 12 posts</p>
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
                    <XAxis dataKey="idx" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `#${v}`} axisLine={false} tickLine={false} />
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
                const plAccounts = accountsByPlatform[s.platform as Platform] || [];
                return (
                  <div key={s.platform} className={`bg-gray-900 border ${meta.border} rounded-2xl p-5`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-9 h-9 rounded-xl ${meta.bg} ${meta.color} flex items-center justify-center`}>
                        <meta.Icon size={17} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{meta.label}</div>
                        <div className="text-xs text-gray-600">{plAccounts.length} account(s)</div>
                      </div>
                    </div>
                    {plAccounts.every(a => liveData[a.id]?.analyticsUnavailable) ? (
                      <div className="py-2 text-center">
                        <p className="text-xs text-gray-600">Analytics unavailable</p>
                        <p className="text-[10px] text-gray-700 mt-1">LinkedIn MDP access required for personal profile stats</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[
                          { label: 'Followers', value: s.followers },
                          { label: 'Posts',     value: s.posts     },
                          { label: 'Views',     value: s.views     },
                          { label: 'Likes',     value: s.likes     },
                          { label: 'Comments',  value: s.comments  },
                        ].map(row => (
                          <div key={row.label} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600">{row.label}</span>
                            <span className="font-bold text-white">{fmtNum(row.value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Create Post', icon: <PlusCircle size={16} />, href: '/posts/create', style: 'from-cyan-600/30 to-blue-600/20 border-cyan-500/20 text-cyan-300' },
            { label: 'Automation',  icon: <Bot size={16} />,        href: '/automation',   style: 'from-purple-600/30 to-pink-600/20 border-purple-500/20 text-purple-300' },
            { label: 'Analytics',   icon: <TrendingUp size={16} />, href: '#',             style: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-300', onClick: () => setActiveTab('analytics') },
            { label: 'Settings',    icon: <Settings size={16} />,   href: '/settings',     style: 'from-gray-700/40 to-gray-600/10 border-gray-600/20 text-gray-400' },
          ].map(item => (
            <Link key={item.label} href={item.href} onClick={item.onClick}
              className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br border hover:border-opacity-60 transition-all hover:scale-[1.01] ${item.style}`}>
              {item.icon}
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>

      </div>
      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}
