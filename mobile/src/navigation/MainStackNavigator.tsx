// mobile/src/navigation/MainStackNavigator.tsx
// Wraps the tab navigator so non-tab screens (like Accounts) can be
// pushed on top from anywhere.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { AccountsScreen } from '@/screens/AccountsScreen';
import { theme } from '@/lib/theme';

export type MainStackParamList = {
  Tabs: undefined;
  Accounts: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
        headerTintColor: theme.brand,
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen
        name="Accounts"
        component={AccountsScreen}
        options={{ title: 'Connected Accounts', headerBackTitle: '' }}
      />
    </Stack.Navigator>
  );
}
