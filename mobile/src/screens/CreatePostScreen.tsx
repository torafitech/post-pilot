// mobile/src/screens/CreatePostScreen.tsx
// Mobile-first create flow: caption → media pick → platforms → schedule
// → submit. Calls the existing Next.js POST /api/posts route via the
// authenticated api client.
import React, { useMemo, useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform as RNPlatform,
  Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { PlatformIcon } from '@/components/PlatformIcon';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
  ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_DISABLED_REASON,
  PLATFORM_LABEL, type Platform,
} from '@/lib/platformConfig';

const PLATFORM_RULES: Record<string, { captionMax: number; allowsImage: boolean; allowsVideo: boolean }> = {
  youtube:   { captionMax: 5000,  allowsImage: false, allowsVideo: true  },
  twitter:   { captionMax: 280,   allowsImage: true,  allowsVideo: true  },
  linkedin:  { captionMax: 3000,  allowsImage: true,  allowsVideo: true  },
  instagram: { captionMax: 2200,  allowsImage: true,  allowsVideo: true  },
  facebook:  { captionMax: 63206, allowsImage: true,  allowsVideo: true  },
  threads:   { captionMax: 500,   allowsImage: true,  allowsVideo: true  },
  tiktok:    { captionMax: 2200,  allowsImage: false, allowsVideo: true  },
};

