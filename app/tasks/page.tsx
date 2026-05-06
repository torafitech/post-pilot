// app/tasks/page.tsx
// Single place to see every post in the queue: scheduled, publishing,
// failed, drafts. Reads from Firestore `posts` (top-level scheduler
// docs). Lets the user retry a failed publish, cancel a scheduled
// post, or jump to /posts/create.
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection, deleteDoc, doc, getDocs, orderBy, query, where,
} from 'firebase/firestore';
import {
  AlertCircle, ArrowLeft, Calendar, CheckCircle2, Clock, FileText,
  Loader2, MoreVertical, PlusCircle, RefreshCw, Trash2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { authFetch } from '@/lib/authClient';
import { db } from '@/lib/firebase';
import { ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_LABEL, type Platform } from '@/lib/platformConfig';
import {
  Youtube, Twitter, Linkedin, Instagram, Facebook, Music, MessageCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────

interface TaskDoc {
  id: string;
  userId: string;
  caption: string;
  platforms: string[];
  platform?: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  status: string;          // 'scheduled' | 'publishing' | 'published' | 'partially_published' | 'failed' | 'draft'
  scheduleMode?: 'now' | 'ai' | 'custom';
  scheduledTime?: any;
  publishedAt?: any;
  createdAt?: any;
  errors?: any[];
  platformPostIds?: Record<string, string>;
}

type TabId = 'scheduled' | 'failed' | 'published' | 'all';

const PLATFORM_ICONS: Record<string, any> = {
  youtube:   Youtube,
  twitter:   Twitter,
  linkedin:  Linkedin,
  instagram: Instagram,
  facebook:  Facebook,
  threads:   MessageCircle,
  tiktok:    Music,
};

const PLATFORM_COLORS: Record<string, string> = {
  youtube:   'text-red-400',
  twitter:   'text-sky-400',
  linkedin:  'text-blue-400',
  instagram: 'text-pink-400',
  facebook:  'text-indigo-400',
  threads:   'text-gray-200',
  tiktok:    'text-fuchsia-400',
};

// ── Helpers ──────────────────────────────────────────────────────────────

function untilTime(d: Date) {
  const ms = d.getTime() - Date.now();
  if (ms <= 0) return 'Overdue';
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const days = Math.floor(h / 24);
  if (days > 0) return `in ${days}d ${h % 24}h`;
  if (h > 0)   return `in ${h}h ${m % 60}m`;
  return `in ${m}m`;
}

function formatDate(d?: Date | null) {
  if (!d) return '—';
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function statusMeta(status: string) {
  switch (status) {
    case 'scheduled':
      return { label: 'Scheduled', color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/30', Icon: Clock };
    case 'publishing':
      return { label: 'Publishing', color: 'text-cyan-300', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', Icon: Loader2 };
    case 'published':
      return { label: 'Published', color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', Icon: CheckCircle2 };
    case 'partially_published':
      return { label: 'Partial', color: 'text-orange-300', bg: 'bg-orange-500/15', border: 'border-orange-500/30', Icon: AlertCircle };
    case 'failed':
      return { label: 'Failed', color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/30', Icon: AlertCircle };
    case 'draft':
    default:
      return { label: 'Draft', color: 'text-gray-300', bg: 'bg-gray-700/40', border: 'border-gray-700', Icon: FileText };
  }
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('scheduled');
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(query(
        collection(db, 'posts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
      ));
      const list: TaskDoc[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setTasks(list);
    } catch (err: any) {
      toast.error('Could not load tasks', err.message);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    scheduled: tasks.filter((t) => t.status === 'scheduled' || t.status === 'publishing').length,
    failed:    tasks.filter((t) => t.status === 'failed' || t.status === 'partially_published').length,
    published: tasks.filter((t) => t.status === 'published').length,
    all:       tasks.length,
  }), [tasks]);

  const filtered = useMemo(() => {
    switch (tab) {
      case 'scheduled': return tasks.filter((t) => t.status === 'scheduled' || t.status === 'publishing');
      case 'failed':    return tasks.filter((t) => t.status === 'failed' || t.status === 'partially_published');
      case 'published': return tasks.filter((t) => t.status === 'published');
      case 'all':       return tasks;
    }
  }, [tasks, tab]);

  const handleRetry = async (task: TaskDoc) => {
    setRetrying(task.id);
    try {
      const res = await authFetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: task.id,
          platforms: task.platforms,
          caption: task.caption,
          imageUrl: task.imageUrl,
          videoUrl: task.videoUrl,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        toast.error('Retry failed', body.error || 'Could not republish.');
      } else {
        toast.success('Re-publishing', 'Task re-queued for publication.');
        load();
      }
    } catch (err: any) {
      toast.error('Retry failed', err.message);
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async (task: TaskDoc) => {
    if (!confirm(`Delete this ${statusMeta(task.status).label.toLowerCase()} task? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'posts', task.id));
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success('Task removed');
    } catch (err: any) {
      toast.error('Could not delete', err.message);
    }
  };

  if (authLoading || (loading && !tasks.length)) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-7 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 -ml-2 rounded-lg hover:bg-gray-800/60 transition-colors">
              <ArrowLeft size={20} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/10">
                  <Calendar className="text-amber-400" size={20} />
                </span>
                Tasks &amp; queue
              </h1>
              <p className="text-gray-500 text-sm mt-1 ml-12">
                Everything in the pipeline — scheduled, failed, and published.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors"
              aria-label="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              href="/posts/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20"
            >
              <PlusCircle size={15} /> Create
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {(
            [
              { id: 'scheduled', label: 'Scheduled', count: counts.scheduled, color: 'amber'   },
              { id: 'failed',    label: 'Failed',    count: counts.failed,    color: 'red'     },
              { id: 'published', label: 'Published', count: counts.published, color: 'emerald' },
              { id: 'all',       label: 'All',       count: counts.all,       color: 'gray'    },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap border transition-colors ${
                  active
                    ? `bg-${t.color}-500/15 border-${t.color}-500/40 text-${t.color}-300`
                    : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-200'
                }`}
                style={
                  active
                    ? {
                        backgroundColor: { amber: 'rgba(245,158,11,0.12)', red: 'rgba(239,68,68,0.12)', emerald: 'rgba(16,185,129,0.12)', gray: 'rgba(156,163,175,0.10)' }[t.color],
                        borderColor:     { amber: 'rgba(245,158,11,0.45)', red: 'rgba(239,68,68,0.45)', emerald: 'rgba(16,185,129,0.45)', gray: 'rgba(156,163,175,0.30)' }[t.color],
                        color:           { amber: '#fcd34d', red: '#fca5a5', emerald: '#6ee7b7', gray: '#d4d4d8' }[t.color],
                      }
                    : undefined
                }
              >
                {t.label}
                <span className="text-xs px-1.5 py-0.5 rounded-md bg-black/30">{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
            {tab === 'scheduled' && (
              <>
                <Calendar size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold">No scheduled tasks</p>
                <p className="text-gray-500 text-xs mt-1 mb-4">Schedule a post to see it queued here.</p>
              </>
            )}
            {tab === 'failed' && (
              <>
                <CheckCircle2 size={32} className="text-emerald-700 mx-auto mb-3" />
                <p className="text-white font-semibold">Nothing failed — clean queue.</p>
              </>
            )}
            {tab === 'published' && (
              <>
                <FileText size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold">No published posts yet</p>
              </>
            )}
            {tab === 'all' && (
              <>
                <FileText size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-white font-semibold">No posts yet</p>
              </>
            )}
            <Link
              href="/posts/create"
              className="inline-flex items-center gap-1.5 mt-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              Create your first post →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onRetry={handleRetry}
                onDelete={handleDelete}
                retrying={retrying === task.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Task card ────────────────────────────────────────────────────────────

function TaskCard({
  task, onRetry, onDelete, retrying,
}: {
  task: TaskDoc;
  onRetry: (t: TaskDoc) => void;
  onDelete: (t: TaskDoc) => void;
  retrying: boolean;
}) {
  const meta = statusMeta(task.status);
  const platforms = task.platforms?.length ? task.platforms : task.platform ? [task.platform] : [];
  const scheduledDate = task.scheduledTime?.toDate?.() || null;
  const publishedDate = task.publishedAt?.toDate?.() || null;
  const isFutureScheduled = scheduledDate && scheduledDate.getTime() > Date.now();
  const canRetry = task.status === 'failed' || task.status === 'partially_published';
  const canDelete = task.status !== 'publishing';

  const errMsg = (() => {
    if (!task.errors?.length) return null;
    const first = task.errors[0];
    if (typeof first === 'string') return first;
    return first?.error || first?.message || 'Unknown error';
  })();

  return (
    <div className={`bg-gray-900 border ${meta.border} rounded-2xl p-5 transition-colors`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status pill */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color} border ${meta.border}`}>
            <meta.Icon size={12} className={task.status === 'publishing' ? 'animate-spin' : ''} />
            {meta.label}
          </span>

          {/* Platform chips */}
          {platforms.map((p) => {
            const Icon = PLATFORM_ICONS[p.toLowerCase()] || MessageCircle;
            const enabled = ENABLED_PLATFORMS.has(p.toLowerCase() as Platform);
            return (
              <span
                key={p}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs ${PLATFORM_COLORS[p.toLowerCase()] || 'text-gray-400'} bg-gray-800/60`}
                title={!enabled ? `${PLATFORM_LABEL[p as Platform] || p} integration coming soon` : undefined}
              >
                <Icon size={10} />
                <span className="capitalize">{PLATFORM_LABEL[p as Platform] || p}</span>
                {!enabled && <span className="text-amber-400 ml-0.5">·soon</span>}
              </span>
            );
          })}

          {/* Time hint */}
          {scheduledDate && task.status === 'scheduled' && (
            <span className="text-xs text-amber-300/90">
              {untilTime(scheduledDate)}
            </span>
          )}
          {publishedDate && task.status === 'published' && (
            <span className="text-xs text-gray-500">
              {formatDate(publishedDate)}
            </span>
          )}
        </div>

        {/* Action menu */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canRetry && (
            <button
              onClick={() => onRetry(task)}
              disabled={retrying}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {retrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Retry
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(task)}
              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-200 line-clamp-2 mb-2.5">
        {task.caption || <em className="text-gray-600">No caption</em>}
      </p>

      <div className="flex items-center gap-4 text-[11px] text-gray-600">
        {scheduledDate && task.status !== 'published' && (
          <span className="flex items-center gap-1">
            <Calendar size={11} /> {formatDate(scheduledDate)}
          </span>
        )}
        {task.imageUrl && <span>· image attached</span>}
        {task.videoUrl && <span>· video attached</span>}
      </div>

      {errMsg && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          <strong className="font-semibold">Error:</strong> {errMsg}
        </div>
      )}
    </div>
  );
}
