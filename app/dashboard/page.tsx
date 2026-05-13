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
  ArrowUpRight, Bot, ChevronDown, ChevronUp, Clock, Eye,
  ExternalLink, Facebook, Globe, Heart, Linkedin, MessageCircle,
  PlusCircle, RefreshCw, Settings, Twitter, Youtube, Zap, Link2,
  AlertCircle, X, TrendingUp,
} from 'lucide-react';

const InstagramIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);
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

const PLATFORMS = ['youtube', 'twitter', 'linkedin', 'instagram', 'facebook', 'threads'] as const;
type Platform = typeof PLATFORMS[number];

const platformMeta: Record<Platform, {
  Icon: React.ElementType; label: string; tone: string;
}> = {
  youtube:   { Icon: Youtube,       label: 'YouTube',   tone: '#f87171' },
  twitter:   { Icon: Twitter,       label: 'Twitter/X', tone: '#7dd3fc' },
  linkedin:  { Icon: Linkedin,      label: 'LinkedIn',  tone: '#93c5fd' },
  instagram: { Icon: InstagramIcon, label: 'Instagram', tone: '#f9a8d4' },
  facebook:  { Icon: Facebook,      label: 'Facebook',  tone: '#60a5fa' },
  threads:   { Icon: MessageCircle, label: 'Threads',   tone: '#d6d3d1' },
};

const oauthRoute: Record<Platform, (uid: string) => string> = {
  youtube:   uid => `/api/auth/youtube?uid=${encodeURIComponent(uid)}`,
  twitter:   uid => `/api/auth/twitter/oauth1?uid=${encodeURIComponent(uid)}`,
  linkedin:  uid => `/api/auth/linkedin?uid=${encodeURIComponent(uid)}`,
  instagram: uid => `/api/auth/instagram?uid=${encodeURIComponent(uid)}`,
  facebook:  uid => `/api/auth/facebook?uid=${encodeURIComponent(uid)}`,
  threads:   uid => `/api/auth/threads?uid=${encodeURIComponent(uid)}`,
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

const CHART_TONES = {
  views: '#d4ff3a',
  likes: '#f4f1ea',
  comments: '#ff5e3a',
  followers: '#7dd3fc',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0b] border border-stone-700 px-4 py-3 shadow-2xl">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex justify-between gap-6 font-mono text-xs">
          <span>{p.name}</span><span className="tabular-nums font-bold">{fmtNum(p.value)}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Status dot (calm, not pulsing pill) ──────────────────────────────────────

function HealthDot({ needsReauth, error, loading }: { needsReauth?: boolean; error?: string; loading?: boolean }) {
  const cls =
    loading      ? 'bg-stone-600 animate-pulse' :
    needsReauth  ? 'bg-[#ff5e3a]' :
    error        ? 'bg-amber-400' :
                   'bg-[#d4ff3a]';
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls}`} aria-hidden />;
}

// ─── Editorial primitives ─────────────────────────────────────────────────────

function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 ${className}`}>
      {children}
    </span>
  );
}

