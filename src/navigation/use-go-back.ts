import { useCallback } from 'react';
import { router } from 'expo-router';

import { homeRouteFor, useSession } from '@/session/session-context';

/**
 * Back that never dispatches an unhandled GO_BACK: with no screen to return
 * to (e.g. opened from a deep link or after a reset) it goes to the role home.
 */
export function useGoBack() {
  const { role } = useSession();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(homeRouteFor(role));
  }, [role]);
}
