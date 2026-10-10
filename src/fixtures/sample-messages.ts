/**
 * Sample Sent Messages — FIXTURE ONLY
 *
 * ⚠️  This is representative sample data for UI development.
 *     Replace with a real GET /api/v1/messages call once the backend is ready.
 *     These statuses are fabricated for UI testing — they do NOT represent
 *     real delivery or NGO review outcomes.
 */

import { SentMessage } from '@/types/message-thread';

export const IS_SAMPLE_MESSAGES = true;

export const SAMPLE_SENT_MESSAGES: SentMessage[] = [
  {
    messageId: 'stub-msg-1001',
    eventId: 'EVT-001',
    eventTitle: 'Brahmaputra Embankment Breach — Dibrugarh Sector',
    ngoId: 'ngo-001',
    ngoName: 'Bharat Flood Response Network',
    observationExcerpt:
      'Water level rising rapidly near ward 7. Several families in low-lying areas need immediate evacuation assistance. Roads to the main highway are partially submerged…',
    sentAt: '2026-10-09T22:14:00Z',
    status: 'NGO_REVIEWING',
    lastUpdatedAt: '2026-10-09T23:05:00Z',
  },
  {
    messageId: 'stub-msg-1002',
    eventId: 'EVT-002',
    eventTitle: 'Gujarat Flash Flood — Kutch District Warning',
    ngoId: 'ngo-003',
    ngoName: 'Assam Relief Collective',
    observationExcerpt:
      'Requesting information about relief distribution schedule for displaced families in the Bhuj temporary shelter. Food and water supply is running low…',
    sentAt: '2026-10-09T18:30:00Z',
    status: 'SENT',
    lastUpdatedAt: '2026-10-09T18:30:00Z',
  },
  {
    messageId: 'stub-msg-1003',
    eventId: 'EVT-001',
    eventTitle: 'Brahmaputra Embankment Breach — Dibrugarh Sector',
    ngoId: 'ngo-002',
    ngoName: 'Himalayan Aid Initiative',
    observationExcerpt:
      'Medical supplies urgently needed in Naharkatia area. The primary health centre has been overwhelmed since yesterday. At least 12 people need treatment for waterborne illness symptoms…',
    sentAt: '2026-10-08T14:45:00Z',
    status: 'CLARIFICATION_REQUESTED',
    lastUpdatedAt: '2026-10-09T10:20:00Z',
  },
  {
    messageId: 'stub-msg-1004',
    eventId: 'EVT-003',
    eventTitle: 'Kerala IMD Red Alert — Wayanad Landslide Risk',
    ngoId: 'ngo-004',
    ngoName: 'Kerala Disaster Management Foundation',
    observationExcerpt:
      'Multiple landslide warning signs observed near Meppadi. Cracks on hillside visible from the road. Local community members are hesitant to evacuate without official guidance…',
    sentAt: '2026-10-07T09:15:00Z',
    status: 'CLOSED',
    lastUpdatedAt: '2026-10-08T16:00:00Z',
  },
];
