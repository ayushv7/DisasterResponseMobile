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
  SAMPLE_OPERATIONAL_STATS,
} from '@/fixtures/sample-operations';
import {
  AllocationRecommendation,
  IncidentRecord,
  InterventionRecord,
  InterventionStatus,
  OperationalOverviewStats,
  OperationalResource,
  ReplanningReason,
  ReplanningRecord,
  TaskActor,
  TaskEventType,
} from '@/types/operations';
import { addEvidence, store } from '@/services/mock/store';

// All data lives in the shared mock store (src/services/mock/store.ts).

export async function fetchOperationalStats(): Promise<OperationalOverviewStats> {
  await new Promise((res) => setTimeout(res, 150));
  return {
    ...SAMPLE_OPERATIONAL_STATS,
    activeIncidents: store.incidents.filter((i) => i.status === 'ACTIVE').length,
    immediateInterventions: store.tasks.filter(
      (i) => i.priority === 'IMMEDIATE' && i.status !== 'VERIFIED_RESOLVED'
    ).length,
    pendingAcknowledgement: store.tasks.filter(
      (i) => i.status === 'AWAITING_ACK'
    ).length,
    inProgressTasks: store.tasks.filter(
      (i) => i.status === 'IN_PROGRESS' || i.status === 'EN_ROUTE'
    ).length,
    blockedOrFailedInterventions: store.tasks.filter(
      (i) => i.status === 'BLOCKED' || i.status === 'FAILED'
    ).length,
    awaitingVerification: store.tasks.filter(
      (i) => i.status === 'AWAITING_VERIFICATION'
    ).length,
    lastTelemetrySync: new Date().toISOString(),
  };
}

export async function fetchIncidents(): Promise<IncidentRecord[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(store.incidents));
}

export async function fetchIncidentDetail(
  id: string
): Promise<{ incident: IncidentRecord; interventions: InterventionRecord[] } | null> {
  await new Promise((res) => setTimeout(res, 150));
  const inc = store.incidents.find((i) => i.id === id);
  if (!inc) return null;
  const relatedInterventions = store.tasks.filter(
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
  let list = [...store.tasks];
  if (statusFilter && statusFilter !== 'ALL') {
    list = list.filter((i) => i.status === statusFilter);
  }
  return JSON.parse(JSON.stringify(list));
}

export async function fetchInterventionDetail(
  id: string
): Promise<InterventionRecord | null> {
  await new Promise((res) => setTimeout(res, 100));
  const found = store.tasks.find((i) => i.id === id);
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

export async function fetchOperationalResources(): Promise<OperationalResource[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(store.crews));
}

export async function fetchAllocationRecommendation(
  interventionId: string
): Promise<AllocationRecommendation | null> {
  await new Promise((res) => setTimeout(res, 120));
  const rec = SAMPLE_ALLOCATION_RECOMMENDATIONS[interventionId];
  return rec ? JSON.parse(JSON.stringify(rec)) : null;
}

/** Append to a work order's history (sample mode keeps it in memory). */
function logEvent(
  target: InterventionRecord,
  type: TaskEventType,
  actor: TaskActor | string,
  note?: string
) {
  const who = typeof actor === 'string' ? { name: actor } : actor;
  target.history = [
    ...(target.history ?? []),
    { type, at: new Date().toISOString(), actor: who.name, actorNgo: who.ngoName, note },
  ];
}

/** Fallback when no signed-in worker is known: the assigned team. */
function teamActor(target: InterventionRecord, actor?: TaskActor): TaskActor {
  return actor ?? { name: target.assignedTeamName || 'Field team', ngoName: target.assignedNgoName };
}

export async function assignIntervention(
  interventionId: string,
  teamId: string,
  equipment: string[],
  deadlineMinutes: number,
  overrideReason?: string
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  const team = store.crews.find((r) => r.id === teamId);
  target.assignedTeamId = teamId;
  target.assignedTeamName = team?.name || teamId;
  target.assignedEquipment = equipment;
  target.assignedAt = new Date().toISOString();
  target.deadlineMinutes = deadlineMinutes;
  target.deadlineTimestamp = new Date(
    Date.now() + deadlineMinutes * 60000
  ).toISOString();
  target.status = 'AWAITING_ACK';
  target.overrideReason = overrideReason;
  logEvent(
    target,
    'ASSIGNED',
    'Coordinator',
    `${target.assignedTeamName}${overrideReason ? ` (override: ${overrideReason})` : ''}`
  );

  return JSON.parse(JSON.stringify(target));
}

/** NGO assigns a task to one of its own workers (backend checks the worker belongs to it). */
export async function assignTaskToWorker(
  interventionId: string,
  worker: { id: string; name: string; ngoName: string; isVolunteer: boolean },
  actor: TaskActor
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 200));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);
  target.assignedWorkerId = worker.id;
  target.assignedWorkerName = worker.name;
  target.assignedWorkerIsVolunteer = worker.isVolunteer;
  target.assignedNgoName = worker.ngoName;
  if (target.status === 'AWAITING_ASSIGNMENT') target.status = 'AWAITING_ACK';
  logEvent(target, 'ASSIGNED', actor, `To ${worker.name}${worker.isVolunteer ? ' (Volunteer)' : ''}`);
  return JSON.parse(JSON.stringify(target));
}

