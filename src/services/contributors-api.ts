/**
 * Contributors — mock adapter (mock mode only). Stands in for the backend:
 * approval, issued credentials, sign-in, resources, check-ins and plans. All
 * decisions here are simple simulations so the flows can be demonstrated;
 * the real rules belong to the backend.
 */
import { SAMPLE_CONTRIBUTOR_CODE, SAMPLE_RESOURCE_POLICIES } from '@/fixtures/sample-contributors';
import {
  createContributorAccount,
  onResourceChanged,
  publishPlan,
  revokeContributorAccess,
  sweepMissedCheckIns,
} from '@/services/mock/cascades';
import { addEvidence, ngoById, store, StoreContributor } from '@/services/mock/store';
import { SAMPLE_VERIFIED_NGOS } from '@/fixtures/sample-ngos';
import { getCurrentCitizen } from '@/services/accounts-api';
import { getCurrentNgoSession } from '@/services/ngo-api';
import { ApiError } from '@/services/api/types';
import {
  ApplyToContributeInput,
  CheckInInput,
  Contributor,
  ContributorApplication,
  ContributorCredentials,
  ContributorLoginInput,
  ContributorInstruction,
  ContributorResource,
  ManualAllocationInput,
  PlanActor,
  RegisterResourceInput,
  ResourcePlan,
  ResourceTypePolicy,
} from '@/types/contributors';
import { VolunteerDecision } from '@/types/volunteers';

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));

// Applications, contributors, resources and plans live in the shared mock store.
let myApplicationId: string | null = null;
let currentId: string | null = null;

function toContributor(c: StoreContributor): Contributor {
  const ngo = ngoById(c.ngoId);
  return { contributorId: c.contributorId, name: c.name, ngoId: c.ngoId, ngoName: ngo?.name ?? c.ngoId };
}

// ── Applications ────────────────────────────────────────────────────────────

export async function applyToContribute(input: ApplyToContributeInput): Promise<ContributorApplication> {
  const citizen = getCurrentCitizen();
  if (!citizen) throw new ApiError('UNAUTHORIZED', 'Sign in to apply.');
  if (!input.consent) throw new ApiError('CONSENT_REQUIRED', 'Consent is required to apply.');
  const ngo = SAMPLE_VERIFIED_NGOS.find((n) => n.id === input.ngoId);
  if (!ngo) throw new ApiError('NGO_NOT_FOUND', 'Choose a verified NGO.');
  const app: ContributorApplication = {
    id: `con-app-${String(store.contributorApplications.length + 101)}`,
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
  store.contributorApplications = [app, ...store.contributorApplications];
  myApplicationId = app.id;
  return copy(app);
}

export async function getMyContributorApplication(): Promise<ContributorApplication | null> {
  if (!getCurrentCitizen() || !myApplicationId) return null;
  const app = store.contributorApplications.find((a) => a.id === myApplicationId);
  return app ? copy(app) : null;
}

export async function listContributorApplications(): Promise<ContributorApplication[]> {
  const ngo = getCurrentNgoSession();
  if (!ngo) throw new ApiError('UNAUTHORIZED', 'Only NGO staff can review applications.');
  return copy(store.contributorApplications.filter((a) => a.ngoId === ngo.ngoId));
}

export async function decideContributorApplication(
  id: string,
  decision: VolunteerDecision,
  reason?: string
): Promise<{ application: ContributorApplication; credentials?: ContributorCredentials }> {
  if (!getCurrentNgoSession()) throw new ApiError('UNAUTHORIZED', 'Only NGO staff can decide.');
  const app = store.contributorApplications.find((a) => a.id === id);
  if (!app) throw new ApiError('NOT_FOUND', 'Application not found.');
  if (decision !== 'APPROVE' && !reason?.trim()) {
    throw new ApiError('REASON_REQUIRED', 'Give a reason for rejecting or revoking.');
  }
  app.decidedAt = new Date().toISOString();
  if (decision === 'APPROVE') {
    if (app.status !== 'PENDING') throw new ApiError('INVALID_STATE', 'Only pending applications can be approved.');
    app.status = 'APPROVED';
    app.decisionReason = undefined;
    const contributorId = createContributorAccount(app);
    return {
      application: copy(app),
      credentials: { contributorId, signInCode: SAMPLE_CONTRIBUTOR_CODE },
    };
  }
  app.status = decision === 'REJECT' ? 'REJECTED' : 'REVOKED';
  app.decisionReason = reason?.trim();
  if (decision === 'REVOKE') revokeContributorAccess(app.id);
  return { application: copy(app) };
}

// ── Sign-in ─────────────────────────────────────────────────────────────────

export async function contributorLogin(input: ContributorLoginInput): Promise<Contributor> {
  const account = store.contributors.find((a) => a.contributorId === input.contributorId.trim().toUpperCase());
  if (!account || input.signInCode.trim().toUpperCase() !== SAMPLE_CONTRIBUTOR_CODE) {
    throw new ApiError('INVALID_CREDENTIALS', 'Contributor ID or sign-in code is not correct.');
  }
  if (account.state === 'CODE_EXPIRED') {
    throw new ApiError('CODE_EXPIRED', 'This sign-in code has expired. Ask your NGO for a new one.');
  }
  if (account.state === 'REVOKED') {
    throw new ApiError('REVOKED', 'Your NGO has revoked this contributor access.');
  }
  currentId = account.contributorId;
  return toContributor(account);
}

/** Dev switcher: act as the first sample contributor. */
export function selectSampleContributor(): Contributor {
  const account = store.contributors[0];
  currentId = account.contributorId;
  return toContributor(account);
}

export function getCurrentContributor(): Contributor | null {
  const c = store.contributors.find((x) => x.contributorId === currentId);
  return c ? toContributor(c) : null;
}

export function signOutContributor() {
  currentId = null;
}

// ── Resources and check-ins ─────────────────────────────────────────────────
// Freshness, due times and eligibility below are a simulation of what the
// backend would return. Screens only display them.

const HOUR = 3600_000;

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * HOUR).toISOString();
}


