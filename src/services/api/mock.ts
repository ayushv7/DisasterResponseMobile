/**
 * mockApi — wraps the existing fixture-backed services.
 * Adds simulated latency and an occasional simulated failure so loading and
 * error states get exercised. Every result is tagged `source: 'sample'`.
 */
import * as accounts from '@/services/accounts-api';
import * as offers from '@/services/offers-api';
import * as volunteers from '@/services/volunteers-api';
import * as contributors from '@/services/contributors-api';
import { onTaskChanged } from '@/services/mock/cascades';
import { createNgo, decideNgo, fetchNgoApplications } from '@/services/ngo-approval-api';
import { fetchSentMessages } from '@/services/messages-list-api';
import { fetchVerifiedNgos, submitPrivateMessage } from '@/services/messaging-api';
import {
  fetchNgoInbox,
  getCurrentNgoSession,
  fetchPublishedContributions,
  fetchPublishedUpdatesForEvent,
  publishContribution,
  takedownContribution,
} from '@/services/ngo-api';
import { SAMPLE_REFERENCE_TIME } from '@/fixtures/sample-operations';
import * as ops from '@/services/operations-api';

import {
  ActionQueueItem,
  ActionQueueReason,
  IncidentRecord,
  InterventionRecord,
  InterventionStatus,
  OperationalOverviewStats,
  OperationalResource,
  TaskActor,
} from '@/types/operations';

import { ApiClient, ApiResult } from './types';

/**
 * Stand-in for backend scoping: an NGO only gets incidents in its service
 * area (the backend selects nearby NGOs). Other callers get everything.
 */
function ngoArea(): string | null {
  return getCurrentNgoSession()?.serviceArea ?? null;
}

async function scopedIncidents(): Promise<IncidentRecord[]> {
  const all = await ops.fetchIncidents();
  const area = ngoArea();
  return area ? all.filter((i) => i.location.includes(area)) : all;
}

async function scopedWorkOrders(status?: InterventionStatus | 'ALL'): Promise<InterventionRecord[]> {
  const all = await ops.fetchInterventions(status);
  if (!ngoArea()) return all;
  const ids = new Set((await scopedIncidents()).map((i) => i.id));
  return all.filter((w) => ids.has(w.incidentId));
}

async function scopedStats(): Promise<OperationalOverviewStats> {
  const base = await ops.fetchOperationalStats();
  if (!ngoArea()) return base;
  const [incidents, items] = await Promise.all([scopedIncidents(), scopedWorkOrders()]);
  const count = (pred: (i: InterventionRecord) => boolean) => items.filter(pred).length;
  return {
    ...base,
    activeIncidents: incidents.filter((i) => i.status === 'ACTIVE').length,
    immediateInterventions: count((i) => i.priority === 'IMMEDIATE' && i.status !== 'VERIFIED_RESOLVED'),
    pendingAcknowledgement: count((i) => i.status === 'AWAITING_ACK'),
    inProgressTasks: count((i) => i.status === 'IN_PROGRESS' || i.status === 'EN_ROUTE'),
    blockedOrFailedInterventions: count((i) => i.status === 'BLOCKED' || i.status === 'FAILED'),
    awaitingVerification: count((i) => i.status === 'AWAITING_VERIFICATION'),
  };
}

/** Runs the simulated cascades after a task mutation (plan status, replan flag). */
async function withTaskCascade(run: () => Promise<InterventionRecord>): Promise<InterventionRecord> {
  const task = await run();
  onTaskChanged(task.id);
  return task;
}

/** The signed-in sample worker; the real backend takes this from the token. */
function workerActor(): TaskActor | undefined {
  const worker = accounts.getCurrentWorker();
  return worker ? { name: worker.name, ngoName: worker.ngoName } : undefined;
}

