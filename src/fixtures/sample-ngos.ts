/**
 * Sample Verified NGO Data — FIXTURE ONLY
 *
 * ⚠️  This is representative sample data for UI development.
 *     Replace with a real GET /api/v1/ngos call once the backend is ready.
 *     Do NOT use this data to make claims about actual NGO registration status.
 */

import { VerifiedNgo } from '@/types/messaging';

export const IS_SAMPLE_NGOS = true;

export const SAMPLE_VERIFIED_NGOS: VerifiedNgo[] = [
  {
    id: 'ngo-001',
    name: 'Bharat Flood Response Network',
    focusAreas: ['Flood Relief', 'Emergency Evacuation', 'Shelter Provision'],
    isVerified: true,
    verifiedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'ngo-002',
    name: 'Himalayan Aid Initiative',
    focusAreas: ['Medical Support', 'Search & Rescue', 'Water & Sanitation'],
    isVerified: true,
    verifiedAt: '2026-02-03T00:00:00Z',
  },
  {
    id: 'ngo-003',
    name: 'Assam Relief Collective',
    focusAreas: ['Food Distribution', 'Displacement Support', 'Child Welfare'],
    isVerified: true,
    verifiedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'ngo-004',
    name: 'Kerala Disaster Management Foundation',
    focusAreas: ['Infrastructure Repair', 'Community Reconstruction'],
    isVerified: true,
    verifiedAt: '2026-04-11T00:00:00Z',
  },
  {
    id: 'ngo-005',
    name: 'National Flood Relief Coordination Centre',
    focusAreas: ['Multi-agency Coordination', 'Logistics', 'Aerial Survey'],
    isVerified: true,
    verifiedAt: '2026-05-07T00:00:00Z',
  },
];
