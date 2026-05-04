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
  Instagram,
  Facebook,
  Music,
  Lock,
} from 'lucide-react';
import { ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_DISABLED_REASON, PLATFORM_LABEL } from '@/lib/platformConfig';

interface LinkMeRule {
  id: string;
  keyword: string;
  replyMessage: string;
  platforms: string[];
  isActive: boolean;
  totalMatches: number;
}

interface AutoReplyTemplate {
  id: string;
  name: string;
  message: string;
  platforms: string[];
  isActive: boolean;
  useAI: boolean;
}

const platformIcons: Record<string, React.ReactNode> = {
  youtube:   <Youtube size={14} className="text-red-400" />,
  twitter:   <Twitter size={14} className="text-sky-400" />,
  linkedin:  <Linkedin size={14} className="text-blue-400" />,
  instagram: <Instagram size={14} className="text-pink-400" />,
  facebook:  <Facebook size={14} className="text-indigo-400" />,
  threads:   <MessageCircle size={14} className="text-gray-200" />,
  tiktok:    <Music size={14} className="text-fuchsia-400" />,
};

const betaPlatforms = [...ALL_PLATFORMS];

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

  // Auto Reply form
  const [showArForm, setShowArForm] = useState(false);
  const [arName, setArName] = useState('');
  const [arMessage, setArMessage] = useState('');
  const [arPlatforms, setArPlatforms] = useState<string[]>([]);
  const [arUseAI, setArUseAI] = useState(false);
  const [arSaving, setArSaving] = useState(false);

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
    setLmSaving(true);
    try {
      const res = await authFetch('/api/automation/link-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: lmKeyword,
          replyMessage: lmReply,
          platforms: lmPlatforms,
        }),
      });
      if (res.ok) {
        const rule = await res.json();
        setLinkMeRules((prev) => [rule, ...prev]);
        setLmKeyword(''); setLmReply(''); setLmPlatforms([]);
        setShowLinkMeForm(false);
      }
    } finally {
      setLmSaving(false);
    }
  };

  const toggleLinkMeRule = async (rule: LinkMeRule) => {
    await authFetch(`/api/automation/link-me/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    setLinkMeRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r)),
    );
  };

  const deleteLinkMeRule = async (id: string) => {
    await authFetch(`/api/automation/link-me/${id}`, { method: 'DELETE' });
    setLinkMeRules((prev) => prev.filter((r) => r.id !== id));
  };

  // ---- Auto Reply handlers ----
  const saveAutoReplyTemplate = async () => {
    if (!arName.trim() || (!arUseAI && !arMessage.trim()) || arPlatforms.length === 0) return;
    setArSaving(true);
    try {
      const res = await authFetch('/api/automation/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: arName,
          message: arMessage,
          platforms: arPlatforms,
          useAI: arUseAI,
        }),
      });
      if (res.ok) {
        const tmpl = await res.json();
        setAutoReplyTemplates((prev) => [tmpl, ...prev]);
        setArName(''); setArMessage(''); setArPlatforms([]); setArUseAI(false);
        setShowArForm(false);
      }
    } finally {
      setArSaving(false);
    }
  };

  const toggleAutoReply = async (tmpl: AutoReplyTemplate) => {
    await authFetch(`/api/automation/auto-reply/${tmpl.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !tmpl.isActive }),
    });
    setAutoReplyTemplates((prev) =>
      prev.map((t) => (t.id === tmpl.id ? { ...t, isActive: !t.isActive } : t)),
    );
  };

  const deleteAutoReply = async (id: string) => {
    await authFetch(`/api/automation/auto-reply/${id}`, { method: 'DELETE' });
    setAutoReplyTemplates((prev) => prev.filter((t) => t.id !== id));
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
      setTimeout(() => setTestResult(null), 15000);
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
                <h3 className="text-sm font-semibold text-white mb-4">New Link Me Rule</h3>

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
                      {betaPlatforms.map((p) => {
                        const enabled = ENABLED_PLATFORMS.has(p);
                        const selected = lmPlatforms.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            disabled={!enabled}
                            onClick={() => enabled && togglePlatform(p, lmPlatforms, setLmPlatforms)}
                            title={enabled ? undefined : (PLATFORM_DISABLED_REASON[p] || 'Coming soon')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              !enabled
                                ? 'bg-gray-900 border border-gray-800 text-gray-600 cursor-not-allowed'
                                : selected
                                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300'
                                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                            }`}
                          >
                            {platformIcons[p]}
                            <span className="capitalize">{PLATFORM_LABEL[p] || p}</span>
                            {!enabled && <Lock size={10} className="ml-0.5 text-amber-300/70" />}
                          </button>
                        );
                      })}
                    </div>
                    {lmPlatforms.includes('linkedin') && (
                      <p className="mt-2 text-xs text-amber-300/90">
                        LinkedIn requires the <code>r_member_social</code> +{' '}
                        <code>w_member_social</code> scopes on your LinkedIn app.
                        If those aren't granted, the rule will save but Test Now will
                        report a scope error.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveLinkMeRule}
                      disabled={lmSaving || !lmKeyword.trim() || !lmReply.trim() || lmPlatforms.length === 0}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                    >
                      {lmSaving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      Save Rule
                    </button>
                    <button
                      onClick={() => setShowLinkMeForm(false)}
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
                      <div className="flex gap-1.5 flex-wrap">
                        {rule.platforms.map((p) => (
                          <span
                            key={p}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400"
                          >
                            {platformIcons[p]}
                            <span className="capitalize">{p}</span>
                          </span>
                        ))}
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
                    AI-generated responses. Runs every few hours. Use {`{username}`} in your message
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
                <h3 className="text-sm font-semibold text-white mb-4">New Auto Reply Template</h3>

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
                      {betaPlatforms.map((p) => {
                        const enabled = ENABLED_PLATFORMS.has(p);
                        const selected = arPlatforms.includes(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            disabled={!enabled}
                            onClick={() => enabled && togglePlatform(p, arPlatforms, setArPlatforms)}
                            title={enabled ? undefined : (PLATFORM_DISABLED_REASON[p] || 'Coming soon')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              !enabled
                                ? 'bg-gray-900 border border-gray-800 text-gray-600 cursor-not-allowed'
                                : selected
                                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white'
                            }`}
                          >
                            {platformIcons[p]}
                            <span className="capitalize">{PLATFORM_LABEL[p] || p}</span>
                            {!enabled && <Lock size={10} className="ml-0.5 text-amber-300/70" />}
                          </button>
                        );
                      })}
                    </div>
                    {arPlatforms.includes('linkedin') && (
                      <p className="mt-2 text-xs text-amber-300/90">
                        LinkedIn requires the <code>r_member_social</code> +{' '}
                        <code>w_member_social</code> scopes on your LinkedIn app.
                        If those aren't granted, the template will save but Test Now will
                        report a scope error.
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={saveAutoReplyTemplate}
                      disabled={
                        arSaving ||
                        !arName.trim() ||
                        (!arUseAI && !arMessage.trim()) ||
                        arPlatforms.length === 0
                      }
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                    >
                      {arSaving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                      Save Template
                    </button>
                    <button
                      onClick={() => setShowArForm(false)}
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
                      <div className="flex gap-1.5 flex-wrap">
                        {tmpl.platforms.map((p) => (
                          <span
                            key={p}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400"
                          >
                            {platformIcons[p]}
                            <span className="capitalize">{p}</span>
                          </span>
                        ))}
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
