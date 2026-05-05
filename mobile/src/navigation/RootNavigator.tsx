// mobile/src/navigation/RootNavigator.tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { useAuth } from '@/lib/auth';
import { theme } from '@/lib/theme';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: theme.bg,
    card:       theme.bgCard,
    border:     theme.border,
    primary:    theme.brand,
    text:       theme.text,
  },
};

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color={theme.brand} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <MainStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
