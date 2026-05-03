// app/createpost/page.tsx
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
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Upload,
  Zap,
  Globe,
  Youtube,
  Twitter,
  Linkedin,
  MessageSquare,
  Target,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Settings,
  PenTool,
  Calendar as CalendarIcon,
  Bell,
  Hash,
} from 'lucide-react';

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

const platformIcons: Record<string, React.ReactNode> = {
  youtube: <Youtube size={20} className="text-red-500" />,
  twitter: <Twitter size={20} className="text-blue-400" />,
  linkedin: <Linkedin size={20} className="text-blue-600" />,
};

const platformTips: Record<string, string> = {
  twitter:
    'Keep it under 280 characters, use 1-2 hashtags, and tag relevant accounts.',
  linkedin:
    'Use a professional tone, share insights, and ask thought-provoking questions.',
};

const orderedTabs: TabId[] = ['content', 'platforms', 'schedule', 'preview'];

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [aiTimeSlots, setAiTimeSlots] = useState<AiTimeSlot[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProTips, setShowProTips] = useState(false);

  const [formData, setFormData] = useState({
    mainCaption: '',
    platforms: [] as string[],
    imageUrl: '',
    videoUrl: '',
    scheduledDate: '',
    scheduledTime: new Date(Date.now() + 3600000)
      .toISOString()
      .slice(11, 16),
  });

  const [platformContent, setPlatformContent] = useState<PlatformSettings>({
    youtube: {
      title: '',
      description: '',
      caption: '',
      hashtags: [],
      tags: [],
    },
    twitter: {
      caption: '',
      hashtags: [],
      tags: [],
    },
    linkedin: {
      caption: '',
      hashtags: [],
      tags: [],
    },
  });

  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showAiComparison, setShowAiComparison] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (formData.mainCaption) {
      generatePlatformContent(formData.mainCaption);
    }
  }, [formData.mainCaption]);

  useEffect(() => {
    if (
      scheduleMode === 'ai' &&
      aiTimeSlots.length === 0 &&
      formData.platforms.length > 0
    ) {
      generateDefaultTimeSlots();
    }
  }, [scheduleMode, formData.platforms]); // eslint-disable-line react-hooks/exhaustive-deps

  const generatePlatformContent = (mainCaption: string) => {
    const hashtags = mainCaption.match(/#[\w]+/g) || [];
    const cleanCaption = mainCaption.replace(/#[\w]+/g, '').trim();

    const youtubeTitle = cleanCaption.substring(0, 100) || 'Untitled Video';
    const youtubeDescription = `${cleanCaption}\n\nSubscribe for more content!\n${hashtags.join(' ')}`;
    const youtubeTags = hashtags.map((h) => h.replace('#', ''));

    const twitterCaption = cleanCaption.substring(0, 250);
    const twitterHashtags = hashtags.slice(0, 3);

    setPlatformContent({
      youtube: {
        title: youtubeTitle,
        description: youtubeDescription,
        caption: cleanCaption,
        hashtags: [],
        tags: youtubeTags,
      },
      twitter: {
        caption: twitterCaption,
        hashtags: twitterHashtags,
        tags: [],
      },
      linkedin: {
        caption: cleanCaption,
        hashtags: hashtags.filter(
          (h) => !h.includes('youtube'),
        ),
        tags: [],
      },
    });
  };

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const generateDefaultTimeSlots = () => {
    const slots: AiTimeSlot[] = [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const platformTimes = {
      twitter: ['07:00', '12:00', '16:00', '21:00'],
      linkedin: ['08:00', '11:00', '14:00', '17:00'],
      youtube: ['10:00', '14:00', '18:00', '21:00'],
    } as const;

    formData.platforms.forEach((platform) => {
      const times =
        platformTimes[platform as keyof typeof platformTimes] || ['12:00'];

      times.slice(0, 2).forEach((time, idx) => {
        const date = idx === 0 ? formatDate(now) : formatDate(tomorrow);
        const engagementScore = 80 + Math.floor(Math.random() * 20);

        const descriptions = {
          twitter: 'High Twitter activity period',
          linkedin: 'Professional hours for LinkedIn',
          youtube: 'Optimal YouTube viewing time',
        } as const;

        slots.push({
          platform,
          time,
          date,
          engagementScore,
          description:
            descriptions[platform as keyof typeof descriptions] ||
            'Recommended time',
        });
      });
    });

    slots.sort((a, b) => b.engagementScore - a.engagementScore);
    setAiTimeSlots(slots);
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTimeDisplay = (date: string, time: string): string => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDateForWeekday = (weekday: string): string => {
    const weekdays = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    const targetIndex = weekdays.indexOf(weekday.toLowerCase());
    if (targetIndex === -1) {
      return new Date().toISOString().split('T')[0];
    }

    const now = new Date();
    const todayIndex = now.getDay();

    let diff = targetIndex - todayIndex;
    if (diff < 0) diff += 7;

    const result = new Date(now);
    result.setDate(result.getDate() + diff);
    return result.toISOString().split('T')[0];
  };

  const handleAiEnhance = async () => {
    const baseCaption = formData.mainCaption;

    if (!baseCaption || baseCaption.trim() === '') {
      alert('Please write a caption first!');
      return;
    }

    setAiEnhancing(true);

    try {
      const response = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: baseCaption,
          platform: formData.platforms[0] || 'youtube',
          platforms: ['youtube', 'twitter', 'linkedin'],
          tone: 'engaging',
          contentType: formData.videoUrl ? 'video' : 'image',
        }),
      });
      if (!response.ok) {
        throw new Error('AI Enhancement failed');
      }

      const data = await response.json();

      if (data.success) {
        setAiSuggestions(data);
        setShowAiComparison(true);

        if (data.platformTimes) {
          const slots: AiTimeSlot[] = [];

          Object.entries(data.platformTimes).forEach(
            ([plat, timeInfo]: any) => {
              let baseDate: string;

              if ((timeInfo.day || '').toLowerCase().includes('tomorrow')) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                baseDate = tomorrow.toISOString().split('T')[0];
              } else if (timeInfo.day) {
                baseDate = getDateForWeekday(timeInfo.day);
              } else {
                baseDate = new Date().toISOString().split('T')[0];
              }

              slots.push({
                platform: plat,
                time: timeInfo.time || '12:00',
                date: baseDate,
                engagementScore: 90,
                description:
                  timeInfo.reason || `AI-recommended time for ${plat}`,
              });
            },
          );

          slots.sort((a, b) => b.engagementScore - a.engagementScore);
          setAiTimeSlots(slots);
        }
      } else {
        alert(`AI enhancement failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error('AI Error:', error);
      alert(`Failed to enhance caption: ${error.message}`);
    } finally {
      setAiEnhancing(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestions) return;

    setFormData((prev) => ({
      ...prev,
      mainCaption: aiSuggestions.enhancedCaption,
    }));

    setShowAiComparison(false);
    setActiveTab('platforms');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab !== 'preview') {
      console.warn(
        'Form submission only allowed from preview tab. Current tab:',
        activeTab,
      );
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!formData.mainCaption.trim()) {
      alert('Please write a caption');
      return;
    }

    if (formData.platforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }

    if (
      scheduleMode !== 'now' &&
      (!formData.scheduledDate || !formData.scheduledTime)
    ) {
      alert('Please set a schedule time');
      return;
    }

    setLoading(true);

    try {
      const postsRef = collection(db, 'posts');
      const scheduledTime =
        scheduleMode === 'now'
          ? new Date()
          : new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      const postDocRef = await addDoc(postsRef, {
        userId: user.uid,
        caption: formData.mainCaption,
        platforms: formData.platforms,
        platformContent,
        imageUrl: formData.imageUrl || null,
        videoUrl: formData.videoUrl || null,
        scheduledTime,
        status: scheduleMode === 'now' ? 'publishing' : 'scheduled',
        scheduleMode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (scheduleMode === 'now') {
        try {
          const publishResponse = await authFetch('/api/posts/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId: postDocRef.id,
              platforms: formData.platforms,
              caption: formData.mainCaption,
              imageUrl: formData.imageUrl || null,
              videoUrl: formData.videoUrl || null,
              platformContent,
            }),
          });

          const publishData = await publishResponse.json();

          if (!publishResponse.ok || !publishData.success) {
            alert(
              `Post saved but failed to publish. You can retry from dashboard.\n${
                publishData.error || ''
              }`,
            );
          } else {
            alert('Post published successfully to all platforms!');
          }
        } catch (publishError) {
          console.error('Error publishing post:', publishError);
          alert(
            'Post saved but failed to publish. Please try again from dashboard.',
          );
        }
      } else {
        alert('Post scheduled successfully! It will be auto-published.');
      }

      setFormData({
        mainCaption: '',
        platforms: [],
        imageUrl: '',
        videoUrl: '',
        scheduledDate: '',
        scheduledTime: new Date(Date.now() + 3600000)
          .toISOString()
          .slice(11, 16),
      });

      setPlatformContent({
        youtube: {
          title: '',
          description: '',
          caption: '',
          hashtags: [],
          tags: [],
        },
        twitter: { caption: '', hashtags: [], tags: [] },
        linkedin: { caption: '', hashtags: [], tags: [] },
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformContent = (
    platform: keyof PlatformSettings,
    field: string,
    value: any,
  ) => {
    setPlatformContent((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const canGoToPlatforms = !!formData.mainCaption.trim();
  const canGoToSchedule = canGoToPlatforms && formData.platforms.length > 0;
  const canGoToPreview =
    canGoToSchedule &&
    (scheduleMode === 'now' ||
      (formData.scheduledDate && formData.scheduledTime));

  const goNext = () => {
    const idx = orderedTabs.indexOf(activeTab);

    if (activeTab === 'content' && !formData.mainCaption.trim()) {
      alert('Please write a caption to continue.');
      return;
    }
    if (activeTab === 'platforms' && formData.platforms.length === 0) {
      alert('Please select at least one platform.');
      return;
    }
    if (
      activeTab === 'schedule' &&
      scheduleMode !== 'now' &&
      (!formData.scheduledDate || !formData.scheduledTime)
    ) {
      alert('Please choose a schedule date and time.');
      return;
    }

    setActiveTab(orderedTabs[idx + 1] as TabId);
  };

  const goPrev = () => {
    const idx = orderedTabs.indexOf(activeTab);
    setActiveTab(orderedTabs[idx - 1] as TabId);
  };

  const handleCustomSchedule = () => {
    setScheduleMode('custom');
    setFormData((prev) => ({
      ...prev,
      scheduledDate:
        prev.scheduledDate || new Date().toISOString().split('T')[0],
    }));
  };

  const canSubmit =
    !loading &&
    formData.platforms.length > 0 &&
    !!formData.mainCaption.trim() &&
    (scheduleMode === 'now' ||
      (formData.scheduledDate && formData.scheduledTime));

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-300 text-lg mt-4 font-medium">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const steps: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'content', label: 'Content', icon: <PenTool size={18} /> },
    { id: 'platforms', label: 'Platforms', icon: <Globe size={18} /> },
    { id: 'schedule', label: 'Schedule', icon: <CalendarIcon size={18} /> },
    { id: 'preview', label: 'Preview', icon: <Eye size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
              Create Content
            </h1>
            <p className="text-gray-400 text-sm">
              Craft, optimize, and schedule posts across all platforms
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-sm"
          >
            <ChevronLeft size={18} />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <div className="relative mb-6">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2" />
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const isActive = activeTab === step.id;
                const isCompleted =
                  steps.findIndex((s) => s.id === activeTab) > index;

                const canClick =
                  step.id === 'content' ||
                  (step.id === 'platforms' && canGoToPlatforms) ||
                  (step.id === 'schedule' && canGoToSchedule) ||
                  (step.id === 'preview' && canGoToPreview);

                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center relative z-10"
                  >
                    <button
                      type="button"
                      disabled={!canClick}
                      onClick={() => canClick && setActiveTab(step.id)}
                      className={`flex items-center justify-center w-11 h-11 rounded-full text-sm transition-all ${
                        isActive
                          ? 'bg-cyan-500 text-white shadow shadow-cyan-500/40'
                          : isCompleted
                          ? 'bg-emerald-600/20 border border-emerald-400/60 text-emerald-300'
                          : 'bg-gray-900 border border-gray-700 text-gray-400'
                      } ${
                        !canClick ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.icon
                      )}
                    </button>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isActive
                          ? 'text-cyan-400'
                          : isCompleted
                          ? 'text-emerald-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'content' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gray-800">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Upload Media
                      </h3>
                      <p className="text-xs text-gray-400">
                        Images, videos, or GIFs (optional)
                      </p>
                    </div>
                  </div>

                  <FileUpload
                    onUploadComplete={(url, type) => {
                      if (type === 'image') {
                        setFormData((prev) => ({ ...prev, imageUrl: url }));
                      } else {
                        setFormData((prev) => ({ ...prev, videoUrl: url }));
                      }
                    }}
                    acceptedTypes="image,video"
                    maxSizeMB={100}
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    If you skip this, we will publish a text-only post.
                  </p>

                  {(formData.imageUrl || formData.videoUrl) && (
                    <div className="mt-6 p-4 bg-gray-950 rounded-xl border border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300">
                          Uploaded Files
                        </h4>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2 text-xs">
                        {formData.imageUrl && (
                          <div className="flex items-center gap-2 text-cyan-400 truncate">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span>Image uploaded</span>
                          </div>
                        )}
                        {formData.videoUrl && (
                          <div className="flex items-center gap-2 text-purple-400 truncate">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span>Video uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setShowProTips((v) => !v)}
                    className="w-full flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Zap className="w-5 h-5 text-cyan-400" />
                      </div>
                      <h4 className="font-semibold text-cyan-300 text-sm">
                        Pro Tips
                      </h4>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        showProTips ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {showProTips && (
                    <div className="px-6 pb-4 space-y-3 text-xs text-gray-300">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                        <span>Use emojis to make captions feel human.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                        <span>
                          3–5 focused hashtags usually work better than 20+.
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                        <span>Always include a clear call-to-action.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gray-800">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          Content Editor
                        </h3>
                        <p className="text-xs text-gray-400">
                          Write your main caption
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAiEnhance}
                      disabled={aiEnhancing || !formData.mainCaption}
                      className="px-4 py-2 rounded-lg bg-purple-600 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {aiEnhancing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enhancing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>AI Enhance</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative">
                    <textarea
                      placeholder="What's on your mind? Start with one strong idea you want to share..."
                      value={formData.mainCaption}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          mainCaption: e.target.value,
                        }));
                        setCharacterCount(e.target.value.length);
                      }}
                      className="w-full px-4 py-4 rounded-xl bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-gray-500 min-h-64 resize-none focus:ring-1 focus:ring-cyan-500/30"
                    />
                    <div className="absolute bottom-3 right-3">
                      <div
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                          characterCount > 2200
                            ? 'bg-red-500/20 text-red-400'
                            : characterCount > 1800
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {characterCount}/2800
                      </div>
                    </div>
                  </div>

                  {formData.mainCaption.includes('#') && (
                    <div className="mt-4 p-4 bg-gray-950 rounded-xl border border-gray-800">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-semibold text-gray-300">
                          Hashtag Preview
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(formData.mainCaption.match(/#[\w]+/g) || [])
                          .slice(0, 8)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const text = formData.mainCaption;
                        setFormData((prev) => ({
                          ...prev,
                          mainCaption: text + ' 🚀',
                        }));
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 hover:text-white flex items-center gap-2"
                    >
                      <span>🚀</span>
                      <span>Add Emoji</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = formData.mainCaption;
                        setFormData((prev) => ({
                          ...prev,
                          mainCaption: text + ' #viral',
                        }));
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 hover:text-white flex items-center gap-2"
                    >
                      <Hash className="w-4 h-4" />
                      <span>Add Hashtag</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = formData.mainCaption;
                        setFormData((prev) => ({
                          ...prev,
                          mainCaption: text + ' 👉 Like & Follow!',
                        }));
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-xs text-gray-300 hover:text-white flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      <span>Add CTA</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-gray-800">
                      <Eye className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Quick Preview
                      </h3>
                      <p className="text-xs text-gray-400">
                        How your content might look on each feed
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['youtube', 'twitter', 'linkedin'].map((platform) => (
                      <div
                        key={platform}
                        className="bg-gray-950 rounded-xl p-4 border border-gray-800"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {platformIcons[platform]}
                          <span className="text-xs font-semibold text-gray-300 capitalize">
                            {platform}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-3">
                          {formData.mainCaption.substring(0, 80) ||
                            'Start typing your caption to see a preview.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'platforms' && (
            <div className="space-y-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gray-800">
                    <Globe className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Select Platforms
                    </h3>
                    <p className="text-xs text-gray-400">
                      Choose where to publish your content
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'youtube',
                      name: 'YouTube',
                      color: 'from-red-500 to-red-700',
                      stats: '2.7B users',
                    },
                    {
                      id: 'twitter',
                      name: 'Twitter/X',
                      color: 'from-blue-400 to-blue-600',
                      stats: '550M users',
                    },
                    {
                      id: 'linkedin',
                      name: 'LinkedIn',
                      color: 'from-blue-600 to-blue-800',
                      stats: '950M users',
                    },
                  ].map((platform) => {
                    const isSelected = formData.platforms.includes(platform.id);

                    return (
                      <div
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all text-sm ${
                          isSelected
                            ? `border-transparent bg-gradient-to-br ${platform.color}`
                            : 'border-gray-800 hover:border-gray-700 bg-gray-950'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div
                            className={`p-3 rounded-xl ${
                              isSelected ? 'bg-white/15' : 'bg-gray-900'
                            }`}
                          >
                            {platformIcons[platform.id]}
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-white' : 'border-gray-600'
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>

                        <h4
                          className={`text-sm font-semibold mb-1 ${
                            isSelected ? 'text-white' : 'text-gray-200'
                          }`}
                        >
                          {platform.name}
                        </h4>

                        <p
                          className={`text-xs ${
                            isSelected ? 'text-white/85' : 'text-gray-400'
                          }`}
                        >
                          {platform.stats}
                        </p>

                        {isSelected && (
                          <div className="absolute -top-2 -right-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 p-4 bg-gray-950 rounded-xl border border-gray-800 flex items-center gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-gray-300">
                    {formData.platforms.length} platform
                    {formData.platforms.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>

              {formData.platforms.map((platform) => (
                <div
                  key={platform}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-8"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-gray-800">
                      {platformIcons[platform]}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white capitalize">
                        {platform} Content
                      </h3>
                      <p className="text-xs text-gray-400">
                        Optimized specifically for {platform}
                      </p>
                    </div>
                  </div>

                  {platform === 'youtube' ? (
                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-2">
                            Video Title
                          </label>
                          <input
                            type="text"
                            value={platformContent.youtube.title}
                            onChange={(e) =>
                              updatePlatformContent(
                                'youtube',
                                'title',
                                e.target.value,
                              )
                            }
                            maxLength={100}
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-gray-500"
                            placeholder="Catchy title for maximum clicks"
                          />
                          <div className="mt-1 text-[11px] text-gray-500 text-right">
                            {(platformContent.youtube?.title?.length ?? 0)}/100
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-2">
                            Tags
                          </label>
                          <input
                            type="text"
                            value={
                              platformContent.youtube.tags?.join(', ') || ''
                            }
                            onChange={(e) =>
                              updatePlatformContent(
                                'youtube',
                                'tags',
                                e.target.value
                                  .split(',')
                                  .map((t) => t.trim()),
                              )
                            }
                            className="w-full px-4 py-2.5 rounded-lg bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-gray-500"
                            placeholder="coding, tech, tutorial, development"
                          />
                          <div className="mt-1 text-[11px] text-gray-500">
                            Comma separated tags for SEO
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={platformContent.youtube.description}
                          onChange={(e) =>
                            updatePlatformContent(
                              'youtube',
                              'description',
                              e.target.value,
                            )
                          }
                          rows={8}
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-gray-500 resize-none"
                          placeholder="Detailed description with timestamps, links, and calls to action"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 text-sm">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Caption
                        </label>
                        <textarea
                          value={
                            platformContent[
                              platform as keyof PlatformSettings
                            ]?.caption || ''
                          }
                          onChange={(e) =>
                            updatePlatformContent(
                              platform as keyof PlatformSettings,
                              'caption',
                              e.target.value,
                            )
                          }
                          rows={5}
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-950 border border-gray-800 focus:border-cyan-500 focus:outline-none text-sm text-white placeholder-gray-500 resize-none"
                          placeholder={`Write your ${platform} caption...`}
                        />
                      </div>

                      {platformContent[
                        platform as keyof PlatformSettings
                      ]?.hashtags?.length > 0 && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-2">
                            Hashtags
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {platformContent[
                              platform as keyof PlatformSettings
                            ]?.hashtags?.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-gray-950 rounded-xl border border-gray-800 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-amber-400">
                        {platform} Tips
                      </span>
                    </div>
                    <p className="text-gray-400">
                      {platformTips[platform] ??
                        'Write concise, engaging copy tailored to this platform.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gray-800">
                    <CalendarIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Schedule Your Post
                    </h3>
                    <p className="text-xs text-gray-400">
                      Choose when to publish your content
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8 text-sm">
                  <div
                    onClick={() => setScheduleMode('now')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      scheduleMode === 'now'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-800 hover:border-gray-700 bg-gray-950'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`p-3 rounded-lg ${
                          scheduleMode === 'now'
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-gray-900 text-gray-400'
                        }`}
                      >
                        <Zap className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        Publish Now
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Post immediately to all selected platforms.
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          scheduleMode === 'now'
                            ? 'text-cyan-400'
                            : 'text-gray-500'
                        }`}
                      >
                        Instant Delivery
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          scheduleMode === 'now'
                            ? 'border-cyan-500'
                            : 'border-gray-600'
                        }`}
                      >
                        {scheduleMode === 'now' && (
                          <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={handleCustomSchedule}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                      scheduleMode === 'custom'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-800 hover:border-gray-700 bg-gray-950'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`p-3 rounded-lg ${
                          scheduleMode === 'custom'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-gray-900 text-gray-400'
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        Custom Time
                      </h4>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Set your own date and time for posting.
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          scheduleMode === 'custom'
                            ? 'text-blue-400'
                            : 'text-gray-500'
                        }`}
                      >
                        Manual Schedule
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          scheduleMode === 'custom'
                            ? 'border-blue-500'
                            : 'border-gray-600'
                        }`}
                      >
                        {scheduleMode === 'custom' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl border-2 border-gray-900 bg-gray-950 text-xs text-gray-400 flex flex-col justify-center">
                    <p className="mb-1">
                      Tip: Scheduling at a consistent time each week can improve
                      engagement.
                    </p>
                    <p>Use analytics later to refine your best posting times.</p>
                  </div>
                </div>

                {scheduleMode === 'custom' && (
                  <div className="bg-gray-950 rounded-2xl p-6 border border-gray-800 text-sm">
                    <h4 className="text-sm font-bold text-white mb-4">
                      Set Date & Time
                    </h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date
                          </div>
                        </label>
                        <input
                          type="date"
                          value={formData.scheduledDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              scheduledDate: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none text-sm text-white"
                          required={scheduleMode === 'custom'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Time
                          </div>
                        </label>
                        <input
                          type="time"
                          value={formData.scheduledTime}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              scheduledTime: e.target.value,
                            }))
                          }
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-800 focus:border-cyan-500 focus:outline-none text-sm text-white"
                          required={scheduleMode === 'custom'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {scheduleMode !== 'now' &&
                  formData.scheduledDate &&
                  formData.scheduledTime && (
                    <div className="mt-6 p-6 bg-gray-950 border border-gray-800 rounded-2xl text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-cyan-300 mb-1">
                            Selected Schedule
                          </div>
                          <div className="text-lg font-bold text-white">
                            {formatTimeDisplay(
                              formData.scheduledDate,
                              formData.scheduledTime,
                            )}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-900">
                          <CalendarIcon className="w-7 h-7 text-cyan-400" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                        <Bell className="w-4 h-4" />
                        <span>
                          You will be able to track this scheduled post in your
                          dashboard.
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-8">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-gray-800">
                    <Eye className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Final Preview
                    </h3>
                    <p className="text-xs text-gray-400">
                      Review your content before publishing
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-8 text-sm">
                  <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Platforms</div>
                    <div className="text-xl font-bold text-white">
                      {formData.platforms.length}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Schedule</div>
                    <div className="text-sm font-bold text-white">
                      {scheduleMode === 'now' ? 'Immediate' : 'Scheduled'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">
                      Characters
                    </div>
                    <div className="text-xl font-bold text-white">
                      {formData.mainCaption.length}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-950 rounded-xl border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Media</div>
                    <div className="text-sm font-bold text-white">
                      {(formData.imageUrl ? 1 : 0) +
                        (formData.videoUrl ? 1 : 0)}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                  {formData.platforms.map((platform) => (
                    <div
                      key={platform}
                      className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden"
                    >
                      <div className="p-4 bg-gray-900">
                        <div className="flex items-center gap-2">
                          {platformIcons[platform]}
                          <span className="font-semibold text-white text-sm capitalize">
                            {platform}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        {(formData.imageUrl || formData.videoUrl) && (
                          <div className="mb-4 rounded-lg overflow-hidden bg-gray-900">
                            {formData.imageUrl ? (
                              <img
                                src={formData.imageUrl}
                                alt="Preview"
                                className="w-full h-40 object-cover"
                              />
                            ) : formData.videoUrl ? (
                              <div className="w-full h-40 bg-gray-900 flex items-center justify-center">
                                <Video className="w-10 h-10 text-gray-600" />
                              </div>
                            ) : null}
                          </div>
                        )}

                        {platform === 'youtube' ? (
                          <>
                            <div className="font-semibold text-sm mb-2 text-white line-clamp-2">
                              {platformContent.youtube.title ||
                                'Untitled Video'}
                            </div>
                            <div className="text-xs text-gray-400 line-clamp-3">
                              {platformContent.youtube.description}
                            </div>
                            {platformContent.youtube.tags &&
                              platformContent.youtube.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                  {platformContent.youtube.tags
                                    .slice(0, 3)
                                    .map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 bg-gray-900 rounded text-[11px] text-gray-400"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                </div>
                              )}
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-6 mb-3">
                              {
                                platformContent[
                                  platform as keyof PlatformSettings
                                ]?.caption
                              }
                            </div>
                            {platformContent[
                              platform as keyof PlatformSettings
                            ]?.hashtags?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {platformContent[
                                  platform as keyof PlatformSettings
                                ]?.hashtags
                                  ?.slice(0, 5)
                                  .map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[11px] text-cyan-400"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {formData.platforms.length === 0 && (
                  <div className="text-center py-12 text-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                      <Globe className="w-8 h-8 text-gray-600" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-200 mb-1">
                      No Platforms Selected
                    </h4>
                    <p className="text-gray-400">
                      Go back and select at least one platform to publish to.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8">
            {activeTab !== 'content' && (
              <button
                type="button"
                onClick={goPrev}
                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs text-gray-300 hover:text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
            )}

            {activeTab !== 'preview' ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : scheduleMode === 'now' ? (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>
                      Publish to {formData.platforms.length} Platform
                      {formData.platforms.length !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      Schedule for {formData.platforms.length} Platform
                      {formData.platforms.length !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      <PremiumModal
        open={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
}

const Video = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);
