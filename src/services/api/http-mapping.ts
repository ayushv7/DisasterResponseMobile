/**
 * Backend (FastAPI, snake_case) → app models. Mapping lives here only;
 * screens never see wire shapes. Fields the backend does not send stay
 * undefined; nothing is filled in from sample data.
 */
import { NgoMember, StaffRole } from '@/types/accounts';
import { IncidentObservation, ObservationFreshness } from '@/types/observations';
import { IncidentRecord, IncidentStatus, SeverityLevel } from '@/types/operations';

import { ApiError } from './types';

/** GET /api/v1/flood-events and /{id} (FloodEventResponse). */
export interface FloodEventDto {
  event_id: string;
  hazard_type: string;
  title: string;
  description: string;
  location_name: string;
  state: string;
  district: string | null;
  location: { latitude: number; longitude: number } | null;
  status: 'CANDIDATE' | 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
  verification_status: 'UNVERIFIED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  is_sample: boolean;
  severity: 'UNKNOWN' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  severity_basis?: { rule: string; location_count: number; assessed_location_count: number };
}

/** GET /api/v1/flood-events/{id}/observations (FloodObservationResponse). */
export interface FloodObservationDto {
  observation_id: string;
  event_id: string | null;
  source_id: string;
  source_name: string | null;
  source_category: string | null;
  source_approval_status: string | null;
  observation_type: string;
  title: string;
  description: string;
  location_name: string;
  state: string;
  district: string | null;
  observed_at: string;
  received_at: string;
  source_url: string | null;
  verification_status: string;
  freshness: ObservationFreshness;
  freshness_rule: string;
  is_sample: boolean;
}

/** Bare backend arrays wrapped the way the app's list convention expects. */
export interface ListPage<T> {
  items: T[];
  nextCursor: null;
  /** From the HTTP Date header when the server sends one; never invented. */
  serverTime: string | null;
}

export function wrapList<T>(items: T[], dateHeader: string | null): ListPage<T> {
  const parsed = dateHeader ? new Date(dateHeader) : null;
  return {
    items,
    nextCursor: null,
    serverTime: parsed && !isNaN(parsed.getTime()) ? parsed.toISOString() : null,
  };
}

const orUndefined = <T>(v: T | null | undefined): T | undefined => (v == null || v === '' ? undefined : v);

export function mapFloodEvent(dto: FloodEventDto): IncidentRecord {
  const basis = dto.severity_basis;
  return {
    id: dto.event_id,
    title: dto.title,
    // Flat location: the name, plus coordinates when the backend has them
    location: dto.location_name,
    latitude: dto.location?.latitude,
    longitude: dto.location?.longitude,
    state: orUndefined(dto.state),
    district: orUndefined(dto.district),
    description: orUndefined(dto.description),
    severity: dto.severity as SeverityLevel,
    severityBasis: basis
      ? `${basis.assessed_location_count} of ${basis.location_count} locations assessed`
      : undefined,
    status: dto.status as IncidentStatus,
    verificationStatus: dto.verification_status,
    detectedAt: dto.created_at,
    updatedAt: dto.updated_at,
    isSample: dto.is_sample,
  };
}

export function mapObservation(dto: FloodObservationDto): IncidentObservation {
  const place = [dto.location_name, dto.district, dto.state].filter(Boolean).join(', ');
  return {
    id: dto.observation_id,
    incidentId: orUndefined(dto.event_id),
    kind: dto.observation_type,
    headline: dto.title,
    description: orUndefined(dto.description),
    location: orUndefined(place),
    sourceName: orUndefined(dto.source_name),
    sourceCategory: orUndefined(dto.source_category),
    sourceApprovalStatus: orUndefined(dto.source_approval_status),
    observedAt: dto.observed_at,
    retrievedAt: dto.received_at,
    sourceUrl: orUndefined(dto.source_url),
    verificationStatus: dto.verification_status,
    freshness: dto.freshness,
    freshnessRule: dto.freshness_rule,
    isSample: dto.is_sample,
  };
}

/** Backend errors are `{detail, code}`; detail is a string or a list of validation errors. */
export function toApiError(status: number, body: unknown): ApiError {
  const detail = (body as { detail?: unknown } | null)?.detail;
  const backendCode = (body as { code?: unknown } | null)?.code;
  const message =
    typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail
            .map((d) => (d && typeof d === 'object' && 'msg' in d ? String((d as { msg: unknown }).msg) : ''))
            .filter(Boolean)
            .join('; ') || `Request failed (HTTP ${status}).`
        : `Request failed (HTTP ${status}).`;
  const code =
    typeof backendCode === 'string'
      ? backendCode
      : status === 401
        ? 'UNAUTHENTICATED'
        : status === 403
          ? 'FORBIDDEN'
          : status === 404
            ? 'NOT_FOUND'
            : status === 422
              ? 'VALIDATION_ERROR'
              : `HTTP_${status}`;
  return new ApiError(code, status === 403 ? `Not allowed: ${message}` : message);
}

/** POST /api/v1/auth/login and /auth/worker-login (TokenResponse). */
export interface TokenResponseDto {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    user_id: string;
    role: 'AUTHORITY' | 'NGO_ADMIN' | 'WORKER';
    display_name: string;
    ngo_id?: string | null;
    worker_id?: string | null;
  };
}

/** Backend role → app role. AUTHORITY uses the authority area ('admin'). */
export function mapStaffRole(role: TokenResponseDto['user']['role']): StaffRole | null {
  return role === 'AUTHORITY' ? 'admin' : role === 'NGO_ADMIN' ? 'ngo' : null;
}

/**
 * Backend worker → NgoMember. The backend sends no phone, skills, NGO name or
 * password-change flag, so those stay empty/false rather than invented.
 */
export function mapWorker(user: TokenResponseDto['user'], ngoCode: string): NgoMember {
  return {
    id: user.user_id,
    workerId: user.worker_id ?? '',
    ngoId: user.ngo_id ?? '',
    ngoName: user.ngo_id ?? ngoCode,
    name: user.display_name,
    phone: '',
    skills: [],
    status: 'ACTIVE',
    mustChangePassword: false,
  };
}
