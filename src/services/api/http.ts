/**
 * httpApi — real backend client (FastAPI, disaster-response-backend).
 *
 * Implemented: health, flood events (incidents) and their observations.
 * Everything else throws NotImplementedError until its endpoints exist; the
 * per-slice switch in ./index.ts keeps those slices on the mock adapter.
 * Wire shapes are mapped in ./http-mapping.ts, never in screens.
 */
import { IncidentRecord } from '@/types/operations';

import { getBaseUrl, refreshHealth } from './data-source';

import {
  FloodEventDto,
  FloodObservationDto,
  mapFloodEvent,
  mapObservation,
  toApiError,
  wrapList,
} from './http-mapping';
import { ApiClient, ApiError, ApiResult, HealthStatus, NotImplementedError } from './types';

/** Build-time value; the URL actually used is getBaseUrl() (Settings can override it). */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const HEALTH_TIMEOUT_MS = 5000;

/**
 * GET /health/ready. A 503 still carries a HealthStatus body ("unavailable"),
 * so it is returned as data rather than thrown; other failures throw.
 */
async function getHealth() {
  if (!getBaseUrl()) throw new ApiError('NO_BACKEND_URL', 'No backend URL set.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await fetch(`${getBaseUrl()}/health/ready`, { signal: controller.signal });
    if (!res.ok && res.status !== 503) throw new Error(`Health check failed: HTTP ${res.status}`);
    const data = (await res.json()) as HealthStatus;
    return { data, source: 'live' as const, receivedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timer);
  }
}

const REQUEST_TIMEOUT_MS = 10000;

/** GET JSON; network failures and non-2xx `{detail}` bodies become ApiError. */
async function getJson<T>(path: string): Promise<{ body: T; dateHeader: string | null }> {
  if (!getBaseUrl()) {
    throw new ApiError('NO_BACKEND_URL', 'No backend URL set. Add one in Settings > Data source.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${getBaseUrl()}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch {
    refreshHealth(); // update the banner / unreachable state; never switches mode
    throw new ApiError('NETWORK', `Could not reach the backend at ${getBaseUrl()}.`);
  } finally {
    clearTimeout(timer);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) throw toApiError(res.status, body);
  return { body: body as T, dateHeader: res.headers.get('date') };
}

const live = <T>(data: T, page?: ApiResult<T>['page']): ApiResult<T> => ({
  data,
  source: 'live',
  receivedAt: new Date().toISOString(),
  page,
});

async function getIncidents(): Promise<ApiResult<IncidentRecord[]>> {
  const { body, dateHeader } = await getJson<FloodEventDto[]>('/api/v1/flood-events?limit=100');
  const page = wrapList(body.map(mapFloodEvent), dateHeader);
  return live(page.items, { nextCursor: page.nextCursor, serverTime: page.serverTime });
}

/**
 * One flood event. The backend has no work orders yet, so interventions is
 * empty (the tasks slice is still sample data and uses different IDs).
 */
async function getIncident(id: string) {
  try {
    const { body } = await getJson<FloodEventDto>(`/api/v1/flood-events/${encodeURIComponent(id)}`);
    return live({ incident: mapFloodEvent(body), interventions: [] });
  } catch (err) {
    if (err instanceof ApiError && err.code === 'NOT_FOUND') return live(null);
    throw err;
  }
}

async function getIncidentObservations(incidentId: string) {
  const { body, dateHeader } = await getJson<FloodObservationDto[]>(
    `/api/v1/flood-events/${encodeURIComponent(incidentId)}/observations?limit=100`
  );
  const page = wrapList(body.map(mapObservation), dateHeader);
  return live(page.items, { nextCursor: page.nextCursor, serverTime: page.serverTime });
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
  getIncidents,
  getIncident,
  getIncidentObservations,
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
