/**
 * Disaster Response Orchestration Network — Orchestration Service Layer
 *
 * Provides central decision-support, situation assessment consolidation,
 * evidence-based action recommendations, and NGO resource matching.
 *
 * BACKEND CONTRACT STATUS: UI-ONLY STUB / PREVIEW
 * Expected backend endpoints when live:
 *   GET   /api/v1/events/{id}/assessment         → SituationAssessment
 *   GET   /api/v1/events/{id}/needs              → PrioritizedNeed[]
 *   GET   /api/v1/events/{id}/recommendations    → ActionRecommendation[]
 *   GET   /api/v1/events/{id}/ngo-matches        → NgoCapabilityMatch[]
 *   GET   /api/v1/events/{id}/coordination       → ResponseCoordinationTask[]
 *   POST  /api/v1/events/{id}/actions/{actionId}/authorize → ActionRecommendation
 */

import {
  SAMPLE_ACTION_RECOMMENDATIONS,
  SAMPLE_ASSESSMENTS,
  SAMPLE_COORDINATION_TASKS,
  SAMPLE_NGO_MATCHES,
  SAMPLE_OUTCOME_UPDATES,
  SAMPLE_PRIORITIZED_NEEDS,
} from '@/fixtures/sample-orchestration';
import {
  ActionLifecycle,
  ActionRecommendation,
  CoordinationStatus,
  NgoCapabilityMatch,
  OutcomeUpdateEntry,
  PrioritizedNeed,
  ResponseCoordinationTask,
  SituationAssessment,
} from '@/types/orchestration';

export const IS_STUB_ORCHESTRATION_API = true;

// In-memory clones for live interaction during session
const inMemoryActions: Record<string, ActionRecommendation[]> = JSON.parse(
  JSON.stringify(SAMPLE_ACTION_RECOMMENDATIONS)
);
const inMemoryTasks: Record<string, ResponseCoordinationTask[]> = JSON.parse(
  JSON.stringify(SAMPLE_COORDINATION_TASKS)
);
const inMemoryOutcomes: Record<string, OutcomeUpdateEntry[]> = JSON.parse(
  JSON.stringify(SAMPLE_OUTCOME_UPDATES)
);

export async function fetchSituationAssessment(
  eventId: string
): Promise<SituationAssessment | null> {
  await new Promise((res) => setTimeout(res, 200));
  return SAMPLE_ASSESSMENTS[eventId] || null;
}

export async function fetchPrioritizedNeeds(
  eventId: string
): Promise<PrioritizedNeed[]> {
  await new Promise((res) => setTimeout(res, 200));
  return SAMPLE_PRIORITIZED_NEEDS[eventId] || [];
}

export async function fetchActionRecommendations(
  eventId: string
): Promise<ActionRecommendation[]> {
  await new Promise((res) => setTimeout(res, 250));
  return inMemoryActions[eventId] || [];
}

export async function fetchNgoCapabilityMatches(
  eventId: string
): Promise<NgoCapabilityMatch[]> {
  await new Promise((res) => setTimeout(res, 200));
  return SAMPLE_NGO_MATCHES[eventId] || [];
}

export async function fetchResponseCoordinationTasks(
  eventId: string
): Promise<ResponseCoordinationTask[]> {
  await new Promise((res) => setTimeout(res, 200));
  return inMemoryTasks[eventId] || [];
}

export async function fetchOutcomeUpdates(
  eventId: string
): Promise<OutcomeUpdateEntry[]> {
  await new Promise((res) => setTimeout(res, 150));
  return inMemoryOutcomes[eventId] || [];
}

/**
 * Transition recommendation to authorized decision or completed action.
 * Retains strict attribution audit trail.
 */
export async function updateActionLifecycle(
  eventId: string,
  actionId: string,
  newState: ActionLifecycle,
  authorizedBy?: string
): Promise<ActionRecommendation> {
  await new Promise((res) => setTimeout(res, 300));

  const list = inMemoryActions[eventId] || [];
  const item = list.find((a) => a.id === actionId);
  if (!item) {
    throw new Error(`Recommendation ${actionId} not found.`);
  }

  item.lifecycleState = newState;
  if (newState === 'AUTHORIZED_DECISION') {
    item.authorizedBy = authorizedBy || 'Responder Operations Desk';
    item.authorizedAt = new Date().toISOString();
  }

  // Also log into outcome updates
  if (!inMemoryOutcomes[eventId]) inMemoryOutcomes[eventId] = [];
  inMemoryOutcomes[eventId].unshift({
    id: `out-${Date.now()}`,
    eventId,
    timestamp: new Date().toISOString(),
    headline: `Action Updated: ${item.actionTitle}`,
    source: authorizedBy || 'Operations Desk',
    operationalImpact: `Action transitioned to ${newState}. Traceable to evidence: ${item.supportingEvidence[0]?.sourceName || 'Telemetry'}.`,
  });

  return JSON.parse(JSON.stringify(item));
}

export async function updateCoordinationTaskStatus(
  eventId: string,
  taskId: string,
  newStatus: CoordinationStatus
): Promise<ResponseCoordinationTask> {
  await new Promise((res) => setTimeout(res, 250));

  const list = inMemoryTasks[eventId] || [];
  const item = list.find((t) => t.id === taskId);
  if (!item) {
    throw new Error(`Coordination task ${taskId} not found.`);
  }

  item.status = newStatus;
  item.lastUpdated = new Date().toISOString();
  return JSON.parse(JSON.stringify(item));
}
