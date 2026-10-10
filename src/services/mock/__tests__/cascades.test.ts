/**
 * Tests for the mock-mode sample store and its simulated cascades. These pin
 * down the demo behaviour only; the real rules belong to the backend.
 */
import { beforeEach, describe, expect, it } from '@jest/globals';

import { setMockFailureRate, mockApi } from '@/services/api/mock';
import { ApiError } from '@/services/api/types';
import * as contributors from '@/services/contributors-api';
import { fetchVerifiedNgos } from '@/services/messaging-api';
import { decideNgo } from '@/services/ngo-approval-api';
import { loginDemoSession, logoutNgo } from '@/services/ngo-api';
import { sweepMissedCheckIns } from '@/services/mock/cascades';
import { resetStore, store } from '@/services/mock/store';

const INCIDENT = 'INC-2026-081';

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(ApiError);
  await promise.catch((e: ApiError) => expect(e.code).toBe(code));
}

beforeEach(async () => {
  resetStore();
  setMockFailureRate(0);
  await logoutNgo();
  contributors.signOutContributor();
  await loginDemoSession();
});

describe('resource plan', () => {
  it('flags the seeded plan because an allocated resource is stale, and refuses approval', async () => {
    const plan = await contributors.getResourcePlan(INCIDENT);
    expect(plan.replanSuggested).toBe(true);
    expect(plan.replanReasons?.some((r) => r.includes('stale'))).toBe(true);
    await expectCode(contributors.approvePlan(plan.id, plan.version), 'RESOURCE_INELIGIBLE');
  });

  it('replan drops ineligible allocations, bumps the version and clears the flag', async () => {
    const v1 = await contributors.getResourcePlan(INCIDENT);
    const v2 = await contributors.requestReplan(v1.id, v1.version);
    expect(v2.version).toBe(v1.version + 1);
    expect(v2.status).toBe('PROPOSED');
    expect(v2.replanSuggested).toBe(false);
    expect(v2.allocations.map((a) => a.resourceId)).not.toContain('res-c1-gen');
    expect(store.planHistory).toHaveLength(1);
    await expectCode(contributors.requestReplan(v1.id, v1.version), 'VERSION_CONFLICT');
  });

  it('validates manual allocations and records valid ones as MANUAL with a reason', async () => {
    let plan = await contributors.getResourcePlan(INCIDENT);
    plan = await contributors.requestReplan(plan.id, plan.version);
    const base = { planId: plan.id, expectedVersion: plan.version, workOrderId: 'INT-101', quantity: 1 };

    await expectCode(
      contributors.allocateManually({ ...base, resourceId: 'res-c1-gen', reason: 'need power for pumps' }),
      'RESOURCE_STALE'
    );
    await expectCode(
      contributors.allocateManually({ ...base, resourceId: 'res-c1-boat', reason: 'boat for the pump crew' }),
      'OVER_ALLOCATED'
    );
    await expectCode(contributors.allocateManually({ ...base, resourceId: 'res-c1-food', reason: 'short' }), 'REASON_REQUIRED');

    const next = await contributors.allocateManually({
      ...base,
      resourceId: 'res-c1-food',
      quantity: 50,
      reason: 'food for the pump crew shift',
    });
    expect(next.version).toBe(plan.version + 1);
    expect(next.lastChangedBy?.kind).toBe('NGO');
    const manual = next.allocations.find((a) => a.source === 'MANUAL');
    expect(manual).toMatchObject({ workOrderId: 'INT-101', resourceId: 'res-c1-food', reason: 'food for the pump crew shift' });
  });

  it('approval publishes tasks to workers and instructions to contributors', async () => {
    let plan = await contributors.getResourcePlan(INCIDENT);
    plan = await contributors.requestReplan(plan.id, plan.version);
    plan = await contributors.approvePlan(plan.id, plan.version);

    expect(plan.status).toBe('APPROVED');
    const published = store.tasks.filter((t) => t.planId === plan.id);
    expect(published.length).toBeGreaterThan(0);
    expect(published.every((t) => !!t.publishedAt)).toBe(true);

    await contributors.contributorLogin({ contributorId: 'SAMPLE-C-0001', signInCode: 'SAMPLE-CODE' });
    const instructions = await contributors.getMyInstructions();
    expect(instructions.length).toBe(plan.allocations.length);
    expect(instructions[0]).toMatchObject({ planId: plan.id, ngoName: 'Disaster Relief Network India' });
  });
});

describe('cascades', () => {
  it('a reported task problem flags the plan for replanning', async () => {
    await mockApi.reportProblem('INT-102', 'Road washed out', true, 'ROUTE_BLOCKED');
    const plan = store.plans.find((p) => p.incidentId === INCIDENT)!;
    expect(plan.replanSuggested).toBe(true);
    expect(plan.replanReasons?.some((r) => r.includes('INT-102') && r.includes('Road washed out'))).toBe(true);
  });

  it('a missed check-in makes the resource stale and flags plans using it', () => {
    const boat = store.resources.find((r) => r.id === 'res-c1-boat')!;
    boat.checkInDueAt = new Date(Date.now() - 60_000).toISOString();
    sweepMissedCheckIns();
    expect(boat.freshness).toBe('STALE');
    expect(boat.eligibleForAllocation).toBe(false);
    const plan = store.plans.find((p) => p.incidentId === INCIDENT)!;
    expect(plan.replanReasons?.some((r) => r.startsWith('Simulated: Boat'))).toBe(true);
  });

  it('revoking a contributor makes their resources ineligible', async () => {
    await contributors.decideContributorApplication('con-app-002', 'REVOKE', 'Photos were reused');
    const theirs = store.resources.filter((r) => r.contributorId === 'SAMPLE-C-0001');
    expect(theirs.length).toBeGreaterThan(0);
    expect(theirs.every((r) => !r.eligibleForAllocation)).toBe(true);
    await expectCode(
      contributors.contributorLogin({ contributorId: 'SAMPLE-C-0001', signInCode: 'SAMPLE-CODE' }),
      'REVOKED'
    );
  });

  it('approving an NGO makes it public and gives it plans; suspending removes it', async () => {
    const before = (await fetchVerifiedNgos()).length;
    await decideNgo('ngo-app-101', true);
    expect((await fetchVerifiedNgos()).length).toBe(before + 1);
    expect(store.plans.some((p) => p.ngoId === 'ngo-app-101' && p.incidentId === INCIDENT)).toBe(true);

    await decideNgo('ngo-app-101', false);
    expect((await fetchVerifiedNgos()).length).toBe(before);
  });

  it('approving a contributor application issues credentials that can sign in', async () => {
    const result = await contributors.decideContributorApplication('con-app-001', 'APPROVE');
    expect(result.credentials).toBeDefined();
    const who = await contributors.contributorLogin(result.credentials!);
    expect(who.contributorId).toBe(result.credentials!.contributorId);
  });
});

describe('resetStore', () => {
  it('restores the seed in place', async () => {
    const plan = await contributors.getResourcePlan(INCIDENT);
    await contributors.requestReplan(plan.id, plan.version);
    await decideNgo('ngo-app-101', true);
    resetStore();
    expect(store.plans).toHaveLength(1);
    expect(store.plans[0].version).toBe(1);
    expect(store.ngos).toHaveLength(1);
    expect(store.planHistory).toHaveLength(0);
  });
});
