import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f1a' },
        headerTintColor: '#e2e2f0',
        tabBarStyle: { backgroundColor: '#0f0f1a', borderTopColor: '#2e2e3e' },
        tabBarActiveTintColor: '#7c3aed',
        tabBarInactiveTintColor: '#555570',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tabs.Screen
        name="create"
        options={{ title: 'Create Post', tabBarLabel: 'Create' }}
      />
    </Tabs>
  );
}
