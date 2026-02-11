'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import YouTubeAnalyticsDashboard from '@/components/YouTube/YouTubeAnalyticsDashboard';
import { ChannelStats } from '@/types/youtube-analytics';

export default function YouTubeAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelStats, setChannelStats] = useState<ChannelStats | null>(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch YouTube channel stats
  useEffect(() => {
    if (!user?.uid) return;

    const fetchChannelStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/youtube/channel-info?userId=${user.uid}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch channel info');
        }

        const data = await response.json();

        // Transform API response to ChannelStats format
        setChannelStats({
          subscribers: data.subscribers || 0,
          subscriberChange: 12.5, // This should come from your API
          videos: data.videoCount || 0,
          videoChange: 2,
          totalViews: data.viewCount || 0,
          viewChange: 8.3,
          watchTime: 1250,
          watchTimeChange: 15.2,
        });
      } catch (err: any) {
        console.error('Failed to fetch channel stats:', err);
        setError(err.message || 'Failed to load channel statistics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChannelStats();
  }, [user?.uid]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="w-20 h-20 border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 text-purple-400 animate-pulse">▶️</div>
            </div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading YouTube Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">YouTube Analytics</h1>
              <p className="text-gray-600 mt-1">Track your YouTube channel performance</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <YouTubeAnalyticsDashboard />
      </div>
    </div>
  );
}
