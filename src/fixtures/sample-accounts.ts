/**
 * SAMPLE ACCOUNTS — Simulated sign-in only. Not real people or credentials.
 *
 * In mock mode these stand in for what the backend would issue. Passwords are
 * not checked. Real NGO codes, worker IDs and passwords come from the backend.
 */
import { NgoMember, StaffRole } from '@/types/accounts';
import { VolunteerApplication } from '@/types/volunteers';

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

/** Mock mode accepts only this one-time code. Real codes are sent by the backend. */
export const SAMPLE_OTP_CODE = '123456';

/** SAMPLE volunteer applications with simulated eligibility results. Not real people. */
export const SAMPLE_VOLUNTEER_APPLICATIONS: VolunteerApplication[] = [
  {
    id: 'vol-app-001',
    name: 'R. Gogoi',
    contact: '•••• 4410',
    skills: ['Swimming', 'First aid'],
    availability: 'Weekends, daytime',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    source: 'APPLIED',
    status: 'PENDING',
    eligibility: {
      eligible: true,
      reasons: ['Simulated: ID check passed', 'Simulated: first aid certificate on file'],
      checkedAt: '2026-10-09T10:00:00Z',
    },
    createdAt: '2026-10-09T09:40:00Z',
  },
  {
    id: 'vol-app-002',
    name: 'M. Das',
    contact: 'm•••@example.org',
    skills: ['Cooking', 'Logistics'],
    availability: 'Evenings',
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    source: 'INVITED',
    status: 'PENDING',
    eligibility: {
      eligible: false,
      reasons: ['Simulated: ID document not yet verified'],
      checkedAt: '2026-10-09T11:00:00Z',
    },
    createdAt: '2026-10-09T10:50:00Z',
  },
];
