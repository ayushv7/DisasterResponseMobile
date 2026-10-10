/**
 * Volunteers — fixture-backed stand-in (mock mode only). Eligibility results
 * here are fixed sample values labelled "Simulated"; the real check is the
 * backend's. Approving adds the person to the NGO team as a volunteer.
 */
import { SAMPLE_VOLUNTEER_APPLICATIONS } from '@/fixtures/sample-accounts';
import {
  addVolunteerMember,
  disableVolunteerMember,
  getCurrentCitizen,
} from '@/services/accounts-api';
import { getCurrentNgoSession } from '@/services/ngo-api';
import { SAMPLE_VERIFIED_NGOS } from '@/fixtures/sample-ngos';
import {
  ApplyToVolunteerInput,
  VolunteerApplication,
  VolunteerDecision,
} from '@/types/volunteers';

let applications: VolunteerApplication[] = JSON.parse(JSON.stringify(SAMPLE_VOLUNTEER_APPLICATIONS));
/** The signed-in citizen's own application id (mock keeps one per session). */
let myApplicationId: string | null = null;

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export async function applyToVolunteer(input: ApplyToVolunteerInput): Promise<VolunteerApplication> {
  const citizen = getCurrentCitizen();
  if (!citizen) throw new Error('Sign in to apply.');
  if (!input.consent) throw new Error('Consent is required to apply.');
  const ngo = SAMPLE_VERIFIED_NGOS.find((n) => n.id === input.ngoId);
  const app: VolunteerApplication = {
    id: `vol-app-${String(applications.length + 1).padStart(3, '0')}`,
    name: input.name,
    contact: citizen.contact,
    skills: input.skills,
    availability: input.availability,
    // Mock routes every application to the sample NGO so it shows in its review list
    ngoId: ngo?.id ?? 'ngo-drn-india',
    ngoName: ngo?.name ?? 'Disaster Relief Network India',
    source: 'APPLIED',
    status: 'PENDING',
    eligibility: {
      eligible: true,
      reasons: ['Simulated: sample eligibility result, no real check was run'],
      checkedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  };
  applications = [app, ...applications];
  myApplicationId = app.id;
  return copy(app);
}

export async function getMyVolunteerApplication(): Promise<VolunteerApplication | null> {
  if (!getCurrentCitizen() || !myApplicationId) return null;
  const app = applications.find((a) => a.id === myApplicationId);
  return app ? copy(app) : null;
}

export async function listVolunteerApplications(): Promise<VolunteerApplication[]> {
  const ngo = getCurrentNgoSession();
  return copy(ngo ? applications.filter((a) => !a.ngoId || a.ngoId === ngo.ngoId) : applications);
}

export async function decideVolunteerApplication(
  id: string,
  decision: VolunteerDecision,
  reason?: string
): Promise<VolunteerApplication> {
  const app = applications.find((a) => a.id === id);
  if (!app) throw new Error('Application not found.');
  if (decision === 'APPROVE') {
    app.status = 'APPROVED';
    app.decisionReason = undefined;
    addVolunteerMember(app);
  } else {
    app.status = decision === 'REJECT' ? 'REJECTED' : 'REVOKED';
    app.decisionReason = reason;
    if (decision === 'REVOKE') disableVolunteerMember(app.id);
  }
  app.decidedAt = new Date().toISOString();
  return copy(app);
}
