'use client';

import FileUpload from '@/components/FileUpload';
import { useAuth } from '@/context/AuthContext';
import { authFetch } from '@/lib/authClient';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export default function CreatePostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('now');
  const [activeTab, setActiveTab] = useState<TabId>('content');
  const [aiTimeSlots, setAiTimeSlots] = useState<AiTimeSlot[]>([]);

  const [formData, setFormData] = useState({
    mainCaption: '',
    platforms: [] as string[],
    imageUrl: '',
    videoUrl: '',
    scheduledDate: '',
    scheduledTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
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

  // Note: AI time slots are now fetched from handleAiEnhance() 
  // when user enhances the caption, not from a separate endpoint
  // Auto-generate default times when AI mode is selected
  useEffect(() => {
    if (scheduleMode === 'ai' && aiTimeSlots.length === 0 && formData.platforms.length > 0) {
      generateDefaultTimeSlots();
    }
  }, [scheduleMode, formData.platforms]);

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
    // Fallback: Generate default time slots if AI enhancement hasn't been used
    const slots: AiTimeSlot[] = [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Default platform-specific best times
    const platformTimes = {
      instagram: ['09:00', '13:00', '17:00', '20:00'],
      facebook: ['08:00', '12:00', '15:00', '19:00'],
      twitter: ['07:00', '12:00', '16:00', '21:00'],
      linkedin: ['08:00', '11:00', '14:00', '17:00'],
      tiktok: ['09:00', '12:00', '18:00', '22:00'],
      youtube: ['10:00', '14:00', '18:00', '21:00'],
    };

    formData.platforms.forEach((platform) => {
      const times = platformTimes[platform as keyof typeof platformTimes] || ['12:00'];

      // Create 2 slots per platform
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
        };

        slots.push({
          platform,
          time,
          date,
          engagementScore,
          description: descriptions[platform as keyof typeof descriptions] || 'Recommended time',
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

  const selectAiTimeSlot = (slot: AiTimeSlot) => {
    setFormData((prev) => ({
      ...prev,
      scheduledDate: slot.date,
      scheduledTime: slot.time,
    }));
  };
  const getDateForWeekday = (weekday: string): string => {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    const targetIndex = weekdays.indexOf(weekday.toLowerCase());
    if (targetIndex === -1) {
      // Fallback: today
      return new Date().toISOString().split('T')[0];
    }

    const now = new Date();
    const todayIndex = now.getDay(); // 0-6

    let diff = targetIndex - todayIndex;
    if (diff < 0) diff += 7; // next occurrence of that weekday

    const result = new Date(now);
    result.setDate(result.getDate() + diff);
    return result.toISOString().split('T')[0];
  };

  // =========================
  // AI ENHANCEMENT HANDLERS
  // =========================

  const handleAiEnhance = async () => {
    const baseCaption = formData.mainCaption;

    if (!baseCaption || baseCaption.trim() === '') {
      alert('Please write a caption first!');
      return;
    }

    setAiEnhancing(true);

    try {
      console.log('🚀 Calling AI Enhancement API...');

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
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('✅ API Response:', data);

      if (data.success) {
        setAiSuggestions(data);
        setShowAiComparison(true);

        // Extract platformTimes from AI response and convert to AiTimeSlot format
        if (data.platformTimes) {
          const now = new Date();
          const today = now.toISOString().split('T')[0];
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split('T')[0];

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
      console.error('❌ AI Error:', error);
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
    setActiveTab('platforms'); // jump to platforms to review
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only allow submission from preview tab
    if (activeTab !== 'preview') {
      console.warn('⚠️ Form submission only allowed from preview tab. Current tab:', activeTab);
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        router.push('/login');
        return;
      }

      if (!formData.mainCaption.trim()) {
        alert('Please write a caption');
        setLoading(false);
        return;
      }

      if (formData.platforms.length === 0) {
        alert('Please select at least one platform');
        setLoading(false);
        return;
      }

      if (scheduleMode !== 'now' && (!formData.scheduledDate || !formData.scheduledTime)) {
        alert('Please set a schedule time');
        setLoading(false);
        return;
      }

      const postsRef = collection(db, 'posts');
      const postDocRef = await addDoc(postsRef, {
        userId: user.uid,
        caption: formData.mainCaption,
        platforms: formData.platforms,
        platformContent: platformContent,
        imageUrl: formData.imageUrl || null,
        videoUrl: formData.videoUrl || null,
        scheduledTime: scheduleMode === 'now'
          ? new Date()
          : new Date(`${formData.scheduledDate}T${formData.scheduledTime}`),
        status: scheduleMode === 'now' ? 'publishing' : 'scheduled',
        scheduleMode: scheduleMode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // If publishing immediately, call the publish API
      if (scheduleMode === 'now') {
        try {
          console.log('Publishing post to platforms...', {
            postId: postDocRef.id,
            platforms: formData.platforms,
          });

          const publishResponse = await authFetch('/api/posts/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postId: postDocRef.id,
              userId: user.uid, // important for all social publishers
              platforms: formData.platforms,
              caption: formData.mainCaption,
              imageUrl: formData.imageUrl || null,
              videoUrl: formData.videoUrl || null,
              platformContent: platformContent,
            }),
          });

          const publishData = await publishResponse.json();
          console.log('Publish response:', publishData);

          if (!publishResponse.ok) {
            alert(
              `Warning: Some platforms may have failed to publish:\n${publishData.error}`,
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
      }

      setFormData({
        mainCaption: '',
        platforms: [],
        imageUrl: '',
        videoUrl: '',
        scheduledDate: '',
        scheduledTime: new Date(Date.now() + 3600000)
          .toISOString()
          .slice(0, 16),
      });

      if (scheduleMode !== 'now') {
        alert('Post scheduled successfully!');
      }
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 sticky top-0 z-40 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="text-3xl">🚀</div>
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              PostPilot
            </span>
          </Link>
          <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Create New Post</h2>
          <p className="text-gray-400">AI-powered multi-platform content creation</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 mb-6 sticky top-20 z-30">
          <div className="flex border-b border-gray-800">
            {[
              { id: 'content', label: 'Content', icon: '📝' },
              { id: 'platforms', label: 'Platforms', icon: '📣' },
              { id: 'schedule', label: 'Schedule', icon: '⏰' },
              { id: 'preview', label: 'Preview', icon: '👀' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`flex-1 px-6 py-4 font-semibold transition ${activeTab === tab.id
                  ? 'border-b-2 border-cyan-500 text-cyan-400'
                  : 'text-gray-400 hover:text-white'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* TAB 1: CONTENT */}
          {activeTab === 'content' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Media Upload */}
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <label className="block text-sm font-semibold mb-4">Upload Media</label>
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
                </div>

                {/* Current Files */}
                {(formData.imageUrl || formData.videoUrl) && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold mb-4">Uploaded Files</h3>
                    {formData.imageUrl && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-400 mb-2">Image:</p>
                        <p className="text-xs text-cyan-400 break-all truncate">{formData.imageUrl}</p>
                      </div>
                    )}
                    {formData.videoUrl && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Video:</p>
                        <p className="text-xs text-cyan-400 break-all truncate">{formData.videoUrl}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caption + AI */}
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold">Main Caption</label>
                    {/* <button
                      type="button"
                      onClick={handleAiEnhance}
                      disabled={aiEnhancing || !formData.mainCaption}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiEnhancing ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Enhancing...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Enhance with AI</span>
                        </>
                      )}
                    </button> */}
                    <button
                      type="button"
                      onClick={() =>
                        alert('AI caption recommendations are part of the premium plan. You will be notified when it is available.')
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg font-medium cursor-not-allowed"
                    >
                      <span>✨ AI Enhance (Premium)</span>
                    </button>


                  </div>
                  <textarea
                    placeholder="Write your caption here... (will auto-optimize for each platform)"
                    value={formData.mainCaption}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        mainCaption: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none transition text-white placeholder-gray-500 min-h-48 resize-none"
                  />
                  <p className="text-gray-400 text-sm mt-2">{formData.mainCaption.length} characters</p>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🤖</span>
                    <h3 className="font-semibold text-cyan-300">AI Optimization</h3>
                  </div>
                  <p className="text-sm text-gray-300">
                    PostPilot automatically adapts your content for each platform:
                  </p>
                  <ul className="text-sm text-gray-400 mt-3 space-y-2">
                    <li>📸 Instagram - Visual captions with emojis & hashtags</li>
                    <li>🎥 YouTube - SEO-optimized titles & descriptions</li>
                    <li>🐦 Twitter - Concise 280-char posts</li>
                    <li>💼 LinkedIn - Professional tone & hashtags</li>
                    <li>📱 TikTok - Trending hashtags & captions</li>
                  </ul>
                </div>

                {/* AI Comparison Modal */}
                {showAiComparison && aiSuggestions && (
                  <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-cyan-500 to-purple-600">
                        <h3 className="text-2xl font-bold text-white">AI Enhancement Results</h3>
                        <p className="text-gray-200 mt-1">Compare and choose the best version</p>
                      </div>

                      <div className="p-6 grid md:grid-cols-2 gap-6">
                        {/* Original */}
                        <div className="border-2 border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-300">Original</h4>
                            <span className="text-sm text-gray-500">
                              {formData.mainCaption.length} chars
                            </span>
                          </div>
                          <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap text-gray-300">
                            {formData.mainCaption}
                          </div>
                        </div>

                        {/* AI Enhanced */}
                        <div className="border-2 border-cyan-500 rounded-lg p-4 bg-cyan-500/5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-cyan-400">AI Enhanced</h4>
                            <span className="text-sm text-cyan-400">
                              {aiSuggestions.enhancedLength || aiSuggestions.enhancedCaption.length} chars
                            </span>
                          </div>
                          <div className="bg-gray-800 p-4 rounded-lg min-h-[200px] whitespace-pre-wrap text-gray-300">
                            {aiSuggestions.enhancedCaption}
                          </div>
                        </div>
                      </div>

                      {/* Hashtags */}
                      <div className="px-6 pb-4">
                        <h4 className="font-semibold text-gray-300 mb-2">Suggested Hashtags</h4>
                        <div className="bg-gray-800 p-4 rounded-lg text-gray-300">
                          {aiSuggestions.hashtags}
                        </div>
                      </div>

                      {/* Best time */}
                      <div className="px-6 pb-4">
                        <h4 className="font-semibold text-gray-300 mb-2">Best Time To Post</h4>
                        <div className="bg-gray-800 p-4 rounded-lg text-gray-300">
                          {aiSuggestions.bestTime}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-6 border-t border-gray-800 bg-gray-800/50 flex gap-3">
                        <button
                          type="button"
                          onClick={applyAiSuggestion}
                          className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-purple-500 transition"
                        >
                          Use AI Version
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAiComparison(false)}
                          className="flex-1 px-6 py-3 bg-gray-800 border-2 border-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition"
                        >
                          Keep Original
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PLATFORMS */}
          {activeTab === 'platforms' && (
            <div className="space-y-6">
              {/* Select Platforms */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <label className="block text-sm font-semibold mb-4">Select Platforms</label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { id: 'instagram', name: 'Instagram', icon: '📸', disabled: false },
                    { id: 'youtube', name: 'YouTube', icon: '🎥', disabled: false },
                    { id: 'twitter', name: 'Twitter/X', icon: '🐦', disabled: false },
                    { id: 'linkedin', name: 'LinkedIn', icon: '💼', disabled: true },
                    { id: 'tiktok', name: 'TikTok', icon: '📱', disabled: true },
                    { id: 'facebook', name: 'Facebook', icon: '👍', disabled: true },
                  ].map((platform) => (
                    <label
                      key={platform.id}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${formData.platforms.includes(platform.id)
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(platform.id)}
                        onChange={() => togglePlatform(platform.id)}
                        className="w-4 h-4 rounded accent-cyan-500"
                        disabled={platform.disabled}
                      />
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="text-gray-300">{platform.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Platform-specific editors */}
              {formData.platforms.map((platform) => (
                <div key={platform} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">
                      {{
                        instagram: '📸',
                        youtube: '🎥',
                        twitter: '🐦',
                        linkedin: '💼',
                        tiktok: '📱',
                        facebook: '👍',
                      }[platform]}
                    </span>
                    <h3 className="text-lg font-bold capitalize">{platform} Content</h3>
                  </div>

                  {platform === 'youtube' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Video Title (max 100 chars)
                        </label>
                        <input
                          type="text"
                          value={platformContent.youtube.title}
                          onChange={(e) =>
                            updatePlatformContent('youtube', 'title', e.target.value)
                          }
                          maxLength={100}
                          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={platformContent.youtube.description}
                          onChange={(e) =>
                            updatePlatformContent('youtube', 'description', e.target.value)
                          }
                          rows={4}
                          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tags (comma separated)
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
                          placeholder="coding, tech, tutorial"
                          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Caption
                        </label>
                        <textarea
                          value={
                            platformContent[platform as keyof PlatformSettings]?.caption || ''
                          }
                          onChange={(e) =>
                            updatePlatformContent(
                              platform as keyof PlatformSettings,
                              'caption',
                              e.target.value,
                            )
                          }
                          rows={6}
                          className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white resize-none"
                        />
                      </div>
                      {platformContent[platform as keyof PlatformSettings]?.hashtags?.length >
                        0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Hashtags
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {platformContent[platform as keyof PlatformSettings]?.hashtags?.map(
                                (tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm"
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
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              {/* Schedule Mode Selection */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Schedule Options</h3>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {/* Publish Now */}
                  <label className={`cursor-pointer p-4 border-2 rounded-lg transition ${scheduleMode === 'now' ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === 'now'}
                      onChange={() => setScheduleMode('now')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${scheduleMode === 'now' ? 'border-cyan-500' : 'border-gray-600'}`}>
                        {scheduleMode === 'now' && <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>}
                      </div>
                      <span className="text-lg font-semibold">Publish Now</span>
                    </div>
                    <p className="text-sm text-gray-400">Post immediately to all selected platforms</p>
                  </label>

                  {/* AI Recommended */}
                  <label className={`cursor-pointer p-4 border-2 rounded-lg transition ${scheduleMode === 'ai' ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === 'ai'}
                      onChange={() => setScheduleMode('ai')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${scheduleMode === 'ai' ? 'border-cyan-500' : 'border-gray-600'}`}>
                        {scheduleMode === 'ai' && <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>}
                      </div>
                      <span className="text-lg font-semibold">AI Recommended</span>
                    </div>
                    <p className="text-sm text-gray-400">Best times for maximum engagement</p>
                  </label>

                  {/* Custom Time */}
                  <label className={`cursor-pointer p-4 border-2 rounded-lg transition ${scheduleMode === 'custom' ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 hover:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="scheduleMode"
                      checked={scheduleMode === 'custom'}
                      onChange={() => setScheduleMode('custom')}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${scheduleMode === 'custom' ? 'border-cyan-500' : 'border-gray-600'}`}>
                        {scheduleMode === 'custom' && <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>}
                      </div>
                      <span className="text-lg font-semibold">Custom Time</span>
                    </div>
                    <p className="text-sm text-gray-400">Set your own date and time</p>
                  </label>
                </div>

                {/* AI Recommended Slots */}
                {/* if scheduleMode === 'ai' show premium upsell instead of real feature */}
                {scheduleMode === 'ai' && (
                  <div className="mt-4 p-4 bg-gray-900 border border-gray-800 rounded-xl text-sm text-gray-300">
                    AI recommended posting times are part of the premium plan.
                    <button
                      type="button"
                      className="mt-3 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-semibold"
                      onClick={() => alert('Premium plan coming soon. You will be notified when it is available.')}
                    >
                      Upgrade to unlock (coming soon)
                    </button>
                  </div>
                )}


                {/* Custom Time Input */}
                {scheduleMode === 'custom' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            scheduledDate: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white"
                        required={scheduleMode === 'custom'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                      <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            scheduledTime: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500 focus:outline-none text-white"
                        required={scheduleMode === 'custom'}
                      />
                    </div>
                  </div>
                )}

                {/* Selected Time Display */}
                {(scheduleMode === 'ai' || scheduleMode === 'custom') && formData.scheduledDate && formData.scheduledTime && (
                  <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-cyan-300 mb-1">Selected Schedule</div>
                        <div className="text-lg font-semibold text-white">
                          {formatTimeDisplay(formData.scheduledDate, formData.scheduledTime)}
                        </div>
                      </div>
                      <div className="text-cyan-400 text-2xl">⏰</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {formData.platforms.map((platform) => (
                <div key={platform} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {{
                          instagram: '📸',
                          youtube: '🎥',
                          twitter: '🐦',
                          linkedin: '💼',
                          tiktok: '📱',
                          facebook: '👍',
                        }[platform]}
                      </span>
                      <span className="font-bold capitalize">{platform}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    {(formData.imageUrl || formData.videoUrl) && (
                      <div className="bg-gray-800 rounded-lg mb-3 aspect-square flex items-center justify-center overflow-hidden">
                        {formData.imageUrl ? (
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : formData.videoUrl ? (
                          <video
                            src={formData.videoUrl}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    )}

                    {platform === 'youtube' ? (
                      <>
                        <div className="font-bold text-sm mb-2 text-white">
                          {platformContent.youtube.title || 'Untitled'}
                        </div>
                        <div className="text-xs text-gray-400 line-clamp-3">
                          {platformContent.youtube.description}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-6">
                          {platformContent[platform as keyof PlatformSettings]?.caption}
                        </div>
                        {platformContent[platform as keyof PlatformSettings]?.hashtags?.length >
                          0 && (
                            <div className="mt-2 text-cyan-400 text-xs">
                              {platformContent[platform as keyof PlatformSettings]?.hashtags?.join(
                                ' ',
                              )}
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ))}

              {formData.platforms.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-5xl mb-4">👀</div>
                  <p className="text-gray-400">Select platforms to see preview</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            {activeTab !== 'content' && (
              <button
                type="button"
                onClick={() => {
                  const tabs: TabId[] = ['content', 'platforms', 'schedule', 'preview'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex - 1] as TabId);
                }}
                className="px-8 py-4 bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 rounded-lg font-semibold transition"
              >
                Previous
              </button>
            )}

            {activeTab !== 'preview' ? (
              // IMPORTANT: keep this as type="button" and also stop propagation
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();          // <- ensure no submit
                  e.stopPropagation();         // <- extra safety
                  const tabs: TabId[] = ['content', 'platforms', 'schedule', 'preview'];
                  const currentIndex = tabs.indexOf(activeTab);
                  setActiveTab(tabs[currentIndex + 1] as TabId);
                }}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 px-8 py-4 rounded-lg font-semibold transition"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || formData.platforms.length === 0}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-4 rounded-lg font-bold text-lg transition"
              >
                {loading
                  ? 'Processing...'
                  : scheduleMode === 'now'
                    ? `Publish to ${formData.platforms.length} Platform${formData.platforms.length !== 1 ? 's' : ''}`
                    : `Schedule to ${formData.platforms.length} Platform${formData.platforms.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}