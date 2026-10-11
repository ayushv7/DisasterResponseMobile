import { useEffect, useRef } from 'react';

import { useToast } from '@/components/Toast';
import { getBaseUrl, hydrateDataSource, useDataSource } from '@/services/api';
import { useSession } from '@/session/session-context';

/**
 * Loads the saved data source once, then watches it. When the effective
 * source changes (Live/Sample or the backend URL), navigation is reset to the
 * role's home so every visible screen remounts and refetches from the new
 * source; nothing cached from the other source stays on screen.
 */
export function DataSourceWatcher() {
  const { mode, hydrated } = useDataSource();
  const { resetToHome } = useSession();
  const toast = useToast();
  const key = `${mode}|${getBaseUrl()}`;
  const lastKey = useRef(key);
  /** Hydrated as of the previous change; startup loading never shows a toast. */
  const wasHydrated = useRef(false);

  useEffect(() => {
    hydrateDataSource();
  }, []);

  useEffect(() => {
    if (lastKey.current !== key) {
      lastKey.current = key;
      resetToHome();
      if (wasHydrated.current) {
        toast(mode === 'live' ? 'Switched to live backend. Screens reloaded.' : 'Switched to sample data. Screens reloaded.');
      }
    }
    wasHydrated.current = hydrated;
  }, [key, hydrated, mode, resetToHome, toast]);

  return null;
}
