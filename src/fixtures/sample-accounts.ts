/**
 * SAMPLE ACCOUNTS — Simulated sign-in only. Not real people or credentials.
 *
 * In mock mode these stand in for what the backend would issue. Passwords are
 * not checked. Real NGO codes, worker IDs and passwords come from the backend.
 */
import { NgoMember, StaffRole } from '@/types/accounts';

/** NGO code of the sample NGO (Disaster Relief Network India). */
export const SAMPLE_NGO_CODE = 'SAMPLE-DRN';

/** Fixed value the mock returns for every new or reset worker password. */
export const SAMPLE_TEMP_PASSWORD = 'SAMPLE-TEMP-PASS';

export const SAMPLE_STAFF_ACCOUNTS: Record<string, { role: StaffRole; name: string; ngoName?: string }> = {
  'ngo@sample.org': {
    role: 'ngo',
    name: 'R. Sharma (Field Lead)',
    ngoName: 'Disaster Relief Network India',
  },
  'coordinator@sample.org': { role: 'coordinator', name: 'Sample Coordinator' },
  'admin@sample.org': { role: 'admin', name: 'Sample Admin' },
};

export const SAMPLE_FIELD_TEAM: NgoMember[] = [
  {
    id: 'mem-001',
    workerId: 'SAMPLE-W-0001',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    name: 'A. Bora',
    phone: '+91 00000 00001',
    skills: ['Boat handling', 'First aid'],
    status: 'ACTIVE',
    mustChangePassword: true,
    teamId: 'RES-CREW-B',
    createdAt: '2026-10-08T09:00:00Z',
  },
  {
    id: 'mem-002',
    workerId: 'SAMPLE-W-0002',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    name: 'P. Saikia',
    phone: '+91 00000 00002',
    skills: ['Water logistics'],
    status: 'ACTIVE',
    mustChangePassword: false,
    teamId: 'RES-CREW-C',
    createdAt: '2026-10-08T09:05:00Z',
  },
];
