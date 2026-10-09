/**
 * Disaster Response Orchestration Network — Messaging API Service
 *
 * ═══════════════════════════════════════════════════════════════
 * ⚠️  UI-ONLY STUB — BACKEND NOT YET IMPLEMENTED (Oct 2026)
 * ═══════════════════════════════════════════════════════════════
 *
 * This module is a clearly-labelled stub. The backend team must provide:
 *
 * 1. BASE URL
 *    Environment variable: EXPO_PUBLIC_API_BASE_URL
 *    Example: https://dron-api.example.com
 *
 * 2. ENDPOINT: List verified NGOs
 *    GET  /api/v1/ngos
 *    Response: { ngos: VerifiedNgo[] }
 *    Auth: Bearer token required (auth system not yet determined)
 *
 * 3. ENDPOINT: Submit a private public message
 *    POST /api/v1/events/{eventId}/messages
 *    Request body: { ngoId: string, observationText: string }
 *    Response: MessageReceipt
 *    Auth: Bearer token required
 *    Notes:
 *    - Message is PRIVATE. It must not appear publicly unless the NGO
 *      independently publishes a separate verified contribution.
 *    - The backend must return the server-assigned messageId and
 *      a server-side submittedAt timestamp. The client must NOT
 *      infer success without a 2xx response.
 *    - Idempotency: If the request times out, the client will not
 *      retry automatically. The user must tap Send again.
 *
 * 4. AUTH SYSTEM (not yet determined)
 *    Placeholder: pass an empty Authorization header for now.
 *    Replace with actual token once auth is implemented.
 *
 * HOW TO INTEGRATE:
 *   1. Set EXPO_PUBLIC_API_BASE_URL in your .env file.
 *   2. Replace the stubbed functions below with real fetch calls.
 *   3. Update ComposeUiState handling in the screen accordingly.
 *   4. Remove IS_STUB_API flag and all stub-specific comments.
 */

import { IS_SAMPLE_NGOS, SAMPLE_VERIFIED_NGOS } from '@/fixtures/sample-ngos';
import { MessageDraft, MessageReceipt, VerifiedNgo } from '@/types/messaging';

export const IS_STUB_API = true;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

/** Simulated network latency for the stub (ms). */
const STUB_DELAY_MS = 1200;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// ─── NGO LIST ────────────────────────────────────────────────────────────────

/**
 * Fetches the list of verified NGOs from the backend.
 *
 * STUB: Returns sample fixture data after a simulated delay.
 * REAL: GET ${API_BASE}/api/v1/ngos
 */
export async function fetchVerifiedNgos(): Promise<VerifiedNgo[]> {
  if (IS_SAMPLE_NGOS || !API_BASE) {
    await wait(STUB_DELAY_MS);
    return SAMPLE_VERIFIED_NGOS;
  }

  // TODO: Replace stub below with real implementation once backend is ready.
  const response = await fetch(`${API_BASE}/api/v1/ngos`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add Authorization header once auth system is determined.
      // 'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch NGO list: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.ngos as VerifiedNgo[];
}

// ─── SUBMIT MESSAGE ──────────────────────────────────────────────────────────

/**
 * Submits a private public-user message to a verified NGO.
 *
 * STUB: Simulates a successful submission after a delay.
 *       Set FORCE_STUB_FAILURE = true below to test error handling.
 * REAL: POST ${API_BASE}/api/v1/events/{eventId}/messages
 *
 * @throws Error if the network request fails or the backend returns non-2xx.
 */

// Set to true temporarily to test the error UI path during development.
const FORCE_STUB_FAILURE = false;

export async function submitPrivateMessage(
  draft: MessageDraft
): Promise<MessageReceipt> {
  if (IS_STUB_API || !API_BASE) {
    await wait(STUB_DELAY_MS);

    if (FORCE_STUB_FAILURE) {
      throw new Error(
        'Stub: Simulated submission failure. Set FORCE_STUB_FAILURE = false to test success.'
      );
    }

    // Return a simulated receipt — clearly fake until backend is live.
    const receipt: MessageReceipt = {
      messageId: `stub-msg-${Date.now()}`,
      ngoId: draft.ngoId,
      eventId: draft.eventId,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_NGO_REVIEW',
    };
    return receipt;
  }

  // TODO: Replace stub below with real implementation once backend is ready.
  const response = await fetch(
    `${API_BASE}/api/v1/events/${draft.eventId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add Authorization header once auth system is determined.
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        ngoId: draft.ngoId,
        observationText: draft.observationText,
      }),
    }
  );

  if (!response.ok) {
    let message = `Submission failed: HTTP ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.detail) message = errorBody.detail;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message);
  }

  return response.json() as Promise<MessageReceipt>;
}
