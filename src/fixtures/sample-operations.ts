/**
 * Disaster Response Orchestration Network — Operational Fixtures
 *
 * Clearly labeled simulation fixtures demonstrating:
 * - Active incident triage
 * - Interventions awaiting assignment, acknowledgement, and verification
 * - Road blockages and equipment breakdown triggering replanning
 * - Explainable equipment/crew allocation recommendations
 */

import {
  AllocationRecommendation,
  IncidentRecord,
  InterventionRecord,
  OperationalOverviewStats,
  OperationalResource,
  ReplanningRecord,
} from '@/types/operations';

export const SAMPLE_INCIDENTS: IncidentRecord[] = [
  {
    id: 'INC-2026-081',
    title: 'Brahmaputra River Surge — Majuli Kamalabari Embankment Threat',
    location: 'Majuli Island, Assam (Sector 4 Riverfront)',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    affectedAreaDescription:
      'Spillover depth 0.85m across lower berm; earthen dike experiencing localized piping.',
    estimatedPopulationImpact: 3400,
    criticalAssetsAtRisk: [
      'Kamalabari Ferry Terminal',
      'Sub-District Primary Health Centre',
      'Power Feeder Substation #2',
    ],
    detectionSource: 'Central Water Commission Gauge + Sentinel SAR Telemetry',
    detectedAt: '2026-10-10T00:45:00Z',
    unresolvedGaps: [
      'Sub-surface soil piping velocity unmeasured',
      'Exact vehicle load rating of access spur road #3',
    ],
    requiredInterventionIds: ['INT-101', 'INT-102'],
  },
  {
    id: 'INC-2026-082',
    title: 'Godavari Estuary Backwater Overflow — Ainavilli Causeway Cutoff',
    location: 'Ainavilli Mandal, Konaseema, Andhra Pradesh',
    severity: 'HIGH',
    status: 'ACTIVE',
    affectedAreaDescription:
      'Causeway submerged under 1.2m turbulent flow; 4 hamlets isolated from road access.',
    estimatedPopulationImpact: 1950,
    criticalAssetsAtRisk: [
      'Ainavilli Mukteswaram Causeway',
      'Drinking Water Supply Wellhead #5',
    ],
    detectionSource: 'State Disaster Management Authority Hydrometric Network',
    detectedAt: '2026-10-09T22:15:00Z',
    unresolvedGaps: [
      'Condition of downstream culvert foundation under high turbidity',
    ],
    requiredInterventionIds: ['INT-103', 'INT-104'],
  },
  {
    id: 'INC-2026-083',
    title: 'Kosi River Flash Silt Inundation — Supaul Lowland Sector',
    location: 'Nirmali Block, Supaul, Bihar',
    severity: 'HIGH',
    status: 'WATCH',
    affectedAreaDescription:
      'Heavy silt deposition in drainage channels preventing runoff discharge.',
    estimatedPopulationImpact: 2600,
    criticalAssetsAtRisk: [
      'Nirmali Block Hospital Ingress',
      'Grain Storage Warehouse Depot',
    ],
    detectionSource: 'River Basin Telemetry + Citizen Sensor Corroboration',
    detectedAt: '2026-10-09T19:30:00Z',
    unresolvedGaps: ['Depth of silt buildup along northern bypass drainage'],
    requiredInterventionIds: ['INT-105', 'INT-106'],
  },
];

/**
 * The moment the sample timestamps were written against. Mock mode shifts
 * resource report times by (now - this) so freshness colors stay meaningful.
 */
export const SAMPLE_REFERENCE_TIME = '2026-10-10T01:00:00Z';

