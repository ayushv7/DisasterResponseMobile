/**
 * Accounts — fixture-backed stand-in for backend sign-in and NGO team
 * management (mock mode only; see docs/api-contract-proposal.md).
 *
 * The backend issues NGO codes, worker IDs and passwords. These functions only
 * return fixed sample values so the flows can be exercised. Passwords are
 * never checked here.
 */
import {
  SAMPLE_NGO_CODE,
  SAMPLE_OTP_CODE,
  SAMPLE_STAFF_ACCOUNTS,
  SAMPLE_TEMP_PASSWORD,
} from '@/fixtures/sample-accounts';
import { createVolunteerAccount, disableVolunteerAccount } from '@/services/mock/cascades';
import { store } from '@/services/mock/store';
import { VolunteerApplication } from '@/types/volunteers';
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

// Workers live in the shared mock store (src/services/mock/store.ts).
let currentWorkerId: string | null = null;
/** Always read the live record, so NGO changes (disable, reset) apply at once. */
const currentWorkerRecord = () => store.workers.find((m) => m.id === currentWorkerId) ?? null;
let nextSampleNumber = store.workers.length + 1;

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
  const member = store.workers.find((m) => m.workerId === input.workerId.trim().toUpperCase());
  if (!member) throw new Error('Unknown worker ID for this NGO.');
  if (member.status === 'DISABLED') throw new Error('This worker account is disabled by the NGO.');
  currentWorkerId = member.id;
  return { member: copy(member) };
}

/** Dev switcher: act as the first sample worker without the sign-in form. */
export function selectSampleWorker(): NgoMember {
  currentWorkerId = store.workers[0].id;
  return copy(store.workers[0]);
}

export async function changeWorkerPassword(_newPassword: string): Promise<NgoMember> {
  const worker = currentWorkerRecord();
  if (!worker) throw new Error('Not signed in as a field worker.');
  worker.mustChangePassword = false;
  return copy(worker);
}

export function getCurrentWorker(): NgoMember | null {
  const worker = currentWorkerRecord();
  return worker ? copy(worker) : null;
}

export function signOutAccounts() {
  currentWorkerId = null;
}

export function getSampleNgoCode() {
  return SAMPLE_NGO_CODE;
}

export async function listWorkers(): Promise<NgoMember[]> {
  return copy(store.workers);
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
  store.workers = [...store.workers, member];
  return { member: copy(member), credentials: { workerId, temporaryPassword: SAMPLE_TEMP_PASSWORD } };
}

export async function disableWorker(memberId: string, disabled: boolean): Promise<NgoMember> {
  const member = store.workers.find((m) => m.id === memberId);
  if (!member) throw new Error('Worker not found.');
  member.status = disabled ? 'DISABLED' : 'ACTIVE';
  return copy(member);
}

export async function resetWorkerPassword(memberId: string): Promise<WorkerCredentials> {
  const member = store.workers.find((m) => m.id === memberId);
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

/** Mock: an approved volunteer joins the NGO team. Kept for callers; logic lives in mock/cascades. */
export function addVolunteerMember(app: VolunteerApplication) {
  createVolunteerAccount(app);
}

/** Mock: revoking a volunteer disables their team membership (see mock/cascades). */
export function disableVolunteerMember(applicationId: string) {
  disableVolunteerAccount(applicationId);
}
