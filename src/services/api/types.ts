/**
 * Single typed entry point for all backend data.
 *
 * - mockApi wraps the existing fixture-backed service modules (sample data,
 *   simulated latency and occasional failures). Nothing reaches a server.
 * - httpApi is the place to implement the real FastAPI calls; every method
 *   throws NotImplementedError until the backend contract is agreed
 *   (see docs/api-contract-proposal.md).
 *
 * Screens should migrate to `api` one at a time as they are touched.
 */
import {
  Citizen,
  CreateWorkerInput,
  NgoMember,
  NotificationAreasInput,
  OtpChallenge,
  StaffLoginResult,
  WorkerCredentials,
  WorkerLoginInput,
  WorkerLoginResult,
} from '@/types/accounts';
import {
  ApplyToContributeInput,
  Contributor,
  ContributorApplication,
  ContributorCredentials,
  ContributorLoginInput,
} from '@/types/contributors';
import { SentMessage } from '@/types/message-thread';
import { HelpOffer, NgoNeed, OfferHelpInput } from '@/types/offers';
import {
  ApplyToVolunteerInput,
  VolunteerApplication,
  VolunteerDecision,
} from '@/types/volunteers';
import { MessageDraft, MessageReceipt, VerifiedNgo } from '@/types/messaging';
import {
  CreateNgoInput,
  NgoApplication,
  NgoCredentials,
  NgoContributionItem,
  NgoInboxFilter,
  NgoInboxMessage,
} from '@/types/ngo-workspace';
import {
  ActionQueueItem,
  AllocationRecommendation,
  IncidentRecord,
  InterventionRecord,
  InterventionStatus,
  OperationalOverviewStats,
  OperationalResource,
  ReplanningReason,
  ReplanningRecord,
} from '@/types/operations';

/** 'sample' = local fixtures (mock mode). 'live' = returned by the backend. */
export type DataSource = 'sample' | 'live';

export interface ApiResult<T> {
  data: T;
  source: DataSource;
  /** When the client received the data (ISO 8601). Not a server timestamp. */
  receivedAt: string;
}

export type ApiMode = 'mock' | 'http';

export interface AssignInput {
  teamId: string;
  equipment: string[];
  deadlineMinutes: number;
  /** Required when the assignment differs from the recommendation. */
  overrideReason?: string;
}

export interface CompletionInput {
  note: string;
  photoUris: string[];
}

export type PublishUpdateInput = Parameters<
  typeof import('@/services/ngo-api').publishContribution
>[0];

export interface ApiClient {
  mode: ApiMode;

  // Accounts (PROPOSED; the backend issues codes, IDs, passwords and tokens)
  /** Email + password for ngo, coordinator and admin staff. */
  staffLogin(email: string, password: string): Promise<ApiResult<StaffLoginResult>>;
  /** NGO code + worker ID + password for field workers. */
  workerLogin(input: WorkerLoginInput): Promise<ApiResult<WorkerLoginResult>>;
  /** Replaces the temporary password on first sign-in. */
  changeWorkerPassword(newPassword: string): Promise<ApiResult<NgoMember>>;

  // NGO field team (PROPOSED). Credentials in responses are shown once, never stored.
  getFieldTeam(): Promise<ApiResult<NgoMember[]>>;
  createWorker(
    input: CreateWorkerInput
  ): Promise<ApiResult<{ member: NgoMember; credentials: WorkerCredentials }>>;
  /** `disabled: false` re-enables the worker. */
  disableWorker(memberId: string, disabled: boolean): Promise<ApiResult<NgoMember>>;
  resetWorkerPassword(memberId: string): Promise<ApiResult<WorkerCredentials>>;
  /** NGO assigns a task to one of its own workers. */
  assignTask(workOrderId: string, memberId: string): Promise<ApiResult<InterventionRecord>>;

  // Citizen (optional public account, PROPOSED). The backend sends the OTP.
  requestOtp(contact: string): Promise<ApiResult<OtpChallenge>>;
  verifyOtp(challengeId: string, code: string): Promise<ApiResult<Citizen>>;
  /** Needs published by verified NGOs, to respond to. */
  getNgoNeeds(): Promise<ApiResult<NgoNeed[]>>;
  /** Signed-in citizen only. Matching is done by the backend. */
  offerHelp(input: OfferHelpInput): Promise<ApiResult<HelpOffer>>;
  /** The signed-in citizen's offers with their current status. */
  getMyOffers(): Promise<ApiResult<HelpOffer[]>>;
  /** Saves alert areas and the push preference. Does not mean push is delivered. */
  setNotificationAreas(input: NotificationAreasInput): Promise<ApiResult<Citizen>>;

