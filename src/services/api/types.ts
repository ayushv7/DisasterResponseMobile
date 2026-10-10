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
import { SentMessage } from '@/types/message-thread';
import { MessageDraft, MessageReceipt, VerifiedNgo } from '@/types/messaging';
import { NgoContributionItem, NgoInboxFilter, NgoInboxMessage } from '@/types/ngo-workspace';
import {
  AllocationRecommendation,
  IncidentRecord,
  InterventionRecord,
  InterventionStatus,
  OperationalOverviewStats,
  OperationalResource,
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

  // Operations
  getOpsSummary(): Promise<ApiResult<OperationalOverviewStats>>;
  getIncidents(): Promise<ApiResult<IncidentRecord[]>>;
  getIncident(
    id: string
  ): Promise<ApiResult<{ incident: IncidentRecord; interventions: InterventionRecord[] } | null>>;
  getWorkOrders(status?: InterventionStatus | 'ALL'): Promise<ApiResult<InterventionRecord[]>>;
  getWorkOrder(id: string): Promise<ApiResult<InterventionRecord | null>>;
  getResources(): Promise<ApiResult<OperationalResource[]>>;
  getRecommendation(workOrderId: string): Promise<ApiResult<AllocationRecommendation | null>>;
  assign(workOrderId: string, input: AssignInput): Promise<ApiResult<InterventionRecord>>;
  acknowledge(workOrderId: string): Promise<ApiResult<InterventionRecord>>;
  start(workOrderId: string): Promise<ApiResult<InterventionRecord>>;
  reportProblem(
    workOrderId: string,
    reason: string,
    isCritical: boolean
  ): Promise<ApiResult<InterventionRecord>>;
  submitCompletion(workOrderId: string, input: CompletionInput): Promise<ApiResult<InterventionRecord>>;
  verify(workOrderId: string, approved: boolean): Promise<ApiResult<InterventionRecord>>;
  getReassignments(): Promise<ApiResult<ReplanningRecord[]>>;
  reassign(reassignmentId: string, notes: string): Promise<ApiResult<ReplanningRecord>>;

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
