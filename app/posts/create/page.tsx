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
  Instagram,
  Youtube,
  Twitter,
  Linkedin,
  MessageSquare,
  BarChart,
  Target,
  CheckCircle,
  X,
  AlertCircle,
  RefreshCw,
  Eye,
  Settings,
  Users,
  TrendingUp,
  PenTool,
  Grid,
  Layers,
  Calendar as CalendarIcon,
  Bell,
  Share2,
  Hash,
  Tag,
} from 'lucide-react';

interface PlatformContent {
  caption: string;
  hashtags: string[];
  tags?: string[];
  title?: string;
  description?: string;
}

interface PlatformSettings {
  instagram: PlatformContent;
  youtube: PlatformContent;
  twitter: PlatformContent;
  linkedin: PlatformContent;
  tiktok: PlatformContent;
  facebook: PlatformContent;
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
  instagram: <Instagram size={20} className="text-pink-500" />,
  youtube: <Youtube size={20} className="text-red-500" />,
  twitter: <Twitter size={20} className="text-blue-400" />,
  linkedin: <Linkedin size={20} className="text-blue-600" />,
  tiktok: <Globe size={20} className="text-black" />,
  facebook: <Globe size={20} className="text-blue-500" />,
};

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [aiTimeSlots, setAiTimeSlots] = useState<AiTimeSlot[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [formData, setFormData] = useState({
    mainCaption: '',
    platforms: [] as string[],
    imageUrl: '',
    videoUrl: '',
    scheduledDate: '',
    scheduledTime: new Date(Date.now() + 3600000).toISOString().slice(11, 16),
  });

  const [platformContent, setPlatformContent] = useState<PlatformSettings>({
    instagram: {
      caption: '',
      hashtags: [],
      tags: [],
    },
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
    tiktok: {
      caption: '',
      hashtags: [],
      tags: [],
    },
    facebook: {
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

  // Auto-generate platform-specific content
  useEffect(() => {
    if (formData.mainCaption) {
      generatePlatformContent(formData.mainCaption);
    }
  }, [formData.mainCaption]);

  // Auto-generate default times when AI mode is selected
  useEffect(() => {
    if (scheduleMode === 'ai' && aiTimeSlots.length === 0 && formData.platforms.length > 0) {
      generateDefaultTimeSlots();
    }
  }, [scheduleMode, formData.platforms]); // eslint-disable-line react-hooks/exhaustive-deps

  const generatePlatformContent = (mainCaption: string) => {
    const hashtags = mainCaption.match(/#[\w]+/g) || [];
    const cleanCaption = mainCaption.replace(/#[\w]+/g, '').trim();

    const instagramCaption = cleanCaption.substring(0, 2000);
    const instagramHashtags = [
      ...hashtags,
      '#contentmarketing',
      '#socialmedia',
      '#contentcreator',
    ].slice(0, 30);

    const youtubeTitle = cleanCaption.substring(0, 100) || 'Untitled Video';
    const youtubeDescription = `${cleanCaption}\n\nSubscribe for more content!${hashtags.join(
      ' ',
    )}\n\n#Shorts`;
    const youtubeTags = hashtags.map((h) => h.replace('#', ''));

    const twitterCaption = cleanCaption.substring(0, 250);
    const twitterHashtags = hashtags.slice(0, 3);

    setPlatformContent({
      instagram: {
        caption: instagramCaption,
        hashtags: instagramHashtags,
        tags: [],
      },
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
          (h) => !h.includes('instagram') && !h.includes('youtube'),
        ),
        tags: [],
      },
      tiktok: {
        caption: cleanCaption.substring(0, 150),
        hashtags: [...hashtags, '#viral', '#trending'].slice(0, 10),
        tags: [],
      },
      facebook: {
        caption: cleanCaption,
        hashtags: hashtags.slice(0, 5),
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
      instagram: ['09:00', '13:00', '17:00', '20:00'],
      facebook: ['08:00', '12:00', '15:00', '19:00'],
      twitter: ['07:00', '12:00', '16:00', '21:00'],
      linkedin: ['08:00', '11:00', '14:00', '17:00'],
      tiktok: ['09:00', '12:00', '18:00', '22:00'],
      youtube: ['10:00', '14:00', '18:00', '21:00'],
    } as const;

    formData.platforms.forEach((platform) => {
      const times =
        platformTimes[platform as keyof typeof platformTimes] || ['12:00'];

      times.slice(0, 2).forEach((time, idx) => {
        const date = idx === 0 ? formatDate(now) : formatDate(tomorrow);
        const engagementScore = 80 + Math.floor(Math.random() * 20);

        const descriptions = {
          instagram: 'Peak engagement time for Instagram',
          facebook: 'Best time for Facebook reach',
          twitter: 'High Twitter activity period',
          linkedin: 'Professional hours for LinkedIn',
          tiktok: 'Trending time on TikTok',
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
          platform: formData.platforms[0] || 'instagram',
          platforms: ['youtube', 'instagram', 'twitter', 'linkedin', 'tiktok', 'facebook'],
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

          Object.entries(data.platformTimes).forEach(([plat, timeInfo]: any) => {
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
              description: timeInfo.reason || `AI-recommended time for ${plat}`,
            });
          });

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
      console.warn('Form submission only allowed from preview tab. Current tab:', activeTab);
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

    if (scheduleMode !== 'now' && (!formData.scheduledDate || !formData.scheduledTime)) {
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
              `Post saved but failed to publish. You can retry from dashboard.\n${publishData.error || ''}`,
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
        scheduledTime: new Date(Date.now() + 3600000).toISOString().slice(11, 16),
      });

      setPlatformContent({
        instagram: { caption: '', hashtags: [], tags: [] },
        youtube: {
          title: '',
          description: '',
          caption: '',
          hashtags: [],
          tags: [],
        },
        twitter: { caption: '', hashtags: [], tags: [] },
        linkedin: { caption: '', hashtags: [], tags: [] },
        tiktok: { caption: '', hashtags: [], tags: [] },
        facebook: { caption: '', hashtags: [], tags: [] },
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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-8 h-8 text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-300 text-lg mt-4 font-medium">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      {/* <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    StarlingPost
                  </div>
                  <div className="text-xs text-gray-400">AI Content Studio</div>
                </div>
              </Link>
              
              <div className="hidden md:flex items-center gap-6 ml-8">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Creating Content</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Users size={16} />
                  <span>{user.displayName || 'Creator'}</span>
                </div>
              </div>
            </div>

            <Link 
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav> */}

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-2">
                Create Content
              </h1>
              <p className="text-gray-400">Craft, optimize, and schedule posts across all platforms</p>
            </div>
            
            {/* <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800/50 border border-gray-700">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-gray-300">Auto-saving</span>
            </div> */}
          </div>

          {/* Progress Steps */}
          <div className="relative mb-8">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2" />
            <div className="relative flex justify-between">
              {[
                { id: 'content', label: 'Content', icon: <PenTool size={18} /> },
                { id: 'platforms', label: 'Platforms', icon: <Globe size={18} /> },
                { id: 'schedule', label: 'Schedule', icon: <CalendarIcon size={18} /> },
                { id: 'preview', label: 'Preview', icon: <Eye size={18} /> },
              ].map((step, index) => {
                const isActive = activeTab === step.id;
                const isCompleted = ['content', 'platforms', 'schedule', 'preview'].indexOf(activeTab) > index;
                
                return (
                  <div key={step.id} className="flex flex-col items-center relative z-10">
                    <button
                      onClick={() => setActiveTab(step.id as TabId)}
                      className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25' 
                          : isCompleted 
                            ? 'bg-emerald-500/20 border-2 border-emerald-500/50' 
                            : 'bg-gray-800 border-2 border-gray-700'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className={`${isActive ? 'text-white' : 'text-gray-400'}`}>
                          {step.icon}
                        </div>
                      )}
                    </button>
                    <span className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TAB 1: CONTENT */}
          {activeTab === 'content' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Media Upload */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Upload Media</h3>
                      <p className="text-sm text-gray-400">Images, videos, or GIFs</p>
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

                  {(formData.imageUrl || formData.videoUrl) && (
                    <div className="mt-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-300">Uploaded Files</h4>
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="space-y-2">
                        {formData.imageUrl && (
                          <div className="flex items-center gap-2 text-xs text-cyan-400 truncate">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span>Image uploaded</span>
                          </div>
                        )}
                        {formData.videoUrl && (
                          <div className="flex items-center gap-2 text-xs text-purple-400 truncate">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span>Video uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Tips */}
                <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Zap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="font-bold text-cyan-300">Pro Tips</h4>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                      <span>Use emojis to increase engagement by 47%</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                      <span>3-5 hashtags work best for Instagram</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5" />
                      <span>Include a call-to-action in your caption</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column - Caption Editor */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Content Editor</h3>
                        <p className="text-sm text-gray-400">Write your main caption</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAiEnhance}
                      disabled={aiEnhancing || !formData.mainCaption}
                      className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center gap-2"
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
                      placeholder="What's on your mind? Write your caption here and watch it transform for each platform..."
                      value={formData.mainCaption}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          mainCaption: e.target.value,
                        }));
                        setCharacterCount(e.target.value.length);
                      }}
                      className="w-full px-4 py-4 rounded-xl bg-gray-900/50 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500 min-h-64 resize-none focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                    
                    {/* Character counter */}
                    <div className="absolute bottom-3 right-3">
                      <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        characterCount > 2000 
                          ? 'bg-red-500/20 text-red-400' 
                          : characterCount > 1500 
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {characterCount}/2800
                      </div>
                    </div>
                  </div>

                  {/* Hashtag suggestions */}
                  {formData.mainCaption.includes('#') && (
                    <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold text-gray-300">Hashtag Preview</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(formData.mainCaption.match(/#[\w]+/g) || [])
                          .slice(0, 8)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-cyan-500/10 text-cyan-300 rounded-full text-sm font-medium hover:bg-cyan-500/20 transition-colors cursor-pointer"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-6 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const text = formData.mainCaption;
                        setFormData(prev => ({
                          ...prev,
                          mainCaption: text + ' 🚀'
                        }));
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                    >
                      <span>🚀</span>
                      <span>Add Emoji</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = formData.mainCaption;
                        setFormData(prev => ({
                          ...prev,
                          mainCaption: text + ' #viral'
                        }));
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                    >
                      <Hash className="w-4 h-4" />
                      <span>Add Hashtag</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const text = formData.mainCaption;
                        setFormData(prev => ({
                          ...prev,
                          mainCaption: text + ' 👉 Like & Follow!'
                        }));
                      }}
                      className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors text-sm flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      <span>Add CTA</span>
                    </button>
                  </div>
                </div>

                {/* Platform Preview */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
                      <Eye className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Quick Preview</h3>
                      <p className="text-sm text-gray-400">How your content will look</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {['instagram', 'twitter', 'linkedin'].map((platform) => (
                      <div
                        key={platform}
                        className="bg-gray-900/50 rounded-xl p-4 border border-gray-700 hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          {platformIcons[platform]}
                          <span className="text-sm font-semibold text-gray-300 capitalize">
                            {platform}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-3">
                          {formData.mainCaption.substring(0, 80) || 'Start typing...'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Comparison Modal */}
          {showAiComparison && aiSuggestions && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">AI Enhancement Results</h3>
                        <p className="text-gray-300">Compare and choose the best version</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAiComparison(false)}
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6">
                  <div className="border-2 border-gray-700 rounded-xl p-5 bg-gray-900/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-300">Original Version</h4>
                      <span className="text-sm px-2 py-1 bg-gray-800 rounded-lg text-gray-400">
                        {formData.mainCaption.length} chars
                      </span>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap text-gray-300">
                      {formData.mainCaption}
                    </div>
                  </div>

                  <div className="border-2 border-cyan-500 rounded-xl p-5 bg-cyan-500/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-cyan-400">AI Enhanced</h4>
                        <div className="px-2 py-1 bg-cyan-500/20 rounded-lg text-xs text-cyan-300">
                          +{aiSuggestions.engagementBoost || 47}% Engagement
                        </div>
                      </div>
                      <span className="text-sm px-2 py-1 bg-cyan-500/20 rounded-lg text-cyan-400">
                        {aiSuggestions.enhancedCaption.length} chars
                      </span>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap text-gray-300">
                      {aiSuggestions.enhancedCaption}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-800 bg-gray-900/30">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-semibold text-gray-300">Suggested Hashtags</h4>
                      </div>
                      <div className="text-sm text-gray-300">
                        {aiSuggestions.hashtags}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-semibold text-gray-300">Best Time</h4>
                      </div>
                      <div className="text-sm text-gray-300">
                        {aiSuggestions.bestTime}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-semibold text-gray-300">Engagement Score</h4>
                      </div>
                      <div className="text-lg font-bold text-emerald-400">
                        {aiSuggestions.engagementScore || 92}/100
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={applyAiSuggestion}
                      className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center gap-3"
                    >
                      <CheckCircle size={20} />
                      Use AI Version
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAiComparison(false)}
                      className="flex-1 px-6 py-3.5 rounded-xl bg-gray-800 border-2 border-gray-700 text-gray-300 font-semibold hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      Keep Original
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLATFORMS */}
          {activeTab === 'platforms' && (
            <div className="space-y-8">
              {/* Platform Selection */}
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    <Globe className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Select Platforms</h3>
                    <p className="text-gray-400">Choose where to publish your content</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'instagram', name: 'Instagram', color: 'from-pink-500 to-purple-600', stats: '1.4B users' },
                    { id: 'youtube', name: 'YouTube', color: 'from-red-500 to-red-700', stats: '2.7B users' },
                    { id: 'twitter', name: 'Twitter/X', color: 'from-blue-400 to-blue-600', stats: '550M users' },
                    { id: 'linkedin', name: 'LinkedIn', color: 'from-blue-600 to-blue-800', stats: '950M users' },
                    { id: 'tiktok', name: 'TikTok', color: 'from-black to-gray-800', stats: '1.9B users' },
                    { id: 'facebook', name: 'Facebook', color: 'from-blue-500 to-blue-700', stats: '3B users' },
                  ].map((platform) => {
                    const isSelected = formData.platforms.includes(platform.id);
                    
                    return (
                      <div
                        key={platform.id}
                        onClick={() => togglePlatform(platform.id)}
                        className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                          isSelected
                            ? `border-transparent bg-gradient-to-br ${platform.color}`
                            : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl ${
                            isSelected ? 'bg-white/20' : 'bg-gray-800'
                          }`}>
                            {platformIcons[platform.id]}
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-white' : 'border-gray-600'
                          }`}>
                            {isSelected && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        <h4 className={`text-lg font-bold mb-2 ${
                          isSelected ? 'text-white' : 'text-gray-300'
                        }`}>
                          {platform.name}
                        </h4>
                        
                        <p className={`text-sm ${
                          isSelected ? 'text-white/80' : 'text-gray-400'
                        }`}>
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

                <div className="mt-8 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-sm text-gray-300">
                      {formData.platforms.length} platform{formData.platforms.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                </div>
              </div>

              {/* Platform-Specific Content */}
              {formData.platforms.map((platform) => (
                <div
                  key={platform}
                  className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className={`p-3 rounded-xl ${
                      platform === 'instagram' ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20' :
                      platform === 'youtube' ? 'bg-gradient-to-r from-red-500/20 to-red-700/20' :
                      platform === 'twitter' ? 'bg-gradient-to-r from-blue-400/20 to-blue-600/20' :
                      'bg-gradient-to-r from-blue-600/20 to-blue-800/20'
                    }`}>
                      {platformIcons[platform]}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white capitalize">{platform} Content</h3>
                      <p className="text-gray-400">Optimized specifically for {platform}</p>
                    </div>
                  </div>

                  {platform === 'youtube' ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Video Title
                          </label>
                          <input
                            type="text"
                            value={platformContent.youtube.title}
                            onChange={(e) =>
                              updatePlatformContent('youtube', 'title', e.target.value)
                            }
                            maxLength={100}
                            className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500"
                            placeholder="Catchy title for maximum clicks"
                          />
                          <div className="mt-1 text-xs text-gray-400 text-right">
                            {(platformContent.youtube?.title?.length ?? 0)}/100

                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Tags
                          </label>
                          <input
                            type="text"
                            value={platformContent.youtube.tags?.join(', ') || ''}
                            onChange={(e) =>
                              updatePlatformContent(
                                'youtube',
                                'tags',
                                e.target.value.split(',').map((t) => t.trim()),
                              )
                            }
                            className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500"
                            placeholder="coding, tech, tutorial, development"
                          />
                          <div className="mt-1 text-xs text-gray-400">
                            Comma separated tags for SEO
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={platformContent.youtube.description}
                          onChange={(e) =>
                            updatePlatformContent('youtube', 'description', e.target.value)
                          }
                          rows={8}
                          className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500 resize-none"
                          placeholder="Detailed description with timestamps, links, and calls to action"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          Caption
                        </label>
                        <textarea
                          value={
                            platformContent[platform as keyof PlatformSettings]?.caption ||
                            ''
                          }
                          onChange={(e) =>
                            updatePlatformContent(
                              platform as keyof PlatformSettings,
                              'caption',
                              e.target.value,
                            )
                          }
                          rows={6}
                          className="w-full px-4 py-3 rounded-lg bg-gray-900/50 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white placeholder-gray-500 resize-none"
                          placeholder={`Write your ${platform} caption...`}
                        />
                      </div>
                      
                      {platformContent[platform as keyof PlatformSettings]?.hashtags
                        ?.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Hashtags
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {platformContent[platform as keyof PlatformSettings]?.hashtags?.map(
                              (tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-cyan-500/10 text-cyan-300 rounded-full text-sm font-medium hover:bg-cyan-500/20 transition-colors cursor-pointer"
                                >
                                  {tag}
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Platform-specific tips */}
                  <div className="mt-6 p-4 bg-gray-900/30 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-semibold text-amber-400">{platform} Tips</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {platform === 'instagram' && 'Use 3-5 relevant hashtags, include a location tag, and post during peak hours (5-6 PM).'}
                      {platform === 'twitter' && 'Keep it under 280 characters, use 1-2 hashtags, and tag relevant accounts for better reach.'}
                      {platform === 'linkedin' && 'Professional tone works best. Share insights and ask thought-provoking questions.'}
                      {platform === 'tiktok' && 'Use trending sounds and hashtags. Keep captions short and engaging.'}
                      {platform === 'facebook' && 'Ask questions to encourage comments. Post during evening hours for best engagement.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-8">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20">
                    <CalendarIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Schedule Your Post</h3>
                    <p className="text-gray-400">Choose when to publish your content</p>
                  </div>
                </div>

                {/* Schedule Options */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {/* Publish Now */}
                  <div
                    onClick={() => setScheduleMode('now')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      scheduleMode === 'now'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${
                        scheduleMode === 'now'
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <h4 className="text-lg font-bold text-white">Publish Now</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Post immediately to all selected platforms
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        scheduleMode === 'now' ? 'text-cyan-400' : 'text-gray-500'
                      }`}>
                        Instant Delivery
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        scheduleMode === 'now' ? 'border-cyan-500' : 'border-gray-600'
                      }`}>
                        {scheduleMode === 'now' && (
                          <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Recommended */}
                  <div
                    onClick={() => {
                      setScheduleMode('ai');
                      setShowPremiumModal(true);
                    }}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      scheduleMode === 'ai'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${
                        scheduleMode === 'ai'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white">AI Recommended</h4>
                        <span className="px-2 py-1 bg-purple-500/20 rounded-lg text-xs text-purple-300">
                          Pro
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Best times for maximum engagement
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        scheduleMode === 'ai' ? 'text-purple-400' : 'text-gray-500'
                      }`}>
                        Smart Timing
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        scheduleMode === 'ai' ? 'border-purple-500' : 'border-gray-600'
                      }`}>
                        {scheduleMode === 'ai' && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom Time */}
                  <div
                    onClick={() => setScheduleMode('custom')}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      scheduleMode === 'custom'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${
                        scheduleMode === 'custom'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        <Settings className="w-5 h-5" />
                      </div>
                      <h4 className="text-lg font-bold text-white">Custom Time</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Set your own date and time
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        scheduleMode === 'custom' ? 'text-blue-400' : 'text-gray-500'
                      }`}>
                        Manual Schedule
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        scheduleMode === 'custom' ? 'border-blue-500' : 'border-gray-600'
                      }`}>
                        {scheduleMode === 'custom' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Time Inputs */}
                {scheduleMode === 'custom' && (
                  <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-6">Set Date & Time</h4>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
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
                          className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white"
                          required={scheduleMode === 'custom'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
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
                          className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white"
                          required={scheduleMode === 'custom'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Summary */}
                {(scheduleMode === 'custom' || scheduleMode === 'ai') &&
                  formData.scheduledDate &&
                  formData.scheduledTime && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-cyan-300 mb-1">Selected Schedule</div>
                          <div className="text-2xl font-bold text-white">
                            {formatTimeDisplay(
                              formData.scheduledDate,
                              formData.scheduledTime,
                            )}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-cyan-500/20">
                          <CalendarIcon className="w-8 h-8 text-cyan-400" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                        <Bell className="w-4 h-4" />
                        <span>You'll receive a notification before posting</span>
                      </div>
                    </div>
                  )}

                {/* AI Timeslots Preview */}
                {scheduleMode === 'ai' && aiTimeSlots.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-bold text-white mb-4">Recommended Times</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiTimeSlots.slice(0, 3).map((slot, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gray-900/50 rounded-xl border border-gray-700 hover:border-cyan-500/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {platformIcons[slot.platform]}
                              <span className="text-sm font-semibold text-gray-300 capitalize">
                                {slot.platform}
                              </span>
                            </div>
                            <div className="px-2 py-1 bg-emerald-500/20 rounded-lg text-xs font-semibold text-emerald-400">
                              {slot.engagementScore}/100
                            </div>
                          </div>
                          <div className="text-lg font-bold text-white mb-2">
                            {formatTimeDisplay(slot.date, slot.time)}
                          </div>
                          <p className="text-sm text-gray-400">{slot.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-8">
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
                    <Eye className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Final Preview</h3>
                    <p className="text-gray-400">Review your content before publishing</p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Platforms</div>
                    <div className="text-2xl font-bold text-white">
                      {formData.platforms.length}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Schedule</div>
                    <div className="text-lg font-bold text-white">
                      {scheduleMode === 'now' ? 'Immediate' : 'Scheduled'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Characters</div>
                    <div className="text-2xl font-bold text-white">
                      {formData.mainCaption.length}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                    <div className="text-sm text-gray-400 mb-1">Media</div>
                    <div className="text-lg font-bold text-white">
                      {(formData.imageUrl ? 1 : 0) + (formData.videoUrl ? 1 : 0)}
                    </div>
                  </div>
                </div>

                {/* Platform Previews */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formData.platforms.map((platform) => (
                    <div
                      key={platform}
                      className="bg-gray-900/50 rounded-2xl border border-gray-700 overflow-hidden hover:border-cyan-500/50 transition-colors"
                    >
                      <div className={`p-4 ${
                        platform === 'instagram' ? 'bg-gradient-to-r from-pink-500 to-purple-600' :
                        platform === 'youtube' ? 'bg-gradient-to-r from-red-500 to-red-700' :
                        platform === 'twitter' ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                        'bg-gradient-to-r from-blue-600 to-blue-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          {platformIcons[platform]}
                          <span className="font-bold text-white capitalize">{platform}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        {/* Media Preview */}
                        {(formData.imageUrl || formData.videoUrl) && (
                          <div className="mb-4 rounded-lg overflow-hidden bg-gray-800">
                            {formData.imageUrl ? (
                              <img
                                src={formData.imageUrl}
                                alt="Preview"
                                className="w-full h-40 object-cover"
                              />
                            ) : formData.videoUrl ? (
                              <div className="w-full h-40 bg-gray-800 flex items-center justify-center">
                                <div className="text-center">
                                  <Video className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                  <span className="text-sm text-gray-500">Video Preview</span>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {/* Content Preview */}
                        {platform === 'youtube' ? (
                          <>
                            <div className="font-bold text-sm mb-2 text-white line-clamp-2">
                              {platformContent.youtube.title || 'Untitled Video'}
                            </div>
                            <div className="text-xs text-gray-400 line-clamp-3">
                              {platformContent.youtube.description}
                            </div>
                            {platformContent.youtube.tags && platformContent.youtube.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {platformContent.youtube.tags.slice(0, 3).map((tag, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-6 mb-3">
                              {platformContent[platform as keyof PlatformSettings]?.caption}
                            </div>
                            {platformContent[platform as keyof PlatformSettings]?.hashtags
                              ?.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {platformContent[platform as keyof PlatformSettings]?.hashtags
                                    ?.slice(0, 5)
                                    .map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="text-xs text-cyan-400"
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
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                      <Globe className="w-10 h-10 text-gray-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-300 mb-2">No Platforms Selected</h4>
                    <p className="text-gray-400">Go back and select at least one platform to publish to</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {activeTab !== 'content' && (
              <button
                type="button"
                onClick={() => {
                  const tabs: TabId[] = ['content', 'platforms', 'schedule', 'preview'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex - 1] as TabId);
                }}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                Previous
              </button>
            )}

            {activeTab !== 'preview' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const tabs: TabId[] = ['content', 'platforms', 'schedule', 'preview'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex + 1] as TabId);
                }}
                className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || formData.platforms.length === 0}
                className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : scheduleMode === 'now' ? (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Publish to {formData.platforms.length} Platform{formData.platforms.length !== 1 ? 's' : ''}</span>
                  </>
                ) : (
                  <>
                    <CalendarIcon className="w-5 h-5" />
                    <span>Schedule for {formData.platforms.length} Platform{formData.platforms.length !== 1 ? 's' : ''}</span>
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

// Helper component for video icon (missing in imports)
const Video = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);