/** Stand-in for GET /work-orders?assignee=me. */
async function fetchMyTasks(): Promise<InterventionRecord[]> {
  const worker = accounts.getCurrentWorker();
  if (!worker) return [];
  const all = await ops.fetchInterventions();
  return all
    .filter((item) => item.assignedWorkerId === worker.id ||
        (!!worker.teamId && item.assignedTeamId === worker.teamId))
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
  assignTask: (workOrderId, memberId) =>
    simulate(async () => {
      const member = (await accounts.listWorkers()).find((m) => m.id === memberId);
      if (!member) throw new Error('Worker not found in your team.');
      if (member.status === 'DISABLED') throw new Error('This worker is disabled.');
      const ngo = getCurrentNgoSession();
      return withTaskCascade(() => ops.assignTaskToWorker(
        workOrderId,
        { id: member.id, name: member.name, ngoName: member.ngoName, isVolunteer: member.kind === 'VOLUNTEER' },
        { name: ngo?.authorizedOfficerName ?? 'NGO', ngoName: ngo?.ngoName }
      ));
    }),
  requestOtp: (contact) => simulate(() => accounts.requestOtp(contact)),
  verifyOtp: (challengeId, code) => simulate(() => accounts.verifyOtp(challengeId, code)),
  getNgoNeeds: () => simulate(offers.fetchNgoNeeds),
  offerHelp: (input) => simulate(() => offers.offerHelp(input)),
  getMyOffers: () => simulate(offers.fetchMyOffers),
  setNotificationAreas: (input) => simulate(() => accounts.setNotificationAreas(input)),
  applyToContribute: (input) => simulate(() => contributors.applyToContribute(input)),
  getMyContributorApplication: () => simulate(contributors.getMyContributorApplication),
  listContributorApplications: () => simulate(contributors.listContributorApplications),
  decideContributorApplication: (id, decision, reason) =>
    simulate(() => contributors.decideContributorApplication(id, decision, reason)),
  contributorLogin: (input) => simulate(() => contributors.contributorLogin(input)),
  getResourceTypePolicies: () => simulate(contributors.getResourceTypePolicies),
  getMyResources: () => simulate(contributors.getMyResources),
  uploadEvidencePhoto: (uri) => simulate(() => contributors.uploadEvidencePhoto(uri)),
  registerResource: (input) => simulate(() => contributors.registerResource(input)),
  checkInResource: (id, input) => simulate(() => contributors.checkInResource(id, input)),
  getResourcePlan: (incidentId) => simulate(() => contributors.getResourcePlan(incidentId)),
  getResourcePlans: () => simulate(contributors.getResourcePlans),
  approvePlan: (id, version) => simulate(() => contributors.approvePlan(id, version)),
  getMyInstructions: () => simulate(contributors.getMyInstructions),
  getAllocatableResources: () => simulate(contributors.getAllocatableResources),
  requestReplan: (id, version) => simulate(() => contributors.requestReplan(id, version)),
  allocateManually: (input) => simulate(() => contributors.allocateManually(input)),
  applyToVolunteer: (input) => simulate(() => volunteers.applyToVolunteer(input)),
  getMyVolunteerApplication: () => simulate(volunteers.getMyVolunteerApplication),
  listVolunteerApplications: () => simulate(volunteers.listVolunteerApplications),
  decideVolunteerApplication: (id, decision, reason) =>
    simulate(() => volunteers.decideVolunteerApplication(id, decision, reason)),

  getOpsSummary: () => simulate(scopedStats),
  getActionQueue: () =>
    simulate(async () => deriveActionQueue(await scopedWorkOrders(), Date.now())),
  getIncidents: () => simulate(scopedIncidents),
  getIncident: (id) => simulate(() => ops.fetchIncidentDetail(id)),
  getWorkOrders: (status) => simulate(() => scopedWorkOrders(status)),
  getWorkOrder: (id) => simulate(() => ops.fetchInterventionDetail(id)),
  getMyTasks: () => simulate(fetchMyTasks),
  getResources: () =>
    simulate(async () => rebaseReportTimes(await ops.fetchOperationalResources())),
  getRecommendation: (id) => simulate(() => ops.fetchAllocationRecommendation(id)),
  assign: (id, input) =>
    simulate(() =>
      withTaskCascade(() =>
        ops.assignIntervention(id, input.teamId, input.equipment, input.deadlineMinutes, input.overrideReason)
      )
    ),
  acknowledge: (id) => simulate(() => withTaskCascade(() => ops.acknowledgeTask(id, workerActor()))),
  start: (id) => simulate(() => withTaskCascade(() => ops.startTask(id, workerActor()))),
  reportProblem: (id, reason, isCritical, kind) =>
    simulate(() => withTaskCascade(() => ops.reportTaskBlocker(id, reason, isCritical, kind, workerActor()))),
  submitCompletion: (id, input) =>
    simulate(() =>
      withTaskCascade(() => ops.submitTaskCompletion(id, input.note, input.photoUris, workerActor()))
    ),
  // NGO users verify step 1; the authority's final step is backend-only for now
  verify: (id, approved) =>
    simulate(() =>
      withTaskCascade(() => {
        const ngo = getCurrentNgoSession();
        return ngo
          ? ops.ngoVerifyIntervention(id, approved, { name: ngo.authorizedOfficerName, ngoName: ngo.ngoName })
          : ops.verifyIntervention(id, approved);
      })
    ),
  getReassignments: () =>
    simulate(async () => {
      const records = await ops.fetchReplanningRecords();
      if (!ngoArea()) return records;
      const ids = new Set((await scopedIncidents()).map((i) => i.id));
      return records.filter((r) => ids.has(r.incidentId));
    }),
  reassign: (id, notes) => simulate(() => ops.executeReplanningDecision(id, notes)),

  getVerifiedNgos: () => simulate(fetchVerifiedNgos),
  messageNgo: (draft) => simulate(() => submitPrivateMessage(draft)),
  getSentMessages: () => simulate(fetchSentMessages),
  getNgoInbox: (filter) => simulate(() => fetchNgoInbox(filter)),
  publishUpdate: (input) => simulate(() => publishContribution(input)),

  getNgoApplications: () => simulate(fetchNgoApplications),
  approveNgo: (id, approved) => simulate(() => decideNgo(id, approved)),
  createNgo: (input) => simulate(() => createNgo(input)),
  getPublishedUpdates: () => simulate(fetchPublishedContributions),
  takedownUpdate: (id, reason) => simulate(() => takedownContribution(id, reason)),
  getUpdatesForEvent: (eventId) => simulate(() => fetchPublishedUpdatesForEvent(eventId)),
};
