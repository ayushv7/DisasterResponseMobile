/**
 * The visitor's area for public alerts. Only the resolved area ID is saved,
 * never coordinates or a location trail. The last alert result is cached so
 * the alert is still readable offline (shown with its "last updated" time).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { api, DataSource } from '@/services/api';
import { MyAlertsQuery, MyAlertsResult } from '@/types/my-alert';

const AREA_KEY = 'my-area-v1';
const CACHE_KEY = 'my-area-alerts-v1';

export interface CachedAlerts {
  result: MyAlertsResult;
  receivedAt: string;
  source: DataSource;
}

export type LocateOutcome =
  | { ok: true }
  | { ok: false; reason: 'denied' | 'services-off' | 'no-fix' | 'no-area' };

/** Rounds to 2 decimals (about 1 km) on the device before anything is sent. */
const coarse = (n: number) => Math.round(n * 100) / 100;

/** Last cached area result (also used by Message an NGO). */
export async function readCachedMyAlerts(): Promise<CachedAlerts | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedAlerts) : null;
  } catch {
    return null;
  }
}

export function useMyArea() {
  const [ready, setReady] = useState(false);
  const [areaId, setAreaId] = useState<string | null>(null);
  const [cached, setCached] = useState<CachedAlerts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFor = useCallback(async (query: MyAlertsQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMyAlerts(query);
      const next: CachedAlerts = { result: res.data, receivedAt: res.receivedAt, source: res.source };
      setCached(next);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(() => {});
      if (res.data.area) {
        setAreaId(res.data.area.id);
        AsyncStorage.setItem(AREA_KEY, res.data.area.id).catch(() => {});
      }
      return res.data;
    } catch (err) {
      // Keep the cached alert visible; the screen shows "offline, last updated"
      setError(err instanceof Error ? err.message : 'Could not load alerts.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [savedArea, cache] = await Promise.all([
        AsyncStorage.getItem(AREA_KEY).catch(() => null),
        readCachedMyAlerts(),
      ]);
      setCached(cache);
      setAreaId(savedArea);
      setReady(true);
      if (savedArea) fetchFor({ areaId: savedArea });
    })();
  }, [fetchFor]);

  const chooseArea = useCallback((id: string) => fetchFor({ areaId: id }), [fetchFor]);

  const refresh = useCallback(() => (areaId ? fetchFor({ areaId }) : Promise.resolve(null)), [areaId, fetchFor]);

  /** Foreground permission, one coarse fix, resolve to an area. Nothing is stored but the area ID. */
  const locate = useCallback(async (): Promise<LocateOutcome> => {
    try {
      if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'services-off' };
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) return { ok: false, reason: 'denied' };
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const result = await fetchFor({ lat: coarse(pos.coords.latitude), lng: coarse(pos.coords.longitude) });
      if (!result) return { ok: false, reason: 'no-fix' };
      return result.area ? { ok: true } : { ok: false, reason: 'no-area' };
    } catch {
      return { ok: false, reason: 'no-fix' };
    }
  }, [fetchFor]);

  return { ready, areaId, cached, loading, error, chooseArea, refresh, locate };
}
