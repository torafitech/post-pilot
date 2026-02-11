// components/DetailedAnalytics.tsx
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  BarChart3, 
  Calendar, 
  Download,
  Filter,
  Share2
} from 'lucide-react';
import { AnalyticsPeriod, AudienceData, MetricData, TrafficSource } from '@/types/youtube-analytics';

interface DetailedAnalyticsProps {
  onBack: () => void;
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  description: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, description }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6">
    <h4 className="text-sm font-medium text-gray-600 mb-2">{title}</h4>
    <div className="flex items-end justify-between">
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '+' : ''}{change}%
        </div>
      </div>
      <div className="text-sm text-gray-600 text-right">
        {description}
      </div>
    </div>
  </div>
);

const DetailedAnalytics: React.FC<DetailedAnalyticsProps> = ({ onBack }) => {
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof metrics>('views');
  const [dateRange, setDateRange] = useState<AnalyticsPeriod>('30d');

  const metrics: Record<string, MetricData> = {
    views: { label: 'Views', color: 'blue', data: Array.from({length: 30}, (_, i) => Math.floor(Math.random() * 1000) + 500) },
    watchTime: { label: 'Watch Time (hours)', color: 'green', data: Array.from({length: 30}, (_, i) => Math.floor(Math.random() * 50) + 20) },
    subscribers: { label: 'Subscribers', color: 'purple', data: Array.from({length: 30}, (_, i) => Math.floor(Math.random() * 50) + 10) },
    engagement: { label: 'Engagement Rate', color: 'orange', data: Array.from({length: 30}, (_, i) => Math.random() * 10 + 2) }
  };

  const audienceData: AudienceData[] = [
    { country: 'United States', percentage: 35, views: 12500 },
    { country: 'India', percentage: 22, views: 7850 },
    { country: 'United Kingdom', percentage: 15, views: 5350 },
    { country: 'Canada', percentage: 10, views: 3570 },
    { country: 'Australia', percentage: 8, views: 2850 }
  ];

  const trafficSources: TrafficSource[] = [
    { source: 'YouTube Search', percentage: 45 },
    { source: 'Suggested Videos', percentage: 30 },
    { source: 'External', percentage: 15 },
    { source: 'Direct', percentage: 10 }
  ];

  const colorClasses = {
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-300', bgLight: 'bg-blue-100' },
    green: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-300', bgLight: 'bg-green-100' },
    purple: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300', bgLight: 'bg-purple-100' },
    orange: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-300', bgLight: 'bg-orange-100' }
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Detailed Analytics</h1>
              <p className="text-gray-600 mt-1">Deep dive into your channel performance metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as AnalyticsPeriod)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Add Filter</span>
              </button>
            </div>
            
            <div className="flex space-x-2">
              {Object.keys(metrics).map((metric) => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric as keyof typeof metrics)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedMetric === metric
                      ? `${colorClasses[metrics[metric].color].bgLight} ${colorClasses[metrics[metric].color].text} border ${colorClasses[metrics[metric].color].border}`
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {metrics[metric].label}
                </button>
              ))}
            </div>
          </div>
        </div>

     
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Average View Duration"
            value="4:32"
            change={12.5}
            description="vs previous period"
          />
          <MetricCard
            title="Click-Through Rate"
            value="8.2%"
            change={3.2}
            description="industry avg: 5.1%"
          />
          <MetricCard
            title="Impressions"
            value="125.5K"
            change={18.7}
            description="+19K vs last period"
          />
          <MetricCard
            title="Engagement Rate"
            value="6.8%"
            change={-1.2}
            description="includes likes & comments"
          />
        </div>

        {/* Main Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{metrics[selectedMetric].label} Over Time</h3>
              <p className="text-gray-600">Last 30 days performance</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full bg-${metrics[selectedMetric].color}-500`} />
              <span className="text-sm text-gray-700">{metrics[selectedMetric].label}</span>
            </div>
          </div>
          <div className="h-80">
            <div className="flex items-end h-64 space-x-1">
              {metrics[selectedMetric].data.map((value, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full max-w-[40px]">
                    <div
                      className={`rounded-t transition-all hover:opacity-80 bg-${metrics[selectedMetric].color}-500`}
                      style={{ height: `${(value / Math.max(...metrics[selectedMetric].data)) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audience & Traffic Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audience Demographics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Audience Locations</h3>
            <div className="space-y-4">
              {audienceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      <span className="text-blue-700 font-bold text-sm">
                        {item.country.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{item.country}</div>
                      <div className="text-sm text-gray-600">{item.views.toLocaleString()} views</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{item.percentage}%</div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic Sources */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Traffic Sources</h3>
            <div className="space-y-6">
              {trafficSources.map((source, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900">{source.source}</span>
                    <span className="font-semibold text-gray-900">{source.percentage}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedAnalytics;