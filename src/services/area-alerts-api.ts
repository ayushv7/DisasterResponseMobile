/**
 * Area alerts — mock adapter (mock mode only). Resolves a coarse position or
 * a chosen area to one sample area and returns only that area's alerts.
 * Positions are used for this lookup and never stored.
 */
import { SAMPLE_ALERT_AREAS } from '@/fixtures/sample-area-alerts';
import { publishedAlertsForArea } from '@/services/mock/cascades';
import { AlertArea, MyAlertsQuery, MyAlertsResult } from '@/types/my-alert';

/** Positions further than this from every sample area resolve to "unknown area". */
const MAX_DISTANCE_KM = 60;

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const publicArea = ({ id, name, district, state }: AlertArea): AlertArea => ({ id, name, district, state });

export async function fetchAlertAreas(): Promise<AlertArea[]> {
  return SAMPLE_ALERT_AREAS.map(publicArea);
}

export async function fetchMyAlerts(query: MyAlertsQuery): Promise<MyAlertsResult> {
  let area = query.areaId ? SAMPLE_ALERT_AREAS.find((a) => a.id === query.areaId) : undefined;
  if (!area && query.lat != null && query.lng != null) {
    const nearest = SAMPLE_ALERT_AREAS.map((a) => ({ a, d: distanceKm(query.lat!, query.lng!, a.lat, a.lng) })).sort(
      (x, y) => x.d - y.d
    )[0];
    if (nearest && nearest.d <= MAX_DISTANCE_KM) area = nearest.a;
  }
  if (!area) return { area: null, alerts: [] };
  return { area: publicArea(area), alerts: publishedAlertsForArea(area.id) };
}
