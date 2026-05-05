// mobile/src/screens/AccountsScreen.tsx
// Connect / disconnect social accounts. OAuth runs in an in-app browser
// pointed at the existing Next.js auth routes — the backend handles the
// token exchange and writes connectedAccounts to Firestore. We refetch
// after the browser closes.
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Feather } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Screen } from '@/components/Screen';
import { PlatformIcon } from '@/components/PlatformIcon';
import { Button } from '@/components/Button';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { API_BASE } from '@/lib/api';
import { theme } from '@/lib/theme';
import {
  ALL_PLATFORMS, ENABLED_PLATFORMS, PLATFORM_DISABLED_REASON, PLATFORM_LABEL, type Platform,
} from '@/lib/platformConfig';

WebBrowser.maybeCompleteAuthSession();

interface ConnectedAccount {
  id: string;
  platform: string;
  platformId?: string;
  accountName: string;
  accessToken?: string;
  connectedAt?: any;
}

export function AccountsScreen() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyPlatform, setBusyPlatform] = useState<Platform | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    setAccounts((snap.data()?.connectedAccounts || []) as any[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onConnect = async (platform: Platform) => {
    if (!user) return;
    if (!ENABLED_PLATFORMS.has(platform)) return;

    const url = oauthUrl(platform, user.uid);
    setBusyPlatform(platform);
    try {
      const result = await WebBrowser.openAuthSessionAsync(url, 'starlingpost://oauth-return');
      // Whether or not the user completes the flow, the backend either
      // wrote a new account doc or didn't. Refetch to find out.
      if (result.type === 'success' || result.type === 'dismiss') {
        await load();
      }
    } catch (err: any) {
      Alert.alert('Connection failed', err?.message || 'Unknown error.');
    } finally {
      setBusyPlatform(null);
    }
  };

  const onDisconnect = async (acc: ConnectedAccount) => {
    if (!user) return;
    Alert.alert(
      'Disconnect account?',
      `${acc.accountName} will stop receiving automation and new posts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            const next = accounts.filter((a) => a.id !== acc.id);
            setAccounts(next);
            try {
              await updateDoc(doc(db, 'users', user.uid), { connectedAccounts: next });
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not disconnect.');
              await load();
            }
          },
        },
      ],
    );
  };

  return (
    <Screen
      title="Accounts"
      subtitle="Connect the platforms you want to manage"
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }}
    >
      {ALL_PLATFORMS.map((pl) => {
        const enabled = ENABLED_PLATFORMS.has(pl);
        const accs = accounts.filter((a) => a.platform === pl);
        const busy = busyPlatform === pl;

        return (
          <View
            key={pl}
            className={`bg-bg-card border rounded-2xl p-4 mb-3 ${enabled ? 'border-[#1f1f23]' : 'border-[#1f1f23] opacity-70'}`}
          >
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-xl bg-[#17171a] items-center justify-center mr-3">
                <PlatformIcon platform={pl} size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold">{PLATFORM_LABEL[pl]}</Text>
                <Text className="text-zinc-500 text-xs">
                  {accs.length === 0 ? 'Not connected' : `${accs.length} connected`}
                </Text>
              </View>
              {!enabled && (
                <View className="px-2 py-1 rounded-full bg-amber-500/15 flex-row items-center gap-1">
                  <Feather name="lock" size={10} color="#fbbf24" />
                  <Text className="text-amber-300 text-[10px] font-bold uppercase">Soon</Text>
                </View>
              )}
            </View>

            {accs.length > 0 && (
              <View className="gap-2 mb-3">
                {accs.map((a) => (
                  <View key={a.id} className="flex-row items-center bg-[#17171a] rounded-xl px-3 py-2.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-[#34d399] mr-2.5" />
                    <Text className="flex-1 text-zinc-200 text-sm">{a.accountName}</Text>
                    <Pressable onPress={() => onDisconnect(a)} hitSlop={10}>
                      <Feather name="x" size={14} color="#71717a" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {!enabled ? (
              <Text className="text-amber-300/80 text-xs leading-snug">
                {PLATFORM_DISABLED_REASON[pl] || 'Coming soon.'}
              </Text>
            ) : (
              <Button
                label={accs.length > 0 ? `Add another ${PLATFORM_LABEL[pl]}` : `Connect ${PLATFORM_LABEL[pl]}`}
                onPress={() => onConnect(pl)}
                variant="secondary"
                size="sm"
                loading={busy}
                icon={<Feather name="link" size={14} color={theme.text} />}
              />
            )}
          </View>
        );
      })}
    </Screen>
  );
}

function oauthUrl(platform: Platform, uid: string): string {
  const map: Record<Platform, string> = {
    youtube:   `${API_BASE}/api/auth/youtube?uid=${encodeURIComponent(uid)}`,
    twitter:   `${API_BASE}/api/auth/twitter/oauth1?uid=${encodeURIComponent(uid)}`,
    linkedin:  `${API_BASE}/api/auth/linkedin?uid=${encodeURIComponent(uid)}`,
    instagram: `${API_BASE}/api/auth/instagram?uid=${encodeURIComponent(uid)}`,
    facebook:  `${API_BASE}/api/auth/facebook?uid=${encodeURIComponent(uid)}`,
    threads:   `${API_BASE}/api/auth/threads?uid=${encodeURIComponent(uid)}`,
    tiktok:    `${API_BASE}/api/auth/tiktok?uid=${encodeURIComponent(uid)}`,
  };
  return map[platform];
}
