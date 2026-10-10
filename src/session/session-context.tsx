/**
 * In-memory session: which role the app is showing.
 *
 * The role only picks the home screen and tab set. It is NOT authorization;
 * the backend enforces permissions. Not persisted: a reload returns to public.
 * Until backend auth exists, non-public roles can only be entered from the
 * __DEV__ switcher, and are marked as demo sessions.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Href, router } from 'expo-router';

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
 * Replace the whole history with `href`, so Back can't return to screens
 * from a previous role (e.g. public screens after signing in).
 */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);

  const signInAs = useCallback(async (role: Exclude<Role, 'public'>) => {
    if (role === 'ngo' || role === 'admin') await loginDemoSession();
    setSession({ role, isDemo: true });
    resetTo(homeRouteFor(role));
  }, []);

  const signOut = useCallback(async () => {
    await logoutNgo();
    setSession(null);
    resetTo(homeRouteFor('public'));
  }, []);

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
