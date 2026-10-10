/**
 * Disaster Response Orchestration Network — Operational API Service
 *
 * BACKEND CONTRACT STATUS: UI SIMULATION HARNESS
 * ──────────────────────────────────────────────
 * Live deployment requires backend endpoints:
 *   GET   /api/v1/ops/overview
 *   GET   /api/v1/ops/incidents
 *   GET   /api/v1/ops/incidents/{id}
 *   GET   /api/v1/ops/interventions
 *   POST  /api/v1/ops/interventions/{id}/assign
 *   POST  /api/v1/ops/tasks/{id}/acknowledge
 *   POST  /api/v1/ops/tasks/{id}/start
 *   POST  /api/v1/ops/tasks/{id}/report-blocker
 *   POST  /api/v1/ops/tasks/{id}/complete
 *   POST  /api/v1/ops/verification/{id}/sign-off
 *   POST  /api/v1/ops/replanning/{id}/execute
 *
 * All operations below mutate in-memory state for development evaluation.
 * Does NOT claim real backend synchronization.
 */

import {
  SAMPLE_ALLOCATION_RECOMMENDATIONS,
  SAMPLE_INCIDENTS,
  SAMPLE_INTERVENTIONS,
  SAMPLE_OPERATIONAL_STATS,
  SAMPLE_REPLANNING_RECORDS,
  SAMPLE_RESOURCES,
} from '@/fixtures/sample-operations';
import {
  AllocationRecommendation,
  IncidentRecord,
  InterventionRecord,
  InterventionStatus,
  OperationalOverviewStats,
  OperationalResource,
  ReplanningRecord,
} from '@/types/operations';

let inMemoryIncidents: IncidentRecord[] = JSON.parse(
  JSON.stringify(SAMPLE_INCIDENTS)
);
let inMemoryInterventions: InterventionRecord[] = JSON.parse(
  JSON.stringify(SAMPLE_INTERVENTIONS)
);
let inMemoryResources: OperationalResource[] = JSON.parse(
  JSON.stringify(SAMPLE_RESOURCES)
);
let inMemoryReplanning: ReplanningRecord[] = JSON.parse(
  JSON.stringify(SAMPLE_REPLANNING_RECORDS)
);

export async function fetchOperationalStats(): Promise<OperationalOverviewStats> {
  await new Promise((res) => setTimeout(res, 150));
  return {
    ...SAMPLE_OPERATIONAL_STATS,
    activeIncidents: inMemoryIncidents.filter((i) => i.status === 'ACTIVE').length,
    immediateInterventions: inMemoryInterventions.filter(
      (i) => i.priority === 'IMMEDIATE' && i.status !== 'VERIFIED_RESOLVED'
    ).length,
    pendingAcknowledgement: inMemoryInterventions.filter(
      (i) => i.status === 'AWAITING_ACK'
    ).length,
    inProgressTasks: inMemoryInterventions.filter(
      (i) => i.status === 'IN_PROGRESS' || i.status === 'EN_ROUTE'
    ).length,
    blockedOrFailedInterventions: inMemoryInterventions.filter(
      (i) => i.status === 'BLOCKED' || i.status === 'FAILED'
    ).length,
    awaitingVerification: inMemoryInterventions.filter(
      (i) => i.status === 'AWAITING_VERIFICATION'
    ).length,
    lastTelemetrySync: new Date().toISOString(),
  };
}

export async function fetchIncidents(): Promise<IncidentRecord[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(inMemoryIncidents));
}

export async function fetchIncidentDetail(
  id: string
): Promise<{ incident: IncidentRecord; interventions: InterventionRecord[] } | null> {
  await new Promise((res) => setTimeout(res, 150));
  const inc = inMemoryIncidents.find((i) => i.id === id);
  if (!inc) return null;
  const relatedInterventions = inMemoryInterventions.filter(
    (i) => i.incidentId === id
  );
  return {
    incident: JSON.parse(JSON.stringify(inc)),
    interventions: JSON.parse(JSON.stringify(relatedInterventions)),
  };
}

export async function fetchInterventions(
  statusFilter?: InterventionStatus | 'ALL'
): Promise<InterventionRecord[]> {
  await new Promise((res) => setTimeout(res, 150));
  let list = [...inMemoryInterventions];
  if (statusFilter && statusFilter !== 'ALL') {
    list = list.filter((i) => i.status === statusFilter);
  }
  return JSON.parse(JSON.stringify(list));
}

