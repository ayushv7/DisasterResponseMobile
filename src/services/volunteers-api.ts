/**
 * Volunteers — fixture-backed stand-in (mock mode only). Eligibility results
 * here are fixed sample values labelled "Simulated"; the real check is the
 * backend's. Approving adds the person to the NGO team as a volunteer.
 */
import { getCurrentCitizen } from '@/services/accounts-api';
import { createVolunteerAccount, disableVolunteerAccount } from '@/services/mock/cascades';
import { store } from '@/services/mock/store';
import { getCurrentNgoSession } from '@/services/ngo-api';
import { SAMPLE_VERIFIED_NGOS } from '@/fixtures/sample-ngos';
import {
  ApplyToVolunteerInput,
  VolunteerApplication,
  VolunteerDecision,
} from '@/types/volunteers';

// Applications live in the shared mock store; approval side effects in mock/cascades.
/** The signed-in citizen's own application id (mock keeps one per session). */
let myApplicationId: string | null = null;

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export async function applyToVolunteer(input: ApplyToVolunteerInput): Promise<VolunteerApplication> {
  const citizen = getCurrentCitizen();
  if (!citizen) throw new Error('Sign in to apply.');
  if (!input.consent) throw new Error('Consent is required to apply.');
  const ngo = SAMPLE_VERIFIED_NGOS.find((n) => n.id === input.ngoId);
  const app: VolunteerApplication = {
    id: `vol-app-${String(store.volunteerApplications.length + 1).padStart(3, '0')}`,
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
  store.volunteerApplications = [app, ...store.volunteerApplications];
  myApplicationId = app.id;
  return copy(app);
}

export async function getMyVolunteerApplication(): Promise<VolunteerApplication | null> {
  if (!getCurrentCitizen() || !myApplicationId) return null;
  const app = store.volunteerApplications.find((a) => a.id === myApplicationId);
  return app ? copy(app) : null;
}

export async function listVolunteerApplications(): Promise<VolunteerApplication[]> {
  const ngo = getCurrentNgoSession();
  return copy(ngo ? store.volunteerApplications.filter((a) => !a.ngoId || a.ngoId === ngo.ngoId) : store.volunteerApplications);
}

export async function decideVolunteerApplication(
  id: string,
  decision: VolunteerDecision,
  reason?: string
): Promise<VolunteerApplication> {
  const app = store.volunteerApplications.find((a) => a.id === id);
  if (!app) throw new Error('Application not found.');
  if (decision === 'APPROVE') {
    app.status = 'APPROVED';
    app.decisionReason = undefined;
    createVolunteerAccount(app);
  } else {
    app.status = decision === 'REJECT' ? 'REJECTED' : 'REVOKED';
    app.decisionReason = reason;
    if (decision === 'REVOKE') disableVolunteerAccount(app.id);
  }
  app.decidedAt = new Date().toISOString();
  return copy(app);
}
