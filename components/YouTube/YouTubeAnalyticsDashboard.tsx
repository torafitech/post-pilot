// components/YouTubeAnalyticsDashboard.tsx
import React, { useState } from 'react';
import { 
  BarChart3, 
  Video as VideoIcon, 
  Eye, 
  Users,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import DetailedAnalytics from './DetailedAnalytics';
import VideoList from './VideoList';
import { ChannelStats, PerformanceData, VideoData, AnalyticsPeriod } from '../../types/youtube-analytics';

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, color }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`w-6 h-6 ${colorClasses[color].text}`} />
        </div>
        <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? (
            <TrendingUp className="inline w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="inline w-4 h-4 mr-1" />
          )}
          {Math.abs(change)}%
        </span>
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</h3>
      <p className="text-gray-600 mt-1">{title}</p>
    </div>
  );
};

const YouTubeAnalyticsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'videos'>('overview');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('7d');

  // Mock data with proper typing
  const channelStats: ChannelStats = {
    subscribers: 1250,
    subscriberChange: 12.5,
    videos: 47,
    videoChange: 2,
    totalViews: 125000,
    viewChange: 8.3,
    watchTime: 1250,
    watchTimeChange: 15.2
  };

  const recentPerformance: PerformanceData[] = [
    { date: 'Mon', views: 1200, watchTime: 45, subscribers: 15 },
    { date: 'Tue', views: 1800, watchTime: 67, subscribers: 22 },
    { date: 'Wed', views: 1500, watchTime: 52, subscribers: 18 },
    { date: 'Thu', views: 2200, watchTime: 78, subscribers: 28 },
    { date: 'Fri', views: 1900, watchTime: 65, subscribers: 21 },
    { date: 'Sat', views: 2500, watchTime: 92, subscribers: 35 },
    { date: 'Sun', views: 2100, watchTime: 76, subscribers: 29 }
  ];

  const topVideos: VideoData[] = [
    { 
      id: 1, 
      title: 'React Hooks Complete Guide', 
      views: 25000, 
      likes: 1250, 
      comments: 87, 
      duration: '15:42',
      published: '2024-01-15',
      status: 'published',
      engagement: 6.8,
      thumbnail: 'https://picsum.photos/seed/react/320/180'
    },
    // ... more videos
  ];

  if (activeView === 'detailed') {
    return <DetailedAnalytics onBack={() => setActiveView('overview')} />;
  }

  if (activeView === 'videos') {
    return <VideoList onBack={() => setActiveView('overview')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">YouTube Analytics</h1>
          <p className="text-gray-600 mt-2">Track your YouTube channel performance</p>
        </div>

        {/* Channel Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">T</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">techinterviewbot</h2>
                <p className="text-gray-600">@techinterviewbot</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Connected
              </span>
              <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setActiveView('detailed')}
            className="bg-white border border-gray-300 rounded-xl p-6 text-left hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">Detailed Analytics</h3>
                <p className="text-gray-600 mt-1 text-sm">Deep dive into your channel metrics</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </button>

          <button
            onClick={() => setActiveView('videos')}
            className="bg-white border border-gray-300 rounded-xl p-6 text-left hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <VideoIcon className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">View Videos</h3>
                <p className="text-gray-600 mt-1 text-sm">Manage and analyze your video content</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
            </div>
          </button>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <Eye className="w-8 h-8 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
            <p className="text-gray-600 mt-1 text-sm">Snapshot of your channel performance</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="SUBSCRIBERS"
            value={channelStats.subscribers}
            change={channelStats.subscriberChange}
            icon={Users}
            color="green"
          />
          <StatCard
            title="VIDEOS"
            value={channelStats.videos}
            change={channelStats.videoChange}
            icon={VideoIcon}
            color="blue"
          />
          <StatCard
            title="TOTAL VIEWS"
            value={channelStats.totalViews}
            change={channelStats.viewChange}
            icon={Eye}
            color="purple"
          />
          <StatCard
            title="WATCH TIME (HOURS)"
            value={channelStats.watchTime}
            change={channelStats.watchTimeChange}
            icon={BarChart3}
            color="orange"
          />
        </div>

        {/* Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Performance Overview</h3>
            <select
              value={analyticsPeriod}
              onChange={(e) => setAnalyticsPeriod(e.target.value as AnalyticsPeriod)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <div className="h-64 flex items-end space-x-2">
            {recentPerformance.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full max-w-[60px]">
                  <div
                    className="bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{ height: `${(day.views / 2500) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 mt-2">{day.date}</span>
                <span className="text-xs font-medium mt-1">{day.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Videos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Performing Videos</h3>
          <div className="space-y-4">
            {topVideos.map((video) => (
              <div key={video.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                    <VideoIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{video.title}</h4>
                    <p className="text-sm text-gray-600">{video.views.toLocaleString()} views</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{video.likes.toLocaleString()}</div>
                    <div className="text-xs text-gray-600">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">{video.comments}</div>
                    <div className="text-xs text-gray-600">Comments</div>
                  </div>
                  <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeAnalyticsDashboard;