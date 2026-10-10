/**
 * Accounts — fixture-backed stand-in for backend sign-in and NGO team
 * management (mock mode only; see docs/api-contract-proposal.md).
 *
 * The backend issues NGO codes, worker IDs and passwords. These functions only
 * return fixed sample values so the flows can be exercised. Passwords are
 * never checked here.
 */
import {
  SAMPLE_FIELD_TEAM,
  SAMPLE_NGO_CODE,
  SAMPLE_OTP_CODE,
  SAMPLE_STAFF_ACCOUNTS,
  SAMPLE_TEMP_PASSWORD,
} from '@/fixtures/sample-accounts';
import {
  Citizen,
  CreateWorkerInput,
  NgoMember,
  NotificationAreasInput,
  OtpChallenge,
  StaffLoginResult,
  WorkerCredentials,
  WorkerLoginInput,
  WorkerLoginResult,
} from '@/types/accounts';

let team: NgoMember[] = JSON.parse(JSON.stringify(SAMPLE_FIELD_TEAM));
let currentWorker: NgoMember | null = null;
let nextSampleNumber = team.length + 1;

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export async function staffLogin(email: string, _password: string): Promise<StaffLoginResult> {
  const account = SAMPLE_STAFF_ACCOUNTS[email.trim().toLowerCase()];
  if (!account) {
    throw new Error(
      `No sample account for this email. Try ${Object.keys(SAMPLE_STAFF_ACCOUNTS).join(', ')}.`
    );
  }
  return { role: account.role, user: { name: account.name, ngoName: account.ngoName } };
}

export async function workerLogin(input: WorkerLoginInput): Promise<WorkerLoginResult> {
  if (input.ngoCode.trim().toUpperCase() !== SAMPLE_NGO_CODE) {
    throw new Error(`Unknown NGO code. The sample NGO code is ${SAMPLE_NGO_CODE}.`);
  }
  const member = team.find((m) => m.workerId === input.workerId.trim().toUpperCase());
  if (!member) throw new Error('Unknown worker ID for this NGO.');
  if (member.status === 'DISABLED') throw new Error('This worker account is disabled by the NGO.');
  currentWorker = member;
  return { member: copy(member) };
}

/** Dev switcher: act as the first sample worker without the sign-in form. */
export function selectSampleWorker(): NgoMember {
  currentWorker = team[0];
  return copy(currentWorker);
}

export async function changeWorkerPassword(_newPassword: string): Promise<NgoMember> {
  if (!currentWorker) throw new Error('Not signed in as a field worker.');
  currentWorker.mustChangePassword = false;
  return copy(currentWorker);
}

export function getCurrentWorker(): NgoMember | null {
  return currentWorker ? copy(currentWorker) : null;
}

export function signOutAccounts() {
  currentWorker = null;
}

export function getSampleNgoCode() {
  return SAMPLE_NGO_CODE;
}

export async function listWorkers(): Promise<NgoMember[]> {
  return copy(team);
}

export async function createWorker(
  input: CreateWorkerInput
): Promise<{ member: NgoMember; credentials: WorkerCredentials }> {
  const workerId = `SAMPLE-W-${String(nextSampleNumber++).padStart(4, '0')}`;
  const member: NgoMember = {
    id: `mem-${workerId}`,
    workerId,
    ngoId: 'ngo-drn-india',
    ngoName: 'Disaster Relief Network India',
    name: input.name,
    phone: input.phone,
    skills: input.skills,
    status: 'ACTIVE',
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  };
  team = [...team, member];
  return { member: copy(member), credentials: { workerId, temporaryPassword: SAMPLE_TEMP_PASSWORD } };
}

export async function disableWorker(memberId: string, disabled: boolean): Promise<NgoMember> {
  const member = team.find((m) => m.id === memberId);
  if (!member) throw new Error('Worker not found.');
  member.status = disabled ? 'DISABLED' : 'ACTIVE';
  return copy(member);
}

export async function resetWorkerPassword(memberId: string): Promise<WorkerCredentials> {
  const member = team.find((m) => m.id === memberId);
  if (!member) throw new Error('Worker not found.');
  member.mustChangePassword = true;
  return { workerId: member.workerId, temporaryPassword: SAMPLE_TEMP_PASSWORD };
}

// ── Citizen (optional public account) ─────────────────────────────────────

let pendingContact: string | null = null;
let currentCitizen: Citizen | null = null;

function contactKind(contact: string): Citizen['contactKind'] {
  return contact.includes('@') ? 'email' : 'phone';
}

function mask(contact: string): string {
  if (contactKind(contact) === 'email') {
    const [user, domain] = contact.split('@');
    return `${user.slice(0, 1)}•••@${domain}`;
  }
  return `•••• ${contact.replace(/\D/g, '').slice(-4)}`;
}

export async function requestOtp(contact: string): Promise<OtpChallenge> {
  const value = contact.trim();
  const valid =
    contactKind(value) === 'email'
      ? /^\S+@\S+\.\S+$/.test(value)
      : value.replace(/\D/g, '').length >= 10;
  if (!valid) throw new Error('Enter a valid phone number or email address.');
  pendingContact = value;
  return {
    challengeId: 'sample-otp-challenge',
    sentTo: mask(value),
    expiresAt: new Date(Date.now() + 10 * 60000).toISOString(),
  };
}

export async function verifyOtp(_challengeId: string, code: string): Promise<Citizen> {
  if (!pendingContact) throw new Error('Request a code first.');
  if (code.trim() !== SAMPLE_OTP_CODE) {
    throw new Error(`Incorrect code. In sample mode the code is ${SAMPLE_OTP_CODE}.`);
  }
  currentCitizen = {
    id: 'sample-citizen-1',
    contact: pendingContact,
    contactKind: contactKind(pendingContact),
    notificationAreas: [],
    pushEnabled: false,
  };
  pendingContact = null;
  return copy(currentCitizen);
}

export function getCurrentCitizen(): Citizen | null {
  return currentCitizen ? copy(currentCitizen) : null;
}

export function signOutCitizen() {
  currentCitizen = null;
}

export async function setNotificationAreas(input: NotificationAreasInput): Promise<Citizen> {
  if (!currentCitizen) throw new Error('Sign in to save alert areas.');
  currentCitizen.notificationAreas = input.areas;
  currentCitizen.pushEnabled = input.pushEnabled;
  return copy(currentCitizen);
}

/** Mock: an approved volunteer joins the NGO team (the backend would issue their credentials). */
export function addVolunteerMember(app: { id: string; name: string; contact: string; skills: string[] }) {
  if (team.some((m) => m.id === `mem-${app.id}`)) {
    team = team.map((m) => (m.id === `mem-${app.id}` ? { ...m, status: 'ACTIVE' } : m));
    return;
  }
  team = [
    ...team,
    {
      id: `mem-${app.id}`,
      workerId: `SAMPLE-V-${String(nextSampleNumber++).padStart(4, '0')}`,
      ngoId: 'ngo-drn-india',
      ngoName: 'Disaster Relief Network India',
      name: app.name,
      phone: app.contact,
      skills: app.skills,
      status: 'ACTIVE',
      kind: 'VOLUNTEER',
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

/** Mock: revoking a volunteer disables their team membership. */
export function disableVolunteerMember(applicationId: string) {
  team = team.map((m) => (m.id === `mem-${applicationId}` ? { ...m, status: 'DISABLED' } : m));
}
