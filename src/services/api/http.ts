/**
 * httpApi — real backend client. Not implemented yet.
 *
 * Implement each method against the agreed FastAPI contract
 * (draft: docs/api-contract-proposal.md) using API_BASE_URL. Return
 * `source: 'live'` so sample-data labels disappear.
 */
import { ApiClient, HealthStatus, NotImplementedError } from './types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const HEALTH_TIMEOUT_MS = 5000;

/**
 * GET /health/ready. A 503 still carries a HealthStatus body ("unavailable"),
 * so it is returned as data rather than thrown; other failures throw.
 */
async function getHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}/health/ready`, { signal: controller.signal });
    if (!res.ok && res.status !== 503) throw new Error(`Health check failed: HTTP ${res.status}`);
    const data = (await res.json()) as HealthStatus;
    return { data, source: 'live' as const, receivedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

function notImplemented(method: string): () => Promise<never> {
  return () => Promise.reject(new NotImplementedError(method));
}

export const httpApi: ApiClient = {
  mode: 'http',
  getHealth,
  staffLogin: notImplemented('staffLogin'),
  workerLogin: notImplemented('workerLogin'),
  changeWorkerPassword: notImplemented('changeWorkerPassword'),
  getFieldTeam: notImplemented('getFieldTeam'),
  createWorker: notImplemented('createWorker'),
  disableWorker: notImplemented('disableWorker'),
  resetWorkerPassword: notImplemented('resetWorkerPassword'),
  assignTask: notImplemented('assignTask'),
  requestOtp: notImplemented('requestOtp'),
  verifyOtp: notImplemented('verifyOtp'),
  getNgoNeeds: notImplemented('getNgoNeeds'),
  offerHelp: notImplemented('offerHelp'),
  getMyOffers: notImplemented('getMyOffers'),
  setNotificationAreas: notImplemented('setNotificationAreas'),
  applyToContribute: notImplemented('applyToContribute'),
  getMyContributorApplication: notImplemented('getMyContributorApplication'),
  listContributorApplications: notImplemented('listContributorApplications'),
  decideContributorApplication: notImplemented('decideContributorApplication'),
  contributorLogin: notImplemented('contributorLogin'),
  getResourceTypePolicies: notImplemented('getResourceTypePolicies'),
  getMyResources: notImplemented('getMyResources'),
  // Needs the presigned-upload contract (POST /evidence/upload-url); see the API proposal.
  uploadEvidencePhoto: notImplemented('uploadEvidencePhoto'),
  registerResource: notImplemented('registerResource'),
  checkInResource: notImplemented('checkInResource'),
  getResourcePlan: notImplemented('getResourcePlan'),
  getResourcePlans: notImplemented('getResourcePlans'),
  approvePlan: notImplemented('approvePlan'),
  getMyInstructions: notImplemented('getMyInstructions'),
  getAllocatableResources: notImplemented('getAllocatableResources'),
  requestReplan: notImplemented('requestReplan'),
  allocateManually: notImplemented('allocateManually'),
  applyToVolunteer: notImplemented('applyToVolunteer'),
  getMyVolunteerApplication: notImplemented('getMyVolunteerApplication'),
  listVolunteerApplications: notImplemented('listVolunteerApplications'),
  decideVolunteerApplication: notImplemented('decideVolunteerApplication'),
  getOpsSummary: notImplemented('getOpsSummary'),
  getActionQueue: notImplemented('getActionQueue'),
  getIncidents: notImplemented('getIncidents'),
  getIncident: notImplemented('getIncident'),
  getWorkOrders: notImplemented('getWorkOrders'),
  getWorkOrder: notImplemented('getWorkOrder'),
  getMyTasks: notImplemented('getMyTasks'),
  getResources: notImplemented('getResources'),
  getRecommendation: notImplemented('getRecommendation'),
  assign: notImplemented('assign'),
  acknowledge: notImplemented('acknowledge'),
  start: notImplemented('start'),
  reportProblem: notImplemented('reportProblem'),
  submitCompletion: notImplemented('submitCompletion'),
  verify: notImplemented('verify'),
  getReassignments: notImplemented('getReassignments'),
  reassign: notImplemented('reassign'),
  getMyAlerts: notImplemented('getMyAlerts'),
  getAlertAreas: notImplemented('getAlertAreas'),
  getVerifiedNgos: notImplemented('getVerifiedNgos'),
  messageNgo: notImplemented('messageNgo'),
  getSentMessages: notImplemented('getSentMessages'),
  getNgoInbox: notImplemented('getNgoInbox'),
  publishUpdate: notImplemented('publishUpdate'),
  getNgoApplications: notImplemented('getNgoApplications'),
  approveNgo: notImplemented('approveNgo'),
  createNgo: notImplemented('createNgo'),
  getPublishedUpdates: notImplemented('getPublishedUpdates'),
  takedownUpdate: notImplemented('takedownUpdate'),
  getUpdatesForEvent: notImplemented('getUpdatesForEvent'),
  getLinkedIncident: notImplemented('getLinkedIncident'),
};
