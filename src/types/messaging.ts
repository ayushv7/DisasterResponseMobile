/**
 * Disaster Response Orchestration Network — Messaging Domain Types
 *
 * Represents the public-user-to-verified-NGO private messaging flow.
 *
 * BACKEND CONTRACT STATUS: UI-ONLY STUB
 * ─────────────────────────────────────
 * The backend endpoints listed below have NOT been implemented yet
 * (as of Oct 2026). The API service layer (src/services/messaging-api.ts)
 * is a clearly-labelled stub. When the backend team delivers the contract,
 * replace the stub with real fetch/axios calls.
 *
 * Expected backend endpoints (FastAPI + MongoDB Atlas):
 *   GET  /api/v1/ngos                   → list of VerifiedNgo[]
 *   POST /api/v1/events/{eventId}/messages → submit MessageDraft, receive MessageReceipt
 *
 * Expected auth: Bearer token in Authorization header (not yet implemented).
 */

/** A verified humanitarian organization registered in the system. */
export interface VerifiedNgo {
  id: string;
  name: string;
  focusAreas: string[]; // e.g. ["Flood Relief", "Evacuation Support"]
  isVerified: boolean;  // Always true in this list — only verified NGOs are returned
  verifiedAt: string;   // ISO 8601 date the administrator granted verification
}

/** The payload composed by the public user before submission. */
export interface MessageDraft {
  eventId: string;
  ngoId: string;
  observationText: string; // The user's private observation/need, max MESSAGE_CHAR_LIMIT chars
  /** Local photo URIs the sender chose to attach (uploaded separately once the backend supports it). */
  photoUris?: string[];
  /** Only present when the sender explicitly chose to share it. */
  location?: SharedLocation;
}

/**
 * A location the sender chose to share with the selected NGO only.
 * 'approximate' is rounded on the device (about 1 km) before it leaves the phone.
 */
export interface SharedLocation {
  latitude: number;
  longitude: number;
  /** Device-reported accuracy radius in metres, or the rounding radius when approximate. */
  accuracyMeters: number | null;
  precision: 'approximate' | 'exact';
  capturedAt: string;
}

/**
 * Receipt returned by the backend after successful submission.
 * The message ID is used to track status — it is NEVER displayed
 * unless the backend has confirmed the message was persisted.
 */
export interface MessageReceipt {
  messageId: string;       // MongoDB ObjectId assigned by the backend
  ngoId: string;
  eventId: string;
  submittedAt: string;     // ISO 8601 timestamp from the server (not the device)
  status: 'PENDING_NGO_REVIEW';
}

/** UI machine states for the compose screen. */
export type ComposeUiState =
  | 'idle'           // Form visible, editable, not submitted
  | 'submitting'     // Request in flight — disable form + show spinner
  | 'success'        // Backend confirmed — show receipt view
  | 'error';         // Request failed — show error, allow retry

/** Hard limits for message composition. */
export const MESSAGE_CHAR_LIMIT = 1000;
export const MESSAGE_MIN_CHARS = 20;
