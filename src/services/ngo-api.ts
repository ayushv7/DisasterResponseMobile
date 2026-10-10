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

import {
  DEFAULT_MOCK_NGO_SESSION,
  SAMPLE_NGO_INBOX_MESSAGES,
} from '@/fixtures/sample-ngo-inbox';
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

let inMemoryMessages: NgoInboxMessage[] = JSON.parse(
  JSON.stringify(SAMPLE_NGO_INBOX_MESSAGES)
);

let inMemoryContributions: NgoContributionItem[] = [
  {
    id: 'contrib-seed-01',
    eventId: 'fl-2026-081',
    eventTitle: 'Brahmaputra River Inundation Warning — Majuli Basin',
    contributionType: 'RELIEF_DISTRIBUTION',
    summary:
      'Dispatched 2 motorized rescue boats and 400 clean drinking water sachets to Kamalabari Ghat sector 3.',
    locality: 'Kamalabari Ghat, Majuli District',
    needs: 'Dry food rations and temporary tarpaulin sheets',
    availableResources: '2 rubber craft, 4 volunteers',
    evidenceReferences: 'Local field team report ref ASDMA-SEC-3',
    verificationMethod: 'Field coordinator on-site physical inspection',
    authorOfficer: 'R. Sharma (Field Lead)',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    status: 'PUBLISHED',
    createdAt: '2026-10-09T20:00:00Z',
    publishedAt: '2026-10-09T20:15:00Z',
  },
  {
    id: 'contrib-seed-02',
    eventId: 'fl-2026-082',
    eventTitle: 'Godavari Estuary Backwater Overflow — East Godavari',
    contributionType: 'EVACUATION_ROUTE',
    summary:
      'Secondary bypass road via Mukteswaram is navigable for light commercial relief vehicles. Causeway remains closed.',
    locality: 'Ainavilli Mandal, Konaseema',
    needs: 'Traffic diversion signage',
    availableResources: 'Route scouting vehicle',
    evidenceReferences: 'Traffic police coordination log #409',
    verificationMethod: 'Joint verification with circle traffic inspector',
    authorOfficer: 'R. Sharma (Field Lead)',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    status: 'DRAFT',
    createdAt: '2026-10-09T18:00:00Z',
  },
  {
    id: 'contrib-seed-03',
    eventId: 'fl-2026-083',
    eventTitle: 'Kosi River Flash Surge — Supaul Lowland Sector',
    contributionType: 'RELIEF_DISTRIBUTION',
    summary:
      'Shelter dispatch duplicate report. Handled via direct SDRF regional pipeline.',
    locality: 'Nirmali Block, Supaul',
    verificationMethod: 'Cross-agency ledger reconciliation',
    authorOfficer: 'R. Sharma (Field Lead)',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    status: 'REJECTED_OR_CLOSED',
    createdAt: '2026-10-09T15:00:00Z',
  },
];

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
  await new Promise((res) => setTimeout(res, 200));
  assertAuthenticatedAndVerified();

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
  await new Promise((res) => setTimeout(res, 300));
  assertAuthenticatedAndVerified();

  const msg = inMemoryMessages.find((m) => m.messageId === messageId);
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

  const msg = inMemoryMessages.find((m) => m.messageId === messageId);
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

  const msg = inMemoryMessages.find((m) => m.messageId === messageId);
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
  return JSON.parse(JSON.stringify(inMemoryContributions));
}

/** Public view: published contributions only (GET /incidents/{id}/updates). No NGO session needed. */
export async function fetchPublishedContributions(): Promise<NgoContributionItem[]> {
  await new Promise((res) => setTimeout(res, 150));
  return JSON.parse(JSON.stringify(inMemoryContributions.filter((c) => c.status === 'PUBLISHED')));
}

export async function fetchContributionById(
  id: string
): Promise<NgoContributionItem | null> {
  await new Promise((res) => setTimeout(res, 100));
  const found = inMemoryContributions.find((c) => c.id === id);
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

export async function saveContributionDraft(
  draftInput: Omit<NgoContributionItem, 'id' | 'createdAt' | 'status' | 'authorOfficer' | 'ngoId' | 'ngoName'> & { draftId?: string }
): Promise<NgoContributionItem> {
  await new Promise((res) => setTimeout(res, 250));
  assertAuthenticatedAndVerified();

  if (draftInput.draftId) {
    const existing = inMemoryContributions.find((c) => c.id === draftInput.draftId);
    if (existing) {
      existing.eventId = draftInput.eventId;
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
    status: 'DRAFT',
    authorOfficer: currentSession!.authorizedOfficerName,
    ngoId: currentSession!.ngoId,
    ngoName: currentSession!.ngoName,
    createdAt: new Date().toISOString(),
  };

  inMemoryContributions.unshift(newItem);
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