export const SAMPLE_RESOURCES: OperationalResource[] = [
  {
    id: 'RES-PUMP-01',
    name: 'Kirloskar High-Volume Diesel Dewatering Pump (6000 LPM)',
    category: 'EQUIPMENT',
    capabilities: ['Heavy Dewatering', 'Turbid Water Discharge', 'Continuous Run'],
    operationalCondition: 'OPERATIONAL',
    availabilityStatus: 'AVAILABLE',
    statusReportedAt: '2026-10-10T00:40:00Z',
    currentBaseLocation: 'Jorhat Central SDRF Depot',
    proximityKm: 4.8,
    specifications: 'Diesel self-priming 6-inch suction with 150m discharge layflat hoses',
  },
  {
    id: 'RES-PUMP-02',
    name: 'Submersible Silt Slurry Pump Unit B',
    category: 'EQUIPMENT',
    capabilities: ['Silt Removal', 'Heavy Slurry Pumping'],
    operationalCondition: 'MAINTENANCE_REQUIRED',
    availabilityStatus: 'RESERVED',
    statusReportedAt: '2026-10-08T09:00:00Z',
    currentBaseLocation: 'North Lakhimpur Workshop',
    proximityKm: 18.5,
    specifications: 'Impeller wear detected during inspection. Requires 3-phase generator.',
  },
  {
    id: 'RES-PUMP-03',
    name: 'Godwin High-Head Centrifugal Pump Set #4',
    category: 'EQUIPMENT',
    capabilities: ['Heavy Dewatering', 'High-Head Pressure Discharge'],
    operationalCondition: 'OPERATIONAL',
    availabilityStatus: 'AVAILABLE',
    statusReportedAt: '2026-10-09T20:15:00Z',
    currentBaseLocation: 'Majuli Civil Defense Hub',
    proximityKm: 7.2,
    specifications: 'Trailer-mounted 4-inch pump with diesel engine drive',
  },
  {
    id: 'RES-CREW-A',
    name: 'SDRF Rapid Engineering Response Crew Alpha',
    category: 'CREW',
    capabilities: ['Embankment Reinforcement', 'Heavy Pump Rigging', 'Hazard Assessment'],
    operationalCondition: 'OPERATIONAL',
    availabilityStatus: 'AVAILABLE',
    statusReportedAt: '2026-10-10T00:52:00Z',
    currentBaseLocation: 'Garmur Relief Staging Area',
    proximityKm: 3.5,
    specifications: '6 hydraulic engineers and 8 trained emergency technicians',
  },
  {
    id: 'RES-CREW-B',
    name: 'Majuli Volunteer Water Rescue Team',
    category: 'CREW',
    capabilities: ['Boat Rescue', 'Shallow Water Evacuation', 'First Aid'],
    operationalCondition: 'OPERATIONAL',
    availabilityStatus: 'DEPLOYED',
    statusReportedAt: '2026-10-10T00:30:00Z',
    currentBaseLocation: 'Kamalabari Ghat',
    proximityKm: 1.2,
    specifications: '10 swimmers with swift-water rescue technician certifications',
    currentAssignmentId: 'INT-104',
  },
  {
    id: 'RES-BOAT-01',
    name: 'Zodiac Pro 40HP Swiftwater Rescue Inflatable',
    category: 'VEHICLE',
    capabilities: ['Swiftwater Evacuation', 'Shallow River Navigation'],
    operationalCondition: 'OPERATIONAL',
    availabilityStatus: 'AVAILABLE',
    statusReportedAt: '2026-10-09T14:00:00Z',
    currentBaseLocation: 'Garmur Jetty',
    proximityKm: 5.1,
    specifications: 'Capacity 10 adults with life vests and trauma kit',
  },
  {
    id: 'RES-BOAT-02',
    name: 'Aluminum Flat-Bottom Relief Barge #2',
    category: 'VEHICLE',
    capabilities: ['Heavy Cargo Logistics', 'Livestock Transport'],
    operationalCondition: 'DEGRADED',
    availabilityStatus: 'AVAILABLE',
    statusReportedAt: '2026-10-07T18:00:00Z',
    currentBaseLocation: 'Dhunaguri Outpost',
    proximityKm: 11.0,
    specifications: 'Outboard motor throttle issue; restricted to calm inland backwaters',
  },
];

