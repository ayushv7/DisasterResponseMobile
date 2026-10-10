/**
 * SAMPLE FIXTURES — NGO INBOX & REVIEW
 *
 * Simulates private citizen reports routed to an authorized NGO
 * ("Disaster Relief Network India").
 *
 * Explicitly marked as sample fixtures.
 */

import { SAMPLE_NGO_CODE } from '@/fixtures/sample-accounts';
import { NgoContributionItem, NgoInboxMessage, NgoSession } from '@/types/ngo-workspace';

export const IS_SAMPLE_NGO_DATA = true;

export const DEFAULT_MOCK_NGO_SESSION: NgoSession = {
  ngoId: 'ngo-drn-india',
  ngoName: 'Disaster Relief Network India',
  verificationStatus: 'VERIFIED',
  authorizedOfficerName: 'R. Sharma (Field Lead)',
  ngoCode: SAMPLE_NGO_CODE,
  serviceArea: 'Assam',
  focusAreas: ['Flood Evacuation', 'Emergency Rations', 'Medical Aid'],
  isDemoPreview: true,
};

export const SAMPLE_NGO_INBOX_MESSAGES: NgoInboxMessage[] = [
  {
    messageId: 'msg-rec-2026-901',
    eventId: 'fl-2026-081',
    eventTitle: 'Brahmaputra River Inundation Warning — Majuli Basin',
    senderPseudonym: 'Citizen-Obs-884',
    receivedAt: '2026-10-09T19:40:00Z',
    status: 'NEEDS_REVIEW',
    observationText:
      'Water has breached the inner embankment near Kamalabari Ghat sector 3. Approximately 25 families are stranded on higher mounds without potable water or power since 4 PM today.',
    evidenceSummary: '1 embankment photo, GPS coordinate radius (redacted)',
    evidenceCount: 1,
    locationMetadata: {
      approximateArea: 'Kamalabari Ghat, Majuli District (~500m radius)',
      coordinatesRedacted: true,
      privacyNotice: 'Exact latitude and longitude masked per citizen privacy policy.',
    },
    attachments: [
      {
        id: 'att-01',
        filename: 'embankment_breach_sec3.jpg',
        fileType: 'image/jpeg',
        sizeBytes: 1845200,
        isRedacted: false,
      },
    ],
    internalNotes: '',
    statusHistory: [
      {
        status: 'NEEDS_REVIEW',
        timestamp: '2026-10-09T19:40:00Z',
        actor: 'System Ingestion Queue',
        notes: 'Citizen message routed to verified NGO based on geographical coverage.',
      },
    ],
  },
  {
    messageId: 'msg-rec-2026-902',
    eventId: 'fl-2026-081',
    eventTitle: 'Brahmaputra River Inundation Warning — Majuli Basin',
    senderPseudonym: 'Citizen-Obs-302',
    receivedAt: '2026-10-09T19:15:00Z',
    status: 'CLARIFICATION_REQUESTED',
    observationText:
      'Need boat rescue for senior citizens at old health sub-centre. Water level reaching 4 feet on ground floor.',
    evidenceSummary: 'No attachments, location pinpoint verified to revenue circle',
    evidenceCount: 0,
    locationMetadata: {
      approximateArea: 'Jengraimukh Circle, Majuli District',
      coordinatesRedacted: true,
      privacyNotice: 'Location blurred to sub-centre administrative perimeter.',
    },
    attachments: [],
    internalNotes: 'Contacted local SDRF unit. Asked sender for exact count of bedridden individuals.',
    statusHistory: [
      {
        status: 'NEEDS_REVIEW',
        timestamp: '2026-10-09T19:15:00Z',
        actor: 'System Ingestion Queue',
      },
      {
        status: 'CLARIFICATION_REQUESTED',
        timestamp: '2026-10-09T19:30:00Z',
        actor: 'R. Sharma (Field Lead)',
        notes: 'Clarification sent: Please confirm exact number of persons requiring medical stretcher evacuation.',
      },
    ],
  },
  {
    messageId: 'msg-rec-2026-903',
    eventId: 'fl-2026-082',
    eventTitle: 'Yamuna Floodplain Water Rise Alert',
    senderPseudonym: 'Citizen-Obs-519',
    receivedAt: '2026-10-09T16:20:00Z',
    status: 'REVIEWED',
    observationText:
      'Causeway near Ainavilli is completely submerged under 3 feet of swift water. Vehicles turned back.',
    evidenceSummary: '1 roadway telemetry capture',
    evidenceCount: 1,
    locationMetadata: {
      approximateArea: 'Ainavilli Mandal, Konaseema',
      coordinatesRedacted: true,
      privacyNotice: 'Point geocode rounded to nearest highway junction.',
    },
    attachments: [
      {
        id: 'att-02',
        filename: 'causeway_submerged.png',
        fileType: 'image/png',
        sizeBytes: 940000,
        isRedacted: false,
      },
    ],
    internalNotes: 'Cross-referenced with CWC Dowleswaram discharge report. Causeway closure confirmed by police.',
    statusHistory: [
      {
        status: 'NEEDS_REVIEW',
        timestamp: '2026-10-09T16:20:00Z',
        actor: 'System Ingestion Queue',
      },
      {
        status: 'REVIEWED',
        timestamp: '2026-10-09T17:10:00Z',
        actor: 'R. Sharma (Field Lead)',
        notes: 'Validated against local traffic police diversion bulletin.',
      },
    ],
  },
  {
    messageId: 'msg-rec-2026-904',
    eventId: 'fl-2026-083',
    eventTitle: 'Ganga Tributary Flash Flood & Landslip Blockage',
    senderPseudonym: 'Citizen-Obs-112',
    receivedAt: '2026-10-09T14:05:00Z',
    status: 'PREPARED_FOR_PUBLICATION',
    observationText:
      'Community shelter at Nirmali has reached capacity (350 persons). Additional drinking water sachets required.',
    evidenceSummary: 'Shelter roster log excerpt',
    evidenceCount: 1,
    locationMetadata: {
      approximateArea: 'Nirmali Block, Supaul',
      coordinatesRedacted: true,
      privacyNotice: 'Shelter location approved for relief coordination.',
    },
    attachments: [
      {
        id: 'att-03',
        filename: 'nirmali_shelter_registry.pdf',
        fileType: 'application/pdf',
        sizeBytes: 420000,
        isRedacted: true,
      },
    ],
    internalNotes: 'Drafted official NGO relief notice for dispatch. Pending dual-officer signoff.',
    statusHistory: [
      {
        status: 'NEEDS_REVIEW',
        timestamp: '2026-10-09T14:05:00Z',
        actor: 'System Ingestion Queue',
      },
      {
        status: 'PREPARED_FOR_PUBLICATION',
        timestamp: '2026-10-09T15:00:00Z',
        actor: 'R. Sharma (Field Lead)',
        notes: 'Ready for inclusion into public NGO relief bulletin.',
      },
    ],
  },
];

/** SAMPLE published/draft NGO updates (moved here from ngo-api so the mock store can seed them). */
export const SAMPLE_NGO_CONTRIBUTIONS: NgoContributionItem[] = [
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
