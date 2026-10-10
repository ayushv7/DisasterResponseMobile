/**
 * SAMPLE CONTRIBUTORS — Simulated applications, sign-ins, resources and plans.
 * Not real people, credentials or resources. Mock mode only.
 */
import {
  ContributorApplication,
  ContributorResource,
  ResourcePlan,
  ResourceTypePolicy,
} from '@/types/contributors';

/** Fixed value the mock returns as the issued sign-in code. */
export const SAMPLE_CONTRIBUTOR_CODE = 'SAMPLE-CODE';

/**
 * Mock check-in policy per resource type. Configurable here only; the app
 * reads intervals from the service, never from this file directly.
 */
export const SAMPLE_RESOURCE_POLICIES: ResourceTypePolicy[] = [
  { type: 'BOAT', label: 'Boat', unit: 'boats', checkInIntervalHours: 5 },
  { type: 'FOOD_STOCK', label: 'Food stock', unit: 'kits', checkInIntervalHours: 24 },
  { type: 'WATER', label: 'Drinking water', unit: 'litres', checkInIntervalHours: 24 },
  { type: 'GENERATOR', label: 'Generator', unit: 'units', checkInIntervalHours: 12 },
  { type: 'VEHICLE', label: 'Vehicle', unit: 'vehicles', checkInIntervalHours: 8 },
];

export const SAMPLE_CONTRIBUTOR_APPLICATIONS: ContributorApplication[] = [
  {
    id: 'con-app-001',
    name: 'K. Hazarika',
    contact: '•••• 2231',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    offering: '2 motor boats, 1 generator',
    area: 'Majuli, Assam',
    status: 'PENDING',
    createdAt: '2026-10-09T08:10:00Z',
  },
  {
    id: 'con-app-002',
    name: 'S. Borah',
    contact: 's•••@example.org',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    offering: '100 food kits weekly',
    area: 'Jorhat, Assam',
    status: 'APPROVED',
    createdAt: '2026-10-07T12:00:00Z',
    decidedAt: '2026-10-07T15:00:00Z',
  },
  {
    id: 'con-app-003',
    name: 'P. Kalita',
    contact: '•••• 9012',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    offering: 'One tractor',
    area: 'Outside service area',
    status: 'REJECTED',
    decisionReason: 'Outside our service area.',
    createdAt: '2026-10-06T09:00:00Z',
    decidedAt: '2026-10-06T11:00:00Z',
  },
  {
    id: 'con-app-004',
    name: 'D. Saikia',
    contact: '•••• 5520',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    offering: '1 pickup truck',
    area: 'Majuli, Assam',
    status: 'REVOKED',
    decisionReason: 'Resource photos were reused from another listing.',
    createdAt: '2026-10-01T09:00:00Z',
    decidedAt: '2026-10-08T10:00:00Z',
  },
];

/** Sample sign-ins: one valid, one expired code, one revoked. */
export const SAMPLE_CONTRIBUTOR_ACCOUNTS: {
  contributorId: string;
  applicationId: string;
  name: string;
  state: 'ACTIVE' | 'CODE_EXPIRED' | 'REVOKED';
}[] = [
  { contributorId: 'SAMPLE-C-0001', applicationId: 'con-app-002', name: 'S. Borah', state: 'ACTIVE' },
  { contributorId: 'SAMPLE-C-0002', applicationId: 'con-app-005', name: 'A. Dutta', state: 'CODE_EXPIRED' },
  { contributorId: 'SAMPLE-C-0003', applicationId: 'con-app-004', name: 'D. Saikia', state: 'REVOKED' },
];

/**
 * Sample resources for SAMPLE-C-0001, one per status the backend can return.
 * Times are relative offsets (hours from now) so the demo stays current.
 */
