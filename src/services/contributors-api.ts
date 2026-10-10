/**
 * Contributors — mock adapter (mock mode only). Stands in for the backend:
 * approval, issued credentials, sign-in, resources, check-ins and plans. All
 * decisions here are simple simulations so the flows can be demonstrated;
 * the real rules belong to the backend.
 */
import {
  SAMPLE_CONTRIBUTOR_ACCOUNTS,
  SAMPLE_CONTRIBUTOR_APPLICATIONS,
  SAMPLE_CONTRIBUTOR_CODE,
} from '@/fixtures/sample-contributors';
import { SAMPLE_VERIFIED_NGOS } from '@/fixtures/sample-ngos';
import { getCurrentCitizen } from '@/services/accounts-api';
import { getCurrentNgoSession } from '@/services/ngo-api';
import { ApiError } from '@/services/api/types';
import {
  ApplyToContributeInput,
  Contributor,
  ContributorApplication,
  ContributorCredentials,
  ContributorLoginInput,
} from '@/types/contributors';
import { VolunteerDecision } from '@/types/volunteers';

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

let applications: ContributorApplication[] = copy(SAMPLE_CONTRIBUTOR_APPLICATIONS);
let accounts = copy(SAMPLE_CONTRIBUTOR_ACCOUNTS);
let myApplicationId: string | null = null;
let current: Contributor | null = null;

// ── Applications ────────────────────────────────────────────────────────────

export async function applyToContribute(input: ApplyToContributeInput): Promise<ContributorApplication> {
  const citizen = getCurrentCitizen();
  if (!citizen) throw new ApiError('UNAUTHORIZED', 'Sign in to apply.');
  if (!input.consent) throw new ApiError('CONSENT_REQUIRED', 'Consent is required to apply.');
  const ngo = SAMPLE_VERIFIED_NGOS.find((n) => n.id === input.ngoId);
  if (!ngo) throw new ApiError('NGO_NOT_FOUND', 'Choose a verified NGO.');
  const app: ContributorApplication = {
    id: `con-app-${String(applications.length + 101)}`,
    name: input.name,
    contact: citizen.contact,
    // Mock: route to the sample NGO so it appears in its review list
    ngoId: 'ngo-drn-india',
    ngoName: ngo.name,
    offering: input.offering,
    area: input.area,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };
  applications = [app, ...applications];
  myApplicationId = app.id;
  return copy(app);
}

export async function getMyContributorApplication(): Promise<ContributorApplication | null> {
  if (!getCurrentCitizen() || !myApplicationId) return null;
  const app = applications.find((a) => a.id === myApplicationId);
  return app ? copy(app) : null;
}

export async function listContributorApplications(): Promise<ContributorApplication[]> {
  const ngo = getCurrentNgoSession();
  if (!ngo) throw new ApiError('UNAUTHORIZED', 'Only NGO staff can review applications.');
  return copy(applications.filter((a) => a.ngoId === ngo.ngoId));
}

export async function decideContributorApplication(
  id: string,
  decision: VolunteerDecision,
  reason?: string
): Promise<{ application: ContributorApplication; credentials?: ContributorCredentials }> {
  if (!getCurrentNgoSession()) throw new ApiError('UNAUTHORIZED', 'Only NGO staff can decide.');
  const app = applications.find((a) => a.id === id);
  if (!app) throw new ApiError('NOT_FOUND', 'Application not found.');
  if (decision !== 'APPROVE' && !reason?.trim()) {
    throw new ApiError('REASON_REQUIRED', 'Give a reason for rejecting or revoking.');
  }
  app.decidedAt = new Date().toISOString();
  if (decision === 'APPROVE') {
    if (app.status !== 'PENDING') throw new ApiError('INVALID_STATE', 'Only pending applications can be approved.');
    app.status = 'APPROVED';
    app.decisionReason = undefined;
    const contributorId = `SAMPLE-C-${String(accounts.length + 1).padStart(4, '0')}`;
    accounts = [...accounts, { contributorId, applicationId: app.id, name: app.name, state: 'ACTIVE' }];
    return {
      application: copy(app),
      credentials: { contributorId, signInCode: SAMPLE_CONTRIBUTOR_CODE },
    };
  }
  app.status = decision === 'REJECT' ? 'REJECTED' : 'REVOKED';
  app.decisionReason = reason?.trim();
  if (decision === 'REVOKE') {
    accounts = accounts.map((a) => (a.applicationId === app.id ? { ...a, state: 'REVOKED' } : a));
  }
  return { application: copy(app) };
}

// ── Sign-in ─────────────────────────────────────────────────────────────────

export async function contributorLogin(input: ContributorLoginInput): Promise<Contributor> {
  const account = accounts.find((a) => a.contributorId === input.contributorId.trim().toUpperCase());
  if (!account || input.signInCode.trim().toUpperCase() !== SAMPLE_CONTRIBUTOR_CODE) {
    throw new ApiError('INVALID_CREDENTIALS', 'Contributor ID or sign-in code is not correct.');
  }
  if (account.state === 'CODE_EXPIRED') {
    throw new ApiError('CODE_EXPIRED', 'This sign-in code has expired. Ask your NGO for a new one.');
  }
  if (account.state === 'REVOKED') {
    throw new ApiError('REVOKED', 'Your NGO has revoked this contributor access.');
  }
  current = {
    contributorId: account.contributorId,
    name: account.name,
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
  };
  return copy(current);
}

/** Dev switcher: act as the first sample contributor. */
export function selectSampleContributor(): Contributor {
  const account = accounts[0];
  current = {
    contributorId: account.contributorId,
    name: account.name,
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
  };
  return copy(current);
}

export function getCurrentContributor(): Contributor | null {
  return current ? copy(current) : null;
}

export function signOutContributor() {
  current = null;
}
