/**
 * In-memory session: which role the app is showing.
 *
 * The role only picks the home screen and tab set. It is NOT authorization;
 * the backend enforces permissions. Not persisted: a reload returns to public.
 * Until backend auth exists, non-public roles can only be entered from the
 * __DEV__ switcher, and are marked as demo sessions.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Href, router, useNavigationContainerRef } from 'expo-router';

import { selectSampleWorker, signOutAccounts, signOutCitizen } from '@/services/accounts-api';
import { selectSampleContributor, signOutContributor } from '@/services/contributors-api';
import { loginDemoSession, logoutNgo } from '@/services/ngo-api';
import { Citizen, SessionUser } from '@/types/accounts';
import { Role } from '@/types/roles';

export interface Session {
  role: Role;
  /** True for dev-switcher and mock-mode (simulated) sign-ins. */
  isDemo: boolean;
  /** Who is signed in, as returned by sign-in. Display only. */
  user?: SessionUser;
}

interface SignInOptions {
  user?: SessionUser;
  isDemo?: boolean;
}

interface SessionContextValue {
  role: Role;
  session: Session | null;
  /**
   * Start a session for `role` and reset navigation to its home. Without
   * `user` this is a dev-switcher demo session using sample identities.
   */
  signInAs: (role: Exclude<Role, 'public'>, options?: SignInOptions) => Promise<void>;
  /** End the session and reset navigation to the public alerts. */
  signOut: () => Promise<void>;
  /**
   * Optional citizen account. Role stays 'public'; signing in only unlocks
   * offers and alert areas, never emergency messaging.
   */
  citizen: Citizen | null;
  /** Set after verifyOtp, or after the backend returns an updated Citizen. */
  setCitizen: (citizen: Citizen) => void;
  signOutCitizen: () => void;
  /** Whether the first-run start screen was seen (null while loading from storage). */
  welcomeSeen: boolean | null;
  setWelcomeSeen: (seen: boolean) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const WELCOME_STORAGE_KEY = 'welcome-seen-v1';

export function homeRouteFor(role: Role): Href {
  switch (role) {
    case 'coordinator':
    case 'admin':
      // Authority (coordinator + admin) shares one console: NGO approval and oversight
      return '/authority/ngos';
    case 'field_worker':
      return '/ops/tasks';
    case 'contributor':
      return '/contributor/resources';
    case 'ngo':
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
  const [citizen, setCitizenState] = useState<Citizen | null>(null);
  const [welcomeSeen, setWelcomeSeenState] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_STORAGE_KEY)
      .then((v) => setWelcomeSeenState(v === '1'))
      .catch(() => setWelcomeSeenState(true));
  }, []);

  const setWelcomeSeen = useCallback((seen: boolean) => {
    setWelcomeSeenState(seen);
    (seen ? AsyncStorage.setItem(WELCOME_STORAGE_KEY, '1') : AsyncStorage.removeItem(WELCOME_STORAGE_KEY)).catch(
      () => {}
    );
  }, []);
  const resetToRoleHome = useResetToRoleHome();

  const signInAs = useCallback(async (role: Exclude<Role, 'public'>, options?: SignInOptions) => {
    let user = options?.user;
    if (role === 'ngo') {
      const ngo = await loginDemoSession();
      user = user ?? { name: ngo.authorizedOfficerName, ngoName: ngo.ngoName };
    }
    if (!user && role === 'contributor') {
      const c = selectSampleContributor();
      user = { name: c.name, ngoName: c.ngoName, workerId: c.contributorId };
    }
    if (!user && role === 'field_worker') {
      const member = selectSampleWorker();
      user = { name: member.name, ngoName: member.ngoName, workerId: member.workerId };
    }
    // Same tick: the session update and the reset render together, so the
    // index redirect sees the new role.
    setSession({ role, isDemo: options?.isDemo ?? true, user });
    resetToRoleHome(role);
  }, [resetToRoleHome]);

  const signOut = useCallback(async () => {
    await logoutNgo();
    signOutAccounts();
    signOutContributor();
    setSession(null);
    resetToRoleHome('public');
  }, [resetToRoleHome]);

  const setCitizen = useCallback((next: Citizen) => setCitizenState(next), []);
  const endCitizenSession = useCallback(() => {
    signOutCitizen();
    setCitizenState(null);
  }, []);

  const value = useMemo(
    () => ({
      role: session?.role ?? 'public',
      session,
      signInAs,
      signOut,
      citizen,
      setCitizen,
      signOutCitizen: endCitizenSession,
      welcomeSeen,
      setWelcomeSeen,
    }),
    [session, signInAs, signOut, citizen, setCitizen, endCitizenSession, welcomeSeen, setWelcomeSeen]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
