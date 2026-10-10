/**
 * Disaster Response Orchestration Network — NGO API Service (STUB)
 *
 * BACKEND CONTRACT STATUS: UI-ONLY STUB
 * ───────────────────────────────────────
 * Live endpoints require FastAPI OAuth/JWT authentication and independent
 * administrative verification of the NGO organization.
 *
 * Endpoints expected when live:
 *   GET   /api/v1/ngo/me                     → NgoSession
 *   GET   /api/v1/ngo/inbox                  → NgoInboxMessage[]
 *   GET   /api/v1/ngo/messages/{messageId}   → NgoInboxMessage
 *   POST  /api/v1/ngo/messages/{id}/clarify  → { status: 'CLARIFICATION_REQUESTED' }
 *   POST  /api/v1/ngo/messages/{id}/reject   → { status: 'REJECTED' }
 *   POST  /api/v1/ngo/messages/{id}/prepare  → { status: 'PREPARED_FOR_PUBLICATION' }
 */

import {
  DEFAULT_MOCK_NGO_SESSION,
  SAMPLE_NGO_INBOX_MESSAGES,
} from '@/fixtures/sample-ngo-inbox';
import {
  NgoInboxFilter,
  NgoInboxMessage,
  NgoOrgStatus,
  NgoSession,
} from '@/types/ngo-workspace';

export const IS_STUB_NGO_API = true;

// In-memory clone of session and messages for the active session
let currentSession: NgoSession = { ...DEFAULT_MOCK_NGO_SESSION };
let inMemoryMessages: NgoInboxMessage[] = JSON.parse(
  JSON.stringify(SAMPLE_NGO_INBOX_MESSAGES)
);

export async function fetchNgoSession(): Promise<NgoSession> {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 200));
  return { ...currentSession };
}

/**
 * Developer/demo toggle to simulate unauthorized or pending states.
 * Proves that PENDING_VERIFICATION or SUSPENDED organizations cannot publish.
 */
export function setMockOrgStatus(status: NgoOrgStatus): NgoSession {
  currentSession = {
    ...currentSession,
    verificationStatus: status,
  };
  return { ...currentSession };
}

export async function fetchNgoInbox(
  filter: NgoInboxFilter = 'ALL'
): Promise<NgoInboxMessage[]> {
  await new Promise((res) => setTimeout(res, 300));

  if (currentSession.verificationStatus !== 'VERIFIED') {
    throw new Error(
      `Access denied: Organization status is ${currentSession.verificationStatus}. Only VERIFIED organizations may access NGO inbox.`
    );
  }

  let list = [...inMemoryMessages];
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
  await new Promise((res) => setTimeout(res, 250));

  if (currentSession.verificationStatus !== 'VERIFIED') {
    throw new Error(
      `Access denied: Organization status is ${currentSession.verificationStatus}. Only independently VERIFIED organizations may view message telemetry.`
    );
  }

  const found = inMemoryMessages.find((m) => m.messageId === messageId);
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
  await new Promise((res) => setTimeout(res, 350));

  assertVerifiedOrg();

  const msg = inMemoryMessages.find((m) => m.messageId === messageId);
  if (!msg) throw new Error('Message not found.');

  msg.status = 'CLARIFICATION_REQUESTED';
  if (internalNotes !== undefined) msg.internalNotes = internalNotes;
  msg.statusHistory.unshift({
    status: 'CLARIFICATION_REQUESTED',
    timestamp: new Date().toISOString(),
    actor: currentSession.authorizedOfficerName,
    notes: clarificationText,
  });

  return JSON.parse(JSON.stringify(msg));
}

export async function rejectAndCloseMessage(
  messageId: string,
  rejectionReason: string,
  internalNotes?: string
): Promise<NgoInboxMessage> {
  await new Promise((res) => setTimeout(res, 350));

  assertVerifiedOrg();

  const msg = inMemoryMessages.find((m) => m.messageId === messageId);
  if (!msg) throw new Error('Message not found.');

  msg.status = 'REJECTED';
  if (internalNotes !== undefined) msg.internalNotes = internalNotes;
  msg.statusHistory.unshift({
    status: 'REJECTED',
    timestamp: new Date().toISOString(),
    actor: currentSession.authorizedOfficerName,
    notes: `Closed: ${rejectionReason}`,
  });

  return JSON.parse(JSON.stringify(msg));
}

export async function prepareContributionForPublication(
  messageId: string,
  internalNotes?: string
): Promise<NgoInboxMessage> {
  await new Promise((res) => setTimeout(res, 350));

  assertVerifiedOrg();

  const msg = inMemoryMessages.find((m) => m.messageId === messageId);
  if (!msg) throw new Error('Message not found.');

  msg.status = 'PREPARED_FOR_PUBLICATION';
  if (internalNotes !== undefined) msg.internalNotes = internalNotes;
  msg.statusHistory.unshift({
    status: 'PREPARED_FOR_PUBLICATION',
    timestamp: new Date().toISOString(),
    actor: currentSession.authorizedOfficerName,
    notes: 'Drafted contribution verified and queued for editorial publishing approval.',
  });

  return JSON.parse(JSON.stringify(msg));
}

function assertVerifiedOrg() {
  if (currentSession.verificationStatus !== 'VERIFIED') {
    throw new Error(
      `Publishing privilege blocked: Organization is ${currentSession.verificationStatus}. Only independently VERIFIED organizations may prepare contributions or update triage status.`
    );
  }
}
