// mobile/src/screens/DashboardScreen.tsx
// Real Firestore-backed overview: posts, totals, per-platform stats, and
// a simple area chart for the last 12 published posts.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from '@/navigation/MainStackNavigator';
import {
  collection, doc, getDoc, getDocs, limit, orderBy, query, where,
} from 'firebase/firestore';
import { LineChart } from 'react-native-gifted-charts';
import { Screen } from '@/components/Screen';
import { StatCard } from '@/components/StatCard';
import { PostCard, type PostCardData } from '@/components/PostCard';
import { PlatformIcon } from '@/components/PlatformIcon';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { fmtNum, theme } from '@/lib/theme';
import { ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_LABEL, type Platform } from '@/lib/platformConfig';

interface ConnectedAccount {
  id: string;
  platform: string;
  accountName: string;
}

export function DashboardScreen() {
  const { user } = useAuth();
  const nav = useNavigation<NavigationProp<MainStackParamList>>();
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [userSnap, postsSnap] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getDocs(query(
        collection(db, 'users', user.uid, 'posts'),
        orderBy('publishedAt', 'desc'),
        limit(50),
      )),
    ]);
    setAccounts((userSnap.data()?.connectedAccounts || []) as any[]);
    setPosts(postsSnap.docs.map((d) => {
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

  const onRefresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const published = useMemo(() => posts.filter((p) => p.status === 'published'), [posts]);

  const totals = useMemo(() => ({
    posts:    published.length,
    views:    published.reduce((s, p) => s + (p.metrics?.views ?? p.metrics?.impressions ?? 0), 0),
    likes:    published.reduce((s, p) => s + (p.metrics?.likes ?? 0), 0),
    comments: published.reduce((s, p) => s + (p.metrics?.comments ?? 0), 0),
  }), [published]);

  const trend = useMemo(() => {
    const last12 = published.slice(0, 12).reverse();
    return last12.map((p) => ({ value: p.metrics?.views ?? p.metrics?.impressions ?? 0 }));
  }, [published]);

  const accountsByPlatform = useMemo(() => {
    const m: Partial<Record<Platform, ConnectedAccount[]>> = {};
    accounts.forEach((a) => {
      if (ALL_PLATFORMS.includes(a.platform as Platform)) {
        const p = a.platform as Platform;
        m[p] = m[p] || [];
        m[p]!.push(a);
      }
    });
    return m;
  }, [accounts]);

  return (
    <Screen
      title={greeting(user?.displayName || user?.email || '')}
      subtitle="Here's what's happening"
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      {/* Stat row */}
      <View className="flex-row gap-3 mb-4">
        <StatCard label="Posts"  value={fmtNum(totals.posts)}  icon={<Feather name="file-text" size={14} color="#a1a1aa" />} accent="#fff" />
        <StatCard label="Views"  value={fmtNum(totals.views)}  icon={<Feather name="eye" size={14} color="#a1a1aa" />}        accent={theme.brand} />
      </View>
      <View className="flex-row gap-3 mb-6">
        <StatCard label="Likes"    value={fmtNum(totals.likes)}    icon={<Feather name="heart" size={14} color="#a1a1aa" />}         accent={theme.pink} />
        <StatCard label="Comments" value={fmtNum(totals.comments)} icon={<Feather name="message-circle" size={14} color="#a1a1aa" />} accent={theme.green} />
      </View>

      {/* Trend chart */}
      {trend.length > 1 && (
        <View className="bg-bg-card border border-[#1f1f23] rounded-2xl p-4 mb-6">
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Views — last {trend.length} posts
          </Text>
          <LineChart
            data={trend}
            color={theme.brand}
            thickness={2.5}
            startFillColor={theme.brand}
            endFillColor={theme.bgCard}
            startOpacity={0.3}
            endOpacity={0}
            areaChart
            curved
            hideDataPoints
            hideRules
            hideAxesAndRules
            yAxisColor="transparent"
            xAxisColor="transparent"
            initialSpacing={0}
            spacing={Math.max(20, 280 / Math.max(trend.length - 1, 1))}
            height={120}
            adjustToWidth
          />
        </View>
      )}

      {/* Connected platforms */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
          Connected Accounts
        </Text>
        <Pressable onPress={() => nav.navigate('Accounts')} hitSlop={10} className="flex-row items-center gap-1">
          <Text className="text-[#a855f7] text-xs font-semibold">Manage</Text>
          <Feather name="chevron-right" size={12} color={theme.brand} />
        </Pressable>
      </View>
      <View className="gap-2 mb-6">
        {ALL_PLATFORMS.map((pl) => {
          const enabled = ENABLED_PLATFORMS.has(pl);
          const accs = accountsByPlatform[pl] || [];
          return (
            <Pressable
              key={pl}
              onPress={() => enabled && nav.navigate('Accounts')}
              className="flex-row items-center bg-bg-card border border-[#1f1f23] rounded-2xl px-4 py-3"
            >
              <PlatformIcon platform={pl} size={18} />
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm font-semibold">{PLATFORM_LABEL[pl]}</Text>
                <Text className="text-zinc-500 text-xs">
                  {accs.length === 0 ? 'Not connected' : `${accs.length} account${accs.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
              {!enabled ? (
                <View className="px-2 py-1 rounded-full bg-amber-500/15">
                  <Text className="text-amber-300 text-[10px] font-bold uppercase">Soon</Text>
                </View>
              ) : accs.length > 0 ? (
                <Feather name="check-circle" size={16} color={theme.green} />
              ) : (
                <Feather name="plus-circle" size={18} color={theme.textMuted} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Recent posts */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Recent posts</Text>
        <Text className="text-zinc-600 text-xs">{posts.length}</Text>
      </View>

      {posts.length === 0 ? (
        <View className="bg-bg-card border border-dashed border-[#27272a] rounded-2xl p-8 items-center">
          <Feather name="file-text" size={28} color={theme.textMuted} />
          <Text className="text-zinc-400 text-sm mt-3">No posts yet</Text>
          <Text className="text-zinc-600 text-xs mt-1">Tap + to create your first post</Text>
        </View>
      ) : (
        posts.slice(0, 10).map((p) => <PostCard key={p.id} post={p} />)
      )}
    </Screen>
  );
}

function greeting(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const first = name.split(/[\s@]/)[0];
  return first ? `${part}, ${first}` : part;
}
