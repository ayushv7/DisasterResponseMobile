/**
 * SAMPLE FIXTURES — NOT LIVE FLOOD INFORMATION
 *
 * This dataset is strictly for client-side development, layout verification,
 * and testing before the live automated ingestion FastAPI backend is connected.
 *
 * RULE COMPLIANCE:
 * - Persistent banner warning must be rendered whenever these fixtures are in use.
 * - Displays event statuses: CANDIDATE, ACTIVE, RESOLVED, DISMISSED.
 * - Displays source publication time separately from system retrieval time.
 * - Displays Freshness: FRESH, AGEING, STALE, SOURCE_UNAVAILABLE.
 * - Displays source observations separately from NGO contributions.
 */

import { FloodEvent } from '@/types/disaster';

export const IS_SAMPLE_DATA = true;
export const SAMPLE_DATA_WARNING = 'SAMPLE DATA — NOT LIVE FLOOD INFORMATION';

export const SAMPLE_FLOOD_EVENTS: FloodEvent[] = [
  {
    id: 'fl-2026-081',
    title: 'Brahmaputra River Inundation Warning — Majuli Basin',
    location: 'Majuli District, Assam',
    stateOrRegion: 'Assam',
    summary:
      'Water levels surpassed danger mark (+1.25m) following 72h continuous precipitation in upper catchment area. 14 villages experiencing embankment seepages.',
    status: 'ACTIVE',
    severityLevel: 'CRITICAL',
    latestSourceTime: '2026-10-09T18:30:00Z',
    systemRetrievedTime: '2026-10-09T19:05:12Z',
    freshness: 'FRESH',
    estimatedAffectedPeople: 48000,
    observations: [
      {
        id: 'obs-01',
        sourceName: 'Central Water Commission (CWC)',
        sourceType: 'GOVERNMENT',
        headline: 'Danger mark exceeded at Neamatighat station',
        evidenceSnippet:
          'Current water level 86.42m against danger mark of 85.04m with a rising trend of 3cm/hr.',
        sourceUrl: 'https://cwc.gov.in/telemetry/station-8642',
        sourceObservedAt: '2026-10-09T18:30:00Z',
        systemRetrievedAt: '2026-10-09T19:05:12Z',
      },
      {
        id: 'obs-02',
        sourceName: 'Assam State Disaster Management Authority (ASDMA)',
        sourceType: 'GOVERNMENT',
        headline: 'Flood Bulletin No. 42 / Riverine Inundation',
        evidenceSnippet:
          'Circle Officer reports 14 revenue villages inundated; SDRF deployment deployed to Kamalabari ghat.',
        sourceObservedAt: '2026-10-09T17:45:00Z',
        systemRetrievedAt: '2026-10-09T18:00:20Z',
      },
    ],
    contributions: [
      {
        id: 'ngo-contrib-01',
        ngoId: 'ngo-red-crescent-assam',
        ngoName: 'Assam Flood Relief Collective (Verified)',
        isVerifiedNgo: true,
        summary:
          'Field inspection team delivered 300 family hygiene kits to Kamalabari relief camp. Dry food stockpiles sufficient for 48h.',
        actionTaken: 'Distributed emergency supplies at designated shelter #4',
        publishedAt: '2026-10-09T21:10:00Z',
      },
    ],
  },
  {
    id: 'fl-2026-082',
    title: 'Yamuna Floodplain Water Rise Alert',
    location: 'Old Railway Bridge, East Delhi',
    stateOrRegion: 'Delhi NCT',
    summary:
      'Hathnikund barrage discharge increase of 145,000 cusecs upstream. Floodplain low-lying settlements notified for pre-emptive evacuation.',
    status: 'CANDIDATE',
    severityLevel: 'MODERATE',
    latestSourceTime: '2026-10-09T14:15:00Z',
    systemRetrievedTime: '2026-10-09T14:50:33Z',
    freshness: 'AGEING',
    estimatedAffectedPeople: 8500,
    observations: [
      {
        id: 'obs-03',
        sourceName: 'Delhi Disaster Management Authority (DDMA)',
        sourceType: 'GOVERNMENT',
        headline: 'Pre-cautionary advisory for low-lying Yamuna banks',
        evidenceSnippet:
          'Water level recorded at 204.85m approaching warning mark 205.33m. Control room activated.',
        sourceObservedAt: '2026-10-09T14:15:00Z',
        systemRetrievedAt: '2026-10-09T14:50:33Z',
      },
    ],
    contributions: [],
  },
  {
    id: 'fl-2026-083',
    title: 'Ganga Tributary Flash Flood & Landslip Blockage',
    location: 'Rudraprayag Sector, Uttarakhand',
    stateOrRegion: 'Uttarakhand',
    summary:
      'Alaknanda river water spike verified by hydrometric telemetry. Road connectivity to Kedarnath valley temporarily diverted.',
    status: 'ACTIVE',
    severityLevel: 'HIGH',
    latestSourceTime: '2026-10-08T10:00:00Z',
    systemRetrievedTime: '2026-10-08T11:15:04Z',
    freshness: 'STALE',
    estimatedAffectedPeople: 2200,
    observations: [
      {
        id: 'obs-04',
        sourceName: 'India Meteorological Department (IMD)',
        sourceType: 'GOVERNMENT',
        headline: 'Heavy localized rainfall advisory — Garhwal region',
        evidenceSnippet:
          'Automated weather station logged 98mm rainfall within 4 hours. Flash flood risk high.',
        sourceObservedAt: '2026-10-08T10:00:00Z',
        systemRetrievedAt: '2026-10-08T11:15:04Z',
      },
    ],
    contributions: [],
  },
  {
    id: 'fl-2026-079',
    title: 'Cauvery River Basin Receding Water Levels',
    location: 'Tiruchirappalli District, Tamil Nadu',
    stateOrRegion: 'Tamil Nadu',
    summary:
      'Mettur Dam discharge stabilized at 12,000 cusecs. Floodwaters drained completely from agricultural tracts and primary canal networks.',
    status: 'RESOLVED',
    severityLevel: 'LOW',
    latestSourceTime: '2026-10-07T08:00:00Z',
    systemRetrievedTime: '2026-10-07T09:30:11Z',
    freshness: 'FRESH',
    estimatedAffectedPeople: 0,
    observations: [
      {
        id: 'obs-05',
        sourceName: 'Water Resources Department (WRD Tamil Nadu)',
        sourceType: 'GOVERNMENT',
        headline: 'De-escalation of Cauvery flood alert',
        evidenceSnippet:
          'Water flow across Grand Anicut returned to safe operating limits. All downstream alerts revoked.',
        sourceObservedAt: '2026-10-07T08:00:00Z',
        systemRetrievedAt: '2026-10-07T09:30:11Z',
      },
    ],
    contributions: [
      {
        id: 'ngo-contrib-02',
        ngoId: 'ngo-cauvery-relief',
        ngoName: 'Cauvery Humanitarian Aid Trust (Verified)',
        isVerifiedNgo: true,
        summary:
          'Post-flood sanitization and chlorine water purification completed across 3 evacuated hamlets.',
        actionTaken: 'Field operation closed and transitioned to local panchayat monitoring.',
        publishedAt: '2026-10-07T14:20:00Z',
      },
    ],
  },
  {
    id: 'fl-2026-075',
    title: 'Unconfirmed Urban Waterlogging Rumor — Ring Road Sector',
    location: 'Nagpur Central, Maharashtra',
    stateOrRegion: 'Maharashtra',
    summary:
      'Preliminary social wire reported canal rupture. Municipal engineers on-site confirmed standard storm drain overflow with no river breach.',
    status: 'DISMISSED',
    severityLevel: 'LOW',
    latestSourceTime: '2026-10-06T12:00:00Z',
    systemRetrievedTime: '2026-10-06T12:40:00Z',
    freshness: 'SOURCE_UNAVAILABLE',
    estimatedAffectedPeople: 0,
    observations: [
      {
        id: 'obs-06',
        sourceName: 'Nagpur Municipal Corporation Emergency Cell',
        sourceType: 'GOVERNMENT',
        headline: 'Inspection report clarifies drainage clearing status',
        evidenceSnippet:
          'Storm culverts cleared within 45 minutes; zero residential flooding. Incident closed as false breach.',
        sourceObservedAt: '2026-10-06T12:00:00Z',
        systemRetrievedAt: '2026-10-06T12:40:00Z',
      },
    ],
    contributions: [],
  },
];
