/**
 * Runtime data source. Live is the default: slices with a real backend
 * implementation call it, the rest stay mock. Settings > "Use sample data"
 * switches every slice to mock. Saved with AsyncStorage, so even a release
 * APK can point at a backend without rebuilding. A saved URL overrides
 * EXPO_PUBLIC_API_BASE_URL. Never switches to sample data on its own.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DataMode = 'live' | 'sample';
/** no-url: Live, but no backend URL is set anywhere. */
export type HealthState = 'unknown' | 'checking' | 'ok' | 'db-down' | 'unreachable' | 'timeout' | 'no-url';

export interface DataSourceState {
  /** False until the saved choice has been read from storage. */
  hydrated: boolean;
  mode: DataMode;
  /** Saved override; empty means use EXPO_PUBLIC_API_BASE_URL. */
  savedUrl: string;
  /** Result of the last /health/ready check (live mode). */
  health: HealthState;
  /**
   * Backend sign-in: 'active' while a token is held, 'expired' after the
   * backend answered 401. The token itself is never stored in this state.
   */
  auth: 'none' | 'active' | 'expired';
}

const STORAGE_KEY = 'data-source-v1';
const HEALTH_TIMEOUT_MS = 5000;
const ENV_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

let state: DataSourceState = {
  hydrated: false,
  mode: 'live',
  savedUrl: '',
  health: 'unknown',
  auth: 'none',
};

// Backend bearer token: memory only (cleared on sign-out and app restart).
let authToken: { token: string; expiresAt: number } | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<DataSourceState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getDataSource(): DataSourceState {
  return state;
}

export function subscribeDataSource(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React hook: re-renders when the mode, URL or health changes. */
export function useDataSource(): DataSourceState {
  return useSyncExternalStore(subscribeDataSource, getDataSource, getDataSource);
}

/** The backend URL in use: saved override, else the env value. No trailing slash. */
export function getBaseUrl(): string {
  return (state.savedUrl || ENV_URL).replace(/\/+$/, '');
}

export function setAuthToken(token: string, expiresInSeconds: number) {
  authToken = { token, expiresAt: Date.now() + expiresInSeconds * 1000 };
  set({ auth: 'active' });
}

export function clearAuthToken(reason: 'signed-out' | 'expired' = 'signed-out') {
  authToken = null;
  set({ auth: reason === 'expired' ? 'expired' : 'none' });
}

/** Current token, or null when missing or past its expiry. */
export function getAuthToken(): string | null {
  if (!authToken) return null;
  if (Date.now() >= authToken.expiresAt) {
    clearAuthToken('expired');
    return null;
  }
  return authToken.token;
}

/**
 * What a live screen should show instead of a plain error: the backend is
 * down/unset ('backend'), or the user must sign in with a backend account
 * ('sign-in'). Null when neither applies.
 */
export function liveProblem(s: DataSourceState = state): 'backend' | 'sign-in' | null {
  if (s.mode !== 'live') return null;
  if (isBackendFailing(s)) return 'backend';
  if (s.auth !== 'active') return 'sign-in';
  return null;
}

/** Live mode (the default). Without a URL, real slices fail with "No backend URL set". */
export function isLiveActive(): boolean {
  return state.mode === 'live';
}

/** True when the last health check failed (or no URL), so Live must not be claimed. */
export function isBackendFailing(s: DataSourceState = state): boolean {
  return s.mode === 'live' && ['db-down', 'unreachable', 'timeout', 'no-url'].includes(s.health);
}

/** http(s) only, trimmed. Returns the cleaned URL or null. */
export function normalizeUrl(input: string): string | null {
  const url = input.trim().replace(/\/+$/, '');
  return /^https?:\/\/[^\s/]+(\/\S*)?$/i.test(url) ? url : null;
}

/** GET {url}/health/ready → ok, database down, unreachable or timeout. */
export async function checkHealth(url: string): Promise<Exclude<HealthState, 'unknown' | 'checking' | 'no-url'>> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/health/ready`, { signal: controller.signal });
    if (res.status === 503) return 'db-down';
    if (!res.ok) return 'unreachable';
    const body = (await res.json().catch(() => null)) as { status?: string } | null;
    return body?.status === 'ok' ? 'ok' : 'db-down';
  } catch {
    return timedOut ? 'timeout' : 'unreachable';
  } finally {
    clearTimeout(timer);
  }
}

/** Re-checks the backend in live mode (also used by the banner's Retry). */
export async function refreshHealth() {
  if (!isLiveActive()) {
    set({ health: 'unknown' });
    return;
  }
  if (!getBaseUrl()) {
    set({ health: 'no-url' });
    return;
  }
  set({ health: 'checking' });
  set({ health: await checkHealth(getBaseUrl()) });
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: state.mode, savedUrl: state.savedUrl })).catch(() => {});
}

export function setDataMode(mode: DataMode) {
  set({ mode, health: 'unknown' });
  persist();
  refreshHealth();
}

/** Saves a URL override (already normalized), or clears it with ''. */
export function setSavedUrl(url: string) {
  set({ savedUrl: url, health: 'unknown' });
  persist();
  refreshHealth();
}

/** Reads the saved choice once at startup, then checks health if live. */
export async function hydrateDataSource() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Pick<DataSourceState, 'mode' | 'savedUrl'>>;
      set({
        mode: saved.mode === 'live' || saved.mode === 'sample' ? saved.mode : state.mode,
        savedUrl: typeof saved.savedUrl === 'string' ? saved.savedUrl : '',
      });
    }
  } catch {
    // keep defaults
  }
  set({ hydrated: true });
  refreshHealth();
}
