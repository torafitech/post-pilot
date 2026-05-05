// mobile/src/screens/PostsScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { PostCard, type PostCardData } from '@/components/PostCard';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';

type Filter = 'all' | 'published' | 'scheduled' | 'failed';

const FILTERS: { id: Filter; label: string; color: string }[] = [
  { id: 'all',        label: 'All',        color: '#a855f7' },
  { id: 'published',  label: 'Published',  color: '#34d399' },
  { id: 'scheduled',  label: 'Scheduled',  color: '#fbbf24' },
  { id: 'failed',     label: 'Failed',     color: '#f87171' },
];

export function PostsScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const snap = await getDocs(query(
      collection(db, 'users', user.uid, 'posts'),
      orderBy('publishedAt', 'desc'),
      limit(100),
    ));
    setPosts(snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        platform: (data.platform || 'youtube').toLowerCase(),
        caption: data.caption || data.mainCaption || data.title,
        status: data.status || 'published',
        publishedAt: data.publishedAt?.toDate?.(),
        scheduledAt: data.scheduledAt?.toDate?.(),
        metrics: data.metrics || {},
      };
    }));
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  const counts = useMemo(() => ({
    all:       posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    failed:    posts.filter((p) => p.status === 'failed').length,
  }), [posts]);

  return (
    <Screen
      title="Posts"
      subtitle={`${posts.length} total`}
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }}
    >
      <View className="flex-row gap-2 mb-5 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              className="rounded-full px-3.5 py-2 border"
              style={{
                backgroundColor: active ? `${f.color}22` : '#17171a',
                borderColor: active ? `${f.color}55` : '#1f1f23',
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: active ? f.color : '#a1a1aa' }}
              >
                {f.label} · {counts[f.id]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View className="bg-bg-card border border-dashed border-[#27272a] rounded-2xl p-10 items-center">
          <Feather name="inbox" size={32} color={theme.textMuted} />
          <Text className="text-zinc-400 text-sm mt-3">Nothing here yet</Text>
          <Text className="text-zinc-600 text-xs mt-1">Pull to refresh</Text>
        </View>
      ) : (
        filtered.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </Screen>
  );
}
