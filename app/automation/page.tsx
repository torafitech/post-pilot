'use client';

import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/authClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Link2,
  MessageCircle,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Zap,
  Youtube,
  Twitter,
  Linkedin,
  Sparkles,
  RefreshCw,
  Bot,
  Play,
  CheckCircle,
  AlertCircle,
  Pencil,
  X,
} from 'lucide-react';

interface LinkMeRule {
  id: string;
  keyword: string;
  replyMessage: string;
  platforms: string[];
  isActive: boolean;
  totalMatches: number;
  postScope?: 'recent' | 'custom';
  recentCount?: number;
  customUrls?: string[];
}

interface AutoReplyTemplate {
  id: string;
  name: string;
  message: string;
  platforms: string[];
  isActive: boolean;
  useAI: boolean;
  postScope?: 'recent' | 'custom';
  recentCount?: number;
  customUrls?: string[];
}

const platformIcons: Record<string, React.ReactNode> = {
  youtube: <Youtube size={14} className="text-red-400" />,
  twitter: <Twitter size={14} className="text-sky-400" />,
  linkedin: <Linkedin size={14} className="text-blue-400" />,
};

const betaPlatforms = ['youtube', 'twitter', 'linkedin'];
const comingSoonPlatforms = new Set<string>(['linkedin']);

