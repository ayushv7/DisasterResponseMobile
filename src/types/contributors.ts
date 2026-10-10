/**
 * Contributors and their resources. The backend owns approval, credentials,
 * check-in policy, freshness, eligibility, allocation and plan versions.
 * The app sends what the user entered and shows what comes back.
 */
import { VolunteerApplicationStatus } from './volunteers';

export type ContributorApplicationStatus = VolunteerApplicationStatus;

export interface ContributorApplication {
  id: string;
  name: string;
  /** Masked contact; never shown on public screens. */
  contact: string;
  ngoId: string;
  ngoName: string;
  /** What the citizen says they can contribute, e.g. "2 boats, 50 food kits". */
  offering: string;
  area: string;
  status: ContributorApplicationStatus;
  decisionReason?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface ApplyToContributeInput {
  name: string;
  ngoId: string;
  offering: string;
  area: string;
  consent: boolean;
}

/** Issued by the backend on approval. Shown once to the NGO, never stored by the app. */
export interface ContributorCredentials {
  contributorId: string;
  signInCode: string;
  /** When the sign-in code stops working, if the backend sets one. */
  codeExpiresAt?: string;
}

export interface ContributorLoginInput {
  contributorId: string;
  signInCode: string;
}

export interface Contributor {
  contributorId: string;
  name: string;
  ngoId: string;
  ngoName: string;
}

// ── Resources ───────────────────────────────────────────────────────────────

/** Service-defined check-in policy for a resource type. Not a UI constant. */
export interface ResourceTypePolicy {
  type: string;
  label: string;
  unit: string;
  checkInIntervalHours: number;
}

export type ResourceCondition = 'GOOD' | 'FAIR' | 'POOR';

export const RESOURCE_CONDITION_LABELS: Record<ResourceCondition, string> = {
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

/** Freshness as decided by the backend. */
export type ResourceFreshness = 'FRESH' | 'DUE' | 'STALE' | 'PENDING' | 'UNVERIFIED';

export interface GpsReading {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
}

/** Supporting evidence, not proof. Kept apart from the descriptive fields. */
export interface ResourceEvidence {
  gps?: GpsReading;
  /** When the evidence was captured on the device (ISO 8601). */
  capturedAt: string;
  photoUrl?: string;
  /** True when submitted without live GPS or camera photo. */
  unverified: boolean;
  /** Set by the NGO when it doubts the evidence. */
  reviewNote?: string;
}

export interface ContributorResource {
  id: string;
  contributorId: string;
  ngoId: string;
  type: string;
  typeLabel: string;
  quantity: number;
  unit: string;
  condition: ResourceCondition;
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  freshness: ResourceFreshness;
  /** Backend explanation of freshness / eligibility. */
  statusReason?: string;
  eligibleForAllocation: boolean;
  lastCheckInAt?: string;
  checkInDueAt?: string;
  checkInIntervalHours?: number;
  evidence?: ResourceEvidence;
  /** Evidence records for this resource (Resource -> Evidence), newest last. */
  evidenceIds?: string[];
}

/** Shared evidence record for a task or a resource (Task/Resource -> Evidence). */
export interface EvidenceRecord {
  id: string;
  subjectType: 'TASK' | 'RESOURCE';
  subjectId: string;
  gps?: GpsReading;
  photoUrl?: string;
  note?: string;
  capturedAt: string;
  unverified: boolean;
}

/**
 * What a contributor must do for an approved plan: where to bring which
 * resource, by when, for which NGO. Issued by the backend.
 */
export interface ContributorInstruction {
  id: string;
  contributorId: string;
  resourceId: string;
  resourceLabel: string;
  taskId: string;
  planId: string;
  planVersion: number;
  where: string;
  what: string;
  deadline?: string;
  ngoName: string;
  issuedAt: string;
}

/** Evidence as captured on the device, before upload. */
export interface EvidenceDraft {
  gps?: GpsReading;
  capturedAt: string;
  /** Local camera file URI; uploaded through uploadEvidencePhoto. */
  photoUri?: string;
  /** Free-text note used when live capture was not possible. */
  note?: string;
}

export interface RegisterResourceInput {
  type: string;
  quantity: number;
  condition: ResourceCondition;
  evidence: { gps?: GpsReading; capturedAt: string; photoUrl?: string; note?: string };
}

export interface CheckInInput {
  available: boolean;
  evidence?: { gps?: GpsReading; capturedAt: string; photoUrl?: string; note?: string };
}

// ── Plans ───────────────────────────────────────────────────────────────────

export interface PlanActor {
  name: string;
  kind: 'SYSTEM' | 'NGO';
}

export interface PlanAllocation {
  id: string;
  workOrderId: string;
  workOrderLabel: string;
  resourceId: string;
  resourceLabel: string;
  quantity: number;
  source: 'AUTO' | 'MANUAL';
  /** Required for MANUAL allocations. */
  reason?: string;
  changedBy?: PlanActor;
  changedAt?: string;
}

export type PlanStatus = 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ResourcePlan {
  id: string;
  ngoId: string;
  /** Incident this plan responds to (Incident -> Plan). */
  incidentId?: string;
  incidentTitle?: string;
  /** PROPOSED until the NGO approves; approval publishes tasks and instructions. */
  status?: PlanStatus;
  /** Backend flag: something changed (task problem, missed check-in) and a replan is advised. */
  replanSuggested?: boolean;
  replanReasons?: string[];
  approvedAt?: string;
  approvedBy?: PlanActor;
  version: number;
  generatedAt: string;
  lastChangedBy?: PlanActor;
  lastChangedAt?: string;
  allocations: PlanAllocation[];
  /** Backend notes, e.g. manual allocations dropped on replan and why. */
  notes?: string[];
}

export interface ManualAllocationInput {
  planId: string;
  /** Version the NGO was looking at; the backend rejects stale versions. */
  expectedVersion: number;
  workOrderId: string;
  resourceId: string;
  quantity: number;
  reason: string;
}
