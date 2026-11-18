import { Tabs } from 'expo-router/tabs';
import { Text } from 'react-native';
import { colors } from '../../lib/theme';

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('🧭') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="compete" options={{ title: 'Compete', tabBarIcon: icon('⚔️') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
