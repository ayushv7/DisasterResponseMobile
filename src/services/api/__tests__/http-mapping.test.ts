/** Wire → app mapping for the backend's flood events and observations. */
import { describe, expect, it } from '@jest/globals';

import { mapFloodEvent, mapObservation, toApiError, wrapList, FloodEventDto, FloodObservationDto } from '../http-mapping';

const event: FloodEventDto = {
  event_id: 'b3f1c2d4-0000-4000-8000-000000000001',
  hazard_type: 'FLOOD',
  title: 'Brahmaputra rising near Majuli',
  description: '',
  location_name: 'Majuli',
  state: 'Assam',
  district: null,
  location: null,
  status: 'CANDIDATE',
  verification_status: 'UNVERIFIED',
  created_at: '2026-10-11T08:00:00Z',
  updated_at: '2026-10-11T09:00:00Z',
  is_sample: true,
  severity: 'UNKNOWN',
  severity_basis: { rule: 'highest of affected locations', location_count: 0, assessed_location_count: 0 },
};

const observation: FloodObservationDto = {
  observation_id: 'obs-1',
  event_id: event.event_id,
  source_id: 'src-cwc',
  source_name: null,
  source_category: 'RIVER_MONITORING',
  source_approval_status: 'APPROVED',
  observation_type: 'RIVER_LEVEL',
  title: 'Neamatighat above danger mark',
  description: 'Level 86.2 m',
  location_name: 'Neamatighat',
  state: 'Assam',
  district: 'Jorhat',
  observed_at: '2026-10-11T07:30:00Z',
  received_at: '2026-10-11T07:35:00Z',
  source_url: null,
  verification_status: 'UNVERIFIED',
  freshness: 'RECENT',
  freshness_rule: 'FRESH under 1 hour, RECENT under 24 hours, STALE otherwise.',
  is_sample: false,
};

describe('mapFloodEvent', () => {
  it('maps backend fields and leaves missing ones undefined', () => {
    const r = mapFloodEvent(event);
    expect(r).toMatchObject({
      id: event.event_id,
      title: event.title,
      location: 'Majuli',
      state: 'Assam',
      severity: 'UNKNOWN',
      status: 'CANDIDATE',
      detectedAt: event.created_at,
      updatedAt: event.updated_at,
      isSample: true,
      severityBasis: '0 of 0 locations assessed',
    });
    // Not sent by the backend: never filled in
    expect(r.latitude).toBeUndefined();
    expect(r.district).toBeUndefined();
    expect(r.description).toBeUndefined();
    expect(r.estimatedPopulationImpact).toBeUndefined();
    expect(r.criticalAssetsAtRisk).toBeUndefined();
    expect(r.detectionSource).toBeUndefined();
  });

  it('flattens coordinates when present', () => {
    const r = mapFloodEvent({ ...event, location: { latitude: 26.95, longitude: 94.17 } });
    expect([r.latitude, r.longitude]).toEqual([26.95, 94.17]);
  });
});

describe('mapObservation', () => {
  it('maps title to headline, observation_type to kind, received_at to retrievedAt', () => {
    expect(mapObservation(observation)).toMatchObject({
      id: 'obs-1',
      incidentId: event.event_id,
      kind: 'RIVER_LEVEL',
      headline: 'Neamatighat above danger mark',
      location: 'Neamatighat, Jorhat, Assam',
      observedAt: observation.observed_at,
      retrievedAt: observation.received_at,
      freshness: 'RECENT',
      isSample: false,
    });
    expect(mapObservation(observation).sourceName).toBeUndefined();
    expect(mapObservation(observation).sourceUrl).toBeUndefined();
  });
});

describe('wrapList and errors', () => {
  it('wraps bare arrays with a null cursor and the server Date header', () => {
    expect(wrapList([1, 2], 'Sat, 11 Oct 2026 08:00:00 GMT')).toEqual({
      items: [1, 2],
      nextCursor: null,
      serverTime: '2026-10-11T08:00:00.000Z',
    });
    expect(wrapList([], null).serverTime).toBeNull();
    expect(wrapList([], 'not a date').serverTime).toBeNull();
  });

  it('turns {detail} into an ApiError', () => {
    const notFound = toApiError(404, { detail: 'Flood event not found.' });
    expect([notFound.code, notFound.message]).toEqual(['NOT_FOUND', 'Flood event not found.']);
    const invalid = toApiError(422, { detail: [{ msg: 'limit must be ≤ 100' }] });
    expect([invalid.code, invalid.message]).toEqual(['VALIDATION_ERROR', 'limit must be ≤ 100']);
    expect(toApiError(500, null).message).toBe('Request failed (HTTP 500).');
  });
});