export function CreatePostScreen() {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [selected, setSelected] = useState<Platform[]>([]);
  const [scheduleAt, setScheduleAt] = useState<'now' | 'later'>('now');
  const [submitting, setSubmitting] = useState(false);

  const togglePlatform = (p: Platform) => {
    if (!ENABLED_PLATFORMS.has(p)) return;
    setSelected((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]));
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setVideoUri(null);
    }
  };

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });
    if (!res.canceled && res.assets[0]) {
      setVideoUri(res.assets[0].uri);
      setImageUri(null);
    }
  };

  const validation = useMemo(() => {
    const errs: string[] = [];
    if (selected.length === 0) errs.push('Pick at least one platform.');
    if (!caption.trim() && !imageUri && !videoUri) errs.push('Add a caption or media.');
    for (const p of selected) {
      const r = PLATFORM_RULES[p];
      if (!r) continue;
      if (caption.length > r.captionMax) {
        errs.push(`${PLATFORM_LABEL[p]} caption is too long (${caption.length}/${r.captionMax}).`);
      }
      if (imageUri && !r.allowsImage) errs.push(`${PLATFORM_LABEL[p]} doesn't accept images.`);
      if (videoUri && !r.allowsVideo) errs.push(`${PLATFORM_LABEL[p]} doesn't accept videos.`);
    }
    return errs;
  }, [selected, caption, imageUri, videoUri]);

  const onSubmit = async () => {
    if (validation.length) {
      Alert.alert('Cannot submit', validation.join('\n'));
      return;
    }
    if (!user) return;
    setSubmitting(true);
    try {
      // For media, upload to your existing image/video upload route first
      // (e.g. Cloudinary or Firebase Storage). Here we just send the
      // local URI and rely on the backend to fetch it OR you can use
      // FormData. Adapt to your existing upload pipeline.
      await api.post('/api/posts', {
        mainCaption: caption,
        platforms: selected,
        imageUri,
        videoUri,
        scheduleMode: scheduleAt,
      });
      Alert.alert('Queued', 'Your post has been scheduled.');
      setCaption('');
      setImageUri(null);
      setVideoUri(null);
      setSelected([]);
      setScheduleAt('now');
    } catch (err: any) {
      Alert.alert('Failed to create', err?.message || 'Unknown error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <View className="mb-6">
            <Text className="text-white text-2xl font-bold">New post</Text>
            <Text className="text-zinc-500 text-sm mt-1">Compose once, publish everywhere.</Text>
          </View>

          {/* Caption */}
          <View className="bg-bg-card border border-[#1f1f23] rounded-2xl p-4 mb-4">
            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="What do you want to share?"
              placeholderTextColor="#52525b"
              multiline
              className="text-white text-base min-h-[120px]"
              textAlignVertical="top"
            />
            <View className="flex-row items-center justify-between pt-3 border-t border-[#1f1f23] mt-2">
              <View className="flex-row gap-3">
                <Pressable onPress={pickImage} className="p-2 rounded-xl bg-[#17171a]">
                  <Feather name="image" size={18} color={theme.textDim} />
                </Pressable>
                <Pressable onPress={pickVideo} className="p-2 rounded-xl bg-[#17171a]">
                  <Feather name="video" size={18} color={theme.textDim} />
                </Pressable>
              </View>
              <Text className="text-zinc-500 text-xs">{caption.length} chars</Text>
            </View>
          </View>

          {/* Media preview */}
          {(imageUri || videoUri) && (
            <View className="bg-bg-card border border-[#1f1f23] rounded-2xl p-3 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Feather name={videoUri ? 'film' : 'image'} size={14} color={theme.brand} />
                  <Text className="text-zinc-300 text-xs">{videoUri ? 'Video selected' : 'Image selected'}</Text>
                </View>
                <Pressable onPress={() => { setImageUri(null); setVideoUri(null); }} hitSlop={8}>
                  <Feather name="x" size={16} color={theme.textMuted} />
                </Pressable>
              </View>
              {imageUri && (
                <Image source={{ uri: imageUri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
              )}
              {videoUri && (
                <View className="bg-[#17171a] rounded-xl h-32 items-center justify-center">
                  <Feather name="play-circle" size={28} color={theme.brand} />
                  <Text className="text-zinc-400 text-xs mt-2" numberOfLines={1}>{videoUri.split('/').pop()}</Text>
                </View>
              )}
            </View>
          )}

          {/* Platform picker */}
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Publish to
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {ALL_PLATFORMS.map((p) => {
              const enabled = ENABLED_PLATFORMS.has(p);
              const active = selected.includes(p);
              return (
                <Pressable
                  key={p}
                  onPress={() => togglePlatform(p)}
                  disabled={!enabled}
                  className="rounded-2xl px-3 py-2.5 border flex-row items-center gap-2"
                  style={{
                    backgroundColor: !enabled ? '#0d0d10' : active ? `${theme.brand}22` : theme.bgCard,
                    borderColor:     !enabled ? '#1f1f23' : active ? `${theme.brand}88` : '#1f1f23',
                    opacity: !enabled ? 0.55 : 1,
                  }}
                >
                  <PlatformIcon platform={p} size={14} />
                  <Text className="text-sm" style={{ color: active ? theme.text : theme.textDim }}>
                    {PLATFORM_LABEL[p]}
                  </Text>
                  {!enabled && <Feather name="lock" size={10} color={theme.amber} />}
                </Pressable>
              );
            })}
          </View>

          {selected.some((p) => !ENABLED_PLATFORMS.has(p)) && (
            <Text className="text-amber-300 text-xs mb-4">
              Some selected platforms aren't live yet — check the Accounts tab.
            </Text>
          )}

          {/* Schedule */}
          <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
            When
          </Text>
          <View className="flex-row gap-2 mb-6">
            {(['now', 'later'] as const).map((opt) => {
              const active = scheduleAt === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setScheduleAt(opt)}
                  className="flex-1 rounded-2xl px-3 py-3 border items-center"
                  style={{
                    backgroundColor: active ? `${theme.brand}22` : theme.bgCard,
                    borderColor:     active ? `${theme.brand}88` : '#1f1f23',
                  }}
                >
                  <Feather name={opt === 'now' ? 'send' : 'clock'} size={14} color={active ? theme.brand : theme.textDim} />
                  <Text className="mt-1.5 text-sm font-medium" style={{ color: active ? theme.text : theme.textDim }}>
                    {opt === 'now' ? 'Post now' : 'Schedule'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {validation.length > 0 && (
            <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3 py-2 mb-4">
              {validation.map((v, i) => (
                <Text key={i} className="text-amber-300 text-xs">• {v}</Text>
              ))}
            </View>
          )}

          <Button
            label={scheduleAt === 'now' ? 'Publish now' : 'Schedule post'}
            onPress={onSubmit}
            loading={submitting}
            disabled={validation.length > 0}
            size="lg"
            icon={<Feather name="send" size={14} color="#fff" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