/** Re-checked on every call: an NGO revoke takes effect immediately. */
function requireContributor(): Contributor {
  const c = store.contributors.find((x) => x.contributorId === currentId);
  if (!c) throw new ApiError('UNAUTHORIZED', 'Sign in as a contributor.');
  if (c.state === 'REVOKED') throw new ApiError('REVOKED', 'Your NGO has revoked this contributor access.');
  return toContributor(c);
}

export async function getResourceTypePolicies(): Promise<ResourceTypePolicy[]> {
  return copy(SAMPLE_RESOURCE_POLICIES);
}

export async function getMyResources(): Promise<ContributorResource[]> {
  const c = requireContributor();
  sweepMissedCheckIns();
  return copy(store.resources.filter((r) => r.contributorId === c.contributorId));
}

/** Mock upload: nothing leaves the device; returns a labelled placeholder URL. */
export async function uploadEvidencePhoto(localUri: string): Promise<{ photoUrl: string }> {
  requireContributor();
  if (!localUri) throw new ApiError('UPLOAD_FAILED', 'No photo to upload.');
  return { photoUrl: `simulated-upload://${localUri.split('/').pop()}` };
}

function recordEvidence(resourceId: string, e: RegisterResourceInput['evidence']) {
  return addEvidence({
    subjectType: 'RESOURCE',
    subjectId: resourceId,
    gps: e.gps,
    photoUrl: e.photoUrl,
    note: e.note,
    capturedAt: e.capturedAt,
    unverified: !(e.gps && e.photoUrl),
  });
}

/** Simulated backend verdict on submitted evidence. */
function verdict(evidence: { gps?: unknown; photoUrl?: string }): Pick<
  ContributorResource,
  'freshness' | 'eligibleForAllocation' | 'statusReason'
> {
  const verified = !!evidence.gps && !!evidence.photoUrl;
  return verified
    ? { freshness: 'FRESH', eligibleForAllocation: true, statusReason: 'Simulated: live GPS and photo received.' }
    : {
        freshness: 'UNVERIFIED',
        eligibleForAllocation: false,
        statusReason: 'Simulated: no live GPS or photo; the NGO must review before allocation.',
      };
}

export async function registerResource(input: RegisterResourceInput): Promise<ContributorResource> {
  const c = requireContributor();
  const policy = SAMPLE_RESOURCE_POLICIES.find((p) => p.type === input.type);
  if (!policy) throw new ApiError('INVALID_TYPE', 'Unknown resource type.');
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new ApiError('INVALID_QUANTITY', 'Quantity must be a whole number of at least 1.');
  }
  const { note: _note, ...evidence } = input.evidence;
  const resource: ContributorResource = {
    id: `res-${Date.now()}`,
    contributorId: c.contributorId,
    ngoId: c.ngoId,
    type: policy.type,
    typeLabel: policy.label,
    quantity: input.quantity,
    unit: policy.unit,
    condition: input.condition,
    availability: 'AVAILABLE',
    ...verdict(evidence),
    lastCheckInAt: new Date().toISOString(),
    checkInDueAt: hoursFromNow(policy.checkInIntervalHours),
    checkInIntervalHours: policy.checkInIntervalHours,
    evidence: { ...evidence, unverified: !(evidence.gps && evidence.photoUrl) },
  };
  store.resources = [resource, ...store.resources];
  resource.evidenceIds = [recordEvidence(resource.id, evidence)];
  return copy(resource);
}

