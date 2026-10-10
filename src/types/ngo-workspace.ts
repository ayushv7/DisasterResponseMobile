/**
 * Disaster Response Orchestration Network — NGO Workspace Types
 *
 * Types for the authorized NGO Inbox and Message Review flows.
 *
 * AUTHORIZATION RULES:
 * - Only accounts belonging to organizations marked VERIFIED by the backend
 *   may access protected NGO operations (reviewing, requesting clarification,
 *   rejecting, and preparing contributions).
 * - PENDING_VERIFICATION, REJECTED, or SUSPENDED organizations must NEVER receive
 *   publishing privileges. Organizations cannot verify themselves.
 * - This client code communicates with stub services until live FastAPI OAuth/JWT
 *   token authorization is connected.
 */

export type NgoOrgStatus =
  | 'VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'REJECTED'
  | 'SUSPENDED';

export interface NgoSession {
  ngoId: string;
  ngoName: string;
  verificationStatus: NgoOrgStatus;
  authorizedOfficerName: string;
  /** Issued by the backend; field workers enter it to sign in. */
  ngoCode?: string;
  focusAreas: string[];
  isDemoPreview: boolean;
}

export type NgoMessageStatus =
  | 'NEEDS_REVIEW'
  | 'CLARIFICATION_REQUESTED'
  | 'REVIEWED'
  | 'REJECTED'
  | 'PREPARED_FOR_PUBLICATION';

export type NgoInboxFilter = 'ALL' | 'NEEDS_REVIEW' | 'CLARIFICATION' | 'REVIEWED';

export interface LocationPrivacyMetadata {
  approximateArea: string;
  coordinatesRedacted: boolean;
  privacyNotice: string;
}

export interface AttachmentMetadata {
  id: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  isRedacted: boolean;
}

export interface StatusHistoryEntry {
  status: NgoMessageStatus;
  timestamp: string; // ISO 8601
  actor: string;
  notes?: string;
}

export interface NgoInboxMessage {
  messageId: string;
  eventId: string;
  eventTitle: string;
  senderPseudonym: string;
  receivedAt: string; // ISO 8601
  status: NgoMessageStatus;
  observationText: string;
  evidenceSummary: string;
  evidenceCount: number;
  locationMetadata: LocationPrivacyMetadata;
  attachments: AttachmentMetadata[];
  internalNotes?: string;
  statusHistory: StatusHistoryEntry[];
}

export type NgoInboxUiState = 'loading' | 'success' | 'empty' | 'error' | 'offline';

export type ContributionType =
  | 'SITUATION_UPDATE'
  | 'RELIEF_DISTRIBUTION'
  | 'EVACUATION_ROUTE'
  | 'MEDICAL_ASSISTANCE';

export type ContributionStatus = 'DRAFT' | 'PUBLISHED' | 'REJECTED_OR_CLOSED';

export interface NgoContributionItem {
  id: string;
  eventId: string;
  eventTitle: string;
  citizenMessageRef?: string;
  contributionType: ContributionType;
  summary: string;
  locality: string;
  needs?: string;
  availableResources?: string;
  evidenceReferences?: string;
  verificationMethod: string;
  authorOfficer: string;
  ngoId: string;
  ngoName: string;
  status: ContributionStatus;
  createdAt: string;
  publishedAt?: string;
}
