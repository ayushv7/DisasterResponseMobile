/**
 * Area alerts for the public. The backend decides which area a user is in
 * (from coarse location or a chosen area) and which alert applies. The app
 * never shows other areas' incidents, raw observations or counts to the public.
 */
export type AlertLevel = 'ADVISORY' | 'WARNING' | 'EVACUATE';

export interface AlertArea {
  id: string;
  name: string;
  district: string;
  state: string;
}

export interface Helpline {
  label: string;
  number: string;
}

export interface MyAlert {
  id: string;
  areaId: string;
  areaName: string;
  level: AlertLevel;
  headline: string;
  issuedAt: string;
  updatedAt: string;
  expiresAt?: string;
  /** Ordered steps for right now. */
  whatToDo: string[];
  doNot: string[];
  shelter?: { name: string; address: string; routeNote?: string };
  helplines: Helpline[];
  issuedBy: { authority: string; ngoName?: string };
  /** Public alert this maps to (links messages and NGO updates for the area). */
  eventId?: string;
}

export interface MyAlertsQuery {
  /** Coarse position only (rounded on the device, about 1 km). Never stored. */
  lat?: number;
  lng?: number;
  areaId?: string;
}

export interface MyAlertsResult {
  /** The area the backend resolved, or null if it could not tell. */
  area: AlertArea | null;
  alerts: MyAlert[];
}
