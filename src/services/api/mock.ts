/**
 * mockApi — wraps the existing fixture-backed services.
 * Adds simulated latency and an occasional simulated failure so loading and
 * error states get exercised. Every result is tagged `source: 'sample'`.
 */
import { fetchSentMessages } from '@/services/messages-list-api';
import { fetchVerifiedNgos, submitPrivateMessage } from '@/services/messaging-api';
import { fetchNgoInbox, publishContribution } from '@/services/ngo-api';
import * as ops from '@/services/operations-api';

import { ActionQueueItem, ActionQueueReason, InterventionRecord } from '@/types/operations';

import { ApiClient, ApiResult } from './types';

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

export const mockApi: ApiClient = {
  mode: 'mock',

  getOpsSummary: () => simulate(ops.fetchOperationalStats),
  getActionQueue: () =>
    simulate(async () => deriveActionQueue(await ops.fetchInterventions(), Date.now())),
  getIncidents: () => simulate(ops.fetchIncidents),
  getIncident: (id) => simulate(() => ops.fetchIncidentDetail(id)),
  getWorkOrders: (status) => simulate(() => ops.fetchInterventions(status)),
  getWorkOrder: (id) => simulate(() => ops.fetchInterventionDetail(id)),
  getResources: () => simulate(ops.fetchOperationalResources),
  getRecommendation: (id) => simulate(() => ops.fetchAllocationRecommendation(id)),
  assign: (id, input) =>
    simulate(async () => {
      const record = await ops.assignIntervention(id, input.teamId, input.equipment, input.deadlineMinutes);
      return input.overrideReason ? { ...record, overrideReason: input.overrideReason } : record;
    }),
  acknowledge: (id) => simulate(() => ops.acknowledgeTask(id)),
  start: (id) => simulate(() => ops.startTask(id)),
  reportProblem: (id, reason, isCritical) =>
    simulate(() => ops.reportTaskBlocker(id, reason, isCritical)),
  submitCompletion: (id, input) =>
    simulate(async () => {
      const record = await ops.submitTaskCompletion(id, input.note);
      return { ...record, completionPhotoUris: input.photoUris };
    }),
  verify: (id, approved) => simulate(() => ops.verifyIntervention(id, approved)),
  getReassignments: () => simulate(ops.fetchReplanningRecords),
  reassign: (id, notes) => simulate(() => ops.executeReplanningDecision(id, notes)),

  getVerifiedNgos: () => simulate(fetchVerifiedNgos),
  messageNgo: (draft) => simulate(() => submitPrivateMessage(draft)),
  getSentMessages: () => simulate(fetchSentMessages),
  getNgoInbox: (filter) => simulate(() => fetchNgoInbox(filter)),
  publishUpdate: (input) => simulate(() => publishContribution(input)),
};
