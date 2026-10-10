/**
 * SAMPLE FIXTURES — Multi-Source Disaster Orchestration & Decision Support
 *
 * Traceable assessments, prioritized field needs, evidence-based recommendations,
 * and NGO capability matching for the Disaster Response Orchestration Network.
 */

import {
  ActionRecommendation,
  NgoCapabilityMatch,
  OutcomeUpdateEntry,
  PrioritizedNeed,
  ResponseCoordinationTask,
  SituationAssessment,
} from '@/types/orchestration';

export const SAMPLE_ASSESSMENTS: Record<string, SituationAssessment> = {
  'fl-2026-081': {
    eventId: 'fl-2026-081',
    status: 'CRITICAL',
    provenance: {
      governmentCount: 2,
      gaugeCount: 1,
      newsCount: 1,
      citizenReportsCount: 2,
      verifiedNgoCount: 1,
    },
    freshness: 'FRESH',
    uncertaintyScore: 22,
    uncertaintyRationale:
      'High telemetry density from Neamatighat gauge. Uncertainty remains in localized inner embankment breaches unmapped by nighttime satellite passes.',
    conflictingReports: [
      {
        id: 'cnf-01',
        topic: 'Kamalabari Ghat Embankment Inundation Depth',
        sources: ['Citizen-Obs-302', 'ASDMA Bulletin No. 42'],
        discrepancy:
          'Citizen report indicates 4-foot standing water on ground floor; official SDRF bulletin reports seepage controlled along primary bund.',
        confidence: 'MEDIUM',
        suggestedVerification:
          'Deploy local drone or circle officer physical depth check at Sector 3.',
      },
    ],
    lastAssessedAt: '2026-10-09T20:10:00Z',
  },
  'fl-2026-082': {
    eventId: 'fl-2026-082',
    status: 'ELEVATED',
    provenance: {
      governmentCount: 1,
      gaugeCount: 1,
      newsCount: 1,
      citizenReportsCount: 1,
      verifiedNgoCount: 0,
    },
    freshness: 'AGEING',
    uncertaintyScore: 35,
    uncertaintyRationale:
      'Hathnikund barrage outflow spike confirmed upstream, but flood crest timing in East Delhi depends on downstream canal weir discharge.',
    conflictingReports: [],
    lastAssessedAt: '2026-10-09T16:00:00Z',
  },
  'fl-2026-083': {
    eventId: 'fl-2026-083',
    status: 'CRITICAL',
    provenance: {
      governmentCount: 1,
      gaugeCount: 1,
      newsCount: 0,
      citizenReportsCount: 1,
      verifiedNgoCount: 0,
    },
    freshness: 'STALE',
    uncertaintyScore: 50,
    uncertaintyRationale:
      'Localized cloudburst telemetry is 24h old. Landslip blockage on Kedarnath access road unverified by direct visual inspection due to fog.',
    conflictingReports: [
      {
        id: 'cnf-02',
        topic: 'Road Passability at Nirmali Causeway',
        sources: ['Citizen-Obs-112', 'State Highway Control'],
        discrepancy:
          'Citizen report claims bridge passable only by tractor; traffic police log lists total closure.',
        confidence: 'LOW',
        suggestedVerification:
          'Request aerial reconnaissance or radio confirmation from police outpost.',
      },
    ],
    lastAssessedAt: '2026-10-08T12:00:00Z',
  },
};

export const SAMPLE_PRIORITIZED_NEEDS: Record<string, PrioritizedNeed[]> = {
  'fl-2026-081': [
    {
      id: 'need-01',
      eventId: 'fl-2026-081',
      category: 'EVACUATION',
      urgency: 'CRITICAL',
      affectedLocality: 'Jengraimukh Circle, Majuli District',
      estimatedCountDescription: '~35 senior citizens and bedridden patients',
      unresolvedGaps:
        'Exact number of non-ambulatory individuals requiring stretcher water craft.',
      evidenceSource: 'Citizen Observation #msg-rec-2026-902 & CWC Neamatighat telemetry',
    },
    {
      id: 'need-02',
      eventId: 'fl-2026-081',
      category: 'POTABLE_WATER',
      urgency: 'HIGH',
      affectedLocality: 'Kamalabari Ghat Sector 3',
      estimatedCountDescription: '25 stranded families (~110 individuals)',
      unresolvedGaps:
        'Contamination status of tube wells along breached inner bund.',
      evidenceSource: 'Citizen Observation #msg-rec-2026-901',
    },
    {
      id: 'need-03',
      eventId: 'fl-2026-081',
      category: 'SHELTER',
      urgency: 'MODERATE',
      affectedLocality: 'Kamalabari Relief Camp #4',
      estimatedCountDescription: '300 displaced residents',
      unresolvedGaps:
        'Replenishment schedule for dry ration buffer past 48 hours.',
      evidenceSource: 'Assam Flood Relief Collective Verified Report',
    },
  ],
  'fl-2026-082': [
    {
      id: 'need-04',
      eventId: 'fl-2026-082',
      category: 'LOGISTICS',
      urgency: 'HIGH',
      affectedLocality: 'Yamuna Floodplain Lowlands, East Delhi',
      estimatedCountDescription: '8,500 floodplain dwellers',
      unresolvedGaps:
        'Pre-emptive bus transport staging zones near Old Railway Bridge.',
      evidenceSource: 'DDMA Advisory Bulletin #204.85m',
    },
  ],
};

