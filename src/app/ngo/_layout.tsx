import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session/session-context';

/**
 * NGO area: its own stack, so Back stays inside the NGO workspace.
 * Role check is a convenience redirect only; the backend enforces access.
 */
export default function NgoLayout() {
  const { role } = useSession();
  if (role !== 'ngo' && role !== 'admin') return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="inbox" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="feed" options={{ animation: 'fade' }} />
      <Stack.Screen name="contributions" options={{ animation: 'fade' }} />
      <Stack.Screen name="organization" options={{ animation: 'fade' }} />
      <Stack.Screen name="contributions/compose" />
      <Stack.Screen name="review/[id]" />
    </Stack>
  );
}