export async function checkInResource(id: string, input: CheckInInput): Promise<ContributorResource> {
  const c = requireContributor();
  const r = store.resources.find((x) => x.id === id && x.contributorId === c.contributorId);
  if (!r) throw new ApiError('NOT_FOUND', 'Resource not found.');
  const now = new Date().toISOString();
  r.lastCheckInAt = now;
  r.checkInDueAt = hoursFromNow(r.checkInIntervalHours ?? 24);
  if (!input.available) {
    Object.assign(r, {
      availability: 'UNAVAILABLE',
      freshness: 'FRESH',
      eligibleForAllocation: false,
      statusReason: 'Simulated: you reported it unavailable.',
    });
  } else if (input.evidence) {
    const { note: _note, ...evidence } = input.evidence;
    Object.assign(r, { availability: 'AVAILABLE', ...verdict(evidence) });
    r.evidence = { ...evidence, unverified: !(evidence.gps && evidence.photoUrl) };
    r.evidenceIds = [...(r.evidenceIds ?? []), recordEvidence(r.id, input.evidence)];
  } else {
    Object.assign(r, {
      availability: 'AVAILABLE',
      freshness: 'FRESH',
      eligibleForAllocation: r.freshness !== 'UNVERIFIED',
      statusReason: 'Simulated: availability confirmed without new evidence.',
    });
  }
  onResourceChanged(r.id);
  return copy(r);
}

/** Pool the plan mock allocates from (all contributors of the NGO). */
export function allResourcesForNgo(ngoId: string): ContributorResource[] {
  return copy(store.resources.filter((r) => r.ngoId === ngoId));
}


// ── Plans ───────────────────────────────────────────────────────────────────
// One plan per incident (Incident -> Plan -> Allocation -> Task). Simulated
// rules, documented in the API proposal: replan drops allocations whose
// resource is no longer eligible (manual ones too, with a note); any change
// bumps the version and returns the plan to PROPOSED until the NGO approves;
// approval publishes tasks and contributor instructions (see cascades.ts).

function requireNgo() {
  const ngo = getCurrentNgoSession();
  if (!ngo) throw new ApiError('UNAUTHORIZED', 'Only NGO staff can view or change plans.');
  return ngo;
}

function ngoActor(): PlanActor {
  const ngo = requireNgo();
  return { name: `${ngo.authorizedOfficerName}, ${ngo.ngoName}`, kind: 'NGO' };
}

function findPlan(planId: string, expectedVersion: number): ResourcePlan {
  const ngo = requireNgo();
  const plan = store.plans.find((p) => p.id === planId && p.ngoId === ngo.ngoId);
  if (!plan) throw new ApiError('NOT_FOUND', 'Plan not found.');
  if (expectedVersion !== plan.version) {
    throw new ApiError('VERSION_CONFLICT', `The plan changed (now version ${plan.version}). Reload and try again.`);
  }
  return plan;
}

/** Saves the current version to history and applies a change as the next version. */
function nextVersion(plan: ResourcePlan, change: Partial<ResourcePlan>) {
  store.planHistory.push(copy(plan));
  Object.assign(plan, change, {
    version: plan.version + 1,
    status: 'PROPOSED',
    approvedAt: undefined,
    approvedBy: undefined,
  });
}

function resourceLabel(r: ContributorResource) {
  const owner = store.contributors.find((a) => a.contributorId === r.contributorId)?.name;
  return `${r.typeLabel} × ${r.quantity}${owner ? ` (${owner})` : ''}`;
}

/** NGO's plans (one per incident in its area). */
export async function getResourcePlans(): Promise<ResourcePlan[]> {
  const ngo = requireNgo();
  sweepMissedCheckIns();
  return copy(store.plans.filter((p) => p.ngoId === ngo.ngoId));
}

export async function getResourcePlan(incidentId?: string): Promise<ResourcePlan> {
  const plans = await getResourcePlans();
  const plan = incidentId ? plans.find((p) => p.incidentId === incidentId) : plans[0];
  if (!plan) throw new ApiError('NOT_FOUND', 'No resource plan for this incident yet.');
  return plan;
}

/** Eligible and ineligible resources the NGO may see when allocating manually. */
export async function getAllocatableResources(): Promise<ContributorResource[]> {
  const ngo = requireNgo();
  sweepMissedCheckIns();
  return allResourcesForNgo(ngo.ngoId);
}

