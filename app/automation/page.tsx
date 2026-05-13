'use client';

import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/authClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Link2, MessageCircle, Plus, Trash2, Zap,
  Youtube, Twitter, Linkedin, Facebook,
  RefreshCw, Bot, Play, CheckCircle, AlertCircle, Pencil, X,
} from 'lucide-react';

const InstagramIconSm = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

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
  youtube:   <Youtube   size={13} className="text-stone-400" />,
  twitter:   <Twitter   size={13} className="text-stone-400" />,
  linkedin:  <Linkedin  size={13} className="text-stone-400" />,
  instagram: <InstagramIconSm />,
  facebook:  <Facebook  size={13} className="text-stone-400" />,
  threads:   <MessageCircle size={13} className="text-stone-400" />,
};

const platformTones: Record<string, string> = {
  youtube: '#f87171', twitter: '#7dd3fc', linkedin: '#93c5fd',
  instagram: '#f9a8d4', facebook: '#60a5fa', threads: '#d6d3d1',
};

const betaPlatforms = ['youtube', 'twitter', 'linkedin', 'instagram', 'facebook', 'threads'];
const comingSoonPlatforms = new Set<string>();

// ─── Shared primitives ────────────────────────────────────────────────────────

function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 ${className}`}>
      {children}
    </span>
  );
}

const inputCls = `
  w-full bg-transparent border-0 border-b border-stone-800
  focus:border-[#d4ff3a] focus:outline-none focus:ring-0
  text-stone-100 placeholder-stone-700 text-sm py-3
  transition-colors duration-200
`;

const textareaCls = `
  w-full bg-transparent border-0 border-b border-stone-800
  focus:border-[#d4ff3a] focus:outline-none focus:ring-0
  text-stone-100 placeholder-stone-700 text-sm py-3
  resize-none transition-colors duration-200
`;

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab,            setActiveTab]            = useState<'link-me' | 'auto-reply'>('link-me');
  const [linkMeRules,          setLinkMeRules]          = useState<LinkMeRule[]>([]);
  const [autoReplyTemplates,   setAutoReplyTemplates]   = useState<AutoReplyTemplate[]>([]);
  const [loading,              setLoading]              = useState(true);
  const [testRunning,          setTestRunning]          = useState(false);
  const [testResult,           setTestResult]           = useState<{ ok: boolean; message: string } | null>(null);

  // Link Me form
  const [showLinkMeForm, setShowLinkMeForm] = useState(false);
  const [lmKeyword,      setLmKeyword]      = useState('');
  const [lmReply,        setLmReply]        = useState('');
  const [lmPlatforms,    setLmPlatforms]    = useState<string[]>([]);
  const [lmSaving,       setLmSaving]       = useState(false);
  const [lmScope,        setLmScope]        = useState<'recent' | 'custom'>('recent');
  const [lmRecentCount,  setLmRecentCount]  = useState(5);
  const [lmCustomUrls,   setLmCustomUrls]   = useState<string[]>([]);
  const [lmUrlInput,     setLmUrlInput]     = useState('');

  // Auto Reply form
  const [showArForm,   setShowArForm]   = useState(false);
  const [arName,       setArName]       = useState('');
  const [arMessage,    setArMessage]    = useState('');
  const [arPlatforms,  setArPlatforms]  = useState<string[]>([]);
  const [arUseAI,      setArUseAI]      = useState(false);
  const [arSaving,     setArSaving]     = useState(false);
  const [arScope,      setArScope]      = useState<'recent' | 'custom'>('recent');
  const [arRecentCount,setArRecentCount]= useState(5);
  const [arCustomUrls, setArCustomUrls] = useState<string[]>([]);
  const [arUrlInput,   setArUrlInput]   = useState('');

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
      if (lmRes.ok) { const d = await lmRes.json(); setLinkMeRules(d.rules || []); }
      if (arRes.ok) { const d = await arRes.json(); setAutoReplyTemplates(d.templates || []); }
    } catch (err) {
      console.error('Failed to load automation data', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (p: string, list: string[], setter: (v: string[]) => void) =>
    setter(list.includes(p) ? list.filter(x => x !== p) : [...list, p]);

  // ── Link Me handlers ──────────────────────────────────────────────────────

  const saveLinkMeRule = async () => {
    if (!lmKeyword.trim() || !lmReply.trim() || lmPlatforms.length === 0) return;
    if (lmScope === 'custom' && lmCustomUrls.length === 0) return;
    setLmSaving(true);
    try {
      const body = JSON.stringify({ keyword: lmKeyword, replyMessage: lmReply, platforms: lmPlatforms, postScope: lmScope, recentCount: lmRecentCount, customUrls: lmCustomUrls });
      const res = editingLmId
        ? await authFetch(`/api/automation/link-me/${editingLmId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
        : await authFetch('/api/automation/link-me',                { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) {
        const rule = await res.json();
        if (editingLmId) setLinkMeRules(prev => prev.map(r => r.id === editingLmId ? { ...r, ...rule } : r));
        else             setLinkMeRules(prev => [rule, ...prev]);
        resetLmForm();
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({ ok: false, message: data.error || 'Failed to save' });
      }
    } finally { setLmSaving(false); }
  };

  const resetLmForm = () => {
    setLmKeyword(''); setLmReply(''); setLmPlatforms([]);
    setLmScope('recent'); setLmRecentCount(5); setLmCustomUrls([]); setLmUrlInput('');
    setEditingLmId(null); setShowLinkMeForm(false);
  };

  const toggleLinkMeRule = async (rule: LinkMeRule) => {
    setLinkMeRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
    const res = await authFetch(`/api/automation/link-me/${rule.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !rule.isActive }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTestResult({ ok: false, message: data.error || 'Failed to save' });
      setLinkMeRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: rule.isActive } : r));
    }
  };

  const deleteLinkMeRule = async (id: string) => {
    const prev = linkMeRules;
    setLinkMeRules(p => p.filter(r => r.id !== id));
    const res = await authFetch(`/api/automation/link-me/${id}`, { method: 'DELETE' });
    if (!res.ok) { const data = await res.json().catch(() => ({})); setTestResult({ ok: false, message: data.error || 'Failed to delete' }); setLinkMeRules(prev); }
  };

  const editLinkMeRule = (rule: LinkMeRule) => {
    setEditingLmId(rule.id); setLmKeyword(rule.keyword); setLmReply(rule.replyMessage);
    setLmPlatforms(rule.platforms); setLmScope(rule.postScope ?? 'recent');
    setLmRecentCount(rule.recentCount ?? 5); setLmCustomUrls(rule.customUrls ?? []); setLmUrlInput('');
    setShowLinkMeForm(true);
  };

  // ── Auto Reply handlers ────────────────────────────────────────────────────

  const saveAutoReplyTemplate = async () => {
    if (!arName.trim() || (!arUseAI && !arMessage.trim()) || arPlatforms.length === 0) return;
    if (arScope === 'custom' && arCustomUrls.length === 0) return;
    setArSaving(true);
    try {
      const body = JSON.stringify({ name: arName, message: arMessage, platforms: arPlatforms, useAI: arUseAI, postScope: arScope, recentCount: arRecentCount, customUrls: arCustomUrls });
      const res = editingArId
        ? await authFetch(`/api/automation/auto-reply/${editingArId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
        : await authFetch('/api/automation/auto-reply',                { method: 'POST',  headers: { 'Content-Type': 'application/json' }, body });
      if (res.ok) {
        const tmpl = await res.json();
        if (editingArId) setAutoReplyTemplates(prev => prev.map(t => t.id === editingArId ? { ...t, ...tmpl } : t));
        else             setAutoReplyTemplates(prev => [tmpl, ...prev]);
        resetArForm();
      } else {
        const data = await res.json().catch(() => ({}));
        setTestResult({ ok: false, message: data.error || 'Failed to save' });
      }
    } finally { setArSaving(false); }
  };

  const resetArForm = () => {
    setArName(''); setArMessage(''); setArPlatforms([]); setArUseAI(false);
    setArScope('recent'); setArRecentCount(5); setArCustomUrls([]); setArUrlInput('');
    setEditingArId(null); setShowArForm(false);
  };

  const toggleAutoReply = async (tmpl: AutoReplyTemplate) => {
    setAutoReplyTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, isActive: !t.isActive } : t));
    const res = await authFetch(`/api/automation/auto-reply/${tmpl.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !tmpl.isActive }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setTestResult({ ok: false, message: data.error || 'Failed to save' });
      setAutoReplyTemplates(prev => prev.map(t => t.id === tmpl.id ? { ...t, isActive: tmpl.isActive } : t));
    }
  };

  const deleteAutoReply = async (id: string) => {
    const prev = autoReplyTemplates;
    setAutoReplyTemplates(p => p.filter(t => t.id !== id));
    const res = await authFetch(`/api/automation/auto-reply/${id}`, { method: 'DELETE' });
    if (!res.ok) { const data = await res.json().catch(() => ({})); setTestResult({ ok: false, message: data.error || 'Failed to delete' }); setAutoReplyTemplates(prev); }
  };

  const editAutoReply = (tmpl: AutoReplyTemplate) => {
    setEditingArId(tmpl.id); setArName(tmpl.name); setArMessage(tmpl.message);
    setArPlatforms(tmpl.platforms); setArUseAI(tmpl.useAI);
    setArScope(tmpl.postScope ?? 'recent'); setArRecentCount(tmpl.recentCount ?? 5);
    setArCustomUrls(tmpl.customUrls ?? []); setArUrlInput('');
    setShowArForm(true);
  };

  const runTestNow = async () => {
    setTestRunning(true); setTestResult(null);
    try {
      const res  = await authFetch('/api/automation/test-run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: activeTab }) });
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
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border border-stone-800 border-t-[#d4ff3a] rounded-full animate-spin" />
          <Eyebrow>Loading automation</Eyebrow>
        </div>
      </div>
    );
  }

  const isLinkMe   = activeTab === 'link-me';
  const activeRules = isLinkMe
    ? linkMeRules.filter(r => r.isActive).length
    : autoReplyTemplates.filter(t => t.isActive).length;

  // ── Shared URL list ────────────────────────────────────────────────────────

  const UrlList = ({
    urls, input, onInput, onAdd, onRemove,
  }: { urls: string[]; input: string; onInput: (v: string) => void; onAdd: () => void; onRemove: (i: number) => void }) => (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="url"
          value={input}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder="https://youtube.com/watch?v=… or tweet URL"
          className={inputCls + ' flex-1'}
        />
        <button type="button" onClick={onAdd}
          className="border border-stone-800 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors">
          Add
        </button>
      </div>
      {urls.length === 0 && <Eyebrow className="text-stone-700">Add at least one URL</Eyebrow>}
      {urls.map((url, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-stone-900 pb-2">
          <span className="flex-1 font-mono text-[11px] text-stone-400 truncate">{url}</span>
          <button type="button" onClick={() => onRemove(i)} className="text-stone-700 hover:text-[#ff5e3a] transition-colors">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );

  // ── Platform selector ─────────────────────────────────────────────────────

  const PlatformSelector = ({ selected, onToggle }: { selected: string[]; onToggle: (p: string) => void }) => (
    <div className="flex gap-2 flex-wrap">
      {betaPlatforms.map(p => {
        const active = selected.includes(p);
        const disabled = comingSoonPlatforms.has(p);
        return (
          <button key={p} type="button" disabled={disabled}
            onClick={() => onToggle(p)}
            style={active ? { borderColor: platformTones[p], color: platformTones[p] } : {}}
            className={`flex items-center gap-2 px-3 py-1.5 border font-mono text-[10px] uppercase tracking-[0.15em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              active
                ? 'bg-transparent'
                : 'border-stone-800 text-stone-500 hover:text-stone-200 hover:border-stone-600'
            }`}
          >
            {active && <span className="w-1 h-1 rounded-full" style={{ background: platformTones[p] }} />}
            <span>{p}</span>
            {disabled && <span className="text-amber-500">soon</span>}
          </button>
        );
      })}
    </div>
  );

  // ── Scope selector ────────────────────────────────────────────────────────

  const ScopeSelector = ({
    scope, onScope, count, onCount, urls, urlInput, onUrlInput, onAddUrl, onRemoveUrl,
  }: {
    scope: 'recent' | 'custom'; onScope: (s: 'recent' | 'custom') => void;
    count: number; onCount: (n: number) => void;
    urls: string[]; urlInput: string; onUrlInput: (v: string) => void;
    onAddUrl: () => void; onRemoveUrl: (i: number) => void;
  }) => (
    <div>
      <div className="flex gap-2 mb-4">
        {(['recent', 'custom'] as const).map(s => (
          <button key={s} type="button" onClick={() => onScope(s)}
            className={`px-4 py-2 border font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
              scope === s
                ? 'border-[#d4ff3a] text-[#d4ff3a] bg-[#d4ff3a]/5'
                : 'border-stone-800 text-stone-500 hover:text-stone-200 hover:border-stone-600'
            }`}
          >
            {s === 'recent' ? 'Recent posts' : 'Custom URLs'}
          </button>
        ))}
      </div>
      {scope === 'recent' ? (
        <div className="flex items-center gap-4">
          <Eyebrow>Last</Eyebrow>
          <input type="number" min={1} max={10} value={count}
            onChange={e => { const n = parseInt(e.target.value, 10); onCount(Math.min(10, Math.max(1, Number.isFinite(n) ? n : 1))); }}
            className="w-16 bg-transparent border-b border-stone-800 focus:border-[#d4ff3a] focus:outline-none text-stone-100 text-sm py-2 text-center tabular-nums transition-colors"
          />
          <Eyebrow>posts</Eyebrow>
        </div>
      ) : (
        <UrlList urls={urls} input={urlInput} onInput={onUrlInput} onAdd={onAddUrl} onRemove={onRemoveUrl} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] grain relative text-stone-100 z-10">
      <div className="relative max-w-[1000px] mx-auto px-6 md:px-10 py-12 space-y-12 z-10">

        {/* ── Header ── */}
        <header className="border-b border-stone-800 pb-10">
          <Eyebrow className="mb-3 block">Automation</Eyebrow>
          <h1
            className="font-display italic text-stone-100 leading-none"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontVariationSettings: '"opsz" 144' }}
          >
            Bots
          </h1>
          <p className="mt-3 text-sm text-stone-400 max-w-lg">
            Auto-engage with your audience using smart comment rules and AI-generated replies.
          </p>
        </header>

        {/* ── Toast ── */}
        {testResult && (
          <div className={`flex items-start gap-4 border px-5 py-4 ${
            testResult.ok
              ? 'border-[#d4ff3a]/30 bg-[#d4ff3a]/5'
              : 'border-[#ff5e3a]/30 bg-[#ff5e3a]/5'
          }`}>
            {testResult.ok
              ? <CheckCircle size={15} className="text-[#d4ff3a] mt-0.5 flex-shrink-0" />
              : <AlertCircle size={15} className="text-[#ff5e3a] mt-0.5 flex-shrink-0" />}
            <pre className="whitespace-pre-wrap text-sm text-stone-200 leading-relaxed flex-1 font-body">{testResult.message}</pre>
            <button onClick={() => setTestResult(null)} className="text-stone-600 hover:text-stone-300 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Tabs + actions ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex border border-stone-800">
            {([
              { id: 'link-me',    Icon: Link2,        label: 'Link Me'     },
              { id: 'auto-reply', Icon: MessageCircle, label: 'Auto Reply' },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#f4f1ea] text-[#0a0a0b]'
                    : 'text-stone-500 hover:text-stone-100'
                }`}
              >
                <tab.Icon size={12} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runTestNow}
              disabled={testRunning || activeRules === 0}
              title={activeRules === 0 ? 'Enable at least one rule first' : 'Run now against latest posts'}
              className="flex items-center gap-2 border border-stone-800 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testRunning ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
              Test Now
            </button>
            <button
              onClick={() => isLinkMe ? setShowLinkMeForm(v => !v) : setShowArForm(v => !v)}
              className="flex items-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] transition-colors"
            >
              <Plus size={12} />
              {isLinkMe ? 'Add Rule' : 'Add Template'}
            </button>
          </div>
        </div>

        {/* ── LINK ME TAB ── */}
        {activeTab === 'link-me' && (
          <div className="space-y-6">

            {/* Info strip */}
            <div className="border border-stone-800 px-5 py-4 flex items-start gap-4">
              <Link2 size={14} className="text-stone-500 mt-0.5 flex-shrink-0" />
              <div>
                <Eyebrow className="block mb-2">How Link Me works</Eyebrow>
                <p className="text-sm text-stone-400 leading-relaxed max-w-2xl">
                  When someone comments a keyword (e.g. "link", "course", "price") on your post,
                  the bot automatically replies with your configured message.
                </p>
              </div>
            </div>

            {/* Add / edit form */}
            {showLinkMeForm && (
              <div className="border border-stone-800 divide-y divide-stone-800">
                <div className="px-6 py-4 flex items-center justify-between">
                  <Eyebrow>{editingLmId ? 'Edit rule' : 'New rule'}</Eyebrow>
                  <button onClick={resetLmForm} className="text-stone-600 hover:text-stone-300 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="px-6 py-6 space-y-8">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                      Trigger keyword
                    </label>
                    <input type="text" value={lmKeyword} onChange={e => setLmKeyword(e.target.value)}
                      placeholder='e.g. "link", "course", "price"'
                      className={inputCls}
                    />
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-700 mt-2">
                      Case-insensitive · partial match
                    </p>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                      Reply message
                    </label>
                    <textarea value={lmReply} onChange={e => setLmReply(e.target.value)} rows={3}
                      placeholder="Hey! Here's the link you asked for: https://…"
                      className={textareaCls}
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                      Platforms
                    </label>
                    <PlatformSelector selected={lmPlatforms} onToggle={p => togglePlatform(p, lmPlatforms, setLmPlatforms)} />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                      Post scope
                    </label>
                    <ScopeSelector
                      scope={lmScope} onScope={setLmScope}
                      count={lmRecentCount} onCount={setLmRecentCount}
                      urls={lmCustomUrls} urlInput={lmUrlInput}
                      onUrlInput={setLmUrlInput}
                      onAddUrl={() => { const t = lmUrlInput.trim(); if (t.length > 8 && !lmCustomUrls.includes(t)) { setLmCustomUrls(p => [...p, t]); setLmUrlInput(''); } }}
                      onRemoveUrl={i => setLmCustomUrls(p => p.filter((_, j) => j !== i))}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={saveLinkMeRule}
                      disabled={lmSaving || !lmKeyword.trim() || !lmReply.trim() || lmPlatforms.length === 0 || (lmScope === 'custom' && lmCustomUrls.length === 0)}
                      className="flex items-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] disabled:opacity-50 transition-colors"
                    >
                      {lmSaving ? <RefreshCw size={11} className="animate-spin" /> : <Plus size={11} />}
                      {editingLmId ? 'Update' : 'Save'}
                    </button>
                    <button onClick={resetLmForm}
                      className="border border-stone-800 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Rules list */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-0">
                <Eyebrow>Rules · {linkMeRules.length}</Eyebrow>
                <Eyebrow>{linkMeRules.filter(r => r.isActive).length} active</Eyebrow>
              </div>

              {linkMeRules.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 border border-stone-800 border-t-0">
                  <Link2 size={20} className="text-stone-700" />
                  <Eyebrow>No rules yet · add one above</Eyebrow>
                </div>
              ) : (
                <div className="border border-stone-800 border-t-0 divide-y divide-stone-800">
                  {linkMeRules.map(rule => (
                    <div key={rule.id} className={`px-6 py-5 transition-opacity ${rule.isActive ? '' : 'opacity-40'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm text-[#d4ff3a] tabular-nums">"{rule.keyword}"</span>
                            {rule.totalMatches > 0 && (
                              <Eyebrow>{rule.totalMatches} match{rule.totalMatches !== 1 ? 'es' : ''}</Eyebrow>
                            )}
                          </div>
                          <p className="text-sm text-stone-300 mb-3 line-clamp-2 leading-relaxed">{rule.replyMessage}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {rule.platforms.map(p => (
                              <span key={p} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500">
                                {platformIcons[p]} {p}
                              </span>
                            ))}
                            <span className="font-mono text-[10px] text-stone-600">
                              {rule.postScope === 'custom'
                                ? `${rule.customUrls?.length ?? 0} URL${(rule.customUrls?.length ?? 0) !== 1 ? 's' : ''}`
                                : `last ${rule.recentCount ?? 5} posts`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          <button onClick={() => toggleLinkMeRule(rule)}
                            className={`px-3 py-1.5 border font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                              rule.isActive
                                ? 'border-[#d4ff3a]/40 text-[#d4ff3a]'
                                : 'border-stone-800 text-stone-600 hover:text-stone-300'
                            }`}
                          >
                            {rule.isActive ? 'Active' : 'Paused'}
                          </button>
                          <button onClick={() => editLinkMeRule(rule)}
                            className="p-2 text-stone-600 hover:text-stone-200 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteLinkMeRule(rule.id)}
                            className="p-2 text-stone-700 hover:text-[#ff5e3a] transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUTO REPLY TAB ── */}
        {activeTab === 'auto-reply' && (
          <div className="space-y-6">

            {/* Info strip */}
            <div className="border border-stone-800 px-5 py-4 flex items-start gap-4">
              <Bot size={14} className="text-stone-500 mt-0.5 flex-shrink-0" />
              <div>
                <Eyebrow className="block mb-2">How Auto Reply works</Eyebrow>
                <p className="text-sm text-stone-400 leading-relaxed max-w-2xl">
                  Automatically replies to new comments using a fixed template or AI-generated responses.
                  Runs every 15 minutes. Use{' '}
                  <code className="font-mono text-[#d4ff3a] text-[11px]">{'{username}'}</code>{' '}
                  to personalize.
                </p>
              </div>
            </div>

            {/* Add / edit form */}
            {showArForm && (
              <div className="border border-stone-800 divide-y divide-stone-800">
                <div className="px-6 py-4 flex items-center justify-between">
                  <Eyebrow>{editingArId ? 'Edit template' : 'New template'}</Eyebrow>
                  <button onClick={resetArForm} className="text-stone-600 hover:text-stone-300 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="px-6 py-6 space-y-8">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                      Template name
                    </label>
                    <input type="text" value={arName} onChange={e => setArName(e.target.value)}
                      placeholder="e.g. Friendly welcome reply"
                      className={inputCls}
                    />
                  </div>

                  {/* AI toggle */}
                  <div className="flex items-start gap-5 border border-stone-800 px-5 py-4">
                    <button type="button" onClick={() => setArUseAI(!arUseAI)}
                      className={`relative mt-1 w-10 h-5 flex-shrink-0 transition-colors ${arUseAI ? 'bg-[#d4ff3a]' : 'bg-stone-800'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-[#0a0a0b] transition-transform ${arUseAI ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={13} className="text-stone-400" />
                        <span className="text-sm text-stone-100 font-medium">AI-generated replies</span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Let AI craft unique responses based on each comment's content
                      </p>
                    </div>
                  </div>

                  {!arUseAI && (
                    <div>
                      <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                        Reply message
                        <span className="ml-3 normal-case tracking-normal text-stone-600">
                          Use <code className="text-[#d4ff3a]">{'{username}'}</code> to personalize
                        </span>
                      </label>
                      <textarea value={arMessage} onChange={e => setArMessage(e.target.value)} rows={3}
                        placeholder="Thanks for the comment, {username}!"
                        className={textareaCls}
                      />
                    </div>
                  )}

                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                      Platforms
                    </label>
                    <PlatformSelector selected={arPlatforms} onToggle={p => togglePlatform(p, arPlatforms, setArPlatforms)} />
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 block mb-3">
                      Post scope
                    </label>
                    <ScopeSelector
                      scope={arScope} onScope={setArScope}
                      count={arRecentCount} onCount={setArRecentCount}
                      urls={arCustomUrls} urlInput={arUrlInput}
                      onUrlInput={setArUrlInput}
                      onAddUrl={() => { const t = arUrlInput.trim(); if (t.length > 8 && !arCustomUrls.includes(t)) { setArCustomUrls(p => [...p, t]); setArUrlInput(''); } }}
                      onRemoveUrl={i => setArCustomUrls(p => p.filter((_, j) => j !== i))}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={saveAutoReplyTemplate}
                      disabled={arSaving || !arName.trim() || (!arUseAI && !arMessage.trim()) || arPlatforms.length === 0 || (arScope === 'custom' && arCustomUrls.length === 0)}
                      className="flex items-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#bff020] disabled:opacity-50 transition-colors"
                    >
                      {arSaving ? <RefreshCw size={11} className="animate-spin" /> : <Plus size={11} />}
                      {editingArId ? 'Update' : 'Save'}
                    </button>
                    <button onClick={resetArForm}
                      className="border border-stone-800 px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Templates list */}
            <div>
              <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-0">
                <Eyebrow>Templates · {autoReplyTemplates.length}</Eyebrow>
                <Eyebrow>{autoReplyTemplates.filter(t => t.isActive).length} active</Eyebrow>
              </div>

              {autoReplyTemplates.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3 border border-stone-800 border-t-0">
                  <MessageCircle size={20} className="text-stone-700" />
                  <Eyebrow>No templates yet · add one above</Eyebrow>
                </div>
              ) : (
                <div className="border border-stone-800 border-t-0 divide-y divide-stone-800">
                  {autoReplyTemplates.map(tmpl => (
                    <div key={tmpl.id} className={`px-6 py-5 transition-opacity ${tmpl.isActive ? '' : 'opacity-40'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-stone-100">{tmpl.name}</span>
                            {tmpl.useAI && (
                              <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#d4ff3a] border border-[#d4ff3a]/30 px-2 py-0.5">
                                <Zap size={9} /> AI
                              </span>
                            )}
                          </div>
                          {!tmpl.useAI && tmpl.message && (
                            <p className="text-sm text-stone-300 mb-3 line-clamp-2 leading-relaxed">{tmpl.message}</p>
                          )}
                          {tmpl.useAI && (
                            <p className="text-sm text-stone-600 mb-3 italic">AI generates unique replies per comment</p>
                          )}
                          <div className="flex items-center gap-3 flex-wrap">
                            {tmpl.platforms.map(p => (
                              <span key={p} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500">
                                {platformIcons[p]} {p}
                              </span>
                            ))}
                            <span className="font-mono text-[10px] text-stone-600">
                              {tmpl.postScope === 'custom'
                                ? `${tmpl.customUrls?.length ?? 0} URL${(tmpl.customUrls?.length ?? 0) !== 1 ? 's' : ''}`
                                : `last ${tmpl.recentCount ?? 5} posts`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          <button onClick={() => toggleAutoReply(tmpl)}
                            className={`px-3 py-1.5 border font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                              tmpl.isActive
                                ? 'border-[#d4ff3a]/40 text-[#d4ff3a]'
                                : 'border-stone-800 text-stone-600 hover:text-stone-300'
                            }`}
                          >
                            {tmpl.isActive ? 'Active' : 'Paused'}
                          </button>
                          <button onClick={() => editAutoReply(tmpl)}
                            className="p-2 text-stone-600 hover:text-stone-200 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => deleteAutoReply(tmpl.id)}
                            className="p-2 text-stone-700 hover:text-[#ff5e3a] transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-stone-800 pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Eyebrow>Automation · cron every 15 min</Eyebrow>
          <Eyebrow className="text-stone-700">
            {linkMeRules.length} Link Me · {autoReplyTemplates.length} Auto Reply
          </Eyebrow>
        </footer>
      </div>
    </div>
  );
}
