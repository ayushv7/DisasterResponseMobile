/**
 * Disaster Response Orchestration Network — NGO API Service (STUB)
 *
 * BACKEND CONTRACT STATUS: UI-ONLY STUB / DEV HARNESS
 * ───────────────────────────────────────────────────
 * Live endpoints require FastAPI OAuth/JWT authentication and independent
 * administrative verification of the NGO organization.
 *
 * Endpoints expected when live:
 *   POST  /api/v1/auth/login                 → { token, session: NgoSession }
 *   GET   /api/v1/ngo/me                     → NgoSession
 *   GET   /api/v1/ngo/inbox                  → NgoInboxMessage[]
 *   GET   /api/v1/ngo/messages/{messageId}   → NgoInboxMessage
 *   POST  /api/v1/ngo/messages/{id}/clarify  → { status: 'CLARIFICATION_REQUESTED' }
 *   POST  /api/v1/ngo/messages/{id}/reject   → { status: 'REJECTED' }
 *   GET   /api/v1/ngo/contributions          → NgoContributionItem[]
 *   POST  /api/v1/ngo/contributions/draft    → NgoContributionItem
 *   POST  /api/v1/ngo/contributions/publish  → NgoContributionItem
 */

import { DEFAULT_MOCK_NGO_SESSION } from '@/fixtures/sample-ngo-inbox';
import { incidentForEvent, store } from '@/services/mock/store';
import {
  NgoContributionItem,
  NgoInboxFilter,
  NgoInboxMessage,
  NgoOrgStatus,
  NgoSession,
} from '@/types/ngo-workspace';

export const IS_STUB_NGO_API = true;

// Active session state. Starts with null (unauthenticated) by default
let currentSession: NgoSession | null = null;

// Inbox messages and updates live in the shared mock store (src/services/mock/store.ts).


export async function loginNgo(
  _email: string,
  _password: string
): Promise<NgoSession> {
  await new Promise((res) => setTimeout(res, 400));
  throw new Error(
    'FastAPI backend authentication endpoint is not yet connected. Real credentials cannot be authenticated.'
  );
}

/**
 * Creates a clearly marked mock session for UI testing of responder views.
 * Only accessible during development (__DEV__).
 */
export async function loginDemoSession(): Promise<NgoSession> {
  await new Promise((res) => setTimeout(res, 200));
  currentSession = {
    ...DEFAULT_MOCK_NGO_SESSION,
    isDemoPreview: true,
  };
  return { ...currentSession };
}

/** Mock scoping only: the signed-in NGO, read synchronously. */
export function getCurrentNgoSession(): NgoSession | null {
  return currentSession ? { ...currentSession } : null;
}

export async function logoutNgo(): Promise<void> {
  await new Promise((res) => setTimeout(res, 150));
  currentSession = null;
}

export async function fetchNgoSession(): Promise<NgoSession | null> {
  await new Promise((res) => setTimeout(res, 150));
  return currentSession ? { ...currentSession } : null;
}

export function setMockOrgStatus(status: NgoOrgStatus): NgoSession {
  if (!currentSession) {
    currentSession = { ...DEFAULT_MOCK_NGO_SESSION };
  }
  currentSession = {
    ...currentSession,
    verificationStatus: status,
  };
  return { ...currentSession };
}

export async function fetchNgoInbox(
  filter: NgoInboxFilter = 'ALL'
): Promise<NgoInboxMessage[]> {
  await new Promise((res) => setTimeout(res, 250));
  assertAuthenticatedAndVerified();

  let list = [...store.ngoMessages];
  if (filter === 'NEEDS_REVIEW') {
    list = list.filter((m) => m.status === 'NEEDS_REVIEW');
  } else if (filter === 'CLARIFICATION') {
    list = list.filter((m) => m.status === 'CLARIFICATION_REQUESTED');
  } else if (filter === 'REVIEWED') {
    list = list.filter(
      (m) =>
        m.status === 'REVIEWED' ||
        m.status === 'REJECTED' ||
        m.status === 'PREPARED_FOR_PUBLICATION'
    );
  }

  return list;
}