export default function AutomationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'link-me' | 'auto-reply'>('link-me');
  const [linkMeRules, setLinkMeRules] = useState<LinkMeRule[]>([]);
  const [autoReplyTemplates, setAutoReplyTemplates] = useState<AutoReplyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Link Me form
  const [showLinkMeForm, setShowLinkMeForm] = useState(false);
  const [lmKeyword, setLmKeyword] = useState('');
  const [lmReply, setLmReply] = useState('');
  const [lmPlatforms, setLmPlatforms] = useState<string[]>([]);
  const [lmSaving, setLmSaving] = useState(false);
  const [lmScope, setLmScope] = useState<'recent' | 'custom'>('recent');
  const [lmRecentCount, setLmRecentCount] = useState(5);
  const [lmCustomUrls, setLmCustomUrls] = useState<string[]>([]);
  const [lmUrlInput, setLmUrlInput] = useState('');

  // Auto Reply form
  const [showArForm, setShowArForm] = useState(false);
  const [arName, setArName] = useState('');
  const [arMessage, setArMessage] = useState('');
  const [arPlatforms, setArPlatforms] = useState<string[]>([]);
  const [arUseAI, setArUseAI] = useState(false);
  const [arSaving, setArSaving] = useState(false);
  const [arScope, setArScope] = useState<'recent' | 'custom'>('recent');
  const [arRecentCount, setArRecentCount] = useState(5);
  const [arCustomUrls, setArCustomUrls] = useState<string[]>([]);
  const [arUrlInput, setArUrlInput] = useState('');

  // Editing state
  const [editingLmId, setEditingLmId] = useState<string | null>(null);
  const [editingArId, setEditingArId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    loadData();
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lmRes, arRes] = await Promise.all([
        authFetch('/api/automation/link-me'),
        authFetch('/api/automation/auto-reply'),
      ]);
      if (lmRes.ok) {
        const d = await lmRes.json();
        setLinkMeRules(d.rules || []);
      }
      if (arRes.ok) {
        const d = await arRes.json();
        setAutoReplyTemplates(d.templates || []);
      }
    } catch (err) {
      console.error('Failed to load automation data', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (
    platform: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(
      list.includes(platform)
        ? list.filter((p) => p !== platform)
        : [...list, platform],
    );
  };

  // ---- Link Me handlers ----
  const saveLinkMeRule = async () => {
    if (!lmKeyword.trim() || !lmReply.trim() || lmPlatforms.length === 0) return;
    if (lmScope === 'custom' && lmCustomUrls.length === 0) return;
    setLmSaving(true);
    try {
      const body = JSON.stringify({
        keyword: lmKeyword,
        replyMessage: lmReply,
        platforms: lmPlatforms,
        postScope: lmScope,
        recentCount: lmRecentCount,
        customUrls: lmCustomUrls,
      });
      const res = editingLmId
        ? await authFetch(`/api/automation/link-me/${editingLmId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body,
          })
        : await authFetch('/api/automation/link-me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });
      if (res.ok) {
        const rule = await res.json();
        if (editingLmId) {
          setLinkMeRules((prev) => prev.map((r) => (r.id === editingLmId ? { ...r, ...rule } : r)));
        } else {
          setLinkMeRules((prev) => [rule, ...prev]);
        }
        setLmKeyword(''); setLmReply(''); setLmPlatforms([]);
        setLmScope('recent'); setLmRecentCount(5); setLmCustomUrls([]); setLmUrlInput('');
        setEditingLmId(null);
        setShowLinkMeForm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({ ok: false, message: data.error || 'Failed to save' });
      }
    } finally {
      setLmSaving(false);
    }
  };

  const toggleLinkMeRule = async (rule: LinkMeRule) => {
    setLinkMeRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)),
    );
    const res = await authFetch(`/api/automation/link-me/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTestResult({ ok: false, message: data.error || 'Failed to save' });
      setLinkMeRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: rule.isActive } : r)),
      );
    }
  };

  const deleteLinkMeRule = async (id: string) => {
    const prevRules = linkMeRules;
    setLinkMeRules((prev) => prev.filter((r) => r.id !== id));
    const res = await authFetch(`/api/automation/link-me/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTestResult({ ok: false, message: data.error || 'Failed to save' });
      setLinkMeRules(prevRules);
    }
  };

  const editLinkMeRule = (rule: LinkMeRule) => {
    setEditingLmId(rule.id);
    setLmKeyword(rule.keyword);
    setLmReply(rule.replyMessage);
    setLmPlatforms(rule.platforms);
    setLmScope(rule.postScope ?? 'recent');
    setLmRecentCount(rule.recentCount ?? 5);
    setLmCustomUrls(rule.customUrls ?? []);
    setLmUrlInput('');
    setShowLinkMeForm(true);
  };

  // ---- Auto Reply handlers ----
  const saveAutoReplyTemplate = async () => {
    if (!arName.trim() || (!arUseAI && !arMessage.trim()) || arPlatforms.length === 0) return;
    setArSaving(true);
    try {
      const body = JSON.stringify({
        name: arName,
        message: arMessage,
        platforms: arPlatforms,
        useAI: arUseAI,
        postScope: arScope,
        recentCount: arRecentCount,
        customUrls: arCustomUrls,
      });
      const res = editingArId
        ? await authFetch(`/api/automation/auto-reply/${editingArId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body,
          })
        : await authFetch('/api/automation/auto-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });
      if (res.ok) {
        const tmpl = await res.json();
        if (editingArId) {
          setAutoReplyTemplates((prev) => prev.map((t) => (t.id === editingArId ? { ...t, ...tmpl } : t)));
        } else {
          setAutoReplyTemplates((prev) => [tmpl, ...prev]);
        }
        setArName(''); setArMessage(''); setArPlatforms([]); setArUseAI(false);
        setArScope('recent'); setArRecentCount(5); setArCustomUrls([]); setArUrlInput('');
        setEditingArId(null);
        setShowArForm(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({ ok: false, message: data.error || 'Failed to save' });
      }
    } finally {
      setArSaving(false);
    }
  };

  const toggleAutoReply = async (tmpl: AutoReplyTemplate) => {
    setAutoReplyTemplates((prev) =>
      prev.map((t) => (t.id === tmpl.id ? { ...t, isActive: !t.isActive } : t)),
    );
    const res = await authFetch(`/api/automation/auto-reply/${tmpl.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !tmpl.isActive }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTestResult({ ok: false, message: data.error || 'Failed to save' });
      setAutoReplyTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, isActive: tmpl.isActive } : t)),
      );
    }
  };

  const deleteAutoReply = async (id: string) => {
    const prevTemplates = autoReplyTemplates;
    setAutoReplyTemplates((prev) => prev.filter((t) => t.id !== id));
    const res = await authFetch(`/api/automation/auto-reply/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTestResult({ ok: false, message: data.error || 'Failed to save' });
      setAutoReplyTemplates(prevTemplates);
    }
  };

  const editAutoReply = (tmpl: AutoReplyTemplate) => {
    setEditingArId(tmpl.id);
    setArName(tmpl.name);
    setArMessage(tmpl.message);
    setArPlatforms(tmpl.platforms);
    setArUseAI(tmpl.useAI);
    setArScope(tmpl.postScope ?? 'recent');
    setArRecentCount(tmpl.recentCount ?? 5);
    setArCustomUrls(tmpl.customUrls ?? []);
    setArUrlInput('');
    setShowArForm(true);
  };

  const runTestNow = async () => {
    setTestRunning(true);
    setTestResult(null);
    try {
      const res = await authFetch('/api/automation/test-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeTab }),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok && data.success, message: data.message || data.error || 'Done.' });
    } catch {
      setTestResult({ ok: false, message: 'Failed to run test.' });
    } finally {
      setTestRunning(false);
      setTimeout(() => setTestResult(null), 30000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Automation</h1>
          </div>
          <p className="text-gray-400 text-sm ml-[52px]">
            Auto-engage with your audience using smart comment rules
          </p>
        </div>

        {/* Test result toast */}
        {testResult && (
          <div className={`flex items-start gap-3 mb-5 px-4 py-3 rounded-xl border text-sm ${
            testResult.ok
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-red-500/10 border-red-500/30 text-red-200'
          }`}>
            {testResult.ok
              ? <CheckCircle size={16} className="mt-0.5 shrink-0" />
              : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed flex-1">{testResult.message}</pre>
            <button
              type="button"
              onClick={() => setTestResult(null)}
              className="shrink-0 p-0.5 rounded hover:bg-white/10 transition-colors"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-gray-900 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('link-me')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'link-me'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Link2 size={16} />
            Link Me
          </button>
          <button
            onClick={() => setActiveTab('auto-reply')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'auto-reply'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageCircle size={16} />
            Auto Reply
          </button>
        </div>

        {/* =================== LINK ME TAB =================== */}
        {activeTab === 'link-me' && (
          <div className="space-y-4">
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <Link2 className="w-5 h-5 text-purple-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">How Link Me works</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    When someone comments a keyword (e.g. "link", "course", "price") on your post,
                    the system automatically replies with your configured message — sending them the
                    resource they asked for, instantly.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Rules ({linkMeRules.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={runTestNow}
                  disabled={testRunning || linkMeRules.filter(r => r.isActive).length === 0}
                  title={linkMeRules.filter(r => r.isActive).length === 0 ? 'Enable at least one rule first' : 'Scan latest posts for keyword matches now'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {testRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  Test Now
                </button>
                <button
                  onClick={() => setShowLinkMeForm((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Plus size={16} />
                  Add Rule
                </button>
              </div>
            </div>

            {/* Add form */}
            {showLinkMeForm && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
                <h3 className="text-sm font-semibold text-white mb-4">{editingLmId ? 'Edit Link Me Rule' : 'New Link Me Rule'}</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Trigger Keyword
                    </label>
                    <input
                      type="text"
                      value={lmKeyword}
                      onChange={(e) => setLmKeyword(e.target.value)}
                      placeholder='e.g. "link", "course", "price"'
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-purple-500 focus:outline-none text-sm text-white placeholder-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Case-insensitive. Matches partial text (e.g. "link" matches "send me the link")
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Reply Message
                    </label>
                    <textarea
                      value={lmReply}
                      onChange={(e) => setLmReply(e.target.value)}
                      rows={3}
                      placeholder="Hey! Here's the link you asked for: https://..."
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-purple-500 focus:outline-none text-sm text-white placeholder-gray-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Apply On Platforms
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {betaPlatforms.map((p) => (
                        <button
                          key={p}
                          type="button"
                          disabled={comingSoonPlatforms.has(p)}
                          onClick={() => togglePlatform(p, lmPlatforms, setLmPlatforms)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            lmPlatforms.includes(p)
                              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {platformIcons[p]}
                          <span className="capitalize">{p}</span>
                          {comingSoonPlatforms.has(p) && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-semibold uppercase tracking-wide">
                              Soon
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Post scope */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Post Scope</label>
                    <div className="flex gap-2 mb-3">
                      {(['recent', 'custom'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setLmScope(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            lmScope === s
                              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {s === 'recent' ? 'Recent posts' : 'Custom URLs'}
                        </button>
                      ))}
                    </div>
                    {lmScope === 'recent' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Last</span>
                        <input
                          type="number"
                          min={1} max={10}
                          value={lmRecentCount}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            setLmRecentCount(Math.min(10, Math.max(1, Number.isFinite(n) ? n : 1)));
                          }}
                          className="w-16 px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-sm text-white text-center focus:border-purple-500 focus:outline-none"
                        />
                        <span className="text-xs text-gray-400">posts</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={lmUrlInput}
                            onChange={(e) => setLmUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const trimmed = lmUrlInput.trim();
                                if (trimmed.length > 8 && !lmCustomUrls.includes(trimmed)) {
                                  setLmCustomUrls(prev => [...prev, trimmed]);
                                  setLmUrlInput('');
                                }
                              }
                            }}
                            placeholder="https://youtube.com/watch?v=... or tweet URL"
                            className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 focus:border-purple-500 focus:outline-none text-xs text-white placeholder-gray-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = lmUrlInput.trim();
                              if (trimmed.length > 8 && !lmCustomUrls.includes(trimmed)) {
                                setLmCustomUrls(prev => [...prev, trimmed]);
                                setLmUrlInput('');
                              }
                            }}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-xl transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        {lmCustomUrls.map((url, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg">
                            <span className="flex-1 text-xs text-gray-300 truncate">{url}</span>
                            <button type="button" onClick={() => setLmCustomUrls(prev => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 transition-colors">×</button>
                          </div>
                        ))}
                        {lmCustomUrls.length === 0 && <p className="text-xs text-gray-500">Add at least one post URL</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveLinkMeRule}
                      disabled={lmSaving || !lmKeyword.trim() || !lmReply.trim() || lmPlatforms.length === 0 || (lmScope === 'custom' && lmCustomUrls.length === 0)}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                    >
                      {lmSaving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      {editingLmId ? 'Update Rule' : 'Save Rule'}
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkMeForm(false);
                        setEditingLmId(null);
                        setLmKeyword(''); setLmReply(''); setLmPlatforms([]);
                        setLmScope('recent'); setLmRecentCount(5); setLmCustomUrls([]); setLmUrlInput('');
                      }}
                      className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rules list */}
            {linkMeRules.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
                <Link2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No Link Me rules yet</p>
                <p className="text-xs mt-1">Add your first rule to start auto-linking</p>
              </div>
            ) : (
              linkMeRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`bg-gray-900 border rounded-2xl p-5 transition-all ${
                    rule.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-300 rounded-full text-xs font-mono font-semibold">
                          "{rule.keyword}"
                        </span>
                        {rule.totalMatches > 0 && (
                          <span className="text-xs text-gray-500">
                            {rule.totalMatches} match{rule.totalMatches !== 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{rule.replyMessage}</p>
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {rule.platforms.map((p) => (
                          <span key={p} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                            {platformIcons[p]}
                            <span className="capitalize">{p}</span>
                          </span>
                        ))}
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-800/60 text-gray-500">
                          {rule.postScope === 'custom'
                            ? `${rule.customUrls?.length ?? 0} URL${(rule.customUrls?.length ?? 0) !== 1 ? 's' : ''}`
                            : `last ${rule.recentCount ?? 5} posts`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleLinkMeRule(rule)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          rule.isActive
                            ? 'text-purple-400 hover:bg-purple-500/10'
                            : 'text-gray-600 hover:bg-gray-800'
                        }`}
                        title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => editLinkMeRule(rule)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                        title="Edit rule"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteLinkMeRule(rule.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =================== AUTO REPLY TAB =================== */}
        {activeTab === 'auto-reply' && (
          <div className="space-y-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">How Auto Reply works</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Automatically reply to new comments on your posts using a fixed template or
                    AI-generated responses. Runs every 15 minutes. Use {`{username}`} in your message
                    to personalize the reply.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Templates ({autoReplyTemplates.length})
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={runTestNow}
                  disabled={testRunning || autoReplyTemplates.filter(t => t.isActive).length === 0}
                  title={autoReplyTemplates.filter(t => t.isActive).length === 0 ? 'Enable at least one template first' : 'Scan latest posts for unanswered comments now'}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {testRunning ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  Test Now
                </button>
                <button
                  onClick={() => setShowArForm((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                  <Plus size={16} />
                  Add Template
                </button>
              </div>
            </div>

            {/* Add form */}
            {showArForm && (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">
                <h3 className="text-sm font-semibold text-white mb-4">{editingArId ? 'Edit Auto Reply Template' : 'New Auto Reply Template'}</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={arName}
                      onChange={(e) => setArName(e.target.value)}
                      placeholder="e.g. Friendly welcome reply"
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-blue-500 focus:outline-none text-sm text-white placeholder-gray-500"
                    />
                  </div>

                  {/* AI toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gray-950 rounded-xl border border-gray-800">
                    <button
                      type="button"
                      onClick={() => setArUseAI(!arUseAI)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        arUseAI ? 'bg-blue-600' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          arUseAI ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                        <Bot size={14} className="text-blue-400" />
                        AI-generated replies
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Let AI craft unique responses based on the comment content
                      </p>
                    </div>
                  </div>

                  {!arUseAI && (
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1.5">
                        Reply Message
                        <span className="ml-2 text-gray-500 font-normal">
                          Use {`{username}`} for personalization
                        </span>
                      </label>
                      <textarea
                        value={arMessage}
                        onChange={(e) => setArMessage(e.target.value)}
                        rows={3}
                        placeholder="Thanks for the comment, {username}! 🙌"
                        className="w-full px-4 py-2.5 rounded-xl bg-gray-950 border border-gray-800 focus:border-blue-500 focus:outline-none text-sm text-white placeholder-gray-500 resize-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">
                      Apply On Platforms
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {betaPlatforms.map((p) => (
                        <button
                          key={p}
                          type="button"
                          disabled={comingSoonPlatforms.has(p)}
                          onClick={() => togglePlatform(p, arPlatforms, setArPlatforms)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            arPlatforms.includes(p)
                              ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {platformIcons[p]}
                          <span className="capitalize">{p}</span>
                          {comingSoonPlatforms.has(p) && (
                            <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-semibold uppercase tracking-wide">
                              Soon
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Post scope */}
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">Post Scope</label>
                    <div className="flex gap-2 mb-3">
                      {(['recent', 'custom'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setArScope(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            arScope === s
                              ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                              : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                          }`}
                        >
                          {s === 'recent' ? 'Recent posts' : 'Custom URLs'}
                        </button>
                      ))}
                    </div>
                    {arScope === 'recent' ? (
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Last</span>
                        <input
                          type="number"
                          min={1} max={10}
                          value={arRecentCount}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10);
                            setArRecentCount(Math.min(10, Math.max(1, Number.isFinite(n) ? n : 1)));
                          }}
                          className="w-16 px-2 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-sm text-white text-center focus:border-blue-500 focus:outline-none"
                        />
                        <span className="text-xs text-gray-400">posts</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={arUrlInput}
                            onChange={(e) => setArUrlInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const trimmed = arUrlInput.trim();
                                if (trimmed.length > 8 && !arCustomUrls.includes(trimmed)) {
                                  setArCustomUrls(prev => [...prev, trimmed]);
                                  setArUrlInput('');
                                }
                              }
                            }}
                            placeholder="https://youtube.com/watch?v=... or tweet URL"
                            className="flex-1 px-3 py-2 rounded-xl bg-gray-950 border border-gray-800 focus:border-blue-500 focus:outline-none text-xs text-white placeholder-gray-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = arUrlInput.trim();
                              if (trimmed.length > 8 && !arCustomUrls.includes(trimmed)) {
                                setArCustomUrls(prev => [...prev, trimmed]);
                                setArUrlInput('');
                              }
                            }}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-xl transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        {arCustomUrls.map((url, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-950 border border-gray-800 rounded-lg">
                            <span className="flex-1 text-xs text-gray-300 truncate">{url}</span>
                            <button type="button" onClick={() => setArCustomUrls(prev => prev.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 transition-colors">×</button>
                          </div>
                        ))}
                        {arCustomUrls.length === 0 && <p className="text-xs text-gray-500">Add at least one post URL</p>}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveAutoReplyTemplate}
                      disabled={
                        arSaving ||
                        !arName.trim() ||
                        (!arUseAI && !arMessage.trim()) ||
                        arPlatforms.length === 0 ||
                        (arScope === 'custom' && arCustomUrls.length === 0)
                      }
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                    >
                      {arSaving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      {editingArId ? 'Update Template' : 'Save Template'}
                    </button>
                    <button
                      onClick={() => {
                        setShowArForm(false);
                        setEditingArId(null);
                        setArName(''); setArMessage(''); setArPlatforms([]); setArUseAI(false);
                        setArScope('recent'); setArRecentCount(5); setArCustomUrls([]); setArUrlInput('');
                      }}
                      className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Templates list */}
            {autoReplyTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No auto reply templates yet</p>
                <p className="text-xs mt-1">Add a template to start auto-replying to comments</p>
              </div>
            ) : (
              autoReplyTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className={`bg-gray-900 border rounded-2xl p-5 transition-all ${
                    tmpl.isActive ? 'border-gray-800' : 'border-gray-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">{tmpl.name}</span>
                        {tmpl.useAI && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/15 text-blue-300 rounded-full text-xs">
                            <Sparkles size={10} />
                            AI
                          </span>
                        )}
                      </div>
                      {!tmpl.useAI && tmpl.message && (
                        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{tmpl.message}</p>
                      )}
                      {tmpl.useAI && (
                        <p className="text-sm text-gray-500 mb-3 italic">AI generates unique replies</p>
                      )}
                      <div className="flex gap-1.5 flex-wrap items-center">
                        {tmpl.platforms.map((p) => (
                          <span key={p} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400">
                            {platformIcons[p]}
                            <span className="capitalize">{p}</span>
                          </span>
                        ))}
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-800/60 text-gray-500">
                          {tmpl.postScope === 'custom'
                            ? `${tmpl.customUrls?.length ?? 0} URL${(tmpl.customUrls?.length ?? 0) !== 1 ? 's' : ''}`
                            : `last ${tmpl.recentCount ?? 5} posts`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleAutoReply(tmpl)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          tmpl.isActive
                            ? 'text-blue-400 hover:bg-blue-500/10'
                            : 'text-gray-600 hover:bg-gray-800'
                        }`}
                      >
                        {tmpl.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => editAutoReply(tmpl)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Edit template"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteAutoReply(tmpl.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