export async function fetchInterventionDetail(
  id: string
): Promise<InterventionRecord | null> {
  await new Promise((res) => setTimeout(res, 100));
  const found = inMemoryInterventions.find((i) => i.id === id);
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

export async function fetchOperationalResources(): Promise<OperationalResource[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(inMemoryResources));
}

export async function fetchAllocationRecommendation(
  interventionId: string
): Promise<AllocationRecommendation | null> {
  await new Promise((res) => setTimeout(res, 120));
  const rec = SAMPLE_ALLOCATION_RECOMMENDATIONS[interventionId];
  return rec ? JSON.parse(JSON.stringify(rec)) : null;
}

export async function assignIntervention(
  interventionId: string,
  teamId: string,
  equipment: string[],
  deadlineMinutes: number
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = inMemoryInterventions.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  const team = inMemoryResources.find((r) => r.id === teamId);
  target.assignedTeamId = teamId;
  target.assignedTeamName = team?.name || teamId;
  target.assignedEquipment = equipment;
  target.assignedAt = new Date().toISOString();
  target.deadlineMinutes = deadlineMinutes;
  target.deadlineTimestamp = new Date(
    Date.now() + deadlineMinutes * 60000
  ).toISOString();
  target.status = 'AWAITING_ACK';

  return JSON.parse(JSON.stringify(target));
}

export async function acknowledgeTask(
  interventionId: string
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 200));
  const target = inMemoryInterventions.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'EN_ROUTE';
  target.acknowledgedAt = new Date().toISOString();
  return JSON.parse(JSON.stringify(target));
}

export async function startTask(
  interventionId: string
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 200));
  const target = inMemoryInterventions.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'IN_PROGRESS';
  target.startedAt = new Date().toISOString();
  return JSON.parse(JSON.stringify(target));
}

export async function reportTaskBlocker(
  interventionId: string,
  reason: string,
  isCritical: boolean
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = inMemoryInterventions.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'BLOCKED';
  target.blockerReport = {
    reportedAt: new Date().toISOString(),
    reason,
    isCritical,
  };

  // Create replanning entry
  const newReplan: ReplanningRecord = {
    id: `REPLAN-${Date.now()}`,
    interventionId: target.id,
    incidentId: target.incidentId,
    incidentTitle: target.incidentTitle,
    targetLocality: target.targetLocality,
    triggerReason: 'ROUTE_BLOCKED',
    originalAssignment: `${target.assignedTeamName || 'Assigned Crew'}`,
    blockerDetails: reason,
    recommendedAlternative: target.contingencyPlan,
    status: 'PENDING_SUPERVISOR_ACTION',
    timestamp: new Date().toISOString(),
  };
  inMemoryReplanning.unshift(newReplan);

  return JSON.parse(JSON.stringify(target));
}

export async function submitTaskCompletion(
  interventionId: string,
  evidence: string
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = inMemoryInterventions.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'AWAITING_VERIFICATION';
  target.completedAt = new Date().toISOString();
  target.completionEvidence = evidence;

  return JSON.parse(JSON.stringify(target));
}

export async function verifyIntervention(
  interventionId: string,
  approved: boolean
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = inMemoryInterventions.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  if (approved) {
    target.status = 'VERIFIED_RESOLVED';
  } else {
    target.status = 'IN_PROGRESS'; // rejected, work resumed
  }

  return JSON.parse(JSON.stringify(target));
}

export async function fetchReplanningRecords(): Promise<ReplanningRecord[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(inMemoryReplanning));
}

export async function executeReplanningDecision(
  replanningId: string,
  decisionNotes: string
): Promise<ReplanningRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const replan = inMemoryReplanning.find((r) => r.id === replanningId);
  if (!replan) throw new Error(`Replanning record ${replanningId} not found.`);

  replan.status = 'REASSIGNED';
  replan.recommendedAlternative += ` (Supervisor Action: ${decisionNotes})`;

  // Update underlying intervention to AWAITING_ASSIGNMENT with note
  const intTarget = inMemoryInterventions.find((i) => i.id === replan.interventionId);
  if (intTarget) {
    intTarget.status = 'AWAITING_ASSIGNMENT';
    intTarget.constraints.push(`Replanned: ${decisionNotes}`);
  }

  return JSON.parse(JSON.stringify(replan));
}
