import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { publishPost } from '../../lib/api';

const PLATFORMS = ['twitter', 'youtube', 'linkedin'] as const;
type Plat = typeof PLATFORMS[number];

const PLATFORM_LABEL: Record<Plat, string> = {
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
};

const PLATFORM_COLOR: Record<Plat, string> = {
  twitter: '#1d9bf0',
  youtube: '#ff0000',
  linkedin: '#0a66c2',
};

export default function CreateScreen() {
  const [caption, setCaption] = useState('');
  const [selected, setSelected] = useState<Set<Plat>>(new Set());
  const [loading, setLoading] = useState(false);

  function togglePlatform(p: Plat) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  async function handlePublish() {
    if (!caption.trim()) {
      Alert.alert('Missing caption', 'Write something first');
      return;
    }
    if (selected.size === 0) {
      Alert.alert('No platforms', 'Select at least one platform');
      return;
    }
    setLoading(true);
    try {
      await publishPost({
        caption: caption.trim(),
        platforms: Array.from(selected),
      });
      Alert.alert('Published!', 'Post sent to selected platforms');
      setCaption('');
      setSelected(new Set());
    } catch (e: any) {
      Alert.alert('Publish failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0f0f1a' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Caption</Text>
        <TextInput
          style={styles.textArea}
          placeholder="What's on your mind?"
          placeholderTextColor="#555570"
          value={caption}
          onChangeText={setCaption}
          multiline
          numberOfLines={6}
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{caption.length}/2000</Text>

        <Text style={styles.label}>Platforms</Text>
        {PLATFORMS.map((p) => {
          const active = selected.has(p);
          return (
            <TouchableOpacity
              key={p}
              style={[
                styles.platformRow,
                active && { borderColor: PLATFORM_COLOR[p], backgroundColor: `${PLATFORM_COLOR[p]}18` },
              ]}
              onPress={() => togglePlatform(p)}
            >
              <View style={[styles.dot, { backgroundColor: PLATFORM_COLOR[p] }]} />
              <Text style={styles.platformLabel}>{PLATFORM_LABEL[p]}</Text>
              <View style={[styles.checkbox, active && { backgroundColor: PLATFORM_COLOR[p], borderColor: PLATFORM_COLOR[p] }]}>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.publishBtn, loading && { opacity: 0.6 }]}
          onPress={handlePublish}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishText}>Publish Now</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: {
    color: '#8b8ba7',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  textArea: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    color: '#e2e2f0',
    fontSize: 15,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#2e2e3e',
  },
  charCount: {
    color: '#555570',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2e2e3e',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  platformLabel: {
    flex: 1,
    color: '#e2e2f0',
    fontSize: 15,
    fontWeight: '500',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#2e2e3e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  publishBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  publishText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
