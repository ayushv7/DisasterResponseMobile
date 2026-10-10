import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session/session-context';

/**
 * Operations area: its own stack, so Back stays inside ops.
 * Role check is a convenience redirect only; the backend enforces access.
 */
export default function OpsLayout() {
  const { role } = useSession();
  // Ops screens now serve NGOs (scoped by the backend) and field workers.
  // Authority roles have their own area and are sent back to it.
  if (role === 'coordinator' || role === 'admin') return <Redirect href="/authority/ngos" />;
  if (role !== 'ngo' && role !== 'field_worker') return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="home" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="incidents" options={{ animation: 'fade' }} />
      <Stack.Screen name="tasks" options={{ animation: 'fade' }} />
      <Stack.Screen name="replanning" options={{ animation: 'fade' }} />
      <Stack.Screen name="more" options={{ animation: 'fade' }} />
      <Stack.Screen name="incident/[id]" />
      <Stack.Screen name="approve-ngos" />
    </Stack>
  );
}