  // Contributors (PROPOSED). Credentials are issued by the backend on approval.
  applyToContribute(input: ApplyToContributeInput): Promise<ApiResult<ContributorApplication>>;
  getMyContributorApplication(): Promise<ApiResult<ContributorApplication | null>>;
  listContributorApplications(): Promise<ApiResult<ContributorApplication[]>>;
  /** `credentials` is present only on approval and is shown once. */
  decideContributorApplication(
    id: string,
    decision: VolunteerDecision,
    reason?: string
  ): Promise<ApiResult<{ application: ContributorApplication; credentials?: ContributorCredentials }>>;
  /** Throws ApiError INVALID_CREDENTIALS | CODE_EXPIRED | REVOKED | UNAUTHORIZED. */
  contributorLogin(input: ContributorLoginInput): Promise<ApiResult<Contributor>>;

  // Volunteers (PROPOSED). Eligibility comes from the backend, never the app.
  applyToVolunteer(input: ApplyToVolunteerInput): Promise<ApiResult<VolunteerApplication>>;
  /** The signed-in citizen's application, or null if none. */
  getMyVolunteerApplication(): Promise<ApiResult<VolunteerApplication | null>>;
  /** NGO: applications and invitations for its team, with eligibility results. */
  listVolunteerApplications(): Promise<ApiResult<VolunteerApplication[]>>;
  decideVolunteerApplication(
    id: string,
    decision: VolunteerDecision,
    reason?: string
  ): Promise<ApiResult<VolunteerApplication>>;

  // Operations
  getOpsSummary(): Promise<ApiResult<OperationalOverviewStats>>;
  /** Prioritized items needing coordinator action now. */
  getActionQueue(): Promise<ApiResult<ActionQueueItem[]>>;
  getIncidents(): Promise<ApiResult<IncidentRecord[]>>;
  getIncident(
    id: string
  ): Promise<ApiResult<{ incident: IncidentRecord; interventions: InterventionRecord[] } | null>>;
  getWorkOrders(status?: InterventionStatus | 'ALL'): Promise<ApiResult<InterventionRecord[]>>;
  getWorkOrder(id: string): Promise<ApiResult<InterventionRecord | null>>;
  /** Field worker: only the signed-in worker's tasks, tagged with their NGO. */
  getMyTasks(): Promise<ApiResult<InterventionRecord[]>>;
  getResources(): Promise<ApiResult<OperationalResource[]>>;
  getRecommendation(workOrderId: string): Promise<ApiResult<AllocationRecommendation | null>>;
  assign(workOrderId: string, input: AssignInput): Promise<ApiResult<InterventionRecord>>;
  acknowledge(workOrderId: string): Promise<ApiResult<InterventionRecord>>;
  start(workOrderId: string): Promise<ApiResult<InterventionRecord>>;
  reportProblem(
    workOrderId: string,
    reason: string,
    isCritical: boolean,
    kind?: ReplanningReason
  ): Promise<ApiResult<InterventionRecord>>;
  submitCompletion(workOrderId: string, input: CompletionInput): Promise<ApiResult<InterventionRecord>>;
  verify(workOrderId: string, approved: boolean): Promise<ApiResult<InterventionRecord>>;
  getReassignments(): Promise<ApiResult<ReplanningRecord[]>>;
  /** `actualAssignment` describes what was actually assigned (may differ from the recommendation). */
  reassign(reassignmentId: string, actualAssignment: string): Promise<ApiResult<ReplanningRecord>>;

  // Public ↔ NGO
  getVerifiedNgos(): Promise<ApiResult<VerifiedNgo[]>>;
  /** `data` is null in mock mode: nothing is sent and no receipt exists. */
  messageNgo(draft: MessageDraft): Promise<ApiResult<MessageReceipt | null>>;
  getSentMessages(): Promise<ApiResult<SentMessage[]>>;
  getNgoInbox(filter?: NgoInboxFilter): Promise<ApiResult<NgoInboxMessage[]>>;
  publishUpdate(input: PublishUpdateInput): Promise<ApiResult<NgoContributionItem>>;

  // Staff (coordinator/admin share one UI; the backend allows approval for admin only)
  getNgoApplications(): Promise<ApiResult<NgoApplication[]>>;
  /** Approve, or decline/suspend when `approved` is false. */
  approveNgo(ngoId: string, approved: boolean): Promise<ApiResult<NgoApplication>>;
  /** Authority creates an NGO account; credentials come back once. */
  createNgo(
    input: CreateNgoInput
  ): Promise<ApiResult<{ ngo: NgoApplication; credentials: NgoCredentials }>>;
  /** Published NGO updates, for authority review and takedown. */
  getPublishedUpdates(): Promise<ApiResult<NgoContributionItem[]>>;
  takedownUpdate(updateId: string, reason: string): Promise<ApiResult<NgoContributionItem>>;
}

/**
 * A rejected request with a machine-readable code from the backend, e.g.
 * INVALID_CREDENTIALS, CODE_EXPIRED, REVOKED, UNAUTHORIZED, RESOURCE_STALE,
 * RESOURCE_UNAVAILABLE, RESOURCE_INELIGIBLE, VERSION_CONFLICT, REASON_REQUIRED.
 * Screens show `message`; they may branch on `code` but never bypass it.
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not implemented: backend contract pending.`);
    this.name = 'NotImplementedError';
  }
}
