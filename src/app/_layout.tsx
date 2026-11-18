import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { StoreProvider, useStore } from '../lib/store';
import { colors } from '../lib/theme';

function Root() {
  const { ready } = useStore();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: 'Back',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="topic/[id]" options={{ title: '' }} />
        <Stack.Screen name="play/[id]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="results" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', title: 'Swipe&Learn Plus' }} />
        <Stack.Screen name="party/index" options={{ title: 'Party mode' }} />
        <Stack.Screen name="party/play" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="party/host" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}