export async function fetchNgoMessageDetail(
  messageId: string
): Promise<NgoInboxMessage> {
  await new Promise((res) => setTimeout(res, 200));
  assertAuthenticatedAndVerified();

  const found = store.ngoMessages.find((m) => m.messageId === messageId);
  if (!found) {
    throw new Error(`Message ${messageId} not found.`);
  }

  return JSON.parse(JSON.stringify(found));
}

export async function requestClarification(
  messageId: string,
  clarificationText: string,
  internalNotes?: string
): Promise<NgoInboxMessage> {
  await new Promise((res) => setTimeout(res, 300));
  assertAuthenticatedAndVerified();

  const msg = store.ngoMessages.find((m) => m.messageId === messageId);
  if (!msg) throw new Error('Message not found.');

  msg.status = 'CLARIFICATION_REQUESTED';
  if (internalNotes !== undefined) msg.internalNotes = internalNotes;
  msg.statusHistory.unshift({
    status: 'CLARIFICATION_REQUESTED',
    timestamp: new Date().toISOString(),
    actor: currentSession!.authorizedOfficerName,
    notes: clarificationText,
  });

  return JSON.parse(JSON.stringify(msg));
}

export async function rejectAndCloseMessage(
  messageId: string,
  rejectionReason: string,
  internalNotes?: string
): Promise<NgoInboxMessage> {
  await new Promise((res) => setTimeout(res, 300));
  assertAuthenticatedAndVerified();

  const msg = store.ngoMessages.find((m) => m.messageId === messageId);
  if (!msg) throw new Error('Message not found.');

  msg.status = 'REJECTED';
  if (internalNotes !== undefined) msg.internalNotes = internalNotes;
  msg.statusHistory.unshift({
    status: 'REJECTED',
    timestamp: new Date().toISOString(),
    actor: currentSession!.authorizedOfficerName,
    notes: `Closed: ${rejectionReason}`,
  });

  return JSON.parse(JSON.stringify(msg));
}

export async function prepareContributionForPublication(
  messageId: string,
  internalNotes?: string
): Promise<NgoInboxMessage> {
  await new Promise((res) => setTimeout(res, 300));
  assertAuthenticatedAndVerified();

  const msg = store.ngoMessages.find((m) => m.messageId === messageId);
  if (!msg) throw new Error('Message not found.');

  msg.status = 'PREPARED_FOR_PUBLICATION';
  if (internalNotes !== undefined) msg.internalNotes = internalNotes;
  msg.statusHistory.unshift({
    status: 'PREPARED_FOR_PUBLICATION',
    timestamp: new Date().toISOString(),
    actor: currentSession!.authorizedOfficerName,
    notes: 'Drafted contribution verified and queued for editorial publishing approval.',
  });

  return JSON.parse(JSON.stringify(msg));
}

// ── CONTRIBUTIONS CRUD ──────────────────────────────────────────

export async function fetchNgoContributions(): Promise<NgoContributionItem[]> {
  await new Promise((res) => setTimeout(res, 250));
  assertAuthenticatedAndVerified();
  return JSON.parse(JSON.stringify(store.ngoUpdates));
}

/** Public view: published contributions only (GET /incidents/{id}/updates). No NGO session needed. */
export async function fetchPublishedContributions(): Promise<NgoContributionItem[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(store.ngoUpdates.filter((c) => c.status === 'PUBLISHED')));
}

