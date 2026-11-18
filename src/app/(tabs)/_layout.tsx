import { Tabs } from 'expo-router/tabs';
import { Text, View } from 'react-native';
import { F, colors } from '../../lib/theme';

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => (
  <View
    style={{
      width: 46, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
      backgroundColor: focused ? colors.primarySoft : 'transparent',
      borderWidth: 2, borderColor: focused ? colors.primary : 'transparent',
    }}
  >
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, borderTopWidth: 2, height: 78, paddingTop: 8 },
        tabBarLabelStyle: { fontFamily: F.extra, fontSize: 11, marginTop: 2 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: icon('🗺️') }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', tabBarIcon: icon('📈') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('👤') }} />
    </Tabs>
  );
}
