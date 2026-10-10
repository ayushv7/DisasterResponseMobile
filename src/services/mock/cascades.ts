/**
 * Simulated backend side effects (mock mode only). They keep the sample store
 * consistent across screens. Every message they write says "Simulated". The
 * real behaviour belongs to the backend; screens never call these directly.
 */
import { InterventionRecord } from '@/types/operations';
import { ContributorApplication, PlanActor, ResourcePlan } from '@/types/contributors';
import { NgoApplication } from '@/types/ngo-workspace';
import { VolunteerApplication } from '@/types/volunteers';

import { ngoById, store } from './store';

const now = () => new Date().toISOString();

function flagPlan(plan: ResourcePlan, reason: string) {
  plan.replanSuggested = true;
  const reasons = plan.replanReasons ?? [];
  if (!reasons.includes(reason)) plan.replanReasons = [...reasons, reason];
}

function plansForTask(task: InterventionRecord) {
  return store.plans.filter(
    (p) => p.incidentId === task.incidentId || p.allocations.some((a) => a.workOrderId === task.id)
  );
}

/** After any task change: update plan status; flag a replan on problems. */
export function onTaskChanged(taskId: string) {
  const task = store.tasks.find((t) => t.id === taskId);
  if (!task) return;
  for (const plan of plansForTask(task)) {
    if (task.status === 'BLOCKED' || task.status === 'FAILED') {
      flagPlan(plan, `Simulated: ${task.id} reported a problem${task.blockerReport ? ` (${task.blockerReport.reason})` : ''}.`);
    }
    if (plan.status === 'PROPOSED') continue;
    const tasks = store.tasks.filter((t) => plan.allocations.some((a) => a.workOrderId === t.id));
    if (tasks.length && tasks.every((t) => t.status === 'VERIFIED_RESOLVED')) plan.status = 'COMPLETED';
    else if (tasks.some((t) => ['EN_ROUTE', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'BLOCKED'].includes(t.status))) {
      plan.status = 'IN_PROGRESS';
    }
  }
}

/** Sweep run on reads: a passed check-in deadline makes the resource stale and flags plans using it. */
export function sweepMissedCheckIns(at = Date.now()) {
  for (const r of store.resources) {
    if (!r.checkInDueAt || r.availability !== 'AVAILABLE' || r.freshness === 'STALE') continue;
    if (new Date(r.checkInDueAt).getTime() >= at) continue;
    r.freshness = 'STALE';
    r.eligibleForAllocation = false;
    r.statusReason = `Simulated: check-in missed (was due ${new Date(r.checkInDueAt).toLocaleString()}).`;
  }
  // Any plan still allocating an ineligible resource (including seeded ones) is flagged
  for (const r of store.resources) onResourceChanged(r.id);
}

/** A resource became ineligible: flag every plan that allocates it. */
export function onResourceChanged(resourceId: string) {
  const r = store.resources.find((x) => x.id === resourceId);
  if (!r || r.eligibleForAllocation) return;
  for (const plan of store.plans) {
    if (plan.allocations.some((a) => a.resourceId === resourceId)) {
      flagPlan(plan, `Simulated: ${r.typeLabel} × ${r.quantity} is ${r.freshness === 'STALE' ? 'stale' : 'no longer eligible'}.`);
    }
  }
}

/** NGO approval: publish tasks to workers and instructions to contributors. */
export function publishPlan(plan: ResourcePlan, actor: PlanActor) {
  const at = now();
  plan.status = 'APPROVED';
  plan.approvedAt = at;
  plan.approvedBy = actor;
  const ngoName = ngoById(plan.ngoId)?.name ?? 'NGO';
  // Instructions for this plan are replaced by the new version's
  store.instructions = store.instructions.filter((i) => i.planId !== plan.id);
  for (const a of plan.allocations) {
    const task = store.tasks.find((t) => t.id === a.workOrderId);
    const resource = store.resources.find((r) => r.id === a.resourceId);
    if (task) {
      task.planId = plan.id;
      task.publishedAt = at;
      task.history = [
        ...(task.history ?? []),
        { type: 'ASSIGNED', at, actor: actor.name, note: `Simulated: plan v${plan.version} approved and published` },
      ];
    }
    if (task && resource) {
      const incident = store.incidents.find((i) => i.id === task.incidentId);
      store.instructions.push({
        id: `ins-${plan.id}-${a.id}`,
        contributorId: resource.contributorId,
        resourceId: resource.id,
        resourceLabel: a.resourceLabel,
        taskId: task.id,
        planId: plan.id,
        planVersion: plan.version,
        where: `${task.targetLocality}${incident ? `, ${incident.location}` : ''}`,
        what: `Bring ${a.quantity} × ${resource.typeLabel.toLowerCase()} for ${task.id} (${task.type.replace(/_/g, ' ').toLowerCase()}).`,
        deadline: task.deadlineTimestamp,
        ngoName,
        issuedAt: at,
      });
    }
  }
}

