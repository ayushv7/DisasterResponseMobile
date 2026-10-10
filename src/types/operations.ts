/**
 * Disaster Response Orchestration Network — Operational Types
 *
 * Models for the core operational workflow:
 * Detection -> Assessment -> Resource Identification -> Explainable Allocation ->
 * Field Worker Execution -> Replanning on Failure -> Verified Resolution.
 */

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type IncidentStatus = 'ACTIVE' | 'WATCH' | 'CONTAINED' | 'RESOLVED';

export interface IncidentRecord {
  id: string; // e.g. INC-2026-081
  title: string;
  location: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  affectedAreaDescription: string;
  estimatedPopulationImpact: number;
  criticalAssetsAtRisk: string[];
  detectionSource: string; // e.g. CWC Gauge Telemetry + SDRF Satellite
  detectedAt: string;
  unresolvedGaps: string[];
  requiredInterventionIds: string[];
}

export type InterventionType =
  | 'DEWATERING'
  | 'EMBANKMENT_REINFORCEMENT'
  | 'BOAT_EVACUATION'
  | 'MEDICAL_STABILIZATION'
  | 'DRINKING_WATER_LOGISTICS'
  | 'SEARCH_AND_RESCUE';

export type InterventionPriority = 'IMMEDIATE' | 'HIGH' | 'ROUTINE';

export type InterventionStatus =
  | 'AWAITING_ASSIGNMENT'
  | 'AWAITING_ACK'
  | 'EN_ROUTE'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'AWAITING_VERIFICATION'
  | 'VERIFIED_RESOLVED'
  | 'FAILED';

export interface InterventionRecord {
  id: string; // e.g. INT-101
  incidentId: string;
  incidentTitle: string;
  type: InterventionType;
  priority: InterventionPriority;
  status: InterventionStatus;
  targetLocality: string;
  instructions: string;
  requiredCapabilities: string[];
  constraints: string[]; // e.g. 'Grid power down', 'Submerged access causeway'
  
  // Assignment state
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedEquipment?: string[];
  assignedAt?: string;
  deadlineMinutes?: number;
  deadlineTimestamp?: string;

  // Execution timestamps & audit trail
  acknowledgedAt?: string;
  startedAt?: string;
  completedAt?: string;
  completionEvidence?: string;
  
  // Blocker / failure telemetry
  blockerReport?: {
    reportedAt: string;
    reason: string;
    isCritical: boolean;
  };
  
  contingencyPlan: string;
  /** Photo evidence URIs attached on completion (local URIs in mock mode). */
  completionPhotoUris?: string[];
  /** Set when the coordinator assigned something other than the recommendation. */
  overrideReason?: string;
  /** Append-only action history. */
  history?: TaskEvent[];
}

export type ResourceCategory = 'EQUIPMENT' | 'CREW' | 'VEHICLE';

export type OperationalCondition = 'OPERATIONAL' | 'DEGRADED' | 'MAINTENANCE_REQUIRED';

export type ResourceAvailability = 'AVAILABLE' | 'DEPLOYED' | 'RESERVED';

export interface OperationalResource {
  id: string; // e.g. RES-PUMP-01
  name: string;
  category: ResourceCategory;
  capabilities: string[];
  operationalCondition: OperationalCondition;
  availabilityStatus: ResourceAvailability;
  currentBaseLocation: string;
  proximityKm: number;
  specifications: string; // e.g. '6000 LPM Diesel Dewatering Pump'
  currentAssignmentId?: string;
  /** When the backend last received a status/condition report for this resource. Drives freshness. */
  statusReportedAt?: string;
}

export interface AllocationRecommendation {
  interventionId: string;
  recommendedTeamId: string;
  recommendedTeamName: string;
  recommendedEquipment: string[];
  matchingRationale: string;
  identifiedConstraints: string[];
  missingInputs: string[];
  suggestedDeadlineMinutes: number;
  alternativeOption: string;
}

export type ReplanningReason =
  | 'UNACKNOWLEDGED_DEADLINE'
  | 'EQUIPMENT_FAILURE'
  | 'ROUTE_BLOCKED'
  | 'INTERVENTION_UNSUCCESSFUL';

export interface ReplanningRecord {
  id: string; // e.g. REPLAN-301
  interventionId: string;
  incidentId: string;
  incidentTitle: string;
  targetLocality: string;
  triggerReason: ReplanningReason;
  originalAssignment: string;
  blockerDetails: string;
  recommendedAlternative: string;
  status: 'ESCALATED' | 'REASSIGNED' | 'PENDING_SUPERVISOR_ACTION';
  timestamp: string;
  /** What was actually assigned, once a decision is made (may differ from the recommendation). */
  actualAssignment?: string;
  decidedAt?: string;
}

export interface OperationalOverviewStats {
  activeIncidents: number;
  immediateInterventions: number;
  pendingAcknowledgement: number;
  inProgressTasks: number;
  blockedOrFailedInterventions: number;
  awaitingVerification: number;
  lastTelemetrySync: string;
}

export type TaskEventType =
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'STARTED'
  | 'PROBLEM_REPORTED'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REASSIGNED';

export interface TaskEvent {
  type: TaskEventType;
  at: string; // ISO 8601
  actor: string;
  note?: string;
}

/** Why a work order needs coordinator action now. Ordered most urgent first. */
export type ActionQueueReason =
  | 'FAILED'
  | 'BLOCKED'
  | 'OVERDUE_ACK'
  | 'UNASSIGNED'
  | 'NEEDS_VERIFICATION';

/** One item in the coordinator's "needs action now" queue (prioritized by the backend). */
export interface ActionQueueItem {
  workOrderId: string;
  incidentId: string;
  reason: ActionQueueReason;
  title: string;
  locality: string;
  priority: InterventionPriority;
  /** Deadline that was missed or is pending, if any (ISO 8601). */
  dueAt?: string;
  detail?: string;
}