export const SAMPLE_INTERVENTIONS: InterventionRecord[] = [
  {
    id: 'INT-101',
    incidentId: 'INC-2026-081',
    incidentTitle: 'Brahmaputra River Surge — Kamalabari Embankment',
    type: 'DEWATERING',
    priority: 'IMMEDIATE',
    status: 'AWAITING_ASSIGNMENT',
    targetLocality: 'Sector 4 Lower Berm, Kamalabari Ghat',
    instructions:
      'Deploy high-volume dewatering unit to depress water head behind piping seepage berm before breach occurs.',
    requiredCapabilities: ['Heavy Dewatering', 'Turbid Water Discharge'],
    constraints: [
      'Access spur road #3 restricted to vehicles under 6 tons',
      'Grid power severed; pump MUST be diesel self-powered',
    ],
    contingencyPlan:
      'If primary pump cannot deploy within 45 min, stage sandbag diversion berm 80m inland.',
  },
  {
    id: 'INT-102',
    incidentId: 'INC-2026-081',
    incidentTitle: 'Brahmaputra River Surge — Kamalabari Embankment',
    type: 'BOAT_EVACUATION',
    requiredQualification: 'Certified swiftwater boat operator',
    priority: 'IMMEDIATE',
    status: 'AWAITING_ACK',
    targetLocality: 'Doriya Char Settlement (Majuli Sub-basin)',
    instructions:
      'Evacuate 38 high-vulnerability households (elderly and pregnant residents) to designated high ground school.',
    requiredCapabilities: ['Swiftwater Evacuation', 'Shallow River Navigation'],
    constraints: ['Strong cross-currents near river junction'],
    assignedTeamId: 'RES-CREW-A',
    assignedTeamName: 'SDRF Rapid Engineering Response Crew Alpha',
    assignedEquipment: ['Zodiac Pro 40HP Rescue Boat (RES-BOAT-01)'],
    assignedAt: '2026-10-10T01:10:00Z',
    deadlineMinutes: 30,
    deadlineTimestamp: '2026-10-10T01:40:00Z',
    contingencyPlan:
      'If not acknowledged by deadline, escalate to State River Police detachment at Nimati.',
  },
  {
    id: 'INT-103',
    incidentId: 'INC-2026-082',
    incidentTitle: 'Godavari Estuary Overflow — Ainavilli Causeway',
    type: 'EMBANKMENT_REINFORCEMENT',
    requiredQualification: 'Supervised civil works crew',
    priority: 'HIGH',
    status: 'BLOCKED',
    targetLocality: 'Mukteswaram Causeway Junction',
    instructions:
      'Deposit boulder rip-rap and geofabric bags along washed-out bridge approach road.',
    requiredCapabilities: ['Embankment Reinforcement'],
    constraints: ['Primary approach road inundated under 1.2m swift current'],
    assignedTeamId: 'RES-CREW-A',
    assignedTeamName: 'SDRF Rapid Engineering Response Crew Alpha',
    assignedEquipment: ['Earthmover Unit #3'],
    assignedAt: '2026-10-09T23:00:00Z',
    blockerReport: {
      reportedAt: '2026-10-10T00:15:00Z',
      reason:
        'Access road completely submerged by sudden estuary surge. Heavy haulers cannot reach site without overturning.',
      isCritical: true,
    },
    contingencyPlan:
      'Switch transport of geobags to shallow flat-bottom barges from eastern bank.',
  },
  {
    id: 'INT-104',
    incidentId: 'INC-2026-082',
    incidentTitle: 'Godavari Estuary Overflow — Ainavilli Causeway',
    type: 'MEDICAL_STABILIZATION',
    requiredQualification: 'First aid / paramedic certificate',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    targetLocality: 'Ainavilli Cutoff Hamlets #2 & #3',
    instructions:
      'Transport 3 dialysis patients and medical officer across backwaters to Amalapuram General Hospital.',
    requiredCapabilities: ['Boat Rescue', 'First Aid'],
    constraints: ['Night navigation along unlit estuary channel'],
    assignedTeamId: 'RES-CREW-B',
    assignedTeamName: 'Majuli Volunteer Water Rescue Team',
    assignedEquipment: ['Shallow draft rescue boat'],
    assignedAt: '2026-10-09T23:30:00Z',
    acknowledgedAt: '2026-10-09T23:35:00Z',
    startedAt: '2026-10-09T23:45:00Z',
    contingencyPlan:
      'Air-cushion hovercraft backup on standby at Rajahmundry air station.',
  },
  {
    id: 'INT-105',
    incidentId: 'INC-2026-083',
    incidentTitle: 'Kosi River Flash Silt Inundation — Supaul',
    type: 'DRINKING_WATER_LOGISTICS',
    priority: 'ROUTINE',
    status: 'AWAITING_VERIFICATION',
    targetLocality: 'Nirmali Block High School Relief Shelter',
    instructions:
      'Deliver water filtration units and 5000L mobile bladder tank for 650 displaced evacuees.',
    requiredCapabilities: ['Drinking Water Logistics'],
    constraints: ['Access road dusty with heavy silt'],
    assignedTeamId: 'RES-CREW-C',
    assignedTeamName: 'Medical Triage & Water Logistics Unit',
    assignedAt: '2026-10-09T20:00:00Z',
    acknowledgedAt: '2026-10-09T20:05:00Z',
    startedAt: '2026-10-09T20:30:00Z',
    completedAt: '2026-10-09T23:40:00Z',
    completionEvidence:
      'Bladder tank filled, chlorine level tested at 0.5 PPM, distributed 300 jerrycans. Signed by Shelter Warden.',
    contingencyPlan: 'Bottle ration pack distribution from district collectorate.',
  },
  {
    id: 'INT-106',
    incidentId: 'INC-2026-083',
    incidentTitle: 'Kosi River Flash Silt Inundation — Supaul',
    type: 'DEWATERING',
    priority: 'HIGH',
    status: 'FAILED',
    targetLocality: 'Hospital Access Basement Sump',
    instructions:
      'Clear flooded hospital basement containing backup diesel generator to restore medical power.',
    requiredCapabilities: ['Heavy Dewatering'],
    constraints: ['High silt concentration in sump water'],
    assignedTeamId: 'RES-CREW-A',
    assignedTeamName: 'Contractor Dewatering Crew #1',
    assignedEquipment: ['Standard Electric Sump Pump'],
    assignedAt: '2026-10-09T21:00:00Z',
    startedAt: '2026-10-09T21:30:00Z',
    blockerReport: {
      reportedAt: '2026-10-09T22:50:00Z',
      reason:
        'Standard sump pump seized due to excessive silt density (45% solids). Intervention unsuccessful.',
      isCritical: true,
    },
    contingencyPlan:
      'Mobilize specialized slurry pump with vortex cutter head from district depot.',
  },
];