export const SAMPLE_RESOURCES: (Omit<ContributorResource, 'lastCheckInAt' | 'checkInDueAt'> & {
  lastCheckInHoursAgo?: number;
  dueInHours?: number;
})[] = [
  {
    id: 'res-c1-boat',
    contributorId: 'SAMPLE-C-0001',
    ngoId: 'ngo-drn-india',
    type: 'BOAT',
    typeLabel: 'Boat',
    quantity: 2,
    unit: 'boats',
    condition: 'GOOD',
    availability: 'AVAILABLE',
    freshness: 'FRESH',
    statusReason: 'Simulated: checked in within the 5-hour window.',
    eligibleForAllocation: true,
    checkInIntervalHours: 5,
    lastCheckInHoursAgo: 1,
    dueInHours: 4,
    evidence: { capturedAt: '', unverified: false, photoUrl: 'simulated://photo/boat' },
  },
  {
    id: 'res-c1-food',
    contributorId: 'SAMPLE-C-0001',
    ngoId: 'ngo-drn-india',
    type: 'FOOD_STOCK',
    typeLabel: 'Food stock',
    quantity: 100,
    unit: 'kits',
    condition: 'GOOD',
    availability: 'AVAILABLE',
    freshness: 'DUE',
    statusReason: 'Simulated: check-in due soon.',
    eligibleForAllocation: true,
    checkInIntervalHours: 24,
    lastCheckInHoursAgo: 22,
    dueInHours: 2,
    evidence: { capturedAt: '', unverified: false, photoUrl: 'simulated://photo/food' },
  },
  {
    id: 'res-c1-gen',
    contributorId: 'SAMPLE-C-0001',
    ngoId: 'ngo-drn-india',
    type: 'GENERATOR',
    typeLabel: 'Generator',
    quantity: 1,
    unit: 'units',
    condition: 'FAIR',
    availability: 'AVAILABLE',
    freshness: 'STALE',
    statusReason: 'Simulated: check-in missed; not eligible until confirmed.',
    eligibleForAllocation: false,
    checkInIntervalHours: 12,
    lastCheckInHoursAgo: 15,
    dueInHours: -3,
  },
  {
    id: 'res-c1-vehicle',
    contributorId: 'SAMPLE-C-0001',
    ngoId: 'ngo-drn-india',
    type: 'VEHICLE',
    typeLabel: 'Vehicle',
    quantity: 1,
    unit: 'vehicles',
    condition: 'POOR',
    availability: 'UNAVAILABLE',
    freshness: 'FRESH',
    statusReason: 'Simulated: contributor reported it unavailable.',
    eligibleForAllocation: false,
    checkInIntervalHours: 8,
    lastCheckInHoursAgo: 2,
    dueInHours: 6,
  },
  {
    id: 'res-c1-water',
    contributorId: 'SAMPLE-C-0001',
    ngoId: 'ngo-drn-india',
    type: 'WATER',
    typeLabel: 'Drinking water',
    quantity: 500,
    unit: 'litres',
    condition: 'GOOD',
    availability: 'AVAILABLE',
    freshness: 'UNVERIFIED',
    statusReason: 'Simulated: registered without live GPS or photo; NGO review needed.',
    eligibleForAllocation: false,
    checkInIntervalHours: 24,
    lastCheckInHoursAgo: 3,
    dueInHours: 21,
    evidence: { capturedAt: '', unverified: true },
  },
];

/** Initial sample plan (version 1, generated by the system). */
export const SAMPLE_PLAN: Omit<ResourcePlan, 'generatedAt'> = {
  id: 'plan-ngo-drn-india',
  ngoId: 'ngo-drn-india',
  version: 1,
  lastChangedBy: { name: 'Allocation service (Simulated)', kind: 'SYSTEM' },
  allocations: [
    {
      id: 'alloc-1',
      workOrderId: 'INT-102',
      workOrderLabel: 'INT-102 · Boat evacuation',
      resourceId: 'res-c1-boat',
      resourceLabel: 'Boat × 2 (S. Borah)',
      quantity: 2,
      source: 'AUTO',
    },
    {
      id: 'alloc-2',
      workOrderId: 'INT-105',
      workOrderLabel: 'INT-105 · Drinking water logistics',
      resourceId: 'res-c1-food',
      resourceLabel: 'Food stock × 100 (S. Borah)',
      quantity: 50,
      source: 'AUTO',
    },
  ],
};
