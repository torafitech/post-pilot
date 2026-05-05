// mobile/src/navigation/MainTabNavigator.tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { PostsScreen } from '@/screens/PostsScreen';
import { CreatePostScreen } from '@/screens/CreatePostScreen';
import { AutomationScreen } from '@/screens/AutomationScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { theme } from '@/lib/theme';

export type MainTabParamList = {
  Dashboard: undefined;
  Posts: undefined;
  Create: undefined;
  Automation: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgCard,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<keyof MainTabParamList, any> = {
            Dashboard:  'home',
            Posts:      'list',
            Create:     'plus-circle',
            Automation: 'zap',
            Profile:    'user',
          };
          return (
            <Feather name={map[route.name]} size={focused ? 22 : 20} color={color} />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Posts" component={PostsScreen} />
      <Tab.Screen
        name="Create"
        component={CreatePostScreen}
        options={{
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: theme.brand,
                  alignItems: 'center', justifyContent: 'center',
                  marginTop: -16,
                  shadowColor: theme.brand,
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 6,
                }}
              >
                <Feather name="plus" size={26} color="#fff" />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tab.Screen name="Automation" component={AutomationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
