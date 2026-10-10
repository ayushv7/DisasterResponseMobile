/**
 * mockApi — wraps the existing fixture-backed services.
 * Adds simulated latency and an occasional simulated failure so loading and
 * error states get exercised. Every result is tagged `source: 'sample'`.
 */
import * as accounts from '@/services/accounts-api';
import { fetchSentMessages } from '@/services/messages-list-api';
import { fetchVerifiedNgos, submitPrivateMessage } from '@/services/messaging-api';
import { fetchNgoInbox, publishContribution } from '@/services/ngo-api';
import { SAMPLE_REFERENCE_TIME } from '@/fixtures/sample-operations';
import * as ops from '@/services/operations-api';

import {
  ActionQueueItem,
  ActionQueueReason,
  InterventionRecord,
  OperationalResource,
  TaskActor,
} from '@/types/operations';

import { ApiClient, ApiResult } from './types';

/** The signed-in sample worker; the real backend takes this from the token. */
function workerActor(): TaskActor | undefined {
  const worker = accounts.getCurrentWorker();
  return worker ? { name: worker.name, ngoName: worker.ngoName } : undefined;
}

/** Stand-in for GET /work-orders?assignee=me. */
async function fetchMyTasks(): Promise<InterventionRecord[]> {
  const worker = accounts.getCurrentWorker();
  if (!worker?.teamId) return [];
  const all = await ops.fetchInterventions();
  return all
    .filter((item) => item.assignedTeamId === worker.teamId)
    .map((item) => ({ ...item, assignedNgoName: worker.ngoName }));
}

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 800;

/** Probability (0–1) that a call fails. Adjustable from the dev screen. */
let failureRate = 0.02;

export function setMockFailureRate(rate: number) {
  failureRate = Math.min(1, Math.max(0, rate));
}

export function getMockFailureRate() {
  return failureRate;
}

async function simulate<T>(call: () => Promise<T>): Promise<ApiResult<T>> {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  await new Promise((resolve) => setTimeout(resolve, delay));
  if (Math.random() < failureRate) {
    throw new Error('Simulated network failure. Try again.');
  }
  const data = await call();
  return { data, source: 'sample', receivedAt: new Date().toISOString() };
}

const REASON_RANK: Record<ActionQueueReason, number> = {
  FAILED: 0,
  BLOCKED: 1,
  OVERDUE_ACK: 2,
  UNASSIGNED: 3,
  NEEDS_VERIFICATION: 4,
};
const PRIORITY_RANK = { IMMEDIATE: 0, HIGH: 1, ROUTINE: 2 } as const;

/**
 * Stand-in for the backend's prioritization: derives the queue from the
 * sample work orders. The real ordering must come from the server.
 */
function deriveActionQueue(items: InterventionRecord[], now: number): ActionQueueItem[] {
  const queue: ActionQueueItem[] = [];
  for (const item of items) {
    let reason: ActionQueueReason | null = null;
    if (item.status === 'FAILED') reason = 'FAILED';
    else if (item.status === 'BLOCKED') reason = 'BLOCKED';
    else if (
      item.status === 'AWAITING_ACK' &&
      item.deadlineTimestamp &&
      new Date(item.deadlineTimestamp).getTime() < now
    )
      reason = 'OVERDUE_ACK';
    else if (item.status === 'AWAITING_ASSIGNMENT') reason = 'UNASSIGNED';
    else if (item.status === 'AWAITING_VERIFICATION') reason = 'NEEDS_VERIFICATION';
    if (!reason) continue;
    queue.push({
      workOrderId: item.id,
      incidentId: item.incidentId,
      reason,
      title: item.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      locality: item.targetLocality,
      priority: item.priority,
      dueAt: item.deadlineTimestamp,
      detail: item.blockerReport?.reason,
    });
  }
  return queue.sort(
    (a, b) =>
      REASON_RANK[a.reason] - REASON_RANK[b.reason] ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  );
}

/** Keep sample report ages relative to now (see SAMPLE_REFERENCE_TIME). */
function rebaseReportTimes(resources: OperationalResource[]): OperationalResource[] {
  const shift = Date.now() - new Date(SAMPLE_REFERENCE_TIME).getTime();
  return resources.map((r) =>
    r.statusReportedAt
      ? { ...r, statusReportedAt: new Date(new Date(r.statusReportedAt).getTime() + shift).toISOString() }
      : r
  );
}

export const mockApi: ApiClient = {
  mode: 'mock',

  staffLogin: (email, password) => simulate(() => accounts.staffLogin(email, password)),
  workerLogin: (input) => simulate(() => accounts.workerLogin(input)),
  changeWorkerPassword: (pw) => simulate(() => accounts.changeWorkerPassword(pw)),
  getFieldTeam: () => simulate(accounts.listWorkers),
  createWorker: (input) => simulate(() => accounts.createWorker(input)),
  disableWorker: (id, disabled) => simulate(() => accounts.disableWorker(id, disabled)),
  resetWorkerPassword: (id) => simulate(() => accounts.resetWorkerPassword(id)),

  getOpsSummary: () => simulate(ops.fetchOperationalStats),
  getActionQueue: () =>
    simulate(async () => deriveActionQueue(await ops.fetchInterventions(), Date.now())),
  getIncidents: () => simulate(ops.fetchIncidents),
  getIncident: (id) => simulate(() => ops.fetchIncidentDetail(id)),
  getWorkOrders: (status) => simulate(() => ops.fetchInterventions(status)),
  getWorkOrder: (id) => simulate(() => ops.fetchInterventionDetail(id)),
  getMyTasks: () => simulate(fetchMyTasks),
  getResources: () =>
    simulate(async () => rebaseReportTimes(await ops.fetchOperationalResources())),
  getRecommendation: (id) => simulate(() => ops.fetchAllocationRecommendation(id)),
  assign: (id, input) =>
    simulate(() =>
      ops.assignIntervention(id, input.teamId, input.equipment, input.deadlineMinutes, input.overrideReason)
    ),
  acknowledge: (id) => simulate(() => ops.acknowledgeTask(id, workerActor())),
  start: (id) => simulate(() => ops.startTask(id, workerActor())),
  reportProblem: (id, reason, isCritical, kind) =>
    simulate(() => ops.reportTaskBlocker(id, reason, isCritical, kind, workerActor())),
  submitCompletion: (id, input) =>
    simulate(() => ops.submitTaskCompletion(id, input.note, input.photoUris, workerActor())),
  verify: (id, approved) => simulate(() => ops.verifyIntervention(id, approved)),
  getReassignments: () => simulate(ops.fetchReplanningRecords),
  reassign: (id, notes) => simulate(() => ops.executeReplanningDecision(id, notes)),

  getVerifiedNgos: () => simulate(fetchVerifiedNgos),
  messageNgo: (draft) => simulate(() => submitPrivateMessage(draft)),
  getSentMessages: () => simulate(fetchSentMessages),
  getNgoInbox: (filter) => simulate(() => fetchNgoInbox(filter)),
  publishUpdate: (input) => simulate(() => publishContribution(input)),
};
