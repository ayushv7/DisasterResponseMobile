/**
 * mockApi — wraps the existing fixture-backed services.
 * Adds simulated latency and an occasional simulated failure so loading and
 * error states get exercised. Every result is tagged `source: 'sample'`.
 */
import { fetchSentMessages } from '@/services/messages-list-api';
import { fetchVerifiedNgos, submitPrivateMessage } from '@/services/messaging-api';
import { fetchNgoInbox, publishContribution } from '@/services/ngo-api';
import * as ops from '@/services/operations-api';

import { ApiClient, ApiResult } from './types';

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 800;

/** Probability (0–1) that a call fails. Adjustable from the dev screen. */
let failureRate = 0.05;

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

export const mockApi: ApiClient = {
  mode: 'mock',

  getOpsSummary: () => simulate(ops.fetchOperationalStats),
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
