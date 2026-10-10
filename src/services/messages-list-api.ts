/**
 * Disaster Response Orchestration Network — Messages List API Service
 *
 * ═══════════════════════════════════════════════════════════════
 * ⚠️  UI-ONLY STUB — BACKEND NOT YET IMPLEMENTED (Oct 2026)
 * ═══════════════════════════════════════════════════════════════
 *
 * ENDPOINT: Fetch sent messages for the current public user
 *   GET  /api/v1/messages
 *   Response: { messages: SentMessage[] }
 *   Auth: Bearer token required (not yet determined)
 *
 * The statuses returned by this endpoint are server-authoritative.
 * The client must NOT modify, upgrade, or infer status transitions.
 */

import {
  IS_SAMPLE_MESSAGES,
  SAMPLE_SENT_MESSAGES,
} from '@/fixtures/sample-messages';
import { SentMessage } from '@/types/message-thread';

export const IS_MESSAGES_STUB = true;

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

const STUB_DELAY_MS = 900;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches the current user's sent messages.
 *
 * STUB: Returns sample fixture data after a simulated delay.
 * REAL: GET ${API_BASE}/api/v1/messages
 */
export async function fetchSentMessages(): Promise<SentMessage[]> {
  if (IS_SAMPLE_MESSAGES || !API_BASE) {
    await wait(STUB_DELAY_MS);
    return SAMPLE_SENT_MESSAGES;
  }

  const response = await fetch(`${API_BASE}/api/v1/messages`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // TODO: Add Authorization header once auth system is determined.
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.messages as SentMessage[];
}
