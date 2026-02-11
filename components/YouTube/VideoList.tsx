// components/VideoList.tsx
import React, { useState } from 'react';
import {
  ArrowLeft,
  Video as VideoIcon,
  Eye,
  ThumbsUp,
  MessageCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  Upload,
  MoreVertical,
  Play,
} from 'lucide-react';

type VideoItem = {
  id: number;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  published: string;
  status: string;
  engagement: number;
};

type VideoListProps = {
  onBack: () => void;
};

type VideoCardProps = {
  video: VideoItem;
};

const VideoCard: React.FC<VideoCardProps> = ({ video }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
    <div className="relative">
      <div className="w-full h-48 bg-gray-200 relative group">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
          <button className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center transform scale-95 group-hover:scale-100 transition-transform">
            <Play className="w-6 h-6 text-gray-900 ml-1" />
          </button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-sm px-2 py-1 rounded">
          {video.duration}
        </div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {video.title}
          </h3>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center text-sm text-gray-600 mb-4">
          <Calendar className="w-4 h-4 mr-1" />
          <span>Published {video.published}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 mb-1">
              <Eye className="w-4 h-4 mr-1" />
              <span className="font-medium">Views</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {video.views.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 mb-1">
              <ThumbsUp className="w-4 h-4 mr-1" />
              <span className="font-medium">Likes</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {video.likes.toLocaleString()}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-600 mb-1">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="font-medium">Comments</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {video.comments}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <span className="text-sm text-gray-600 capitalize">
              {video.status}
            </span>
          </div>
          <div className="text-sm font-medium text-gray-900">
            {video.engagement}% Engagement
          </div>
        </div>
      </div>
    </div>
  </div>
);

const VideoList: React.FC<VideoListProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes' | 'engagement'>(
    'date'
  );

  const videos: VideoItem[] = [
    {
      id: 1,
      title: 'React Hooks Complete Guide - Learn useState, useEffect & More',
      thumbnail: 'https://picsum.photos/seed/react/320/180',
      views: 25000,
      likes: 1250,
      comments: 87,
      duration: '15:42',
      published: '2024-01-15',
      status: 'published',
      engagement: 6.8,
    },
    {
      id: 2,
      title:
        'JavaScript Interview Questions 2024 - Top 50 Questions & Answers',
      thumbnail: 'https://picsum.photos/seed/js/320/180',
      views: 18000,
      likes: 920,
      comments: 65,
      duration: '22:15',
      published: '2024-01-10',
      status: 'published',
      engagement: 7.2,
    },
    {
      id: 3,
      title: 'TypeScript vs JavaScript - Which Should You Learn in 2024?',
      thumbnail: 'https://picsum.photos/seed/ts/320/180',
      views: 15000,
      likes: 780,
      comments: 52,
      duration: '18:30',
      published: '2024-01-05',
      status: 'published',
      engagement: 5.9,
    },
    {
      id: 4,
      title: 'Node.js Best Practices for Scalable Applications',
      thumbnail: 'https://picsum.photos/seed/node/320/180',
      views: 12000,
      likes: 650,
      comments: 45,
      duration: '25:10',
      published: '2024-01-01',
      status: 'published',
      engagement: 6.1,
    },
    {
      id: 5,
      title: 'Next.js 14 Tutorial - Server Components & App Router',
      thumbnail: 'https://picsum.photos/seed/next/320/180',
      views: 8000,
      likes: 420,
      comments: 32,
      duration: '32:45',
      published: '2023-12-28',
      status: 'published',
      engagement: 5.4,
    },
    {
      id: 6,
      title: 'System Design Interview Preparation Guide',
      thumbnail: 'https://picsum.photos/seed/system/320/180',
      views: 9500,
      likes: 510,
      comments: 41,
      duration: '28:20',
      published: '2023-12-25',
      status: 'published',
      engagement: 6.5,
    },
  ];

  // (Optionally) apply search/sort later if you want
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">View Videos</h1>
              <p className="text-gray-600 mt-1">
                Manage and analyze your video content
              </p>
            </div>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Upload New Video</span>
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search videos by title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={e =>
                  setSortBy(e.target.value as 'date' | 'views' | 'likes' | 'engagement')
                }
                className="border border-gray-300 rounded-lg px-4 py-3"
              >
                <option value="date">Sort by: Date</option>
                <option value="views">Sort by: Views</option>
                <option value="likes">Sort by: Likes</option>
                <option value="engagement">Sort by: Engagement</option>
              </select>

              <button className="flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>

        {/* Stats Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Video Analytics Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">47</div>
              <div className="text-gray-600 mt-1">Total Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">125K</div>
              <div className="text-gray-600 mt-1">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">6.4%</div>
              <div className="text-gray-600 mt-1">Avg. Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">15:42</div>
              <div className="text-gray-600 mt-1">Avg. Duration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoList;