/** Authority takedown of a published update (POST /admin/updates/{id}/takedown). */
/** Public: published updates for an alert, matched by alert or by its linked incident. */
export async function fetchPublishedUpdatesForEvent(eventId: string): Promise<NgoContributionItem[]> {
  await new Promise((res) => setTimeout(res, 150));
  const incidentId = incidentForEvent(eventId);
  return JSON.parse(
    JSON.stringify(
      store.ngoUpdates.filter(
        (c) => c.status === 'PUBLISHED' && (c.eventId === eventId || (!!incidentId && c.incidentId === incidentId))
      )
    )
  );
}

export async function takedownContribution(id: string, reason: string): Promise<NgoContributionItem> {
  await new Promise((res) => setTimeout(res, 150));
  const item = store.ngoUpdates.find((c) => c.id === id);
  if (!item) throw new Error('Update not found.');
  item.status = 'TAKEN_DOWN';
  item.takenDownReason = reason;
  return JSON.parse(JSON.stringify(item));
}

export async function fetchContributionById(
  id: string
): Promise<NgoContributionItem | null> {
  await new Promise((res) => setTimeout(res, 100));
  const found = store.ngoUpdates.find((c) => c.id === id);
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

export async function saveContributionDraft(
  draftInput: Omit<NgoContributionItem, 'id' | 'createdAt' | 'status' | 'authorOfficer' | 'ngoId' | 'ngoName'> & { draftId?: string }
): Promise<NgoContributionItem> {
  await new Promise((res) => setTimeout(res, 250));
  assertAuthenticatedAndVerified();

  if (draftInput.draftId) {
    const existing = store.ngoUpdates.find((c) => c.id === draftInput.draftId);
    if (existing) {
      existing.eventId = draftInput.eventId;
      existing.incidentId = incidentForEvent(draftInput.eventId);
      existing.eventTitle = draftInput.eventTitle;
      existing.citizenMessageRef = draftInput.citizenMessageRef;
      existing.contributionType = draftInput.contributionType;
      existing.summary = draftInput.summary;
      existing.locality = draftInput.locality;
      existing.needs = draftInput.needs;
      existing.availableResources = draftInput.availableResources;
      existing.evidenceReferences = draftInput.evidenceReferences;
      existing.verificationMethod = draftInput.verificationMethod;
      existing.status = 'DRAFT';
      return JSON.parse(JSON.stringify(existing));
    }
  }

  const newItem: NgoContributionItem = {
    ...draftInput,
    id: `draft-${Date.now()}`,
    incidentId: incidentForEvent(draftInput.eventId),
    status: 'DRAFT',
    authorOfficer: currentSession!.authorizedOfficerName,
    ngoId: currentSession!.ngoId,
    ngoName: currentSession!.ngoName,
    createdAt: new Date().toISOString(),
  };

  store.ngoUpdates.unshift(newItem);
  return JSON.parse(JSON.stringify(newItem));
}

/**
 * Publishes an officially verified NGO contribution.
 *
 * BACKEND REQUIREMENT:
 * Requires live FastAPI endpoint: POST /api/v1/ngo/contributions/publish
 * Per product architecture rules, contributions CANNOT be marked as published
 * through local state alone. Must reject until server confirms publication.
 */
export async function publishContribution(
  _draftInput: Omit<NgoContributionItem, 'id' | 'createdAt' | 'status' | 'authorOfficer' | 'ngoId' | 'ngoName'> & { draftId?: string }
): Promise<NgoContributionItem> {
  await new Promise((res) => setTimeout(res, 350));
  assertAuthenticatedAndVerified();

  throw new Error(
    'Backend publication endpoint (POST /api/v1/ngo/contributions/publish) is not yet available. Contributions cannot be marked as published through local state alone. Saved in local drafts.'
  );
}

function assertAuthenticatedAndVerified() {
  if (!currentSession) {
    throw new Error('Unauthenticated: Please sign in to access the NGO workspace.');
  }
  if (currentSession.verificationStatus !== 'VERIFIED') {
    throw new Error(
      `Access denied: Organization status is ${currentSession.verificationStatus}. Only VERIFIED organizations may access NGO operations.`
    );
  }
}
