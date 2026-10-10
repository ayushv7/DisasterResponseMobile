/**
 * Disaster Response Orchestration Network — Orchestration & Decision-Support Types
 *
 * Types for multi-source situational assessment, evidence-based recommendations,
 * NGO capability matching, and response coordination.
 */

export type AssessmentStatus = 'CRITICAL' | 'ELEVATED' | 'MONITORING' | 'STABILIZED';

export type FreshnessState = 'FRESH' | 'AGEING' | 'STALE' | 'SOURCE_UNAVAILABLE';

export type UrgencyLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'ROUTINE';

export type ActionLifecycle = 'RECOMMENDATION' | 'AUTHORIZED_DECISION' | 'COMPLETED';

export type CoordinationStatus = 'PROPOSED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ConflictingReport {
  id: string;
  topic: string;
  sources: string[];
  discrepancy: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedVerification: string;
}

export interface ProvenanceMetrics {
  governmentCount: number;
  gaugeCount: number;
  newsCount: number;
  citizenReportsCount: number;
  verifiedNgoCount: number;
}

export interface SituationAssessment {
  eventId: string;
  status: AssessmentStatus;
  provenance: ProvenanceMetrics;
  freshness: FreshnessState;
  uncertaintyScore: number; // 0 to 100 percentage
  uncertaintyRationale: string;
  conflictingReports: ConflictingReport[];
  lastAssessedAt: string;
}

export interface PrioritizedNeed {
  id: string;
  eventId: string;
  category: 'EVACUATION' | 'POTABLE_WATER' | 'SHELTER' | 'MEDICAL' | 'LOGISTICS';
  urgency: UrgencyLevel;
  affectedLocality: string;
  estimatedCountDescription: string;
  unresolvedGaps: string;
  evidenceSource: string;
}

export interface EvidenceCitation {
  sourceName: string;
  sourceType: string;
  citationSnippet: string;
  observedAt: string;
}

export interface ActionRecommendation {
  id: string;
  eventId: string;
  actionTitle: string;
  category: string;
  targetLocality: string;
  justification: string;
  urgency: UrgencyLevel;
  supportingEvidence: EvidenceCitation[];
  lifecycleState: ActionLifecycle;
  assignedNgoId?: string;
  assignedNgoName?: string;
  dependencies: string[];
  authorizedBy?: string;
  authorizedAt?: string;
}

export interface NgoCapabilityMatch {
  ngoId: string;
  ngoName: string;
  matchingFocusAreas: string[];
  proximityDescription: string;
  readinessStatus: 'STANDBY' | 'DEPLOYED' | 'EN_ROUTE';
  matchedNeeds: string[];
}

export interface ResponseCoordinationTask {
  id: string;
  eventId: string;
  actionId: string;
  title: string;
  responsibleOrg: string;
  status: CoordinationStatus;
  dependencies: string[];
  unresolvedNeeds: string;
  lastUpdated: string;
}

export interface OutcomeUpdateEntry {
  id: string;
  eventId: string;
  timestamp: string;
  headline: string;
  source: string;
  operationalImpact: string;
}
