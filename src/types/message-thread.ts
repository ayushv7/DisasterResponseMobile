/**
 * Disaster Response Orchestration Network — Sent Message Types
 *
 * These types represent the public user's view of their sent private messages.
 * Status values are ALWAYS server-provided — the client must NOT infer or
 * invent delivery receipts, verification, or publication status.
 *
 * BACKEND CONTRACT (not yet implemented):
 *   GET  /api/v1/messages          → SentMessage[]
 *   Expected auth: Bearer token (not yet determined)
 */

/**
 * Server-provided message lifecycle statuses.
 * The client displays these as-is — no client-side transitions.
 */
export type MessageStatus =
  | 'SENT'                     // Backend received and persisted the message
  | 'DELIVERED'                // Backend confirmed delivery to NGO (if supported)
  | 'NGO_REVIEWING'           // NGO has opened/acknowledged the message
  | 'CLARIFICATION_REQUESTED' // NGO has requested additional information
  | 'CLOSED';                 // NGO has closed the conversation

/** A message the public user has previously sent to a verified NGO. */
export interface SentMessage {
  messageId: string;          // Server-assigned ID (from MessageReceipt)
  eventId: string;            // The flood event this message is about
  eventTitle: string;         // Denormalized for display — populated by the backend
  ngoId: string;
  ngoName: string;            // Denormalized for display
  observationExcerpt: string; // First ~120 chars of the message body
  sentAt: string;             // ISO 8601 — server timestamp
  status: MessageStatus;      // Server-provided, never inferred
  lastUpdatedAt: string;      // ISO 8601 — when the status last changed
}

/** UI states for the Messages list screen. */
export type MessagesUiState =
  | 'loading'   // Initial fetch in flight
  | 'success'   // Data loaded (may be empty)
  | 'error'     // Fetch failed
  | 'offline';  // Device appears to be offline (future use)
