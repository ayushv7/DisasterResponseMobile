import { isLiveActive, subscribeDataSource } from './data-source';
import { httpApi } from './http';
import { mockApi } from './mock';
import { ApiClient } from './types';

/**
 * Per-slice data source. Each slice can move from the mock adapter to the
 * real backend on its own, once its endpoints exist (see
 * docs/api-contract-proposal.md). The Settings "Data source" switch picks
 * Live (this per-slice layout) or Sample (every slice mock) at runtime;
 * Live also needs a backend URL (Settings or EXPO_PUBLIC_API_BASE_URL).
 *
 * - health: GET /health/ready (implemented by the backend)
 * - incidents: GET /api/v1/flood-events and /{id} (implemented)
 * - observations: GET /api/v1/flood-events/{id}/observations (implemented)
 * - session: staff and field worker sign-in, POST /api/v1/auth/login and /auth/worker-login (implemented)
 * - resources, plans, tasks: core operations (mock until endpoints exist)
 * - auth: contributor sign-in, citizen OTP and NGO team management (mock)
 * - publicAlerts: area alerts for the public (stays mock + Simulated)
 * - community: messaging, NGO workspace, public accounts, offers, volunteers
 */
export type ApiSlice =
  | 'health'
  | 'incidents'
  | 'observations'
  | 'resources'
  | 'plans'
  | 'tasks'
  | 'session'
  | 'auth'
  | 'publicAlerts'
  | 'community';

export type SliceSource = 'mock' | 'http';

/** Per-slice switch used in Live mode. Flip a slice to 'http' only when its endpoints exist. */
export const LIVE_SLICE_SOURCES: Record<ApiSlice, SliceSource> = {
  health: 'http',
  incidents: 'http',
  observations: 'http',
  resources: 'mock',
  plans: 'mock',
  tasks: 'mock',
  session: 'http',
  auth: 'mock',
  publicAlerts: 'mock',
  community: 'mock',
};

export type ApiMethod = Exclude<keyof ApiClient, 'mode'>;

/** Which slice each method belongs to. TypeScript requires every method here. */
const METHOD_SLICES: Record<ApiMethod, ApiSlice> = {
  getHealth: 'health',

  getIncidents: 'incidents',
  getIncident: 'incidents',

  getIncidentObservations: 'observations',

  // No backend endpoints: derived from work orders, so they follow tasks
  getOpsSummary: 'tasks',
  getActionQueue: 'tasks',

  getMyAlerts: 'publicAlerts',
  getAlertAreas: 'publicAlerts',
  getLinkedIncident: 'publicAlerts',

  getResources: 'resources',
  getResourceTypePolicies: 'resources',
  getMyResources: 'resources',
  uploadEvidencePhoto: 'resources',
  registerResource: 'resources',
  checkInResource: 'resources',
  getAllocatableResources: 'resources',

  getRecommendation: 'plans',
  assign: 'plans',
  getReassignments: 'plans',
  reassign: 'plans',
  getResourcePlan: 'plans',
  getResourcePlans: 'plans',
  requestReplan: 'plans',
  allocateManually: 'plans',
  approvePlan: 'plans',
  getMyInstructions: 'plans',

  getWorkOrders: 'tasks',
  getWorkOrder: 'tasks',
  getMyTasks: 'tasks',
  assignTask: 'tasks',
  acknowledge: 'tasks',
  start: 'tasks',
  reportProblem: 'tasks',
  submitCompletion: 'tasks',
  verify: 'tasks',

  staffLogin: 'session',
  workerLogin: 'session',
  changeWorkerPassword: 'auth',
  contributorLogin: 'auth',
  requestOtp: 'auth',
  verifyOtp: 'auth',
  getFieldTeam: 'auth',
  createWorker: 'auth',
  disableWorker: 'auth',
  resetWorkerPassword: 'auth',

  getVerifiedNgos: 'community',
  messageNgo: 'community',
  getSentMessages: 'community',
  getNgoInbox: 'community',
  publishUpdate: 'community',
  getPublishedUpdates: 'community',
  takedownUpdate: 'community',
  getUpdatesForEvent: 'community',
  getNgoApplications: 'community',
  approveNgo: 'community',
  createNgo: 'community',
  getNgoNeeds: 'community',
  offerHelp: 'community',
  getMyOffers: 'community',
  setNotificationAreas: 'community',
  applyToContribute: 'community',
  getMyContributorApplication: 'community',
  listContributorApplications: 'community',
  decideContributorApplication: 'community',
  applyToVolunteer: 'community',
  getMyVolunteerApplication: 'community',
  listVolunteerApplications: 'community',
  decideVolunteerApplication: 'community',
};

const ALL_SLICES = Object.keys(LIVE_SLICE_SOURCES) as ApiSlice[];

function computeSources(): Record<ApiSlice, SliceSource> {
  const live = isLiveActive();
  return Object.fromEntries(ALL_SLICES.map((s) => [s, live ? LIVE_SLICE_SOURCES[s] : 'mock'])) as Record<
    ApiSlice,
    SliceSource
  >;
}

// Recomputed whenever the data source changes. They are live ES module
// bindings, so importers always read the current value.
/** Source each slice uses right now (Sample mode: all mock). */
export let SLICE_SOURCES = computeSources();
/** True when the slice is served by the mock adapter (keep its Simulated labels). */
export let IS_MOCK_SLICE = {} as Record<ApiSlice, boolean>;
/** Slices served by the real backend (shown in the BackendBanner). */
export let REAL_SLICES: ApiSlice[] = [];
/** True while any data slice is still mock, so sample/Simulated labels stay on. */
export let IS_MOCK_API = true;

function recompute() {
  SLICE_SOURCES = computeSources();
  IS_MOCK_SLICE = Object.fromEntries(ALL_SLICES.map((s) => [s, SLICE_SOURCES[s] === 'mock'])) as Record<
    ApiSlice,
    boolean
  >;
  REAL_SLICES = ALL_SLICES.filter((s) => SLICE_SOURCES[s] === 'http');
  IS_MOCK_API = ALL_SLICES.filter((s) => s !== 'health').some((s) => IS_MOCK_SLICE[s]);
  api.mode = IS_MOCK_API ? 'mock' : 'http';
}

/** The adapter a method uses right now. */
export function adapterFor(method: ApiMethod): ApiClient {
  return SLICE_SOURCES[METHOD_SLICES[method]] === 'http' ? httpApi : mockApi;
}

/** One client; each call is routed to its slice's current adapter (no restart needed). */
export const api: ApiClient = {
  mode: 'mock',
  ...(Object.fromEntries(
    (Object.keys(METHOD_SLICES) as ApiMethod[]).map((method) => [
      method,
      (...args: unknown[]) => (adapterFor(method)[method] as (...a: unknown[]) => unknown)(...args),
    ])
  ) as Omit<ApiClient, 'mode'>),
};

recompute();
subscribeDataSource(recompute);

export {
  checkHealth,
  clearAuthToken,
  getBaseUrl,
  getDataSource,
  hydrateDataSource,
  isBackendFailing,
  liveProblem,
  normalizeUrl,
  refreshHealth,
  setDataMode,
  setSavedUrl,
  useDataSource,
} from './data-source';
export type { DataMode, DataSourceState, HealthState } from './data-source';
export * from './types';