export async function acknowledgeTask(
  interventionId: string,
  actor?: TaskActor
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 200));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'EN_ROUTE';
  target.acknowledgedAt = new Date().toISOString();
  logEvent(target, 'ACKNOWLEDGED', teamActor(target, actor));
  return JSON.parse(JSON.stringify(target));
}

export async function startTask(
  interventionId: string,
  actor?: TaskActor
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 200));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'IN_PROGRESS';
  target.startedAt = new Date().toISOString();
  logEvent(target, 'STARTED', teamActor(target, actor));
  return JSON.parse(JSON.stringify(target));
}

export async function reportTaskBlocker(
  interventionId: string,
  reason: string,
  isCritical: boolean,
  trigger: ReplanningReason = 'ROUTE_BLOCKED',
  actor?: TaskActor
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'BLOCKED';
  target.blockerReport = {
    reportedAt: new Date().toISOString(),
    reason,
    isCritical,
  };
  logEvent(target, 'PROBLEM_REPORTED', teamActor(target, actor), reason);

  // Create replanning entry
  const newReplan: ReplanningRecord = {
    id: `REPLAN-${Date.now()}`,
    interventionId: target.id,
    incidentId: target.incidentId,
    incidentTitle: target.incidentTitle,
    targetLocality: target.targetLocality,
    triggerReason: trigger,
    originalAssignment: `${target.assignedTeamName || 'Assigned Crew'}`,
    blockerDetails: reason,
    recommendedAlternative: target.contingencyPlan,
    status: 'PENDING_SUPERVISOR_ACTION',
    timestamp: new Date().toISOString(),
  };
  store.reassignments.unshift(newReplan);

  return JSON.parse(JSON.stringify(target));
}

export async function submitTaskCompletion(
  interventionId: string,
  evidence: string,
  photoUris: string[] = [],
  actor?: TaskActor
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  target.status = 'AWAITING_VERIFICATION';
  target.completedAt = new Date().toISOString();
  target.completionEvidence = evidence;
  target.completionPhotoUris = photoUris;
  const evidenceIds = (photoUris.length ? photoUris : [undefined]).map((uri) =>
    addEvidence({
      subjectType: 'TASK',
      subjectId: target.id,
      photoUrl: uri,
      note: evidence,
      capturedAt: new Date().toISOString(),
      unverified: !uri,
    })
  );
  target.evidenceIds = [...(target.evidenceIds ?? []), ...evidenceIds];
  target.ngoVerification = { status: 'PENDING' };
  target.authorityVerification = { status: 'PENDING' };
  logEvent(
    target,
    'COMPLETED',
    teamActor(target, actor),
    photoUris.length ? `${photoUris.length} photo(s) attached` : undefined
  );

  return JSON.parse(JSON.stringify(target));
}

/**
 * Step 1 of verification: the NGO signs off its worker's evidence. Approval
 * keeps the task awaiting the authority's final verification; rejection
 * reopens it for the worker.
 */
export async function ngoVerifyIntervention(
  interventionId: string,
  approved: boolean,
  actor: TaskActor
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);
  const step = { by: actor.ngoName ?? actor.name, at: new Date().toISOString() };
  if (approved) {
    target.ngoVerification = { status: 'VERIFIED', ...step };
    target.authorityVerification = target.authorityVerification ?? { status: 'PENDING' };
    logEvent(target, 'VERIFIED', actor, 'NGO check passed; awaiting authority');
  } else {
    target.ngoVerification = { status: 'REJECTED', ...step };
    target.status = 'IN_PROGRESS';
    logEvent(target, 'REJECTED', actor, 'NGO sent it back to the worker');
  }
  return JSON.parse(JSON.stringify(target));
}

export async function verifyIntervention(
  interventionId: string,
  approved: boolean
): Promise<InterventionRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const target = store.tasks.find((i) => i.id === interventionId);
  if (!target) throw new Error(`Intervention ${interventionId} not found.`);

  if (approved) {
    target.status = 'VERIFIED_RESOLVED';
    logEvent(target, 'VERIFIED', 'Coordinator');
  } else {
    target.status = 'IN_PROGRESS'; // rejected, work resumed
    logEvent(target, 'REJECTED', 'Coordinator');
  }

  return JSON.parse(JSON.stringify(target));
}

export async function fetchReplanningRecords(): Promise<ReplanningRecord[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(store.reassignments));
}

export async function executeReplanningDecision(
  replanningId: string,
  decisionNotes: string
): Promise<ReplanningRecord> {
  await new Promise((res) => setTimeout(res, 250));
  const replan = store.reassignments.find((r) => r.id === replanningId);
  if (!replan) throw new Error(`Replanning record ${replanningId} not found.`);

  replan.status = 'REASSIGNED';
  // Keep the recommendation as-is so recommended vs actual can be compared.
  replan.actualAssignment = decisionNotes;
  replan.decidedAt = new Date().toISOString();

  // Update underlying intervention to AWAITING_ASSIGNMENT with note
  const intTarget = store.tasks.find((i) => i.id === replan.interventionId);
  if (intTarget) {
    intTarget.status = 'AWAITING_ASSIGNMENT';
    intTarget.constraints.push(`Replanned: ${decisionNotes}`);
    logEvent(intTarget, 'REASSIGNED', 'Coordinator', decisionNotes);
  }

  return JSON.parse(JSON.stringify(replan));
}