export const SAMPLE_ACTION_RECOMMENDATIONS: Record<
  string,
  ActionRecommendation[]
> = {
  'fl-2026-081': [
    {
      id: 'act-01',
      eventId: 'fl-2026-081',
      actionTitle: 'Dispatch Shallow-Draft Boat Rescue to Jengraimukh',
      category: 'Evacuation',
      targetLocality: 'Jengraimukh Old Health Sub-Centre',
      justification:
        'Water depth at 4ft ground level puts senior citizens at acute risk of hypothermia and entrapment.',
      urgency: 'CRITICAL',
      supportingEvidence: [
        {
          sourceName: 'Citizen Observation',
          sourceType: 'Citizen Message',
          citationSnippet:
            'Need boat rescue for senior citizens at old health sub-centre. Water level reaching 4 feet on ground floor.',
          observedAt: '2026-10-09T19:15:00Z',
        },
        {
          sourceName: 'Central Water Commission (CWC)',
          sourceType: 'Gauge Telemetry',
          citationSnippet:
            'Current water level 86.42m against danger mark 85.04m, rising 3cm/hr.',
          observedAt: '2026-10-09T18:30:00Z',
        },
      ],
      lifecycleState: 'AUTHORIZED_DECISION',
      assignedNgoId: 'ngo-001',
      assignedNgoName: 'Bharat Flood Response Network',
      dependencies: ['SDRF clearance at Kamalabari boat launch point'],
      authorizedBy: 'ASDMA District Control Liaison',
      authorizedAt: '2026-10-09T19:50:00Z',
    },
    {
      id: 'act-02',
      eventId: 'fl-2026-081',
      actionTitle: 'Mobilize 500 Emergency Water Purification Sachets',
      category: 'Water & Sanitation',
      targetLocality: 'Kamalabari Ghat Sector 3',
      justification:
        'Inner bund breach cut off tap water access for 25 families stranded on mounds.',
      urgency: 'HIGH',
      supportingEvidence: [
        {
          sourceName: 'Citizen Observation',
          sourceType: 'Citizen Message',
          citationSnippet:
            'Approximately 25 families stranded on higher mounds without potable water or power.',
          observedAt: '2026-10-09T19:40:00Z',
        },
      ],
      lifecycleState: 'RECOMMENDATION',
      assignedNgoId: 'ngo-002',
      assignedNgoName: 'Himalayan Aid Initiative',
      dependencies: ['Water route navigation or drone airdrop staging'],
    },
    {
      id: 'act-03',
      eventId: 'fl-2026-081',
      actionTitle: 'Deliver Family Hygiene Kits to Camp #4',
      category: 'Relief Supplies',
      targetLocality: 'Kamalabari Relief Camp #4',
      justification:
        'Maintains sanitary conditions for 300 displaced individuals.',
      urgency: 'MODERATE',
      supportingEvidence: [
        {
          sourceName: 'Assam Flood Relief Collective',
          sourceType: 'Verified NGO Contribution',
          citationSnippet:
            'Field team delivered 300 family hygiene kits. Dry food stockpiles sufficient for 48h.',
          observedAt: '2026-10-09T21:10:00Z',
        },
      ],
      lifecycleState: 'COMPLETED',
      assignedNgoId: 'ngo-003',
      assignedNgoName: 'Assam Relief Collective',
      dependencies: [],
      authorizedBy: 'District Relief Commissioner',
      authorizedAt: '2026-10-09T20:30:00Z',
    },
  ],
  'fl-2026-082': [
    {
      id: 'act-04',
      eventId: 'fl-2026-082',
      actionTitle: 'Stage Pre-emptive Floodplain Evacuation Centers',
      category: 'Shelter',
      targetLocality: 'Mayur Vihar & Geeta Colony Elevated Shelters',
      justification:
        'Upstream release of 145,000 cusecs will reach Old Railway Bridge within 18 hours.',
      urgency: 'HIGH',
      supportingEvidence: [
        {
          sourceName: 'Delhi Disaster Management Authority',
          sourceType: 'Government Advisory',
          citationSnippet:
            'Hathnikund barrage discharge increase approaching warning mark 205.33m.',
          observedAt: '2026-10-09T14:15:00Z',
        },
      ],
      lifecycleState: 'RECOMMENDATION',
      dependencies: ['Delhi Transport Corporation bus requisition'],
    },
  ],
};