export const SAMPLE_ALLOCATION_RECOMMENDATIONS: Record<string, AllocationRecommendation> = {
  'INT-101': {
    interventionId: 'INT-101',
    recommendedTeamId: 'RES-CREW-A',
    recommendedTeamName: 'SDRF Rapid Engineering Response Crew Alpha',
    recommendedEquipment: [
      'Kirloskar High-Volume Diesel Dewatering Pump (RES-PUMP-01)',
      '150m Heavy Layflat Hose Bundle',
    ],
    matchingRationale:
      'Selected based on OPERATIONAL condition, 4.8km proximity, self-powered diesel requirement (meeting grid power failure constraint), and verified capability in high-turbidity discharge.',
    identifiedConstraints: [
      'Bridge weight limit (6T): Equipment set weighs 2.2T (compliant)',
      'Discharge route requires crossing earthen levee without causing erosion',
    ],
    missingInputs: [
      'Field soil permeability verification at discharge discharge exit',
    ],
    suggestedDeadlineMinutes: 45,
    alternativeOption:
      'Godwin Pump Set #4 (RES-PUMP-03) at 7.2km, if primary team encounter transit delay.',
  },
};

export const SAMPLE_REPLANNING_RECORDS: ReplanningRecord[] = [
  {
    id: 'REPLAN-301',
    interventionId: 'INT-103',
    incidentId: 'INC-2026-082',
    incidentTitle: 'Godavari Estuary Overflow — Ainavilli Causeway',
    targetLocality: 'Mukteswaram Causeway Junction',
    triggerReason: 'ROUTE_BLOCKED',
    originalAssignment: 'Ground haulage via Approach Road #1 (Crew Alpha)',
    blockerDetails:
      'Access corridor submerged by 1.2m tidal flow; heavy haulers cannot traverse.',
    recommendedAlternative:
      'Reallocate delivery of geofabric rip-rap via shallow flat-bottom barges (RES-BOAT-02) from eastern calm-water jetty.',
    status: 'PENDING_SUPERVISOR_ACTION',
    timestamp: '2026-10-10T00:20:00Z',
  },
  {
    id: 'REPLAN-302',
    interventionId: 'INT-106',
    incidentId: 'INC-2026-083',
    incidentTitle: 'Kosi River Flash Silt Inundation — Supaul',
    targetLocality: 'Hospital Access Basement Sump',
    triggerReason: 'EQUIPMENT_FAILURE',
    originalAssignment: 'Contractor Dewatering Crew with Standard Electric Sump Pump',
    blockerDetails:
      'Standard pump impeller jammed and seized due to heavy silt solids.',
    recommendedAlternative:
      'Dispatch Submersible Silt Slurry Pump (RES-PUMP-02) with diesel generator from North Lakhimpur or request SDRF slurry rig.',
    status: 'ESCALATED',
    timestamp: '2026-10-09T23:05:00Z',
  },
];

export const SAMPLE_OPERATIONAL_STATS: OperationalOverviewStats = {
  activeIncidents: 3,
  immediateInterventions: 2,
  pendingAcknowledgement: 1,
  inProgressTasks: 1,
  blockedOrFailedInterventions: 2,
  awaitingVerification: 1,
  lastTelemetrySync: '2026-10-10T01:15:00Z',
};
