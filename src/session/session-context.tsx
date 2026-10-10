/**
 * In-memory session: which role the app is showing.
 *
 * The role only picks the home screen and tab set. It is NOT authorization;
 * the backend enforces permissions. Not persisted: a reload returns to public.
 * Until backend auth exists, non-public roles can only be entered from the
 * __DEV__ switcher, and are marked as demo sessions.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Href, router, useNavigationContainerRef } from 'expo-router';

import { loginDemoSession, logoutNgo } from '@/services/ngo-api';
import { Role } from '@/types/roles';

export interface Session {
  role: Role;
  isDemo: boolean;
}

interface SessionContextValue {
  role: Role;
  session: Session | null;
  /** Start a demo session for `role` and reset navigation to its home. */
  signInAs: (role: Exclude<Role, 'public'>) => Promise<void>;
  /** End the session and reset navigation to the public alerts. */
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function homeRouteFor(role: Role): Href {
  switch (role) {
    case 'coordinator':
      return '/ops/home';
    case 'field_worker':
      return '/ops/tasks';
    case 'ngo':
    case 'admin':
      return '/ngo/inbox';
    default:
      return '/alerts';
  }
}

/**
 * Replace the whole history with the role home, so Back can't return to
 * screens from a previous role (e.g. public screens after signing in).
 *
 * Resets the root navigator to the index route, which redirects by role.
 * Avoids router.dismissAll(): its POP_TO_TOP goes to the innermost stack and
 * warns "not handled by any navigator" when that stack has nothing to pop.
 */
function useResetToRoleHome() {
  const navigationRef = useNavigationContainerRef();
  return useCallback(
    (role: Role) => {
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: 'index' }] });
      } else {
        router.replace(homeRouteFor(role));
      }
    },
    [navigationRef]
  );
}

/** Replace the current screen with `href`; kept for existing callers. */
export function resetTo(href: Href) {
  router.replace(href);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const resetToRoleHome = useResetToRoleHome();

  const signInAs = useCallback(async (role: Exclude<Role, 'public'>) => {
    if (role === 'ngo' || role === 'admin') await loginDemoSession();
    // Same tick: the session update and the reset render together, so the
    // index redirect sees the new role.
    setSession({ role, isDemo: true });
    resetToRoleHome(role);
  }, [resetToRoleHome]);

  const signOut = useCallback(async () => {
    await logoutNgo();
    setSession(null);
    resetToRoleHome('public');
  }, [resetToRoleHome]);

  const value = useMemo(
    () => ({ role: session?.role ?? 'public', session, signInAs, signOut }),
    [session, signInAs, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
