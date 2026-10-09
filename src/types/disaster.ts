/**
 * Disaster Response Orchestration Network — Domain Models & Enums
 *
 * Rules:
 * - Public users can view permitted flood events and source evidence.
 * - Public users CANNOT create official flood events, publish contributions, verify messages, or verify NGOs.
 * - Observations (from ingested government/news sources) are strictly distinct from NGO contributions.
 * - Distinct timestamps: source publication time vs system retrieval time.
 * - Event statuses: CANDIDATE, ACTIVE, RESOLVED, DISMISSED.
 * - Freshness states: FRESH, AGEING, STALE, SOURCE_UNAVAILABLE.
 */

export type EventStatus = 'CANDIDATE' | 'ACTIVE' | 'RESOLVED' | 'DISMISSED';

export type FreshnessState = 'FRESH' | 'AGEING' | 'STALE' | 'SOURCE_UNAVAILABLE';

/**
 * An observation ingested automatically from an approved government or news source.
 * Must display publication/observation time separately from system retrieval time.
 */
export interface SourceObservation {
  id: string;
  sourceName: string; // e.g. "Central Water Commission", "State Disaster Management Authority"
  sourceType: 'GOVERNMENT' | 'OFFICIAL_NEWS' | 'GAUGE_NETWORK';
  headline: string;
  evidenceSnippet: string;
  sourceUrl?: string;
  sourceObservedAt: string; // Time of publication/observation at the source
  systemRetrievedAt: string; // Time the system ingested/retrieved the data
}

/**
 * An attributed contribution published only by an independently verified & authorized NGO.
 * Strictly separated from raw automated source observations.
 */
export interface NgoContribution {
  id: string;
  ngoId: string;
  ngoName: string;
  isVerifiedNgo: boolean; // Must be true; only authorized administrator can verify NGO
  summary: string;
  actionTaken?: string;
  publishedAt: string;
}

/**
 * An official flood event compiled by the orchestration network.
 */
export interface FloodEvent {
  id: string;
  title: string;
  location: string;
  stateOrRegion: string;
  summary: string;
  status: EventStatus;
  severityLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  observations: SourceObservation[];
  contributions: NgoContribution[];
  latestSourceTime: string; // Earliest or latest observation reported by external source
  systemRetrievedTime: string; // System retrieval/ingestion timestamp
  freshness: FreshnessState;
  estimatedAffectedPeople?: number;
}

export type FeedFilterStatus = 'ALL' | EventStatus;

export type FeedUiState = 'loading' | 'success' | 'empty' | 'error' | 'stale';
