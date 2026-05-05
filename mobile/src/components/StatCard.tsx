// mobile/src/components/StatCard.tsx
import React from 'react';
import { Text, View } from 'react-native';
import type { Feather } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
}

export function StatCard({ label, value, icon, accent = '#a855f7' }: Props) {
  return (
    <View className="flex-1 bg-bg-card border border-[#1f1f23] rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          {label}
        </Text>
        {icon}
      </View>
      <Text className="text-white text-2xl font-bold" style={{ color: accent }}>
        {value}
      </Text>
    </View>
  );
}