// ── Applications → accounts ─────────────────────────────────────────────────

/** Volunteer approved: they join the NGO team as a VOLUNTEER worker (credentials are the backend's job). */
export function createVolunteerAccount(app: VolunteerApplication) {
  const id = `mem-${app.id}`;
  const existing = store.workers.find((m) => m.id === id);
  if (existing) {
    existing.status = 'ACTIVE';
    return existing;
  }
  const ngo = ngoById(app.ngoId ?? 'ngo-drn-india');
  const member = {
    id,
    workerId: `SAMPLE-V-${String(store.workers.length + 1).padStart(4, '0')}`,
    ngoId: ngo?.id ?? 'ngo-drn-india',
    ngoName: ngo?.name ?? app.ngoName ?? 'NGO',
    name: app.name,
    phone: app.contact,
    skills: app.skills,
    status: 'ACTIVE' as const,
    kind: 'VOLUNTEER' as const,
    mustChangePassword: true,
    createdAt: now(),
  };
  store.workers = [...store.workers, member];
  return member;
}

/** Volunteer revoked: their worker account is disabled (kept for audit). */
export function disableVolunteerAccount(applicationId: string) {
  const m = store.workers.find((w) => w.id === `mem-${applicationId}`);
  if (m) m.status = 'DISABLED';
}

/** Contributor approved: an ACTIVE contributor account in the approving NGO. Returns its ID. */
export function createContributorAccount(app: ContributorApplication): string {
  const contributorId = `SAMPLE-C-${String(store.contributors.length + 1).padStart(4, '0')}`;
  store.contributors = [
    ...store.contributors,
    { contributorId, applicationId: app.id, name: app.name, ngoId: app.ngoId, state: 'ACTIVE' },
  ];
  return contributorId;
}

/** Contributor revoked: account revoked, their resources leave every plan. */
export function revokeContributorAccess(applicationId: string) {
  const c = store.contributors.find((x) => x.applicationId === applicationId);
  if (!c) return;
  c.state = 'REVOKED';
  for (const r of store.resources.filter((x) => x.contributorId === c.contributorId)) {
    r.eligibleForAllocation = false;
    r.statusReason = 'Simulated: contributor access revoked by the NGO.';
    onResourceChanged(r.id);
  }
}

// ── NGO approval ────────────────────────────────────────────────────────────

/**
 * NGO approved (or created by the authority): it becomes an ACTIVE NGO and
 * gets an empty plan for each incident in its area, so it can receive plans.
 */
export function activateNgo(app: NgoApplication, code?: string) {
  const area = app.area ?? '';
  let ngo = ngoById(app.id);
  if (ngo) {
    ngo.status = 'ACTIVE';
  } else {
    ngo = {
      id: app.id,
      name: app.name,
      code: code ?? `SAMPLE-NGO-${store.ngos.length + 1}`,
      serviceArea: area,
      status: 'ACTIVE',
      focusAreas: app.focusAreas,
      approvedAt: now(),
    };
    store.ngos = [...store.ngos, ngo];
  }
  if (!area) return ngo;
  for (const incident of store.incidents.filter((i) => i.location.includes(area))) {
    if (store.plans.some((p) => p.ngoId === ngo.id && p.incidentId === incident.id)) continue;
    store.plans = [
      ...store.plans,
      {
        id: `plan-${ngo.id}-${incident.id}`,
        ngoId: ngo.id,
        incidentId: incident.id,
        incidentTitle: incident.title,
        status: 'PROPOSED',
        version: 1,
        generatedAt: now(),
        lastChangedBy: { name: 'Allocation service (Simulated)', kind: 'SYSTEM' },
        allocations: [],
        notes: ['Simulated: created for a newly approved NGO. Request a replan to fill it.'],
      },
    ];
  }
  return ngo;
}

/** NGO rejected or suspended: it stops receiving plans and leaves the public list. */
export function suspendNgo(ngoId: string) {
  const ngo = ngoById(ngoId);
  if (ngo) ngo.status = 'SUSPENDED';
  for (const plan of store.plans.filter((p) => p.ngoId === ngoId)) {
    flagPlan(plan, 'Simulated: this NGO was suspended by the authority.');
  }
}
