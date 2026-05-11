import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PostCardProps {
  caption: string;
  platforms: string[];
  status: string;
  scheduledTime?: string;
}

const STATUS_COLOR: Record<string, string> = {
  published: '#22c55e',
  scheduled: '#f59e0b',
  failed: '#ef4444',
  draft: '#6b7280',
};

export function PostCard({ caption, platforms, status, scheduledTime }: PostCardProps) {
  const color = STATUS_COLOR[status] ?? '#6b7280';
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.status, { color }]}>{status.toUpperCase()}</Text>
        <Text style={styles.platforms}>{platforms.join(' · ')}</Text>
      </View>
      <Text style={styles.caption} numberOfLines={2}>{caption}</Text>
      {scheduledTime && (
        <Text style={styles.time}>{new Date(scheduledTime).toLocaleString()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2e2e3e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  platforms: {
    fontSize: 11,
    color: '#8b8ba7',
  },
  caption: {
    color: '#e2e2f0',
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
});
