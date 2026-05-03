'use client';

import { PremiumModal } from '@/components/PremiumModal';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/authClient';
import { db } from '@/lib/firebase';
import { DashboardPost, SocialPost } from '@/types/post';
import {
  collection, doc, getDoc, getDocs, limit,
  orderBy, query, updateDoc, where,
} from 'firebase/firestore';
import {
  BarChart2, Bot, Calendar, CheckCircle2, Clock, Eye,
  Globe, Heart, Linkedin, MessageCircle, PlusCircle,
  RefreshCw, Settings, ThumbsUp, TrendingUp, Twitter,
  Users, Video, Youtube, Zap, Link2, ArrowUpRight, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accessToken: string;
  connectedAt: Date;
}

const PLATFORMS = ['youtube', 'twitter', 'linkedin'] as const;
type Platform = typeof PLATFORMS[number];

const platformMeta: Record<Platform, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  youtube:  { icon: <Youtube  size={18} />, color: 'text-red-400',  bg: 'bg-red-500/10',  label: 'YouTube'   },
  twitter:  { icon: <Twitter  size={18} />, color: 'text-sky-400',  bg: 'bg-sky-500/10',  label: 'Twitter/X' },
  linkedin: { icon: <Linkedin size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'LinkedIn'  },
};

const oauthRoutes: Record<Platform, (uid: string) => string> = {
  youtube:  uid => `/api/auth/youtube?uid=${encodeURIComponent(uid)}`,
  twitter:  uid => `/api/auth/twitter/oauth1?uid=${encodeURIComponent(uid)}`,
  linkedin: uid => `/api/auth/linkedin?uid=${encodeURIComponent(uid)}`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function timeAgo(date: Date) {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60)   return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function timeLeft(date: Date) {
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return 'Due now';
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, gradient,
}: { label: string; value: string | number; sub?: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 bg-gray-900 border border-gray-800`}>
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${gradient}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
          <div className="text-gray-600">{icon}</div>
        </div>
        <div className="text-3xl font-extrabold text-white mb-1">{value}</div>
        {sub && <div className="text-xs text-gray-500">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Platform connection card ─────────────────────────────────────────────────

function PlatformCard({
  platform, account, posts, onConnect, onDisconnect,
}: {
  platform: Platform;
  account: ConnectedAccount | null;
  posts: DashboardPost[];
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const meta = platformMeta[platform];
  const platformPosts = posts.filter(p => p.platform?.toLowerCase() === platform && p.publishedAt);
  const totalLikes = platformPosts.reduce((s, p) => s + (p.metrics?.likes || 0), 0);
  const totalViews = platformPosts.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0);

  if (!account) {
    return (
      <div className="bg-gray-900 border border-dashed border-gray-700 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center min-h-[160px]">
        <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center ${meta.color} opacity-50`}>
          {meta.icon}
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-400">{meta.label}</div>
          <div className="text-xs text-gray-600 mt-0.5">Not connected</div>
        </div>
        <button
          onClick={onConnect}
          className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-colors"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center ${meta.color}`}>
            {meta.icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{account.accountName}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-[10px] text-emerald-400">Connected</span>
            </div>
          </div>
        </div>
        <button
          onClick={onDisconnect}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
          title="Disconnect"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/60 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{platformPosts.length}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Posts</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{fmtNum(totalViews)}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Views</div>
        </div>
        <div className="bg-gray-800/60 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-white">{fmtNum(totalLikes)}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Likes</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [posts, setPosts] = useState<DashboardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | Platform>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    Promise.all([fetchAccounts(), fetchPosts()]).finally(() => setLoading(false));
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccounts = async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return;
    const list: ConnectedAccount[] = (snap.data()?.connectedAccounts || []).map((a: any) => ({
      id: a.id,
      platform: a.platform?.toLowerCase(),
      accountName: a.accountName || a.accountLabel || a.platform,
      accessToken: a.accessToken || '',
      connectedAt: a.connectedAt?.toDate?.() || new Date(),
    }));
    setConnectedAccounts(list);
  };

  const fetchPosts = async () => {
    if (!user) return;
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100),
    );
    const snap = await getDocs(q);
    const list: SocialPost[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as any));
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

  const handleConnect = (platform: string) => {
    if (!user) return;
    const route = oauthRoutes[platform as Platform]?.(user.uid);
    if (route) window.location.href = route;
  };

  const handleDisconnect = async (accountId: string) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const filtered = (snap.data()?.connectedAccounts || []).filter((a: any) => a.id !== accountId);
      await updateDoc(ref, { connectedAccounts: filtered });
    }
    setConnectedAccounts(prev => prev.filter(a => a.id !== accountId));
  };

  // ── Derived data ─────────────────────────────────────────────────────────────

  const publishedPosts = useMemo(() =>
    posts.filter(p => p.publishedAt && typeof p.publishedAt.toDate === 'function')
      .sort((a, b) => b.publishedAt!.toDate().getTime() - a.publishedAt!.toDate().getTime()),
    [posts]);

  const scheduledPosts = useMemo(() =>
    posts.filter(p => p.status === 'scheduled' && p.scheduledTime && typeof p.scheduledTime.toDate === 'function')
      .sort((a, b) => a.scheduledTime!.toDate().getTime() - b.scheduledTime!.toDate().getTime()),
    [posts]);

  const filteredPublished = useMemo(() =>
    activeFilter === 'all' ? publishedPosts : publishedPosts.filter(p => p.platform?.toLowerCase() === activeFilter),
    [publishedPosts, activeFilter]);

  const totalViews = useMemo(() => publishedPosts.reduce((s, p) => s + (p.metrics?.views || p.metrics?.impressions || 0), 0), [publishedPosts]);
  const totalLikes = useMemo(() => publishedPosts.reduce((s, p) => s + (p.metrics?.likes || 0), 0), [publishedPosts]);
  const totalComments = useMemo(() => publishedPosts.reduce((s, p) => s + (p.metrics?.comments || 0), 0), [publishedPosts]);

  const accountMap = useMemo(() => {
    const m: Partial<Record<Platform, ConnectedAccount>> = {};
    connectedAccounts.forEach(a => { if (PLATFORMS.includes(a.platform as Platform)) m[a.platform as Platform] = a; });
    return m;
  }, [connectedAccounts]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-gray-800 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-medium">Creator Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              {greeting},{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {userProfile?.displayName || user.email?.split('@')[0] || 'Creator'}
              </span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Here's how your content is performing.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
            <button
              onClick={() => setShowPremium(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium transition-colors"
            >
              <Zap size={15} />
              Upgrade
            </button>
            <Link
              href="/posts/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all"
            >
              <PlusCircle size={15} />
              Create Post
            </Link>
          </div>
        </div>

        {/* ── Overview stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Posts"
            value={publishedPosts.length}
            sub="Published across platforms"
            icon={<Video size={18} />}
            gradient="bg-cyan-500"
          />
          <StatCard
            label="Total Views"
            value={fmtNum(totalViews)}
            sub="Views & impressions"
            icon={<Eye size={18} />}
            gradient="bg-purple-500"
          />
          <StatCard
            label="Engagement"
            value={fmtNum(totalLikes + totalComments)}
            sub="Likes + comments"
            icon={<Heart size={18} />}
            gradient="bg-pink-500"
          />
          <StatCard
            label="Scheduled"
            value={scheduledPosts.length}
            sub="Posts in queue"
            icon={<Clock size={18} />}
            gradient="bg-amber-500"
          />
        </div>

        {/* ── Connected platforms ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe size={16} className="text-gray-400" />
              Connected Platforms
            </h2>
            <span className="text-xs text-gray-600">{connectedAccounts.length}/3 connected</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLATFORMS.map(p => (
              <PlatformCard
                key={p}
                platform={p}
                account={accountMap[p] || null}
                posts={posts}
                onConnect={() => handleConnect(p)}
                onDisconnect={() => {
                  const acc = accountMap[p];
                  if (acc) handleDisconnect(acc.id);
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Automation quick status ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot size={16} className="text-purple-400" />
              Automation
            </h2>
            <Link
              href="/automation"
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              Manage <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: <Link2 size={14} />, label: 'Link Me', desc: 'Auto-send links on keyword', href: '/automation', color: 'text-orange-400' },
              { icon: <MessageCircle size={14} />, label: 'Auto-Reply', desc: 'Reply to comments 24/7', href: '/automation', color: 'text-emerald-400' },
              { icon: <ThumbsUp size={14} />, label: 'Auto-Pin', desc: 'Pin first comment on YouTube', href: '/posts/create', color: 'text-yellow-400' },
            ].map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-start gap-3 p-4 bg-gray-800/60 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <div className={`mt-0.5 ${item.color}`}>{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-white">{item.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Posts + Scheduled grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Recent posts (takes 2/3) */}
          <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 size={16} className="text-emerald-400" />
                Recent Posts
              </h2>
              <div className="flex items-center gap-1">
                {(['all', ...PLATFORMS] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      activeFilter === f
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {f === 'all' ? 'All' : platformMeta[f as Platform].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-800/60">
              {filteredPublished.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Video size={32} className="text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500">No published posts yet.</p>
                  <Link href="/posts/create" className="mt-3 text-xs text-cyan-400 hover:text-cyan-300">
                    Create your first post →
                  </Link>
                </div>
              ) : (
                filteredPublished.slice(0, 8).map(post => {
                  const meta = platformMeta[post.platform?.toLowerCase() as Platform];
                  const publishedDate = post.publishedAt?.toDate();
                  const views = post.metrics?.views || post.metrics?.impressions || 0;
                  const likes = post.metrics?.likes || 0;
                  const comments = post.metrics?.comments || 0;

                  return (
                    <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
                      {/* Platform icon */}
                      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${meta?.bg || 'bg-gray-800'} ${meta?.color || 'text-gray-400'} mt-0.5`}>
                        {meta?.icon || <Globe size={16} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white line-clamp-1 font-medium">
                          {post.caption || 'Untitled post'}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {publishedDate && (
                            <span className="text-xs text-gray-600">{timeAgo(publishedDate)}</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Eye size={11} />{fmtNum(views)}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Heart size={11} />{fmtNum(likes)}
                          </span>
                          {comments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <MessageCircle size={11} />{fmtNum(comments)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex-shrink-0">
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={10} />
                          Published
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Scheduled posts (takes 1/3) */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar size={16} className="text-amber-400" />
                Scheduled
              </h2>
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">
                {scheduledPosts.length}
              </span>
            </div>

            <div className="divide-y divide-gray-800/60 max-h-[420px] overflow-y-auto">
              {scheduledPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <Clock size={28} className="text-gray-700 mb-3" />
                  <p className="text-sm text-gray-500">No posts scheduled.</p>
                  <Link href="/posts/create" className="mt-2 text-xs text-cyan-400 hover:text-cyan-300">
                    Schedule one →
                  </Link>
                </div>
              ) : (
                scheduledPosts.map(post => {
                  const schedDate = post.scheduledTime!.toDate();
                  const platforms = post.platforms?.length ? post.platforms : [post.platform];
                  const isUrgent = schedDate.getTime() - Date.now() < 2 * 3600000;

                  return (
                    <div key={post.id} className="px-5 py-4 hover:bg-gray-800/30 transition-colors">
                      <div className="flex -space-x-1.5 mb-2">
                        {platforms.slice(0, 3).map((pl, i) => {
                          const m = platformMeta[pl?.toLowerCase() as Platform];
                          return (
                            <div key={i} className={`w-6 h-6 rounded-md flex items-center justify-center ring-2 ring-gray-900 text-xs ${m?.bg || 'bg-gray-800'} ${m?.color || 'text-gray-400'}`}>
                              {m?.icon || <Globe size={10} />}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-sm text-white line-clamp-1 mb-1.5">
                        {post.caption || 'Untitled post'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Clock size={10} className={isUrgent ? 'text-red-400' : 'text-amber-400'} />
                        <span className={`text-xs font-medium ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
                          {timeLeft(schedDate)}
                        </span>
                        <span className="text-xs text-gray-600">
                          · {schedDate.toLocaleDateString()} {schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Empty platforms notice */}
            {connectedAccounts.length === 0 && (
              <div className="px-5 py-4 border-t border-gray-800">
                <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                  <p>Connect a platform to start publishing scheduled posts.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Quick actions row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Create Post', icon: <PlusCircle size={18} />, href: '/posts/create', color: 'from-cyan-500 to-blue-600', text: 'text-white', desc: 'Write, schedule & publish' },
            { label: 'Automation', icon: <Bot size={18} />, href: '/automation', color: 'from-purple-600/40 to-pink-600/20', text: 'text-purple-300', desc: 'Manage Link Me & Auto Reply' },
            { label: 'Analytics', icon: <TrendingUp size={18} />, href: '/dashboard', color: 'from-emerald-600/30 to-teal-600/20', text: 'text-emerald-300', desc: 'Track your performance' },
            { label: 'Settings', icon: <Settings size={18} />, href: '/settings', color: 'from-gray-700/60 to-gray-600/20', text: 'text-gray-300', desc: 'Account & preferences' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br ${item.color} border border-white/5 hover:border-white/10 transition-all hover:scale-[1.02]`}
            >
              <div className={item.text}>{item.icon}</div>
              <div>
                <div className={`text-sm font-semibold ${item.text}`}>{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>

      </div>

      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />
    </div>
  );
}
