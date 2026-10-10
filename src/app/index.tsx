import { Redirect } from 'expo-router';

import { homeRouteFor, useSession } from '@/session/session-context';

/** Entry route: send each role to its own home. Public lands on /alerts. */
export default function IndexRedirect() {
  const { role } = useSession();
  return <Redirect href={homeRouteFor(role)} />;
}
