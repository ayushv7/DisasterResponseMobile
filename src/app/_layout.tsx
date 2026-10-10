import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BackendBanner } from '@/components/BackendBanner';
import { IS_MOCK_API } from '@/services/api';
import { SessionProvider } from '@/session/session-context';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { colors, isDark } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Navy banner sits under the status bar in sample mode, so use light icons */}
      <StatusBar style={isDark || IS_MOCK_API ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <BackendBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="alerts" options={{ animation: 'fade' }} />
        <Stack.Screen name="map" options={{ animation: 'fade' }} />
        <Stack.Screen name="messages" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="worker-login" />
        <Stack.Screen name="citizen-login" />
        <Stack.Screen name="offer-help" />
        <Stack.Screen name="my-offers" />
        <Stack.Screen name="notification-areas" />
        <Stack.Screen name="volunteer" />
        <Stack.Screen name="contribute" />
        <Stack.Screen name="contributor-login" />
        <Stack.Screen name="contributor" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="message/compose" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="orchestration/[id]" />
        {/* Role areas: no swipe-back out of them into public screens */}
        <Stack.Screen name="ops" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="ngo" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="dev/index" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <RootLayoutContent />
      </SessionProvider>
    </ThemeProvider>
  );
}
