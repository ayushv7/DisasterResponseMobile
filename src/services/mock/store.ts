/**
 * ONE in-memory store for mock mode (stand-in for the backend database).
 * Every mock adapter reads and writes here, so an action on one screen is
 * visible on every other. Seeded from the existing fixtures (unchanged).
 *
 * Relations (by ID):
 *   Ngo ─< Incident (by service area) ─< Plan(version) ─< Allocation ─> Task ─> FieldWorker
 *   Ngo ─< Contributor ─< Resource
 *   Task / Resource ─< Evidence
 *   Contributor ─< Instruction (issued when a plan is approved)
 */
import { SAMPLE_FIELD_TEAM, SAMPLE_NGO_CODE } from '@/fixtures/sample-accounts';
import {
  SAMPLE_CONTRIBUTOR_ACCOUNTS,
  SAMPLE_CONTRIBUTOR_APPLICATIONS,
  SAMPLE_PLAN,
  SAMPLE_RESOURCES as SAMPLE_CONTRIBUTOR_RESOURCES,
} from '@/fixtures/sample-contributors';
import {
  SAMPLE_INCIDENTS,
  SAMPLE_INTERVENTIONS,
  SAMPLE_REPLANNING_RECORDS,
  SAMPLE_RESOURCES as SAMPLE_CREWS,
} from '@/fixtures/sample-operations';
import { NgoMember } from '@/types/accounts';
import {
  ContributorApplication,
  ContributorInstruction,
  ContributorResource,
  EvidenceRecord,
  ResourcePlan,
} from '@/types/contributors';
import { IncidentRecord, InterventionRecord, OperationalResource, ReplanningRecord } from '@/types/operations';

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const HOUR = 3600_000;
const hoursFromNow = (h: number) => new Date(Date.now() + h * HOUR).toISOString();

export interface StoreNgo {
  id: string;
  name: string;
  code: string;
  serviceArea: string;
}

export interface StoreContributor {
  contributorId: string;
  applicationId: string;
  name: string;
  ngoId: string;
  state: 'ACTIVE' | 'CODE_EXPIRED' | 'REVOKED';
}

function seedResources(): ContributorResource[] {
  return SAMPLE_CONTRIBUTOR_RESOURCES.map(({ lastCheckInHoursAgo, dueInHours, ...r }) => ({
    ...r,
    lastCheckInAt: lastCheckInHoursAgo != null ? hoursFromNow(-lastCheckInHoursAgo) : undefined,
    checkInDueAt: dueInHours != null ? hoursFromNow(dueInHours) : undefined,
    evidence: r.evidence ? { ...r.evidence, capturedAt: hoursFromNow(-(lastCheckInHoursAgo ?? 0)) } : undefined,
  }));
}

export const store = {
  ngos: [
    { id: 'ngo-drn-india', name: 'Disaster Relief Network India', code: SAMPLE_NGO_CODE, serviceArea: 'Assam' },
  ] as StoreNgo[],
  incidents: copy(SAMPLE_INCIDENTS) as IncidentRecord[],
  tasks: copy(SAMPLE_INTERVENTIONS) as InterventionRecord[],
  crews: copy(SAMPLE_CREWS) as OperationalResource[],
  reassignments: copy(SAMPLE_REPLANNING_RECORDS) as ReplanningRecord[],
  plans: [{ ...copy(SAMPLE_PLAN), generatedAt: new Date().toISOString() }] as ResourcePlan[],
  /** Previous plan versions (audit). */
  planHistory: [] as ResourcePlan[],
  workers: copy(SAMPLE_FIELD_TEAM) as NgoMember[],
  contributorApplications: copy(SAMPLE_CONTRIBUTOR_APPLICATIONS) as ContributorApplication[],
  contributors: SAMPLE_CONTRIBUTOR_ACCOUNTS.map((a) => ({ ...a, ngoId: 'ngo-drn-india' })) as StoreContributor[],
  resources: seedResources(),
  instructions: [] as ContributorInstruction[],
  evidence: [] as EvidenceRecord[],
};

export function ngoById(id: string): StoreNgo | undefined {
  return store.ngos.find((n) => n.id === id);
}

/** Records evidence for a task or resource and returns its id. */
export function addEvidence(record: Omit<EvidenceRecord, 'id'>): string {
  const id = `ev-${store.evidence.length + 1}`;
  store.evidence.push({ id, ...record });
  return id;
}
