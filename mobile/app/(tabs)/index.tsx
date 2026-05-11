import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getConnections, getScheduledPosts } from '../../lib/api';
import { PostCard } from '../../components/PostCard';

interface Connection {
  platform: string;
  accountName: string;
  platformId: string;
}

interface Post {
  id: string;
  caption: string;
  platforms: string[];
  status: string;
  scheduledTime?: string;
}

export default function DashboardScreen() {
  const { user, logOut } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [connData, postData] = await Promise.all([
        getConnections(),
        getScheduledPosts(),
      ]);
      setConnections(connData.accounts ?? connData ?? []);
      setPosts(postData.posts ?? postData ?? []);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const PLATFORM_COLOR: Record<string, string> = {
    twitter: '#1d9bf0',
    youtube: '#ff0000',
    linkedin: '#0a66c2',
    instagram: '#e1306c',
    facebook: '#1877f2',
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7c3aed" size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={logOut} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Connected Accounts</Text>
      {connections.length === 0 ? (
        <Text style={styles.empty}>No connected accounts</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformRow}>
          {connections.map((c, i) => (
            <View
              key={i}
              style={[styles.platformChip, { borderColor: PLATFORM_COLOR[c.platform] ?? '#7c3aed' }]}
            >
              <Text style={[styles.platformName, { color: PLATFORM_COLOR[c.platform] ?? '#7c3aed' }]}>
                {c.platform.toUpperCase()}
              </Text>
              <Text style={styles.accountName}>{c.accountName}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Text style={styles.sectionTitle}>Recent Posts</Text>
      {posts.length === 0 ? (
        <Text style={styles.empty}>No posts yet</Text>
      ) : (
        posts.slice(0, 10).map((p) => (
          <PostCard
            key={p.id}
            caption={p.caption}
            platforms={p.platforms}
            status={p.status}
            scheduledTime={p.scheduledTime}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  greeting: { color: '#8b8ba7', fontSize: 13 },
  email: { color: '#e2e2f0', fontSize: 15, fontWeight: '600' },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#ef4444', fontSize: 13 },
  sectionTitle: {
    color: '#e2e2f0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  empty: { color: '#555570', fontSize: 14, marginBottom: 16 },
  platformRow: { marginBottom: 20 },
  platformChip: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginRight: 10,
    minWidth: 100,
  },
  platformName: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  accountName: { color: '#8b8ba7', fontSize: 12 },
});
