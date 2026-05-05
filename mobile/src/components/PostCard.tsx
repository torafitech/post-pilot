// mobile/src/components/PostCard.tsx
import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { PlatformIcon } from './PlatformIcon';
import { fmtNum, timeAgo } from '@/lib/theme';

export interface PostCardData {
  id: string;
  platform: string;
  caption?: string;
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  publishedAt?: Date;
  scheduledAt?: Date;
  metrics?: { views?: number; likes?: number; comments?: number; impressions?: number };
}

export function PostCard({ post }: { post: PostCardData }) {
  const views = post.metrics?.views ?? post.metrics?.impressions ?? 0;
  const likes = post.metrics?.likes ?? 0;
  const comments = post.metrics?.comments ?? 0;
  const date = post.publishedAt || post.scheduledAt;

  const statusColor = {
    published: '#34d399',
    scheduled: '#fbbf24',
    failed:    '#f87171',
    draft:     '#a1a1aa',
  }[post.status];

  return (
    <View className="bg-bg-card border border-[#1f1f23] rounded-2xl p-4 mb-3">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center gap-2 flex-1">
          <PlatformIcon platform={post.platform} size={16} />
          <Text className="text-zinc-400 text-xs capitalize">{post.platform}</Text>
          <View
            className="px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${statusColor}22` }}
          >
            <Text className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: statusColor }}>
              {post.status}
            </Text>
          </View>
        </View>
        {date && (
          <Text className="text-zinc-600 text-xs">
            {post.status === 'scheduled' ? 'in ' : ''}
            {timeAgo(date)}
          </Text>
        )}
      </View>

      {post.caption && (
        <Text className="text-zinc-200 text-sm mb-3" numberOfLines={2}>
          {post.caption}
        </Text>
      )}

      {post.status === 'published' && (
        <View className="flex-row gap-4 pt-2 border-t border-[#1f1f23]">
          <Stat icon={<Feather name="eye" size={12} color="#a1a1aa" />} value={fmtNum(views)} />
          <Stat icon={<Feather name="heart" size={12} color="#a1a1aa" />} value={fmtNum(likes)} />
          <Stat icon={<Feather name="message-circle" size={12} color="#a1a1aa" />} value={fmtNum(comments)} />
        </View>
      )}
    </View>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-zinc-400 text-xs">{value}</Text>
    </View>
  );
}
