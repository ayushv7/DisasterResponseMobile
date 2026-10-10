import { Redirect } from 'expo-router';

import { homeRouteFor, useSession } from '@/session/session-context';

/**
 * Entry route: send each role to its own home. Public lands on /alerts, or on
 * the start screen the first time the app runs. Signed-in roles never see it.
 */
export default function IndexRedirect() {
  const { role, welcomeSeen } = useSession();
  if (role === 'public') {
    if (welcomeSeen === null) return null; // reading the first-run flag
    if (!welcomeSeen) return <Redirect href="/welcome" />;
  }
  return <Redirect href={homeRouteFor(role)} />;
}
