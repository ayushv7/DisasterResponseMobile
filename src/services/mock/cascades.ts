/**
 * Simulated backend side effects (mock mode only). They keep the sample store
 * consistent across screens. Every message they write says "Simulated". The
 * real behaviour belongs to the backend; screens never call these directly.
 */
import { InterventionRecord } from '@/types/operations';
import { PlanActor, ResourcePlan } from '@/types/contributors';

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
    onResourceChanged(r.id);
  }
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