export const SAMPLE_NGO_MATCHES: Record<string, NgoCapabilityMatch[]> = {
  'fl-2026-081': [
    {
      ngoId: 'ngo-001',
      ngoName: 'Bharat Flood Response Network',
      matchingFocusAreas: ['Emergency Evacuation', 'Flood Relief'],
      proximityDescription: 'Jorhat Riverine Depot (~12 km via river ferry)',
      readinessStatus: 'STANDBY',
      matchedNeeds: ['Water craft rescue for non-ambulatory citizens'],
    },
    {
      ngoId: 'ngo-002',
      ngoName: 'Himalayan Aid Initiative',
      matchingFocusAreas: ['Medical Support', 'Water & Sanitation'],
      proximityDescription: 'Dibrugarh Forward Base (~28 km)',
      readinessStatus: 'EN_ROUTE',
      matchedNeeds: ['Potable water distribution', 'Health monitoring'],
    },
    {
      ngoId: 'ngo-003',
      ngoName: 'Assam Relief Collective',
      matchingFocusAreas: ['Food Distribution', 'Shelter Provision'],
      proximityDescription: 'Kamalabari Ghat on-site team',
      readinessStatus: 'DEPLOYED',
      matchedNeeds: ['Relief camp supply management'],
    },
  ],
};

export const SAMPLE_COORDINATION_TASKS: Record<
  string,
  ResponseCoordinationTask[]
> = {
  'fl-2026-081': [
    {
      id: 'task-01',
      eventId: 'fl-2026-081',
      actionId: 'act-01',
      title: 'Senior Citizen Evacuation at Jengraimukh',
      responsibleOrg: 'Bharat Flood Response Network',
      status: 'IN_PROGRESS',
      dependencies: ['SDRF boat launch escort'],
      unresolvedNeeds: 'Requires 2 additional high-flotation stretchers',
      lastUpdated: '2026-10-09T20:20:00Z',
    },
    {
      id: 'task-02',
      eventId: 'fl-2026-081',
      actionId: 'act-02',
      title: 'Water Sachet Airlift / Boat Delivery',
      responsibleOrg: 'Himalayan Aid Initiative',
      status: 'PROPOSED',
      dependencies: ['Safe approach clearance from Circle Officer'],
      unresolvedNeeds: 'Navigation clearance for flooded inner canal',
      lastUpdated: '2026-10-09T20:05:00Z',
    },
    {
      id: 'task-03',
      eventId: 'fl-2026-081',
      actionId: 'act-03',
      title: 'Hygiene Kit Distribution at Camp #4',
      responsibleOrg: 'Assam Relief Collective',
      status: 'COMPLETED',
      dependencies: [],
      unresolvedNeeds: 'None — 300 kits verified distributed',
      lastUpdated: '2026-10-09T21:10:00Z',
    },
  ],
};

export const SAMPLE_OUTCOME_UPDATES: Record<string, OutcomeUpdateEntry[]> = {
  'fl-2026-081': [
    {
      id: 'out-01',
      eventId: 'fl-2026-081',
      timestamp: '2026-10-09T21:10:00Z',
      headline: 'Camp #4 Hygiene Stock Delivered',
      source: 'Assam Relief Collective Field Report',
      operationalImpact:
        'Sanitation risk decreased from HIGH to MODERATE in Kamalabari shelter.',
    },
    {
      id: 'out-02',
      eventId: 'fl-2026-081',
      timestamp: '2026-10-09T19:50:00Z',
      headline: 'District Authorizes Boat Dispatch',
      source: 'ASDMA District Control Room',
      operationalImpact:
        'Evacuation recommendation transitioned to Authorized Decision. Resource locked.',
    },
    {
      id: 'out-03',
      eventId: 'fl-2026-081',
      timestamp: '2026-10-09T19:05:00Z',
      headline: 'Neamatighat Telemetry Danger Exceeded',
      source: 'Central Water Commission Automated Sensor',
      operationalImpact:
        'Triggered multi-source situation escalation to CRITICAL.',
    },
  ],
};
