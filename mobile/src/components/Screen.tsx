// mobile/src/components/Screen.tsx
// Wraps every screen with safe-area + status bar styling, optional
// header, and a common scroll container. Keeps screens DRY.
import React from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
}

export function Screen({ title, subtitle, right, children, refreshing, onRefresh, scroll = true }: Props) {
  const content = (
    <View className="px-5 pb-10">
      {title && (
        <View className="flex-row items-end justify-between mb-6 mt-2">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">{title}</Text>
            {subtitle && (
              <Text className="text-zinc-500 text-sm mt-1">{subtitle}</Text>
            )}
          </View>
          {right}
        </View>
      )}
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor="#a855f7"
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
