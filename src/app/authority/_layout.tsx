import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/session/session-context';

/**
 * Authority area (coordinator and admin share it for now): NGO approval,
 * NGO accounts, suspension and takedown. No disaster assignment here; the
 * backend plans and NGOs execute. Role check is convenience only.
 */
export default function AuthorityLayout() {
  const { role } = useSession();
  if (role !== 'coordinator' && role !== 'admin') return <Redirect href="/" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', gestureEnabled: false }}>
      <Stack.Screen name="ngos" />
      <Stack.Screen name="create-ngo" />
      <Stack.Screen name="takedown" />
      <Stack.Screen name="more" />
    </Stack>
  );
}
