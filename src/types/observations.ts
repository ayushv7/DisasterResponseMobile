/**
 * A source observation attached to an incident (backend flood observation).
 * Freshness is decided by the backend: FRESH < 1 h, RECENT < 24 h, else STALE.
 */
export type ObservationFreshness = 'FRESH' | 'RECENT' | 'STALE';

export interface IncidentObservation {
  id: string;
  incidentId?: string;
  /** observation_type, e.g. RIVER_LEVEL, WEATHER_WARNING, NGO_REPORT. */
  kind: string;
  headline: string;
  description?: string;
  location?: string;
  sourceName?: string;
  sourceCategory?: string;
  sourceApprovalStatus?: string;
  /** When observed or published at the source. */
  observedAt: string;
  /** When the system retrieved it. */
  retrievedAt?: string;
  sourceUrl?: string;
  verificationStatus?: string;
  freshness?: ObservationFreshness;
  freshnessRule?: string;
  isSample?: boolean;
}