function SectionHead({ kicker, title, aside }: { kicker: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-stone-800 pb-4 mb-6">
      <div>
        <Eyebrow>{kicker}</Eyebrow>
        <h2 className="font-display italic text-2xl md:text-[28px] text-stone-100 mt-1 tracking-tight">
          {title}
        </h2>
      </div>
      {aside}
    </div>
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
  const [analyticsView, setAnalyticsView] = useState<'platform' | 'activity'>('platform');
  const [postFilter, setPostFilter] = useState<'all' | Platform>('all');

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

  useEffect(() => {
    if (accounts.length > 0 && user) fetchLiveData(accounts);
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
        getDocs(query(collection(db, 'users', user.uid, 'linkMeRules'), where('isActive', '==', true))),
        getDocs(query(collection(db, 'users', user.uid, 'autoReplyTemplates'), where('isActive', '==', true))),
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
              views: aggViews, likes: aggLikes, comments: aggComments,
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
        try {
          const res = await fetch(`/api/linkedin/posts?userId=${user.uid}`);
          const json = await res.json();
          if (res.ok && json.recentPosts) {
            updates[acc.id] = {
              postCount:   json.postCount   || 0,
              likes:       json.totalLikes  || 0,
              comments:    json.totalComments || 0,
              recentPosts: json.recentPosts || [],
            };
          } else {
            updates[acc.id] = { analyticsUnavailable: true };
          }
        } catch {
          updates[acc.id] = { analyticsUnavailable: true };
        }
      }

      if (acc.platform === 'instagram' || acc.platform === 'facebook' || acc.platform === 'threads') {
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

  const liveTotals = useMemo(() => {
    let totalFollowers = 0, totalViews = 0, totalLikes = 0, totalComments = 0;
    accounts.forEach(acc => {
      const d = liveData[acc.id];
      if (!d) return;
      totalFollowers += d.subscribers ?? d.followers ?? 0;
      totalViews    += d.views    ?? 0;
      totalLikes    += d.likes    ?? 0;
      totalComments += d.comments ?? 0;
    });
    return { totalFollowers, totalViews, totalLikes, totalComments };
  }, [accounts, liveData]);

  const firestoreTotals = useMemo(() => ({
    views:    published.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0),
    likes:    published.reduce((s, p) => s + (p.metrics?.likes || 0), 0),
    comments: published.reduce((s, p) => s + (p.metrics?.comments || 0), 0),
  }), [published]);

  const displayViews    = liveTotals.totalViews    > 0 ? liveTotals.totalViews    : firestoreTotals.views;
  const displayLikes    = liveTotals.totalLikes    > 0 ? liveTotals.totalLikes    : firestoreTotals.likes;
  const displayComments = liveTotals.totalComments > 0 ? liveTotals.totalComments : firestoreTotals.comments;

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
        platform: pl,
        posts:    livePostCount > 0 ? livePostCount : plPosts.length,
        views:    liveViews    > 0 ? liveViews    : fsViews,
        likes:    liveLikes    > 0 ? liveLikes    : fsLikes,
        comments: liveComments > 0 ? liveComments : fsComments,
        followers: plAccounts.reduce((s, a) => s + (liveData[a.id]?.subscribers ?? liveData[a.id]?.followers ?? 0), 0),
      };
    });
  }, [published, accounts, liveData]);

  const postsByMonth = useMemo(() => {
    const empty = () => ({ YouTube: 0, 'Twitter/X': 0, LinkedIn: 0, Instagram: 0, Facebook: 0, Threads: 0 });
    const map: Record<string, { month: string } & ReturnType<typeof empty>> = {};
    published.forEach(p => {
      const d = p.publishedAt!.toDate();
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: key, ...empty() };
      const pls = p.platforms?.length ? p.platforms.map(x => x.toLowerCase()) : [p.platform?.toLowerCase()];
      pls.forEach(pl => {
        if (pl === 'youtube') map[key].YouTube++;
        else if (pl === 'twitter') map[key]['Twitter/X']++;
        else if (pl === 'linkedin') map[key].LinkedIn++;
        else if (pl === 'instagram') map[key].Instagram++;
        else if (pl === 'facebook') map[key].Facebook++;
        else if (pl === 'threads') map[key].Threads++;
      });
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

  const platformPerformance = useMemo(() => {
    return (PLATFORMS.map(pl => {
      const plPosts = published.filter(p => {
        const spl = p.platform?.toLowerCase();
        const mpl = p.platforms?.map(x => x.toLowerCase());
        return spl === pl || mpl?.includes(pl);
      });
      if (plPosts.length === 0) return null;
      const totalViews = plPosts.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0);
      const totalLikes = plPosts.reduce((s, p) => s + (p.metrics?.likes || 0), 0);
      return {
        platform: pl,
        avgViews: Math.round(totalViews / plPosts.length),
        avgLikes: Math.round(totalLikes / plPosts.length),
        count: plPosts.length,
      };
    }).filter(Boolean) as { platform: string; avgViews: number; avgLikes: number; count: number }[])
      .sort((a, b) => b.avgViews - a.avgViews);
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
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border border-stone-800 border-t-[#d4ff3a] rounded-full animate-spin" />
          <Eyebrow>Loading studio</Eyebrow>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const now = new Date();
  const hour = now.getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-stone-100 relative">
      <div className="grain fixed inset-0 z-0 pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto px-6 md:px-10 lg:px-14 py-10 md:py-14 space-y-14 z-10">

        {/* ── Reauth alert ── */}
        {hasAnyReauthNeeded && (
          <div className="flex items-start gap-4 px-5 py-4 border border-[#ff5e3a]/30 bg-[#ff5e3a]/5">
            <AlertCircle size={16} className="text-[#ff5e3a] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Eyebrow className="text-[#ff5e3a]/80">Action required</Eyebrow>
              <p className="text-sm text-stone-200 mt-1">
                One or more accounts need to be reconnected. Locate the affected card below and follow the prompt.
              </p>
            </div>
          </div>
        )}

        {/* ── Editorial header ── */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 border-b border-stone-800 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Eyebrow>Studio · {dateStr}</Eyebrow>
              {lastSync && (
                <span className="flex items-center gap-2">
                  <HealthDot loading={liveLoading} />
                  <Eyebrow>Synced {timeAgo(lastSync)}</Eyebrow>
                </span>
              )}
            </div>
            <h1 className="font-display tracking-tight leading-[0.95] text-stone-100">
              <span className="block italic text-stone-400 text-2xl md:text-3xl mb-2 font-light">{greet},</span>
              <span className="block text-5xl md:text-6xl lg:text-7xl">
                {userProfile?.displayName || user.email?.split('@')[0] || 'Creator'}
              </span>
            </h1>
            <p className="text-sm text-stone-400 max-w-lg leading-relaxed">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} across{' '}
              <span className="text-stone-200">{Object.keys(accountsByPlatform).length}</span>{' '}
              {Object.keys(accountsByPlatform).length === 1 ? 'platform' : 'platforms'}
              {' · '}<span className="text-stone-200">{scheduled.length}</span> scheduled
              {' · '}<span className="text-stone-200">{published.length}</span> published
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex border border-stone-800">
              {(['overview', 'analytics'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    activeTab === t
                      ? 'bg-[#f4f1ea] text-[#0a0a0b]'
                      : 'text-stone-500 hover:text-stone-100'
                  }`}
                >{t}</button>
              ))}
            </div>

            <button
              onClick={handleSync}
              disabled={liveLoading}
              className="flex items-center gap-2 border border-stone-800 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} className={liveLoading ? 'animate-spin' : ''} />
              {liveLoading ? 'Syncing' : 'Sync'}
            </button>

            <button
              onClick={() => setShowPremium(true)}
              className="flex items-center gap-2 border border-stone-800 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-[#d4ff3a] hover:border-[#d4ff3a]/40 transition-colors"
            >
              <Zap size={11} /> Upgrade
            </button>

            <Link
              href="/posts/create"
              className="flex items-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] transition-colors"
            >
              <PlusCircle size={11} /> New Post
            </Link>
          </div>
        </header>

        {/* ── Stat ledger ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 border border-stone-800">
          {[
            { label: 'Followers',  value: liveTotals.totalFollowers,         sub: 'across all accounts',  live: true },
            { label: 'Views',      value: displayViews,                       sub: 'cumulative reach',     live: liveTotals.totalViews > 0 },
            { label: 'Engagement', value: displayLikes + displayComments,     sub: 'likes + comments',     live: liveTotals.totalLikes > 0 },
            { label: 'Scheduled',  value: scheduled.length,                   sub: 'queued for publish',   live: false },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`p-6 md:p-8 ${i < 3 ? 'md:border-r' : ''} ${i < 2 ? 'border-b md:border-b-0' : ''} border-stone-800 relative group`}
            >
              <div className="flex items-center justify-between mb-7">
                <Eyebrow>{s.label}</Eyebrow>
                {s.live && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#d4ff3a]" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#d4ff3a]">Live</span>
                  </span>
                )}
              </div>
              <div
                className="font-display text-stone-100 tabular-nums tracking-tight leading-none"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontVariationSettings: '"opsz" 144, "wght" 350' }}
              >
                {liveLoading ? '—' : fmtNum(s.value)}
              </div>
              <div className="mt-4">
                <Eyebrow className="text-stone-600">{s.sub}</Eyebrow>
              </div>
            </div>
          ))}
        </section>

        {/* ── Connected Accounts ── */}
        <section>
          <SectionHead
            kicker="Connections"
            title="Accounts"
            aside={<Eyebrow>{accounts.length} connected · {PLATFORMS.length} platforms</Eyebrow>}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-stone-800 [&>*]:border-stone-800">
            {PLATFORMS.map((pl, idx) => {
              const meta = platformMeta[pl];
              const plAccounts = accountsByPlatform[pl] || [];
              const plStats = platformStats.find(s => s.platform === pl)!;
              const hasAccounts = plAccounts.length > 0;
              const allUnavailable = hasAccounts && plAccounts.every(a => liveData[a.id]?.analyticsUnavailable);
              const col = idx % 3;
              const row = Math.floor(idx / 3);
              const totalRows = Math.ceil(PLATFORMS.length / 3);

              return (
                <div
                  key={pl}
                  className={`
                    relative
                    ${col < 2 ? 'md:border-r' : ''}
                    ${col < 2 ? 'lg:border-r' : ''}
                    ${row < totalRows - 1 ? 'border-b' : ''}
                  `}
                >
                  {/* Platform header */}
                  <div className="flex items-start justify-between p-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 border border-stone-800 flex items-center justify-center" style={{ color: meta.tone }}>
                        <meta.Icon size={16} />
                      </div>
                      <div>
                        <div className="font-display italic text-lg text-stone-100 leading-tight">{meta.label}</div>
                        <Eyebrow>
                          {hasAccounts ? `${plAccounts.length} ${plAccounts.length === 1 ? 'account' : 'accounts'}` : 'Not connected'}
                        </Eyebrow>
                      </div>
                    </div>
                    <button
                      onClick={() => handleConnect(pl)}
                      className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#d4ff3a] transition-colors"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Per-account list */}
                  {hasAccounts && (
                    <div className="border-t border-stone-800">
                      {plAccounts.map(acc => {
                        const ld = liveData[acc.id];
                        const isExpanded = expandedAccount === acc.id;
                        const count = ld?.subscribers ?? ld?.followers;
                        const countLabel = pl === 'youtube' ? 'subs' : 'followers';

                        return (
                          <div key={acc.id} className="border-b border-stone-800 last:border-b-0">
                            <div className="flex items-center justify-between px-5 py-2.5 hover:bg-stone-900/40 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <HealthDot
                                  needsReauth={ld?.needsReauth}
                                  error={ld?.error}
                                  loading={liveLoading && !ld}
                                />
                                <span className="text-sm text-stone-200 truncate font-medium">{acc.accountName}</span>
                                {count !== undefined && (
                                  <span className="font-mono text-[10px] text-stone-500 tabular-nums flex-shrink-0">
                                    {fmtNum(count)} {countLabel}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                {ld?.needsReauth && (
                                  <button
                                    onClick={() => handleConnect(pl)}
                                    className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#ff5e3a] hover:text-[#ff7e5a] transition-colors"
                                  >Reconnect</button>
                                )}
                                {ld && !ld.needsReauth && (
                                  <button
                                    onClick={() => setExpandedAccount(isExpanded ? null : acc.id)}
                                    className="text-stone-600 hover:text-stone-200 transition-colors"
                                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                  >
                                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDisconnect(acc.id)}
                                  className="text-stone-700 hover:text-[#ff5e3a] transition-colors"
                                  aria-label="Disconnect"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>

                            {isExpanded && ld && (ld.recentPosts?.length ?? 0) === 0 && (
                              <div className="px-5 py-3 border-t border-stone-900 text-center">
                                <Eyebrow>No recent posts</Eyebrow>
                              </div>
                            )}

                            {isExpanded && ld?.recentPosts && ld.recentPosts.length > 0 && (
                              <div className="border-t border-stone-900 bg-stone-950/40">
                                {ld.recentPosts.slice(0, 5).map(rp => (
                                  <div key={rp.id} className="flex items-start gap-3 px-5 py-2.5 border-b border-stone-900 last:border-b-0 hover:bg-stone-900/30 transition-colors">
                                    {rp.thumbnail && (
                                      <img src={rp.thumbnail} alt="" className="w-12 h-8 object-cover flex-shrink-0 bg-stone-900" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] text-stone-300 line-clamp-2 leading-tight">{rp.title}</p>
                                      <div className="flex items-center gap-3 mt-1.5 font-mono text-[10px] text-stone-600 tabular-nums">
                                        <span className="flex items-center gap-1"><Eye size={9} />{fmtNum(rp.views)}</span>
                                        <span className="flex items-center gap-1"><Heart size={9} />{fmtNum(rp.likes)}</span>
                                        {rp.comments > 0 && (
                                          <span className="flex items-center gap-1"><MessageCircle size={9} />{fmtNum(rp.comments)}</span>
                                        )}
                                      </div>
                                    </div>
                                    <a
                                      href={rp.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-stone-700 hover:text-stone-300 flex-shrink-0 mt-0.5 transition-colors"
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

                  {/* Stats / connect CTA */}
                  <div className="px-5 py-4 border-t border-stone-800">
                    {!hasAccounts ? (
                      <button
                        onClick={() => handleConnect(pl)}
                        className="block w-full text-center py-2 border border-dashed border-stone-800 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#d4ff3a] hover:border-[#d4ff3a]/40 transition-colors"
                      >
                        Connect {meta.label}
                      </button>
                    ) : allUnavailable ? (
                      <div className="text-center py-1">
                        <Eyebrow>Analytics pending</Eyebrow>
                        <p className="font-mono text-[10px] text-stone-700 mt-1.5 leading-relaxed">
                          {pl === 'linkedin'  && 'LinkedIn MDP access required'}
                          {pl === 'instagram' && 'Awaiting Meta App Review'}
                          {pl === 'facebook'  && 'Awaiting Meta App Review'}
                          {pl === 'threads'   && 'Insights API not wired'}
                        </p>
                      </div>
                    ) : (
                      <div className={`grid gap-3 ${pl === 'linkedin' ? 'grid-cols-3' : 'grid-cols-4'}`}>
                        {(pl === 'linkedin' ? [
                          { v: plStats.posts,             l: 'Posts' },
                          { v: fmtNum(plStats.likes),     l: 'Likes' },
                          { v: fmtNum(plStats.comments),  l: 'Replies' },
                        ] : [
                          { v: fmtNum(plStats.followers), l: 'Followers' },
                          { v: plStats.posts,             l: 'Posts' },
                          { v: fmtNum(plStats.views),     l: 'Views' },
                          { v: fmtNum(plStats.likes),     l: 'Likes' },
                        ]).map(stat => (
                          <div key={stat.l}>
                            <div className="font-display text-lg text-stone-100 tabular-nums tracking-tight" style={{ fontVariationSettings: '"opsz" 80, "wght" 400' }}>
                              {stat.v}
                            </div>
                            <Eyebrow className="text-[9px]">{stat.l}</Eyebrow>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-10">

            {/* Recent posts */}
            <div className="lg:col-span-2">
              <SectionHead
                kicker="Activity"
                title="Recent posts"
                aside={
                  <div className="flex gap-3 flex-wrap">
                    {(['all', ...PLATFORMS] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setPostFilter(f as any)}
                        className={`font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                          postFilter === f
                            ? 'text-[#d4ff3a]'
                            : 'text-stone-600 hover:text-stone-300'
                        }`}
                      >
                        {f === 'all' ? 'All' : platformMeta[f as Platform].label}
                      </button>
                    ))}
                  </div>
                }
              />

              <div className="border border-stone-800 divide-y divide-stone-800">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center py-16 gap-3">
                    <Eyebrow>No published posts yet</Eyebrow>
                    <Link
                      href="/posts/create"
                      className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a] hover:text-[#bff020] transition-colors"
                    >
                      Create your first post →
                    </Link>
                  </div>
                ) : filtered.slice(0, 10).map(post => {
                  const primaryPl = (post.platform || post.platforms?.[0] || '').toLowerCase();
                  const meta = platformMeta[primaryPl as Platform];
                  const date = post.publishedAt?.toDate();
                  const views    = post.metrics?.views || post.metrics?.impressions || 0;
                  const likes    = post.metrics?.likes || 0;
                  const comments = post.metrics?.comments || 0;
                  return (
                    <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-stone-900/40 transition-colors">
                      <div className="flex-shrink-0 mt-0.5" style={{ color: meta?.tone || '#a8a29e' }}>
                        {meta ? <meta.Icon size={16} /> : <Globe size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-100 leading-snug line-clamp-2">{post.caption || 'Untitled post'}</p>
                        <div className="flex items-center gap-5 mt-2 flex-wrap font-mono text-[10px] tabular-nums text-stone-500">
                          {date && <span className="uppercase tracking-[0.15em]">{timeAgo(date)}</span>}
                          <span className="flex items-center gap-1"><Eye size={10} />{fmtNum(views)}</span>
                          <span className="flex items-center gap-1"><Heart size={10} />{fmtNum(likes)}</span>
                          {comments > 0 && <span className="flex items-center gap-1"><MessageCircle size={10} />{fmtNum(comments)}</span>}
                        </div>
                      </div>
                      <HealthDot />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-10">
              {/* Scheduled */}
              <div>
                <SectionHead
                  kicker="Queue"
                  title="Scheduled"
                  aside={<span className="font-mono text-xs tabular-nums text-stone-300">{scheduled.length}</span>}
                />
                <div className="border border-stone-800 divide-y divide-stone-800 max-h-[280px] overflow-y-auto">
                  {scheduled.length === 0 ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                      <Clock size={20} className="text-stone-700" />
                      <Eyebrow>No posts queued</Eyebrow>
                      <Link href="/posts/create" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a]">
                        Schedule one →
                      </Link>
                    </div>
                  ) : scheduled.map(post => {
                    const date = post.scheduledTime!.toDate();
                    const urgent = date.getTime() - Date.now() < 2 * 3600000;
                    const pls = post.platforms?.length ? post.platforms : [post.platform];
                    return (
                      <div key={post.id} className="px-5 py-3.5 hover:bg-stone-900/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          {pls.slice(0, 3).map((pl: string, i: number) => {
                            const m = platformMeta[pl?.toLowerCase() as Platform];
                            return (
                              <span key={i} style={{ color: m?.tone || '#a8a29e' }}>
                                {m ? <m.Icon size={11} /> : <Globe size={11} />}
                              </span>
                            );
                          })}
                          <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ml-auto ${urgent ? 'text-[#ff5e3a]' : 'text-stone-500'}`}>
                            {untilTime(date)}
                          </span>
                        </div>
                        <p className="text-xs text-stone-200 line-clamp-1 leading-snug">{post.caption || 'Untitled'}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Automation */}
              <div>
                <SectionHead
                  kicker="Bots"
                  title="Automation"
                  aside={
                    <Link href="/automation" className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d4ff3a] hover:text-[#bff020] flex items-center gap-1.5 transition-colors">
                      Manage <ArrowUpRight size={11} />
                    </Link>
                  }
                />
                <div className="border border-stone-800 divide-y divide-stone-800">
                  {[
                    { Icon: Link2,          label: 'Link Me rules',  active: autoStats.linkMeActive   },
                    { Icon: MessageCircle,  label: 'Auto Reply',     active: autoStats.autoReplyActive },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <row.Icon size={14} className="text-stone-500" />
                        <span className="text-sm text-stone-200">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <HealthDot loading={row.active === 0 && false} />
                        <span className="font-mono text-xs tabular-nums text-stone-300">
                          {row.active} <span className="text-stone-600">active</span>
                        </span>
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/automation"
                    className="flex items-center justify-center gap-2 py-3.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 hover:text-[#d4ff3a] transition-colors"
                  >
                    <Settings size={11} /> Configure rules
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-10">

            {/* Analytics sub-tab switcher */}
            <div className="flex items-center border-b border-stone-800">
              {(['platform', 'activity'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setAnalyticsView(v)}
                  className={`px-6 py-3 font-mono text-[10px] uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors ${
                    analyticsView === v
                      ? 'border-[#d4ff3a] text-[#d4ff3a]'
                      : 'border-transparent text-stone-500 hover:text-stone-300'
                  }`}
                >
                  {v === 'platform' ? 'Platform Analytics' : 'StarlingPost Activity'}
                </button>
              ))}
              <div className="ml-auto pb-3">
                {analyticsView === 'platform'
                  ? lastSync
                    ? <Eyebrow className="text-[#d4ff3a]">● Live · {timeAgo(lastSync)}</Eyebrow>
                    : <Eyebrow>{liveLoading ? 'Syncing…' : 'Not synced'}</Eyebrow>
                  : <Eyebrow>Via StarlingPost · {published.length} posts</Eyebrow>
                }
              </div>
            </div>

            {/* ── PLATFORM ANALYTICS ── */}
            {analyticsView === 'platform' && (
              <div className="space-y-12">

                {/* Live platform cards */}
                <div>
                  <SectionHead kicker="Live Data" title="Platform breakdown" />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-stone-800 [&>*]:border-stone-800">
                    {platformStats.map((s, idx) => {
                      const meta = platformMeta[s.platform as Platform];
                      const plAccounts = accountsByPlatform[s.platform as Platform] || [];
                      const allUnavail = plAccounts.length > 0 && plAccounts.every(a => liveData[a.id]?.analyticsUnavailable);
                      const hasLive = plAccounts.some(a => liveData[a.id] && !liveData[a.id]?.analyticsUnavailable && !liveData[a.id]?.error);
                      const col = idx % 3;
                      const row = Math.floor(idx / 3);
                      const totalRows = Math.ceil(platformStats.length / 3);
                      return (
                        <div
                          key={s.platform}
                          className={`p-6 ${col < 2 ? 'md:border-r lg:border-r' : ''} ${row < totalRows - 1 ? 'border-b' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 border border-stone-800 flex items-center justify-center" style={{ color: meta.tone }}>
                                <meta.Icon size={16} />
                              </div>
                              <div>
                                <div className="font-display italic text-lg text-stone-100 leading-tight">{meta.label}</div>
                                <Eyebrow>{plAccounts.length} {plAccounts.length === 1 ? 'account' : 'accounts'}</Eyebrow>
                              </div>
                            </div>
                            {plAccounts.length > 0 && (
                              <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border ${
                                hasLive ? 'border-[#d4ff3a]/30 text-[#d4ff3a]' : 'border-stone-800 text-stone-600'
                              }`}>
                                {hasLive ? 'Live' : 'N/A'}
                              </span>
                            )}
                          </div>
                          {plAccounts.length === 0 ? (
                            <Eyebrow className="text-stone-700">Not connected</Eyebrow>
                          ) : allUnavail ? (
                            <div className="py-2">
                              <Eyebrow className="text-stone-600">Analytics pending</Eyebrow>
                              <p className="font-mono text-[10px] text-stone-700 mt-2 leading-relaxed">
                                {s.platform === 'linkedin'  && 'LinkedIn MDP access required'}
                                {s.platform === 'instagram' && 'Pending Meta App Review'}
                                {s.platform === 'facebook'  && 'Pending Meta App Review'}
                                {s.platform === 'threads'   && 'Threads insights not yet wired'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2.5 border-t border-stone-800 pt-4">
                              {[
                                { label: 'Followers', value: s.followers },
                                { label: 'Posts',     value: s.posts     },
                                { label: 'Views',     value: s.views     },
                                { label: 'Likes',     value: s.likes     },
                                { label: 'Comments',  value: s.comments  },
                              ].map(row => (
                                <div key={row.label} className="flex items-baseline justify-between">
                                  <Eyebrow>{row.label}</Eyebrow>
                                  <span className="font-display tabular-nums text-stone-100 text-lg" style={{ fontVariationSettings: '"opsz" 80, "wght" 400' }}>
                                    {fmtNum(row.value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cross-platform bar chart */}
                <div>
                  <SectionHead kicker="Engagement" title="Cross-platform comparison" />
                  <div className="border border-stone-800 p-6 md:p-8">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={platformStats} barSize={20} barGap={4}>
                        <CartesianGrid strokeDasharray="2 4" stroke="#292524" vertical={false} />
                        <XAxis
                          dataKey="platform"
                          tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}
                          tickFormatter={v => (platformMeta[v as Platform]?.label || v).toUpperCase()}
                          axisLine={{ stroke: '#292524' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={fmtNum}
                          width={44}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212, 255, 58, 0.04)' }} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#a8a29e', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.15em' }} />
                        <Bar dataKey="views"     name="Views"     fill={CHART_TONES.views} />
                        <Bar dataKey="likes"     name="Likes"     fill={CHART_TONES.likes} />
                        <Bar dataKey="comments"  name="Comments"  fill={CHART_TONES.comments} />
                        <Bar dataKey="followers" name="Followers" fill={CHART_TONES.followers} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {/* ── STARLINGPOST ACTIVITY ── */}
            {analyticsView === 'activity' && (
              <div className="space-y-12">

                {/* Publishing stats ledger */}
                <div>
                  <SectionHead kicker="Publishing" title="Activity overview" />
                  <div className="grid grid-cols-2 md:grid-cols-4 border border-stone-800">
                    {[
                      { label: 'Published',  value: published.length,          unit: 'posts'   },
                      { label: 'Scheduled',  value: scheduled.length,          unit: 'queued'  },
                      { label: 'Link-Me',    value: autoStats.linkMeActive,    unit: 'active'  },
                      { label: 'Auto-Reply', value: autoStats.autoReplyActive, unit: 'active'  },
                    ].map((s, idx) => (
                      <div key={s.label} className={`p-6 md:p-8 ${idx < 3 ? 'border-r border-stone-800' : ''} ${idx < 2 ? 'border-b md:border-b-0 border-stone-800' : ''}`}>
                        <Eyebrow>{s.label}</Eyebrow>
                        <div
                          className="font-display text-stone-100 tabular-nums tracking-tight leading-none mt-2"
                          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontVariationSettings: '"opsz" 144, "wght" 350' }}
                        >
                          {s.value}
                        </div>
                        <Eyebrow className="mt-1">{s.unit}</Eyebrow>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Posts per month */}
                <div>
                  <SectionHead kicker="Cadence" title="Posts per month" />
                  <div className="border border-stone-800 p-6 md:p-8">
                    {postsByMonth.length === 0 ? (
                      <div className="flex flex-col items-center py-16 gap-3">
                        <Eyebrow>Publish posts to see trends</Eyebrow>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={postsByMonth}>
                          <defs>
                            <linearGradient id="gradMonth-citron" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%"  stopColor="#d4ff3a" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#d4ff3a" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#292524" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }} axisLine={{ stroke: '#292524' }} tickLine={false} />
                          <YAxis tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#44403c', strokeWidth: 1 }} />
                          <Legend wrapperStyle={{ fontSize: 11, color: '#a8a29e', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.15em' }} />
                          <Area type="monotone" dataKey="YouTube"   stroke={platformMeta.youtube.tone}   fill="transparent" strokeWidth={1.5} dot={false} />
                          <Area type="monotone" dataKey="Twitter/X" stroke={platformMeta.twitter.tone}   fill="transparent" strokeWidth={1.5} dot={false} />
                          <Area type="monotone" dataKey="LinkedIn"  stroke={platformMeta.linkedin.tone}  fill="transparent" strokeWidth={1.5} dot={false} />
                          <Area type="monotone" dataKey="Instagram" stroke={platformMeta.instagram.tone} fill="transparent" strokeWidth={1.5} dot={false} />
                          <Area type="monotone" dataKey="Facebook"  stroke={platformMeta.facebook.tone}  fill="transparent" strokeWidth={1.5} dot={false} />
                          <Area type="monotone" dataKey="Threads"   stroke={platformMeta.threads.tone}   fill="transparent" strokeWidth={1.5} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Best performing platform */}
                <div>
                  <SectionHead
                    kicker="Performance"
                    title="Best performing platform"
                    aside={<Eyebrow>Avg per post · stored metrics</Eyebrow>}
                  />
                  {platformPerformance.length === 0 ? (
                    <div className="border border-stone-800 flex flex-col items-center py-16 gap-3">
                      <TrendingUp size={20} className="text-stone-700" />
                      <Eyebrow>No engagement data yet</Eyebrow>
                    </div>
                  ) : (
                    <div className="border border-stone-800">
                      {platformPerformance.map((p, idx) => {
                        const meta = platformMeta[p.platform as Platform];
                        const maxViews = platformPerformance[0].avgViews || 1;
                        const pct = Math.round((p.avgViews / maxViews) * 100);
                        return (
                          <div key={p.platform} className={`flex items-center gap-4 px-6 py-4 ${idx < platformPerformance.length - 1 ? 'border-b border-stone-800' : ''}`}>
                            <span className="font-mono text-[10px] text-stone-700 w-4 flex-shrink-0">{idx + 1}</span>
                            <div className="flex items-center gap-2 w-28 flex-shrink-0">
                              <meta.Icon size={13} style={{ color: meta.tone }} />
                              <Eyebrow className="text-stone-400">{meta.label}</Eyebrow>
                            </div>
                            <div className="flex-1 h-px bg-stone-900 relative mx-2">
                              <div
                                className="absolute inset-y-0 left-0 h-full"
                                style={{ width: `${pct}%`, backgroundColor: meta.tone, opacity: 0.6, height: '1px' }}
                              />
                            </div>
                            <div className="flex items-center gap-6 flex-shrink-0">
                              <div className="text-right">
                                <div className="font-display tabular-nums text-stone-100 text-base leading-tight" style={{ fontVariationSettings: '"opsz" 80' }}>
                                  {fmtNum(p.avgViews)}
                                </div>
                                <Eyebrow>avg views</Eyebrow>
                              </div>
                              <div className="text-right">
                                <div className="font-display tabular-nums text-stone-100 text-base leading-tight" style={{ fontVariationSettings: '"opsz" 80' }}>
                                  {fmtNum(p.avgLikes)}
                                </div>
                                <Eyebrow>avg likes</Eyebrow>
                              </div>
                              <div className="text-right hidden md:block">
                                <div className="font-display tabular-nums text-stone-500 text-sm leading-tight">
                                  {p.count}
                                </div>
                                <Eyebrow>posts</Eyebrow>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Engagement trend */}
                <div>
                  <SectionHead
                    kicker="Trend"
                    title="Last 12 posts"
                    aside={<Eyebrow>Stored metrics · via StarlingPost</Eyebrow>}
                  />
                  <div className="border border-stone-800 p-6 md:p-8">
                    {viewsTrend.length === 0 ? (
                      <div className="flex flex-col items-center py-16 gap-3">
                        <TrendingUp size={20} className="text-stone-700" />
                        <Eyebrow>No engagement data yet</Eyebrow>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={viewsTrend}>
                          <defs>
                            <linearGradient id="gradV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d4ff3a" stopOpacity={0.35} /><stop offset="95%" stopColor="#d4ff3a" stopOpacity={0} /></linearGradient>
                            <linearGradient id="gradL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f4f1ea" stopOpacity={0.25} /><stop offset="95%" stopColor="#f4f1ea" stopOpacity={0} /></linearGradient>
                            <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5e3a" stopOpacity={0.25} /><stop offset="95%" stopColor="#ff5e3a" stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="2 4" stroke="#292524" vertical={false} />
                          <XAxis dataKey="idx" tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }} tickFormatter={v => `#${v}`} axisLine={{ stroke: '#292524' }} tickLine={false} />
                          <YAxis tick={{ fill: '#78716c', fontSize: 11, fontFamily: 'var(--font-mono), monospace' }} axisLine={false} tickLine={false} tickFormatter={fmtNum} width={40} />
                          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#44403c', strokeWidth: 1 }} />
                          <Legend wrapperStyle={{ fontSize: 11, color: '#a8a29e', fontFamily: 'var(--font-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.15em' }} />
                          <Area type="monotone" dataKey="views"    name="Views"    stroke="#d4ff3a" fill="url(#gradV)" strokeWidth={1.8} dot={false} />
                          <Area type="monotone" dataKey="likes"    name="Likes"    stroke="#f4f1ea" fill="url(#gradL)" strokeWidth={1.5} dot={false} />
                          <Area type="monotone" dataKey="comments" name="Comments" stroke="#ff5e3a" fill="url(#gradC)" strokeWidth={1.5} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ── Quick actions ── */}
        <section>
          <SectionHead kicker="Shortcuts" title="Quick actions" />
          <div className="grid grid-cols-2 md:grid-cols-4 border border-stone-800 [&>*]:border-stone-800">
            {[
              { label: 'Create post', icon: PlusCircle, href: '/posts/create' },
              { label: 'Automation',  icon: Bot,        href: '/automation'   },
              { label: 'Analytics',   icon: TrendingUp, href: '#',             onClick: () => setActiveTab('analytics') },
              { label: 'Settings',    icon: Settings,   href: '/settings'     },
            ].map((item, idx) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                className={`group flex items-center justify-between p-6 ${idx < 3 ? 'md:border-r' : ''} ${idx < 2 ? 'border-b md:border-b-0' : ''} hover:bg-[#d4ff3a]/5 transition-colors`}
              >
                <div>
                  <Eyebrow>0{idx + 1}</Eyebrow>
                  <div className="font-display italic text-xl text-stone-100 mt-2 group-hover:text-[#d4ff3a] transition-colors">
                    {item.label}
                  </div>
                </div>
                <item.icon size={16} className="text-stone-600 group-hover:text-[#d4ff3a] transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Footer note ── */}
        <footer className="border-t border-stone-800 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Eyebrow>StarlingPost Studio · v1</Eyebrow>
          <Eyebrow>
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · Asia/Calcutta
          </Eyebrow>
        </footer>

      </div>

      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}
