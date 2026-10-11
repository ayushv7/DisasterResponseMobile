/**
 * Runtime data source: "Live backend" or "Sample data". Chosen in Settings
 * and saved with AsyncStorage, so even a release APK can point at a backend
 * without rebuilding. A saved URL overrides EXPO_PUBLIC_API_BASE_URL.
 */
import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DataMode = 'live' | 'sample';
export type HealthState = 'unknown' | 'checking' | 'ok' | 'db-down' | 'unreachable' | 'timeout';

export interface DataSourceState {
  /** False until the saved choice has been read from storage. */
  hydrated: boolean;
  mode: DataMode;
  /** Saved override; empty means use EXPO_PUBLIC_API_BASE_URL. */
  savedUrl: string;
  /** Result of the last /health/ready check (live mode). */
  health: HealthState;
}

const STORAGE_KEY = 'data-source-v1';
const HEALTH_TIMEOUT_MS = 5000;
const ENV_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();

let state: DataSourceState = {
  hydrated: false,
  mode: ENV_URL ? 'live' : 'sample',
  savedUrl: '',
  health: 'unknown',
};
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

/** Live mode is only active when there is a URL to talk to. */
export function isLiveActive(): boolean {
  return state.mode === 'live' && !!getBaseUrl();
}

/** http(s) only, trimmed. Returns the cleaned URL or null. */
export function normalizeUrl(input: string): string | null {
  const url = input.trim().replace(/\/+$/, '');
  return /^https?:\/\/[^\s/]+(\/\S*)?$/i.test(url) ? url : null;
}

/** GET {url}/health/ready → ok, database down, unreachable or timeout. */
export async function checkHealth(url: string): Promise<Exclude<HealthState, 'unknown' | 'checking'>> {
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
