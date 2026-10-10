import React from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
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
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="map" options={{ animation: 'fade' }} />
        <Stack.Screen name="messages" options={{ animation: 'fade' }} />
        <Stack.Screen name="profile" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" />
        <Stack.Screen name="event/[id]" />
        <Stack.Screen name="message/compose" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="ngo/feed" options={{ animation: 'fade' }} />
        <Stack.Screen name="ngo/inbox" options={{ animation: 'fade' }} />
        <Stack.Screen name="ngo/contributions" options={{ animation: 'fade' }} />
        <Stack.Screen name="ngo/contributions/compose" />
        <Stack.Screen name="ngo/organization" options={{ animation: 'fade' }} />
        <Stack.Screen name="ngo/review/[id]" />
        <Stack.Screen name="orchestration/[id]" />
        <Stack.Screen name="ops/home" options={{ animation: 'fade' }} />
        <Stack.Screen name="ops/incidents" options={{ animation: 'fade' }} />
        <Stack.Screen name="ops/tasks" options={{ animation: 'fade' }} />
        <Stack.Screen name="ops/replanning" options={{ animation: 'fade' }} />
        <Stack.Screen name="ops/incident/[id]" />
        <Stack.Screen name="dev/index" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