export async function requestReplan(planId: string, expectedVersion: number): Promise<ResourcePlan> {
  const plan = findPlan(planId, expectedVersion);
  sweepMissedCheckIns();
  const eligible = (id: string) => store.resources.find((r) => r.id === id)?.eligibleForAllocation === true;
  const notes: string[] = [];
  const kept = plan.allocations.filter((a) => {
    if (eligible(a.resourceId)) return true;
    notes.push(
      `Simulated: ${a.source === 'MANUAL' ? 'manual' : 'automatic'} allocation of ${a.resourceLabel} to ${a.workOrderId} dropped (resource not eligible).`
    );
    return false;
  });
  const at = new Date().toISOString();
  nextVersion(plan, {
    generatedAt: at,
    lastChangedBy: { name: 'Allocation service (Simulated)', kind: 'SYSTEM' },
    lastChangedAt: at,
    allocations: kept,
    notes: notes.length ? notes : ['Simulated: recomputed; no changes needed.'],
    replanSuggested: false,
    replanReasons: undefined,
  });
  return copy(plan);
}

export async function allocateManually(input: ManualAllocationInput): Promise<ResourcePlan> {
  const plan = findPlan(input.planId, input.expectedVersion);
  const ngo = requireNgo();
  if (input.reason.trim().length < 10) {
    throw new ApiError('REASON_REQUIRED', 'Give a reason of at least 10 characters for the manual allocation.');
  }
  sweepMissedCheckIns();
  const r = store.resources.find((x) => x.id === input.resourceId);
  if (!r || r.ngoId !== ngo.ngoId) throw new ApiError('UNAUTHORIZED', 'This resource does not belong to your NGO.');
  const task = store.tasks.find((t) => t.id === input.workOrderId);
  if (!task || (plan.incidentId && task.incidentId !== plan.incidentId)) {
    throw new ApiError('INVALID_TASK', `${input.workOrderId} is not part of this incident.`);
  }
  if (r.availability === 'UNAVAILABLE') {
    throw new ApiError('RESOURCE_UNAVAILABLE', `${resourceLabel(r)} is reported unavailable.`);
  }
  if (r.freshness === 'STALE') {
    throw new ApiError('RESOURCE_STALE', `${resourceLabel(r)} missed its check-in and cannot be allocated.`);
  }
  if (!r.eligibleForAllocation) {
    throw new ApiError('RESOURCE_INELIGIBLE', `${resourceLabel(r)} is not eligible: ${r.statusReason ?? 'see resource status'}.`);
  }
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > r.quantity) {
    throw new ApiError('INVALID_QUANTITY', `Quantity must be between 1 and ${r.quantity}.`);
  }
  const alreadyAllocated = plan.allocations
    .filter((a) => a.resourceId === r.id && a.workOrderId !== input.workOrderId)
    .reduce((sum, a) => sum + a.quantity, 0);
  if (alreadyAllocated + input.quantity > r.quantity) {
    throw new ApiError(
      'OVER_ALLOCATED',
      `${resourceLabel(r)}: ${alreadyAllocated} already allocated elsewhere in this plan; only ${r.quantity - alreadyAllocated} left.`
    );
  }
  const actor = ngoActor();
  const at = new Date().toISOString();
  nextVersion(plan, {
    lastChangedBy: actor,
    lastChangedAt: at,
    notes: undefined,
    allocations: [
      // A manual allocation replaces any allocation of the same resource to the same task
      ...plan.allocations.filter((a) => !(a.resourceId === r.id && a.workOrderId === input.workOrderId)),
      {
        id: `alloc-${Date.now()}`,
        workOrderId: task.id,
        workOrderLabel: `${task.id} · ${task.type.replace(/_/g, ' ').toLowerCase()}`,
        resourceId: r.id,
        resourceLabel: resourceLabel(r),
        quantity: input.quantity,
        source: 'MANUAL',
        reason: input.reason.trim(),
        changedBy: actor,
        changedAt: at,
      },
    ],
  });
  return copy(plan);
}

/** NGO approves the current version: publishes tasks and contributor instructions. */
export async function approvePlan(planId: string, expectedVersion: number): Promise<ResourcePlan> {
  const plan = findPlan(planId, expectedVersion);
  if (plan.status !== 'PROPOSED') throw new ApiError('INVALID_STATE', 'This version is already approved.');
  sweepMissedCheckIns();
  const stale = plan.allocations.filter(
    (a) => !store.resources.find((r) => r.id === a.resourceId)?.eligibleForAllocation
  );
  if (stale.length) {
    throw new ApiError(
      'RESOURCE_INELIGIBLE',
      `Replan first: ${stale.map((a) => a.resourceLabel).join(', ')} ${stale.length === 1 ? 'is' : 'are'} no longer eligible.`
    );
  }
  publishPlan(plan, ngoActor());
  return copy(plan);
}

/** Signed-in contributor's instructions from approved plans. */
export async function getMyInstructions(): Promise<ContributorInstruction[]> {
  const c = requireContributor();
  return copy(store.instructions.filter((i) => i.contributorId === c.contributorId));
}
