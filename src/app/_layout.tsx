import React from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SessionProvider } from '@/session/session-context';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
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
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="message/compose" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="orchestration/[id]" />
        {/* Role areas: no swipe-back out of them into public screens */}
        <Stack.Screen name="ops" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="ngo" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="dev/index" />
      </Stack>
    </>
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
