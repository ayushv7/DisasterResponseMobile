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
  CreateWorkerInput,
  NgoMember,
  StaffLoginResult,
  WorkerCredentials,
  WorkerLoginInput,
  WorkerLoginResult,
} from '@/types/accounts';
import { SentMessage } from '@/types/message-thread';
import { MessageDraft, MessageReceipt, VerifiedNgo } from '@/types/messaging';
import { NgoContributionItem, NgoInboxFilter, NgoInboxMessage } from '@/types/ngo-workspace';
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
}

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`${method} is not implemented: backend contract pending.`);
    this.name = 'NotImplementedError';
  }
}
