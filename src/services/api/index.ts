import { API_BASE_URL, httpApi } from './http';
import { mockApi } from './mock';
import { ApiClient } from './types';

/**
 * Per-slice data source. Each slice can move from the mock adapter to the
 * real backend on its own, once its endpoints exist (see
 * docs/api-contract-proposal.md). Without EXPO_PUBLIC_API_BASE_URL every
 * slice is mock.
 *
 * - health: GET /health/ready (implemented by the backend)
 * - incidents, observations, resources, plans, tasks, auth: core operations
 * - community: messaging, NGO workspace, public accounts, offers, volunteers
 */
export type ApiSlice =
  | 'health'
  | 'incidents'
  | 'observations'
  | 'resources'
  | 'plans'
  | 'tasks'
  | 'auth'
  | 'community';

export type SliceSource = 'mock' | 'http';

const HAS_BACKEND = !!API_BASE_URL;

/** Flip a slice to 'http' only when its backend endpoints exist. */
export const SLICE_SOURCES: Record<ApiSlice, SliceSource> = {
  health: HAS_BACKEND ? 'http' : 'mock',
  incidents: 'mock',
  observations: 'mock', // no ApiClient methods yet; observations are read from fixtures
  resources: 'mock',
  plans: 'mock',
  tasks: 'mock',
  auth: 'mock',
  community: 'mock',
};

type ApiMethod = Exclude<keyof ApiClient, 'mode'>;

/** Which slice each method belongs to. TypeScript requires every method here. */
const METHOD_SLICES: Record<ApiMethod, ApiSlice> = {
  getHealth: 'health',

  getOpsSummary: 'incidents',
  getActionQueue: 'incidents',
  getIncidents: 'incidents',
  getIncident: 'incidents',
  getLinkedIncident: 'incidents',
  getMyAlerts: 'incidents',
  getAlertAreas: 'incidents',

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

  staffLogin: 'auth',
  workerLogin: 'auth',
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

const DATA_SLICES = (Object.keys(SLICE_SOURCES) as ApiSlice[]).filter((s) => s !== 'health');

/** True when the slice is served by the mock adapter (keep its Simulated labels). */
export const IS_MOCK_SLICE = Object.fromEntries(
  (Object.keys(SLICE_SOURCES) as ApiSlice[]).map((s) => [s, SLICE_SOURCES[s] === 'mock'])
) as Record<ApiSlice, boolean>;

/** Slices served by the real backend (shown in the BackendBanner). */
export const REAL_SLICES = (Object.keys(SLICE_SOURCES) as ApiSlice[]).filter((s) => SLICE_SOURCES[s] === 'http');

/** True while any data slice is still mock, so sample/Simulated labels stay on. */
export const IS_MOCK_API = DATA_SLICES.some((s) => IS_MOCK_SLICE[s]);

/** One client; each method comes from its slice's adapter. */
export const api: ApiClient = {
  mode: IS_MOCK_API ? 'mock' : 'http',
  ...(Object.fromEntries(
    (Object.keys(METHOD_SLICES) as ApiMethod[]).map((method) => {
      const adapter = SLICE_SOURCES[METHOD_SLICES[method]] === 'http' ? httpApi : mockApi;
      return [method, adapter[method]];
    })
  ) as Omit<ApiClient, 'mode'>),
};

export * from './types';
