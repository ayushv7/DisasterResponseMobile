import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session/session-context';

/**
 * Contributor area: own resources and check-ins only. Role check is a
 * convenience redirect; the backend enforces access.
 */
export default function ContributorLayout() {
  const { role } = useSession();
  if (role !== 'contributor') return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="resources" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="more" options={{ animation: 'fade', gestureEnabled: false }} />
      <Stack.Screen name="add-resource" />
      <Stack.Screen name="check-in/[id]" />
    </Stack>
  );
}
