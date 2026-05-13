'use client';

import FileUpload from '@/components/FileUpload';
import { PremiumModal } from '@/components/PremiumModal';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/authClient';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Linkedin,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Twitter,
  XCircle,
  Youtube,
} from 'lucide-react';

/* ─── types ─────────────────────────────────────────────── */

interface PlatformContent {
  caption: string;
  hashtags: string[];
  tags?: string[];
  title?: string;
  description?: string;
}

interface PlatformSettings {
  youtube: PlatformContent;
  twitter: PlatformContent;
  linkedin: PlatformContent;
  instagram: PlatformContent;
  facebook: PlatformContent;
  threads: PlatformContent;
}

interface AiTimeSlot {
  platform: string;
  time: string;
  date: string;
  engagementScore: number;
  description: string;
}

type TabId = 'content' | 'platforms' | 'schedule' | 'preview';
type ScheduleMode = 'now' | 'ai' | 'custom';

/* ─── static data ────────────────────────────────────────── */

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const VideoIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PLATFORMS = [
  { id: 'youtube',   name: 'YouTube',   users: '2.7B users', icon: <Youtube size={20} />,       color: 'text-red-400'  },
  { id: 'twitter',   name: 'Twitter/X', users: '550M users', icon: <Twitter size={20} />,       color: 'text-sky-400'  },
  { id: 'linkedin',  name: 'LinkedIn',  users: '950M users', icon: <Linkedin size={20} />,      color: 'text-blue-400' },
  { id: 'instagram', name: 'Instagram', users: '2B users',   icon: <InstagramIcon size={20} />, color: 'text-pink-400' },
  { id: 'facebook',  name: 'Facebook',  users: '3B users',   icon: <Facebook size={20} />,      color: 'text-blue-500' },
  { id: 'threads',   name: 'Threads',   users: '300M users', icon: <MessageCircle size={20} />, color: 'text-stone-300'},
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

const PLATFORM_TIPS: Partial<Record<PlatformId, string>> = {
  twitter:   'Keep under 280 chars. 1–2 hashtags. Tag relevant accounts.',
  linkedin:  'Professional tone. Share insight. End with a question.',
  instagram: 'Requires image or video. Up to 30 hashtags. Strong hook first.',
  facebook:  'Ask questions to boost comments. Text, image, and video all work.',
  threads:   'Text-first. Under 500 chars. Replies drive reach.',
};

const PLATFORM_RULES: Record<string, {
  captionMax: number; titleMax?: number;
  allowsImage: boolean; allowsVideo: boolean;
  imageFormats: string; videoFormats: string;
  requiresVideo?: boolean; requiresTitle?: boolean;
}> = {
  youtube:   { captionMax: 5000, titleMax: 100, allowsImage: false, allowsVideo: true,  imageFormats: '—',                   videoFormats: 'MP4, MOV, AVI',   requiresVideo: true, requiresTitle: true },
  twitter:   { captionMax: 280,                 allowsImage: true,  allowsVideo: true,  imageFormats: 'JPG, PNG, GIF, WebP', videoFormats: 'MP4 (max 2:20)'  },
  linkedin:  { captionMax: 3000,                allowsImage: true,  allowsVideo: true,  imageFormats: 'JPG, PNG, GIF',       videoFormats: 'MP4'              },
  instagram: { captionMax: 2200,                allowsImage: true,  allowsVideo: true,  imageFormats: 'JPG, PNG',            videoFormats: 'MP4 (max 60s)'   },
  facebook:  { captionMax: 63206,               allowsImage: true,  allowsVideo: true,  imageFormats: 'JPG, PNG, GIF, WebP', videoFormats: 'MP4, MOV'        },
  threads:   { captionMax: 500,                 allowsImage: true,  allowsVideo: true,  imageFormats: 'JPG, PNG',            videoFormats: 'MP4 (max 5 min)' },
};

const TABS: TabId[] = ['content', 'platforms', 'schedule', 'preview'];

const EMPTY_PLATFORM_CONTENT: PlatformSettings = {
  youtube:   { title: '', description: '', caption: '', hashtags: [], tags: [] },
  twitter:   { caption: '', hashtags: [], tags: [] },
  linkedin:  { caption: '', hashtags: [], tags: [] },
  instagram: { caption: '', hashtags: [], tags: [] },
  facebook:  { caption: '', hashtags: [], tags: [] },
  threads:   { caption: '', hashtags: [], tags: [] },
};

/* ─── shared style tokens ────────────────────────────────── */

const label = 'block font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-3';
const inputBase = [
  'w-full bg-transparent border-0 border-b border-stone-800',
  'focus:border-[#d4ff3a] focus:outline-none focus:ring-0',
  'text-stone-100 placeholder-stone-700 text-sm py-3',
  'transition-colors duration-200',
].join(' ');
const textareaBase = [
  'w-full bg-transparent border border-stone-800',
  'focus:border-[#d4ff3a] focus:outline-none focus:ring-0',
  'text-stone-100 placeholder-stone-700 text-sm p-4',
  'resize-none transition-colors duration-200',
].join(' ');
const sectionBox = 'border border-stone-800';
const sectionHead = 'border-b border-stone-800 px-8 py-6';

/* ─── component ──────────────────────────────────────────── */

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab,        setActiveTab]        = useState<TabId>('content');
  const [scheduleMode,     setScheduleMode]     = useState<ScheduleMode>('now');
  const [loading,          setLoading]          = useState(false);
  const [aiEnhancing,      setAiEnhancing]      = useState(false);
  const [aiSuggestions,    setAiSuggestions]    = useState<any>(null);
  const [showAiPanel,      setShowAiPanel]      = useState(false);
  const [showProTips,      setShowProTips]      = useState(false);
  const [charCount,        setCharCount]        = useState(0);
  const [aiTimeSlots,      setAiTimeSlots]      = useState<AiTimeSlot[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [formData, setFormData] = useState({
    mainCaption:   '',
    platforms:     [] as string[],
    imageUrl:      '',
    videoUrl:      '',
    scheduledDate: '',
    scheduledTime: new Date(Date.now() + 3_600_000).toISOString().slice(11, 16),
  });

  const [platformContent, setPlatformContent] = useState<PlatformSettings>(EMPTY_PLATFORM_CONTENT);

  /* auth guard */
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  /* auto-generate platform content when caption changes */
  useEffect(() => {
    if (formData.mainCaption) genPlatformContent(formData.mainCaption);
  }, [formData.mainCaption]); // eslint-disable-line

  /* generate AI time slots when mode = ai */
  useEffect(() => {
    if (scheduleMode === 'ai' && aiTimeSlots.length === 0 && formData.platforms.length > 0)
      genDefaultSlots();
  }, [scheduleMode, formData.platforms]); // eslint-disable-line

  /* ─── helpers ──────────────────────── */

  function genPlatformContent(main: string) {
    const tags   = main.match(/#[\w]+/g) || [];
    const clean  = main.replace(/#[\w]+/g, '').trim();
    setPlatformContent({
      youtube:   { title: clean.substring(0, 100) || 'Untitled Video', description: `${clean}\n\nSubscribe for more content!\n${tags.join(' ')}`, caption: clean, hashtags: [], tags: tags.map(h => h.replace('#', '')) },
      twitter:   { caption: clean.substring(0, 250), hashtags: tags.slice(0, 3), tags: [] },
      linkedin:  { caption: clean, hashtags: tags.filter(h => !h.includes('youtube')), tags: [] },
      instagram: { caption: clean.substring(0, 2200), hashtags: tags.slice(0, 30), tags: [] },
      facebook:  { caption: clean, hashtags: tags.slice(0, 10), tags: [] },
      threads:   { caption: clean.substring(0, 500), hashtags: tags.slice(0, 5), tags: [] },
    });
  }

  function genDefaultSlots() {
    const slots: AiTimeSlot[] = [];
    const now = new Date(); const tmr = new Date(now); tmr.setDate(tmr.getDate() + 1);
    const times = { twitter: ['07:00','12:00'], linkedin: ['08:00','11:00'], youtube: ['10:00','14:00'] } as const;
    formData.platforms.forEach(p => {
      const t = times[p as keyof typeof times] || ['12:00'];
      t.forEach((time, i) => slots.push({ platform: p, time, date: [now,tmr][i].toISOString().split('T')[0], engagementScore: 80 + Math.floor(Math.random()*20), description: 'Recommended time' }));
    });
    setAiTimeSlots(slots.sort((a,b) => b.engagementScore - a.engagementScore));
  }

  function fmtDate(d: Date) { return d.toISOString().split('T')[0]; }
  function fmtDateTime(date: string, time: string) {
    return new Date(`${date}T${time}`).toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });
  }
  function weekdayToDate(w: string) {
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const ti = days.indexOf(w.toLowerCase()); if (ti === -1) return fmtDate(new Date());
    const now = new Date(); let diff = ti - now.getDay(); if (diff < 0) diff += 7;
    const r = new Date(now); r.setDate(r.getDate() + diff); return fmtDate(r);
  }

  const togglePlatform = (id: string) =>
    setFormData(p => ({ ...p, platforms: p.platforms.includes(id) ? p.platforms.filter(x => x !== id) : [...p.platforms, id] }));

  const updatePlatform = (platform: keyof PlatformSettings, field: string, value: any) =>
    setPlatformContent(p => ({ ...p, [platform]: { ...p[platform], [field]: value } }));

  /* ─── AI enhance ──────────────────── */

  async function handleAiEnhance() {
    if (!formData.mainCaption.trim()) { alert('Write a caption first.'); return; }
    setAiEnhancing(true);
    try {
      const res = await fetch('/api/ai/enhance', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ caption: formData.mainCaption, platform: formData.platforms[0] || 'youtube', platforms: PLATFORMS.map(p=>p.id), tone:'engaging', contentType: formData.videoUrl ? 'video' : 'image' }) });
      if (!res.ok) throw new Error('AI Enhancement failed');
      const data = await res.json();
      if (data.success) {
        setAiSuggestions(data); setShowAiPanel(true);
        if (data.platformTimes) {
          const slots: AiTimeSlot[] = [];
          Object.entries(data.platformTimes).forEach(([plat, ti]: any) => {
            const d = (ti.day||'').toLowerCase().includes('tomorrow') ? (() => { const t=new Date(); t.setDate(t.getDate()+1); return fmtDate(t); })() : ti.day ? weekdayToDate(ti.day) : fmtDate(new Date());
            slots.push({ platform: plat, time: ti.time||'12:00', date: d, engagementScore: 90, description: ti.reason||`Recommended for ${plat}` });
          });
          setAiTimeSlots(slots.sort((a,b) => b.engagementScore-a.engagementScore));
        }
      } else { alert(`AI failed: ${data.error}`); }
    } catch (err: any) { alert(`Enhancement failed: ${err.message}`); }
    finally { setAiEnhancing(false); }
  }

  function applyAiSuggestion() {
    if (!aiSuggestions) return;
    setFormData(p => ({ ...p, mainCaption: aiSuggestions.enhancedCaption }));
    setShowAiPanel(false); setActiveTab('platforms');
  }

  /* ─── submit ──────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (activeTab !== 'preview') return;
    if (!user) { router.push('/login'); return; }
    if (!formData.mainCaption.trim())   { alert('Please write a caption.'); return; }
    if (!formData.platforms.length)     { alert('Select at least one platform.'); return; }
    if (scheduleMode !== 'now' && (!formData.scheduledDate || !formData.scheduledTime)) { alert('Set a schedule time.'); return; }

    setLoading(true);
    try {
      const scheduledTime = scheduleMode === 'now' ? new Date() : new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const ref = await addDoc(collection(db,'posts'), { userId: user.uid, caption: formData.mainCaption, platforms: formData.platforms, platformContent, imageUrl: formData.imageUrl||null, videoUrl: formData.videoUrl||null, scheduledTime, status: scheduleMode==='now'?'publishing':'scheduled', scheduleMode, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      if (scheduleMode === 'now') {
        const pr = await authFetch('/api/posts/publish', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ postId: ref.id, platforms: formData.platforms, caption: formData.mainCaption, imageUrl: formData.imageUrl||null, videoUrl: formData.videoUrl||null, platformContent }) });
        const pd = await pr.json();
        alert(!pr.ok || !pd.success ? `Saved but failed to publish. Retry from dashboard.\n${pd.error||''}` : 'Published successfully!');
      } else { alert('Scheduled! Auto-published at the set time.'); }
      setFormData({ mainCaption:'', platforms:[], imageUrl:'', videoUrl:'', scheduledDate:'', scheduledTime: new Date(Date.now()+3_600_000).toISOString().slice(11,16) });
      setPlatformContent(EMPTY_PLATFORM_CONTENT);
      router.push('/dashboard');
    } catch (err) { console.error(err); alert('Failed to create post.'); }
    finally { setLoading(false); }
  }

  /* ─── navigation guards ───────────── */

  const canGoTo: Record<TabId, boolean> = {
    content:   true,
    platforms: !!formData.mainCaption.trim(),
    schedule:  !!formData.mainCaption.trim() && formData.platforms.length > 0,
    preview:   !!formData.mainCaption.trim() && formData.platforms.length > 0 && (scheduleMode==='now' || (!!formData.scheduledDate && !!formData.scheduledTime)),
  };

  function goNext() {
    const i = TABS.indexOf(activeTab);
    if (activeTab==='content'   && !formData.mainCaption.trim())                                               { alert('Write a caption to continue.'); return; }
    if (activeTab==='platforms' && !formData.platforms.length)                                                 { alert('Select at least one platform.'); return; }
    if (activeTab==='schedule'  && scheduleMode!=='now' && (!formData.scheduledDate||!formData.scheduledTime)) { alert('Choose a date and time.'); return; }
    setActiveTab(TABS[i+1]);
  }
  function goPrev() { setActiveTab(TABS[TABS.indexOf(activeTab)-1]); }

  function handleCustomSchedule() {
    setScheduleMode('custom');
    setFormData(p => ({ ...p, scheduledDate: p.scheduledDate || fmtDate(new Date()) }));
  }

  /* ─── validation ──────────────────── */

  const platformErrors = formData.platforms.flatMap(p => {
    const r = PLATFORM_RULES[p]; if (!r) return [];
    const cap = p==='youtube' ? (platformContent.youtube.description||'') : (platformContent[p as keyof PlatformSettings]?.caption||'');
    const errs: string[] = [];
    if (r.requiresTitle && !platformContent.youtube.title?.trim()) errs.push('YouTube: title required');
    if (p==='youtube' && (platformContent.youtube.title?.length||0)>100) errs.push('YouTube: title > 100 chars');
    if (cap.length > r.captionMax) errs.push(`${p}: caption > ${r.captionMax} chars`);
    return errs;
  });

  const canSubmit = !loading && formData.platforms.length>0 && !!formData.mainCaption.trim() && platformErrors.length===0 && (scheduleMode==='now' || (!!formData.scheduledDate && !!formData.scheduledTime));

  /* ─── loading / unauthenticated ────── */
  if (authLoading) return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <p className="font-display italic text-stone-600" style={{ fontSize:'1.5rem' }}>Loading…</p>
    </div>
  );
  if (!user) return null;

  /* ─── render ──────────────────────── */
  return (
    <div className="min-h-screen bg-[#0a0a0b] grain">
      <div className="max-w-[880px] mx-auto px-6 md:px-10 py-16">

        {/* ── page header ─────────────────────────────── */}
        <div className="mb-12 pb-10 border-b border-stone-800 flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-3">
              StarlingPost
            </p>
            <h1
              className="font-display italic text-stone-100 leading-none"
              style={{ fontSize:'clamp(2rem,5vw,3rem)', fontVariationSettings:'"opsz" 144' }}
            >
              New post.
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-600 hover:text-stone-300 transition-colors flex-shrink-0"
          >
            <ChevronLeft size={12} />
            Dashboard
          </Link>
        </div>

        {/* ── step indicator ───────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-0 border-b border-stone-800">
            {TABS.map((tab, idx) => {
              const isActive    = activeTab === tab;
              const isCompleted = TABS.indexOf(activeTab) > idx;
              const clickable   = canGoTo[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && setActiveTab(tab)}
                  className={[
                    'flex items-center gap-2 px-5 py-4 border-b-2 -mb-px transition-all',
                    isActive    ? 'border-[#d4ff3a]'  : 'border-transparent',
                    !clickable  ? 'cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span className={`font-mono text-[9px] tabular-nums ${isActive ? 'text-[#d4ff3a]' : isCompleted ? 'text-stone-600' : 'text-stone-800'}`}>
                    0{idx + 1}
                  </span>
                  <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${isActive ? 'text-stone-100' : isCompleted ? 'text-stone-500 hover:text-stone-300' : 'text-stone-700'}`}>
                    {tab}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ════════════════════════════════════════════════
              STEP 1 · CONTENT
          ════════════════════════════════════════════════ */}
          {activeTab === 'content' && (
            <div className="space-y-6">

              {/* caption + media two-col */}
              <div className={sectionBox}>
                <div className={sectionHead}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Step 01</p>
                  <h2
                    className="font-display italic text-stone-100 leading-none"
                    style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontVariationSettings:'"opsz" 80' }}
                  >
                    Write your caption.
                  </h2>
                </div>

                <div className="grid md:grid-cols-[260px_1fr] divide-y md:divide-y-0 md:divide-x divide-stone-800">

                  {/* LEFT · media */}
                  <div className="p-8 space-y-6">
                    <div>
                      <p className={label}>Media</p>
                      <FileUpload
                        onUploadComplete={(url, type) =>
                          setFormData(p => type === 'image' ? { ...p, imageUrl: url } : { ...p, videoUrl: url })
                        }
                        acceptedTypes="image,video"
                        maxSizeMB={100}
                      />
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 mt-3">
                        Optional — text only if skipped
                      </p>
                    </div>

                    {(formData.imageUrl || formData.videoUrl) && (
                      <div className="border border-stone-800 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff3a]" />
                          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#d4ff3a]">Uploaded</p>
                        </div>
                        {formData.imageUrl && <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600">· Image attached</p>}
                        {formData.videoUrl && <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-600 mt-1">· Video attached</p>}
                      </div>
                    )}

                    {/* pro tips */}
                    <div className="border-t border-stone-900 pt-5">
                      <button
                        type="button"
                        onClick={() => setShowProTips(v => !v)}
                        className="flex items-center justify-between w-full group"
                      >
                        <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-stone-700 group-hover:text-stone-500 transition-colors">
                          Tips
                        </p>
                        <ChevronRight size={11} className={`text-stone-800 transition-transform ${showProTips ? 'rotate-90' : ''}`} />
                      </button>
                      {showProTips && (
                        <ul className="mt-4 space-y-2.5">
                          {['Emojis make captions feel human, not spam.', '3–5 hashtags beat 20+ every time.', 'End every post with a clear action.'].map((tip, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-stone-800 mt-1.5 flex-shrink-0" />
                              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-700">{tip}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* RIGHT · caption editor */}
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-5">
                      <p className={label}>Caption</p>
                      <button
                        type="button"
                        onClick={handleAiEnhance}
                        disabled={aiEnhancing || !formData.mainCaption.trim()}
                        className="flex items-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] font-mono text-[9px] uppercase tracking-[0.2em] font-bold px-4 py-2 hover:bg-[#bff020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {aiEnhancing
                          ? <><RefreshCw size={10} className="animate-spin" /> Enhancing…</>
                          : <><Sparkles size={10} /> AI Enhance</>}
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        value={formData.mainCaption}
                        onChange={e => { setFormData(p => ({ ...p, mainCaption: e.target.value })); setCharCount(e.target.value.length); }}
                        placeholder="Start with one strong idea you want to share…"
                        className={textareaBase + ' min-h-[200px]'}
                      />
                      <span className={`absolute bottom-3 right-3 font-mono text-[10px] ${charCount > 2200 ? 'text-[#ff5e3a]' : 'text-stone-800'}`}>
                        {charCount}
                      </span>
                    </div>

                    {/* hashtag chips */}
                    {formData.mainCaption.includes('#') && (
                      <div className="mt-4 border-t border-stone-900 pt-4">
                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-700 mb-3">Detected hashtags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(formData.mainCaption.match(/#[\w]+/g) || []).slice(0, 8).map((tag, i) => (
                            <span key={i} className="font-mono text-[9px] uppercase tracking-[0.08em] border border-stone-800 text-stone-600 px-2 py-0.5">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* quick insert */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {[['Emoji', ' 🚀'], ['#viral', ' #viral'], ['CTA', ' 👉 Like & Follow!']].map(([lbl, txt]) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, mainCaption: p.mainCaption + txt }))}
                          className="font-mono text-[9px] uppercase tracking-[0.15em] border border-stone-800 text-stone-700 px-3 py-1.5 hover:border-stone-600 hover:text-stone-400 transition-colors"
                        >
                          + {lbl}
                        </button>
                      ))}
                    </div>

                    {/* AI comparison panel */}
                    {showAiPanel && aiSuggestions && (
                      <div className="mt-6 border border-[#d4ff3a]/30 bg-[#d4ff3a]/[0.04] p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#d4ff3a]" />
                            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d4ff3a]">AI suggestion ready</p>
                          </div>
                          <button type="button" onClick={() => setShowAiPanel(false)} className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700 hover:text-stone-400 transition-colors">
                            dismiss
                          </button>
                        </div>
                        <p className="text-stone-400 text-sm leading-relaxed mb-5 line-clamp-4">
                          {aiSuggestions.enhancedCaption}
                        </p>
                        <div className="flex gap-3">
                          <button type="button" onClick={applyAiSuggestion} className="font-mono text-[10px] uppercase tracking-[0.2em] font-bold bg-[#d4ff3a] text-[#0a0a0b] px-5 py-2 hover:bg-[#bff020] transition-colors">
                            Apply →
                          </button>
                          <button type="button" onClick={() => setShowAiPanel(false)} className="font-mono text-[10px] uppercase tracking-[0.2em] border border-stone-800 text-stone-500 px-5 py-2 hover:text-stone-300 transition-colors">
                            Keep original
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* quick platform preview */}
              {formData.mainCaption && (
                <div className={sectionBox}>
                  <div className="border-b border-stone-800 px-8 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-600">Platform preview</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-stone-800">
                    {PLATFORMS.map(p => (
                      <div key={p.id} className="p-5">
                        <div className={`flex items-center gap-2 mb-3 ${p.color}`}>
                          {p.icon}
                          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-600">{p.name}</span>
                        </div>
                        <p className="text-stone-600 text-xs leading-relaxed line-clamp-3">
                          {formData.mainCaption.substring(0, 80)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              STEP 2 · PLATFORMS
          ════════════════════════════════════════════════ */}
          {activeTab === 'platforms' && (
            <div className="space-y-6">

              {/* selector */}
              <div className={sectionBox}>
                <div className={sectionHead}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Step 02</p>
                  <h2
                    className="font-display italic text-stone-100 leading-none"
                    style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontVariationSettings:'"opsz" 80' }}
                  >
                    Where should this live?
                  </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3">
                  {PLATFORMS.map((p, idx) => {
                    const sel = formData.platforms.includes(p.id);
                    const border = [
                      idx < PLATFORMS.length - (PLATFORMS.length % 3 || 3) ? '' : '',
                      'border-b border-r border-stone-800',
                    ].join(' ');
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={[
                          'group p-7 text-left border-b border-r border-stone-800 transition-colors',
                          sel ? 'bg-[#d4ff3a]/[0.04]' : 'hover:bg-stone-900/50',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <span className={`${p.color} ${sel ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'} transition-opacity`}>
                            {p.icon}
                          </span>
                          <div className={`w-[14px] h-[14px] border flex items-center justify-center flex-shrink-0 transition-colors ${sel ? 'border-[#d4ff3a] bg-[#d4ff3a]' : 'border-stone-700'}`}>
                            {sel && <span className="text-[#0a0a0b] text-[8px] font-bold leading-none">✓</span>}
                          </div>
                        </div>
                        <p className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-1 transition-colors ${sel ? 'text-stone-200' : 'text-stone-600 group-hover:text-stone-400'}`}>
                          {p.name}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-800">{p.users}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-stone-800 px-8 py-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-700">
                    {formData.platforms.length} platform{formData.platforms.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              </div>

              {/* validation */}
              {formData.platforms.length > 0 && (
                <div className={sectionBox}>
                  <div className="border-b border-stone-800 px-8 py-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">Content validation</p>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-stone-800">
                    {formData.platforms.map(pid => {
                      const meta  = PLATFORMS.find(p => p.id === pid)!;
                      const rules = PLATFORM_RULES[pid];
                      if (!rules || !meta) return null;
                      const cap = pid==='youtube' ? (platformContent.youtube.description||'') : (platformContent[pid as keyof PlatformSettings]?.caption||'');
                      const ttl = platformContent.youtube.title || '';

                      type Issue = { t: 'err'|'warn'; m: string };
                      const issues: Issue[] = [];
                      if (rules.requiresTitle && !ttl.trim())                      issues.push({ t:'err',  m:'YouTube title required' });
                      if (rules.requiresTitle && ttl.length > (rules.titleMax||100))  issues.push({ t:'err',  m:`Title > ${rules.titleMax} chars` });
                      if (cap.length > rules.captionMax)                           issues.push({ t:'err',  m:`Caption > ${rules.captionMax}` });
                      if (pid==='twitter' && cap.length > 240 && cap.length <= 280) issues.push({ t:'warn', m:`${280-cap.length} chars left` });
                      if (rules.requiresVideo && !formData.videoUrl)               issues.push({ t:'err',  m:'Video required' });
                      if (pid==='instagram' && !formData.imageUrl && !formData.videoUrl) issues.push({ t:'err', m:'Image or video required' });

                      const hasErr  = issues.some(i => i.t==='err');
                      const hasWarn = issues.some(i => i.t==='warn');
                      const good    = !hasErr && !hasWarn && (cap.length>0 || !!ttl);

                      return (
                        <div key={pid} className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`flex items-center gap-2 ${meta.color}`}>
                              {meta.icon}
                              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-600">{meta.name}</span>
                            </div>
                            {hasErr  && <XCircle    size={12} className="text-[#ff5e3a]"  />}
                            {!hasErr && hasWarn && <AlertCircle size={12} className="text-amber-400" />}
                            {good    && <CheckCircle size={12} className="text-[#d4ff3a]" />}
                          </div>

                          {rules.captionMax > 0 && (
                            <div className="mb-4">
                              <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.08em] mb-1.5">
                                <span className="text-stone-700">{pid==='youtube' ? 'Desc' : 'Caption'}</span>
                                <span className={cap.length > rules.captionMax ? 'text-[#ff5e3a]' : cap.length > rules.captionMax*0.85 ? 'text-amber-400' : 'text-stone-700'}>
                                  {cap.length}/{rules.captionMax}
                                </span>
                              </div>
                              <div className="h-px bg-stone-900 overflow-hidden">
                                <div
                                  className={`h-full ${cap.length > rules.captionMax ? 'bg-[#ff5e3a]' : cap.length > rules.captionMax*0.85 ? 'bg-amber-500' : 'bg-[#d4ff3a]'}`}
                                  style={{ width:`${Math.min(100,(cap.length/rules.captionMax)*100)}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="mb-3 space-y-0.5">
                            {[['Image', rules.allowsImage], ['Video', rules.allowsVideo]].map(([lbl, ok]) => (
                              <p key={String(lbl)} className="font-mono text-[9px] uppercase tracking-[0.08em]">
                                <span className={ok ? 'text-[#d4ff3a]' : 'text-stone-800'}>{ok ? '✓' : '✕'}</span>
                                {' '}<span className="text-stone-800">{String(lbl)}</span>
                              </p>
                            ))}
                          </div>

                          {issues.map((iss, i) => (
                            <div key={i} className={`flex items-start gap-1 font-mono text-[9px] uppercase tracking-[0.08em] mt-1 ${iss.t==='err' ? 'text-[#ff5e3a]' : 'text-amber-400'}`}>
                              {iss.t==='err' ? <XCircle size={9} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={9} className="mt-0.5 flex-shrink-0" />}
                              {iss.m}
                            </div>
                          ))}
                          {good && (
                            <p className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[#d4ff3a] mt-1">
                              <CheckCircle size={9} /> Ready
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* per-platform editors */}
              {formData.platforms.map(pid => {
                const meta  = PLATFORMS.find(p => p.id === pid)!;
                const rules = PLATFORM_RULES[pid];
                const pc    = platformContent[pid as keyof PlatformSettings];
                const capLen = pc?.caption?.length || 0;

                return (
                  <div key={pid} className={sectionBox}>
                    <div className={`${sectionHead} flex items-center justify-between`}>
                      <div className={`flex items-center gap-3 ${meta.color}`}>
                        {meta.icon}
                        <h3
                          className="font-display italic text-stone-100"
                          style={{ fontSize:'1.1rem', fontVariationSettings:'"opsz" 80' }}
                        >
                          {meta.name}
                        </h3>
                      </div>
                      {pid !== 'youtube' && (
                        <span className={`font-mono text-[9px] uppercase tracking-[0.15em] ${capLen > (rules?.captionMax||0) ? 'text-[#ff5e3a]' : 'text-stone-700'}`}>
                          {capLen}/{rules?.captionMax}
                        </span>
                      )}
                    </div>

                    <div className="p-8">
                      {pid === 'youtube' ? (
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-7">
                            <div>
                              <label className={label}>Video title</label>
                              <input type="text" value={platformContent.youtube.title} onChange={e => updatePlatform('youtube','title',e.target.value)} maxLength={100} placeholder="Catchy title for maximum clicks" className={inputBase} />
                              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-800 mt-1 text-right">{platformContent.youtube?.title?.length ?? 0}/100</p>
                            </div>
                            <div>
                              <label className={label}>Tags</label>
                              <input type="text" value={platformContent.youtube.tags?.join(', ')||''} onChange={e => updatePlatform('youtube','tags',e.target.value.split(',').map(t=>t.trim()))} placeholder="coding, tech, tutorial" className={inputBase} />
                              <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-800 mt-1">Comma separated</p>
                            </div>
                          </div>
                          <div>
                            <label className={label}>Description</label>
                            <textarea value={platformContent.youtube.description} onChange={e => updatePlatform('youtube','description',e.target.value)} rows={8} placeholder="Detailed description with timestamps and links" className={textareaBase} />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-7">
                          <div>
                            <label className={label}>Caption</label>
                            <textarea value={pc?.caption||''} onChange={e => updatePlatform(pid as keyof PlatformSettings,'caption',e.target.value)} rows={5} placeholder={`Write your ${meta.name} caption…`} className={textareaBase} />
                          </div>
                          {(pc?.hashtags?.length||0) > 0 && (
                            <div>
                              <label className={label}>Hashtags</label>
                              <div className="flex flex-wrap gap-1.5">
                                {pc?.hashtags?.map((tag, i) => (
                                  <span key={i} className="font-mono text-[9px] uppercase tracking-[0.08em] border border-stone-800 text-stone-600 px-2 py-0.5">{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {PLATFORM_TIPS[pid as PlatformId] && (
                        <div className="mt-7 pt-6 border-t border-stone-900 flex items-start gap-3">
                          <AlertCircle size={11} className="text-stone-700 mt-0.5 flex-shrink-0" />
                          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-700 leading-relaxed">
                            {PLATFORM_TIPS[pid as PlatformId]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              STEP 3 · SCHEDULE
          ════════════════════════════════════════════════ */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className={sectionBox}>
                <div className={sectionHead}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Step 03</p>
                  <h2
                    className="font-display italic text-stone-100 leading-none"
                    style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontVariationSettings:'"opsz" 80' }}
                  >
                    When should this go live?
                  </h2>
                </div>

                {/* mode cards */}
                <div className="grid md:grid-cols-2 border-b border-stone-800 divide-y md:divide-y-0 md:divide-x divide-stone-800">
                  {/* publish now */}
                  <div
                    onClick={() => setScheduleMode('now')}
                    className={`p-8 cursor-pointer transition-colors ${scheduleMode==='now' ? 'bg-[#d4ff3a]/[0.04]' : 'hover:bg-stone-900/40'}`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${scheduleMode==='now' ? 'text-[#d4ff3a]' : 'text-stone-600'}`}>
                        Publish now
                      </p>
                      <div className={`w-[14px] h-[14px] border flex-shrink-0 flex items-center justify-center ${scheduleMode==='now' ? 'border-[#d4ff3a]' : 'border-stone-700'}`}>
                        {scheduleMode==='now' && <div className="w-[6px] h-[6px] bg-[#d4ff3a]" />}
                      </div>
                    </div>
                    <p
                      className="font-display italic text-stone-400 mb-3"
                      style={{ fontSize:'1.3rem', fontVariationSettings:'"opsz" 80' }}
                    >
                      Live in seconds.
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-700 leading-relaxed">
                      Posts immediately to all selected platforms.
                    </p>
                  </div>

                  {/* schedule */}
                  <div
                    onClick={handleCustomSchedule}
                    className={`p-8 cursor-pointer transition-colors ${scheduleMode==='custom' ? 'bg-[#d4ff3a]/[0.04]' : 'hover:bg-stone-900/40'}`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <p className={`font-mono text-[10px] uppercase tracking-[0.25em] ${scheduleMode==='custom' ? 'text-[#d4ff3a]' : 'text-stone-600'}`}>
                        Schedule
                      </p>
                      <div className={`w-[14px] h-[14px] border flex-shrink-0 flex items-center justify-center ${scheduleMode==='custom' ? 'border-[#d4ff3a]' : 'border-stone-700'}`}>
                        {scheduleMode==='custom' && <div className="w-[6px] h-[6px] bg-[#d4ff3a]" />}
                      </div>
                    </div>
                    <p
                      className="font-display italic text-stone-400 mb-3"
                      style={{ fontSize:'1.3rem', fontVariationSettings:'"opsz" 80' }}
                    >
                      Pick your moment.
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-700 leading-relaxed">
                      Set a date and time. Auto-published by cron.
                    </p>
                  </div>
                </div>

                {/* custom date/time */}
                {scheduleMode === 'custom' && (
                  <div className="border-b border-stone-800 p-8">
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-8">Date & time</p>
                    <div className="grid md:grid-cols-2 gap-10">
                      <div>
                        <label className={label}>Date</label>
                        <input type="date" value={formData.scheduledDate} onChange={e => setFormData(p => ({ ...p, scheduledDate: e.target.value }))} className={inputBase} required={scheduleMode==='custom'} />
                      </div>
                      <div>
                        <label className={label}>Time</label>
                        <input type="time" value={formData.scheduledTime} onChange={e => setFormData(p => ({ ...p, scheduledTime: e.target.value }))} className={inputBase} required={scheduleMode==='custom'} />
                      </div>
                    </div>
                  </div>
                )}

                {/* confirmation */}
                {scheduleMode !== 'now' && formData.scheduledDate && formData.scheduledTime && (
                  <div className="border-b border-stone-800 px-8 py-6">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-600 mb-2">Scheduled for</p>
                    <p className="font-display italic text-stone-100" style={{ fontSize:'1.5rem', fontVariationSettings:'"opsz" 80' }}>
                      {fmtDateTime(formData.scheduledDate, formData.scheduledTime)}
                    </p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-700 mt-2">
                      Track from dashboard after scheduling
                    </p>
                  </div>
                )}

                <div className="px-8 py-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-800">
                    Consistent timing each week builds audience habits and improves reach.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════
              STEP 4 · PREVIEW
          ════════════════════════════════════════════════ */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className={sectionBox}>
                <div className={sectionHead}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-stone-500 mb-2">Step 04</p>
                  <h2
                    className="font-display italic text-stone-100 leading-none"
                    style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontVariationSettings:'"opsz" 80' }}
                  >
                    Final review.
                  </h2>
                </div>

                {/* stats */}
                <div className="grid grid-cols-4 border-b border-stone-800 divide-x divide-stone-800">
                  {[
                    { n: String(formData.platforms.length), l: 'Platforms' },
                    { n: scheduleMode==='now' ? 'Now' : 'Timed', l: 'Delivery' },
                    { n: String(formData.mainCaption.length), l: 'Characters' },
                    { n: String((formData.imageUrl?1:0)+(formData.videoUrl?1:0)), l: 'Media' },
                  ].map(s => (
                    <div key={s.l} className="py-6 text-center">
                      <div
                        className="font-display italic text-stone-100 leading-none mb-1"
                        style={{ fontSize:'1.6rem', fontVariationSettings:'"opsz" 80' }}
                      >
                        {s.n}
                      </div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* platform cards */}
                {formData.platforms.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 border-b border-stone-800 divide-x divide-y divide-stone-800">
                    {formData.platforms.map(pid => {
                      const meta = PLATFORMS.find(p => p.id === pid)!;
                      const pc   = platformContent[pid as keyof PlatformSettings];
                      return (
                        <div key={pid} className="p-6">
                          <div className={`flex items-center gap-2 mb-4 ${meta.color}`}>
                            {meta.icon}
                            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-600">{meta.name}</span>
                          </div>

                          {(formData.imageUrl || formData.videoUrl) && (
                            <div className="mb-4 border border-stone-800 bg-stone-900" style={{ height:100, overflow:'hidden' }}>
                              {formData.imageUrl
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={formData.imageUrl} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><VideoIcon className="w-7 h-7 text-stone-700" /></div>}
                            </div>
                          )}

                          {pid === 'youtube' ? (
                            <>
                              <p className="text-stone-200 text-sm font-medium leading-snug mb-2 line-clamp-2">
                                {platformContent.youtube.title || 'Untitled Video'}
                              </p>
                              <p className="text-stone-600 text-xs leading-relaxed line-clamp-3">
                                {platformContent.youtube.description}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-stone-500 text-xs leading-relaxed whitespace-pre-wrap line-clamp-4 mb-2">
                                {pc?.caption}
                              </p>
                              {(pc?.hashtags?.length||0) > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {pc?.hashtags?.slice(0,4).map((tag,i) => (
                                    <span key={i} className="font-mono text-[9px] text-stone-700">{tag}</span>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center border-b border-stone-800">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-700">No platforms selected</p>
                    <p className="font-display italic text-stone-600 mt-2" style={{ fontSize:'1rem' }}>Go back and choose where to publish.</p>
                  </div>
                )}

                {/* errors */}
                {platformErrors.length > 0 && (
                  <div className="border-b border-stone-800 px-8 py-5 bg-[#ff5e3a]/[0.04]">
                    {platformErrors.map((e,i) => (
                      <div key={i} className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#ff5e3a] mb-1">
                        <XCircle size={10} />{e}
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-8 py-5">
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-700">
                    {scheduleMode !== 'now' && formData.scheduledDate
                      ? `Scheduled · ${fmtDateTime(formData.scheduledDate, formData.scheduledTime)}`
                      : 'Publishing to all selected platforms immediately.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── nav buttons ───────────────────────────────── */}
          <div className="flex gap-4 mt-8">
            {activeTab !== 'content' && (
              <button
                type="button"
                onClick={goPrev}
                className="flex items-center gap-2 border border-stone-800 text-stone-600 hover:text-stone-200 hover:border-stone-600 font-mono text-[10px] uppercase tracking-[0.2em] px-6 py-3.5 transition-colors"
              >
                <ChevronLeft size={12} /> Previous
              </button>
            )}

            {activeTab !== 'preview' ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 flex items-center justify-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] font-mono text-[10px] uppercase tracking-[0.25em] font-bold py-3.5 hover:bg-[#bff020] transition-colors"
              >
                Continue <ChevronRight size={12} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 flex items-center justify-center gap-2 bg-[#d4ff3a] text-[#0a0a0b] font-mono text-[10px] uppercase tracking-[0.25em] font-bold py-3.5 hover:bg-[#bff020] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? <><RefreshCw size={11} className="animate-spin" /> Publishing…</>
                  : scheduleMode === 'now'
                    ? `Publish to ${formData.platforms.length} platform${formData.platforms.length!==1?'s':''} →`
                    : `Schedule for ${formData.platforms.length} platform${formData.platforms.length!==1?'s':''} →`}
              </button>
            )}
          </div>
        </form>
      </div>

      <PremiumModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
}
