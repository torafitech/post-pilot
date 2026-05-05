// mobile/src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import { API_BASE } from '@/lib/api';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from '@/navigation/MainStackNavigator';
import type { MainTabParamList } from '@/navigation/MainTabNavigator';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const tabNav = useNavigation<NavigationProp<MainTabParamList>>();
  const stackNav = useNavigation<NavigationProp<MainStackParamList>>();
  const [busy, setBusy] = useState(false);

  const onSignOut = () =>
    Alert.alert('Sign out?', 'You will need to sign in again to manage your accounts.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try { await logout(); } finally { setBusy(false); }
        },
      },
    ]);

  const initial = (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase();

  return (
    <Screen title="Profile">
      <View className="bg-bg-card border border-[#1f1f23] rounded-2xl p-5 mb-5 items-center">
        <View
          className="w-20 h-20 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: `${theme.brand}33`, borderWidth: 2, borderColor: theme.brand }}
        >
          <Text className="text-white text-3xl font-bold">{initial}</Text>
        </View>
        <Text className="text-white text-lg font-bold">
          {user?.displayName || 'StarlingPost user'}
        </Text>
        <Text className="text-zinc-500 text-sm mt-0.5">{user?.email}</Text>
      </View>

      <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
        Manage
      </Text>
      <View className="bg-bg-card border border-[#1f1f23] rounded-2xl mb-5 overflow-hidden">
        <Row
          icon="link"
          label="Connected accounts"
          onPress={() => stackNav.navigate('Accounts')}
        />
        <Row
          icon="zap"
          label="Automation"
          onPress={() => tabNav.navigate('Automation')}
        />
        <Row
          icon="list"
          label="Posts"
          onPress={() => tabNav.navigate('Posts')}
          last
        />
      </View>

      <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
        About
      </Text>
      <View className="bg-bg-card border border-[#1f1f23] rounded-2xl mb-5 overflow-hidden">
        <Row
          icon="globe"
          label="Open web dashboard"
          onPress={() => Linking.openURL(`${API_BASE}/dashboard`)}
        />
        <Row
          icon="shield"
          label="Privacy policy"
          onPress={() => Linking.openURL(`${API_BASE}/privacy`)}
        />
        <Row
          icon="file-text"
          label="Terms of service"
          onPress={() => Linking.openURL(`${API_BASE}/terms`)}
          last
        />
      </View>

      <Button
        label="Sign out"
        onPress={onSignOut}
        variant="ghost"
        size="lg"
        loading={busy}
        icon={<Feather name="log-out" size={14} color={theme.textDim} />}
      />

      <Text className="text-zinc-700 text-[10px] text-center mt-6">
        StarlingPost v1.0.0
      </Text>
    </Screen>
  );
}

function Row({
  icon, label, onPress, last,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center px-4 py-4 ${last ? '' : 'border-b border-[#1f1f23]'}`}
    >
      <View className="w-8 h-8 rounded-lg bg-[#17171a] items-center justify-center mr-3">
        <Feather name={icon} size={14} color={theme.textDim} />
      </View>
      <Text className="flex-1 text-zinc-200 text-sm">{label}</Text>
      <Feather name="chevron-right" size={16} color={theme.textMuted} />
    </Pressable>
  );
}
