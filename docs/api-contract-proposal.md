# API Contract Proposal (PROPOSED) — Disaster Response Orchestration Network (Floods MVP)

Status: **PROPOSAL from the mobile frontend. Nothing here is implemented or agreed.**
The backend (FastAPI + MongoDB Atlas + AWS) is authoritative for permissions, recommendations,
reassignment and escalation. The app only displays what the backend returns.

Every path, field and status below is a starting point for discussion. Please correct or
replace anything; the app will adapt to whatever you ship.

## Conventions (proposed)

- Base URL from `EXPO_PUBLIC_API_BASE_URL` (unset = app runs on local sample data).
- JSON, `camelCase` fields, ISO 8601 UTC timestamps (`...Z`), string IDs.
- Auth: `Authorization: Bearer <token>`. Token issuance is TBD by the backend.
- Errors: non-2xx with `{ "error": { "code": string, "message": string } }`.
- Lists: `{ "items": T[], "nextCursor": string | null }`.
- Every response that drives a "last updated" label includes `serverTime`.
- Mutations accept an `Idempotency-Key` header so retries on flaky networks are safe.

## Domain types (TypeScript)

```ts
type Role = 'coordinator' | 'field_worker' | 'ngo' | 'public' | 'admin';
type Severity = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

interface User {
  id: string;
  displayName: string;
  roles: Role[];               // backend-assigned; UI gating is convenience only
  ngoId?: string;              // for ngo users
  teamId?: string;             // for field workers
}

interface Incident {
  id: string;                  // e.g. INC-2026-081
  title: string;
  status: 'CANDIDATE' | 'ACTIVE' | 'CONTAINED' | 'RESOLVED' | 'DISMISSED';
  severity: Severity;
  location: { name: string; lat?: number; lng?: number };
  affectedArea: string;
  estimatedPopulationImpact?: number;
  criticalAssetsAtRisk: string[];
  detectedAt: string;          // when the system detected the event
  updatedAt: string;
  observationIds: string[];
  workOrderIds: string[];
}

interface SourceObservation {
  id: string;
  incidentId: string;
  kind: 'GOVERNMENT' | 'GAUGE' | 'RAINFALL' | 'NEWS' | 'FIELD';
  sourceName: string;
  sourceUrl?: string;
  headline: string;
  value?: { metric: string; amount: number; unit: string };   // e.g. water level
  observedAt: string;          // time at source (publication/measurement)
  retrievedAt: string;         // time the system ingested it
  conflictsWith?: string[];    // observation IDs that disagree; both are kept
}

interface Resource {
  id: string;
  name: string;
  category: 'CREW' | 'EQUIPMENT' | 'VEHICLE';
  capabilities: string[];
  availability: 'AVAILABLE' | 'ASSIGNED' | 'RESERVED' | 'UNAVAILABLE';
  condition: 'OPERATIONAL' | 'DEGRADED' | 'FAILED' | 'MAINTENANCE_REQUIRED';
  baseLocation: string;
  distanceKm?: number;         // relative to the incident being viewed
  statusReportedAt: string;    // drives freshness: <1h green, <24h amber, older red
}

interface Recommendation {
  id: string;
  workOrderId: string;
  resourceIds: string[];
  suggestedDeadline: string;
  explanation: string[];       // human-readable reasons, in order of weight
  constraints: string[];
  missingInputs: string[];
  alternatives: { resourceIds: string[]; reason: string }[];
  generatedAt: string;
}

type WorkOrderState =
  | 'UNASSIGNED' | 'ASSIGNED' | 'ACKNOWLEDGED' | 'IN_PROGRESS'
  | 'BLOCKED' | 'AWAITING_VERIFICATION' | 'VERIFIED' | 'FAILED' | 'CANCELLED';

interface WorkOrder {
  id: string;
  incidentId: string;
  intervention: string;        // e.g. DEWATERING, BOAT_EVACUATION
  priority: 'IMMEDIATE' | 'HIGH' | 'ROUTINE';
  state: WorkOrderState;
  instructions: string;
  assignedResourceIds: string[];
  assignedTeamId?: string;
  deadline?: string;
  contingency?: string;
  recommendationId?: string;
  overrideReason?: string;     // set when coordinator overrides the recommendation
  updatedAt: string;
}

interface Evidence {
  id: string;
  kind: 'PHOTO' | 'NOTE';
  url?: string;                // upload flow TBD (presigned S3 URL?)
  note?: string;
  capturedAt: string;
}

interface TaskEvent {          // append-only history for a work order
  id: string;
  workOrderId: string;
  type: 'ASSIGNED' | 'ACKNOWLEDGED' | 'STARTED' | 'PROBLEM_REPORTED' | 'COMPLETED'
      | 'VERIFIED' | 'REJECTED' | 'REASSIGNED' | 'ESCALATED' | 'ACK_TIMEOUT';
  actorId: string;             // 'system' for automated detections
  at: string;
  note?: string;
  problem?: { kind: 'EQUIPMENT_FAILURE' | 'ROUTE_BLOCKED' | 'UNSAFE' | 'OTHER'; detail: string };
  evidence?: Evidence[];
}

interface Verification {
  workOrderId: string;
  outcome: 'VERIFIED' | 'REJECTED';
  verifierId: string;
  notes?: string;
  at: string;
}

interface Reassignment {
  id: string;
  workOrderId: string;
  trigger: 'ACK_TIMEOUT' | 'EQUIPMENT_FAILURE' | 'ROUTE_BLOCKED' | 'WORK_FAILED';
  fromResourceIds: string[];
  recommendedResourceIds: string[];   // what the backend recommended
  actualResourceIds?: string[];       // what was actually assigned
  status: 'PENDING_DECISION' | 'REASSIGNED' | 'ESCALATED';
  decidedBy?: string;
  at: string;
}

interface NgoMessage {         // private: visible only to the target NGO and admins
  id: string;
  incidentId: string;
  ngoId: string;
  body: string;
  senderPseudonym: string;     // never phone number or exact location
  approximateArea?: string;
  consentToContact: boolean;
  location?: {                 // PROPOSED; only if the sender chose to attach it
    latitude: number;
    longitude: number;
    accuracyMeters: number | null;
    precision: 'approximate' | 'exact';   // approximate is rounded (~1 km) on the device
    capturedAt: string;
  };
  evidenceIds?: string[];      // PROPOSED; photos uploaded via /evidence/upload-url
  status: 'RECEIVED' | 'NEEDS_REVIEW' | 'CLARIFICATION_REQUESTED' | 'REVIEWED' | 'CLOSED';
  createdAt: string;
}

interface NgoUpdate {          // public, attributed to the NGO
  id: string;
  incidentId: string;
  ngoId: string;
  ngoName: string;
  body: string;
  status: 'DRAFT' | 'PUBLISHED' | 'TAKEN_DOWN';
  publishedAt?: string;
  takenDownReason?: string;
}

interface Ngo {
  id: string;
  name: string;
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
  approvedAt?: string;
}
```

## Endpoints (proposed)

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/auth/session` | any | Exchange credentials for token + `User` |
| GET | `/me` | any | Current `User` and roles |
| GET | `/ops/summary` | coordinator | Counts by work-order state, overdue/failed, `serverTime` |
| GET | `/ops/action-queue` | coordinator | Prioritized items needing action now |
| GET | `/incidents` | coordinator, public* | List (`?status=&severity=`) |
| GET | `/incidents/{id}` | coordinator, public* | Incident detail |
| GET | `/incidents/{id}/observations` | coordinator, public* | `SourceObservation[]` incl. conflicts |
| GET | `/incidents/{id}/resources` | coordinator | Candidate `Resource[]` with distance |
| GET | `/work-orders/{id}/recommendation` | coordinator | Latest `Recommendation` |
| POST | `/work-orders/{id}/assign` | coordinator | `{ recommendationId?, resourceIds, deadline, overrideReason? }` |
| GET | `/work-orders?assignee=me` | field_worker | My tasks |
| GET | `/work-orders/{id}/events` | coordinator, assignee | `TaskEvent[]` history |
| POST | `/work-orders/{id}/acknowledge` | assignee | |
| POST | `/work-orders/{id}/start` | assignee | |
| POST | `/work-orders/{id}/problem` | assignee | `{ kind, detail, evidence? }` |
| POST | `/work-orders/{id}/complete` | assignee | `{ note, evidence[] }` |
| POST | `/evidence/upload-url` | assignee, public | Presigned upload (TBD) |
| POST | `/work-orders/{id}/verify` | coordinator | `{ outcome, notes? }` |
| GET | `/reassignments?status=` | coordinator | Pending/past `Reassignment[]` |
| POST | `/reassignments/{id}/decide` | coordinator | `{ resourceIds, note? }` or escalate |
| GET | `/ngos?status=APPROVED` | public | Verified NGOs to message |
| POST | `/incidents/{id}/messages` | public | Create `NgoMessage` (rate-limited; 429 + `retryAfter`) |
| GET | `/ngo/messages` | ngo | Inbox |
| POST | `/ngo/messages/{id}/status` | ngo | Review / clarify / close |
| POST | `/incidents/{id}/updates` | ngo | Create/publish `NgoUpdate` |
| GET | `/incidents/{id}/updates` | any | Published updates |
| POST | `/admin/ngos/{id}/approve` | admin | Approve/suspend NGO |
| POST | `/admin/updates/{id}/takedown` | admin | `{ reason }` |

\* Public sees a reduced incident/observation view; backend decides the fields.

## Field worker accounts (PROPOSED)

All items in this section are **PROPOSED** and not implemented. Field workers belong to one NGO
and cannot self-register. The backend issues NGO codes, worker IDs, temporary passwords and
tokens; the app never generates them. It shows returned credentials once and never stores them.
In mock mode the app returns fixed sample values labelled "Simulated".

```ts
interface NgoMember {          // PROPOSED
  id: string;
  workerId: string;            // backend-issued; used with the NGO code to sign in
  ngoId: string;
  ngoName: string;
  name: string;
  phone: string;
  skills: string[];
  status: 'ACTIVE' | 'DISABLED';
  mustChangePassword: boolean; // true until the temporary password is replaced
  teamId?: string;             // decides which work orders the worker sees
  createdAt: string;
}

interface WorkerCredentials {  // PROPOSED; returned once, never retrievable again
  workerId: string;
  temporaryPassword: string;
}
```

Staff (ngo, coordinator, admin) keep using `POST /auth/session` with email + password.
`Ngo` gains an `ngoCode` (backend-issued) that the NGO shares with its workers.
`TaskEvent` should carry a display name and NGO name for the actor (e.g. `actorName`,
`actorNgoName`) so every action in the UI can show who performed it.

| Method | Path | Who | Purpose | Status |
|---|---|---|---|---|
| POST | `/auth/worker-session` | any | `workerLogin`: `{ ngoCode, workerId, password }` → token + `NgoMember` | PROPOSED |
| POST | `/auth/password` | field_worker | Replace temporary password on first sign-in `{ newPassword }` | PROPOSED |
| GET | `/ngo/workers` | ngo | List own field team (`NgoMember[]`) | PROPOSED |
| POST | `/ngo/workers` | ngo | `createWorker`: `{ name, phone, skills }` → `{ member, credentials }` | PROPOSED |
| POST | `/ngo/workers/{id}/disable` | ngo | `disableWorker`: `{ disabled: boolean }` (false re-enables) | PROPOSED |
| POST | `/ngo/workers/{id}/reset-password` | ngo | `resetWorkerPassword` → `WorkerCredentials` | PROPOSED |

`GET /work-orders?assignee=me` (above) returns only the signed-in worker's tasks, with the NGO
name of the assigned team.

## Public accounts (PROPOSED)

All items in this section are **PROPOSED** and not implemented.

- **Visitor** (no sign-in): reads alerts and sends a message to an NGO. Emergency messaging is
  never gated behind sign-in.
- **Registered citizen** (optional): phone or email OTP sign-in. Unlocks offering help, choosing
  alert areas, and "My messages / My offers" with status.

The backend sends and checks OTPs, issues tokens, and matches offers to verified NGO needs. The
app only calls these and shows the result. In mock mode the app accepts a fixed sample code and
labels everything "Simulated". Push notifications are a saved preference only until the backend
delivers them; the app does not claim push works.

```ts
interface Citizen {            // PROPOSED; role stays 'public'
  id: string;
  contact: string;             // phone or email the OTP was sent to
  contactKind: 'phone' | 'email';
  notificationAreas: string[];
  pushEnabled: boolean;        // preference only
}

interface OtpChallenge {       // PROPOSED; the code is never returned to the app
  challengeId: string;
  sentTo: string;              // masked destination
  expiresAt: string;
}

interface HelpOffer {          // PROPOSED
  id: string;
  kind: 'FOOD' | 'MONEY' | 'EQUIPMENT' | 'VOLUNTEERING';
  details: string;
  area: string;
  needId?: string;             // the NGO need being answered, if any
  status: 'SUBMITTED' | 'MATCHED' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';
  matchedNgoName?: string;     // set by backend matching
  createdAt: string;
}
```

No payments are taken in the app. A money offer only records intent; a matched NGO contacts
the citizen directly.

| Method | Path | Who | Purpose | Status |
|---|---|---|---|---|
| POST | `/auth/otp/request` | public | `requestOtp`: `{ contact }` → `OtpChallenge` (rate-limited) | PROPOSED |
| POST | `/auth/otp/verify` | public | `verifyOtp`: `{ challengeId, code }` → token + `Citizen` | PROPOSED |
| POST | `/offers` | citizen | `offerHelp`: `{ kind, details, area, needId? }` → `HelpOffer` | PROPOSED |
| GET | `/offers?owner=me` | citizen | My offers with status | PROPOSED |
| PUT | `/me/notification-areas` | citizen | `setNotificationAreas`: `{ areas, pushEnabled }` → `Citizen` | PROPOSED |

The list of NGO needs is currently read from published NGO updates (`GET /incidents/{id}/updates`).
"My messages" uses the existing message endpoints, filtered to the signed-in citizen.

## Staff roles

`coordinator` and `admin` stay **separate roles** in this contract. The app shows both one
"authority" console for now. The backend must still enforce which of them may do what.

## Final role model (PROPOSED)

All items in this section are **PROPOSED** and not implemented.

- **Backend (AWS):** detects incidents, computes priority and resource allocation, and selects the
  nearby NGO(s). The app never decides any of this. In mock mode the app shows sample plans
  labelled "Simulated".
- **Authority** (`coordinator` + `admin`): no disaster assignment. Pending NGO queue
  (approve/reject), create NGO account, suspend NGO, content takedown.
- **NGO:** sees only incidents and plans the backend scoped to it. Accepts or adjusts the plan,
  assigns tasks to its own workers, verifies evidence (step 1), manages its field team and
  volunteers. Cannot approve NGOs or override authority decisions.
- **Field worker** (staff or volunteer): own tasks only, tagged with the NGO name.
- **Citizen:** optional sign-in for offers, alerts and volunteering. Visitors need no sign-in.

### Scoping

`GET /incidents`, `GET /ops/summary`, `GET /ops/action-queue`, `GET /work-orders` and
`GET /reassignments` return results **pre-scoped per caller**: an NGO gets only incidents near it
(nearby-NGO selection is backend-side), a field worker only its own work orders. The app does not
filter by role or distance.

### Types

```ts
interface WorkOrder {          // additions, PROPOSED
  requiredQualification?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  assignedWorkerIsVolunteer?: boolean;
  assignedNgoName?: string;
  ngoVerification?: VerificationStep;        // step 1: the NGO checks evidence
  authorityVerification?: VerificationStep;  // step 2: authority final verification
}

interface VerificationStep { status: 'PENDING' | 'VERIFIED' | 'REJECTED'; by?: string; at?: string }

interface Ngo {                // additions, PROPOSED
  ngoCode: string;             // backend-issued
  area: string;                // used by the backend to select nearby NGOs
  status: 'PENDING' | 'APPROVED' | 'SUSPENDED';
}

interface NgoMember { kind: 'STAFF_WORKER' | 'VOLUNTEER' }   // addition, PROPOSED

interface EligibilityResult { eligible: boolean; reasons: string[]; checkedAt: string }

interface VolunteerApplication {
  id: string;
  name: string;
  contact: string;             // masked
  skills: string[];
  availability: string;
  ngoId?: string;
  source: 'APPLIED' | 'INVITED';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  decisionReason?: string;
  eligibility?: EligibilityResult;   // computed by the backend only
  createdAt: string;
}
```

### Endpoints

| Method | Path | Who | Purpose | Status |
|---|---|---|---|---|
| GET | `/ngos?status=PENDING` | authority | Pending NGO queue | PROPOSED |
| POST | `/admin/ngos` | authority | `createNgo`: `{ name, email, area }` → `{ ngo, credentials }` (shown once) | PROPOSED |
| POST | `/admin/ngos/{id}/approve` | authority | `approveNgo`: `{ approved }`; `false` rejects a pending NGO or suspends an approved one | PROPOSED |
| POST | `/admin/updates/{id}/takedown` | authority | `{ reason }` | PROPOSED |
| POST | `/work-orders/{id}/accept` | ngo | Accept the backend plan as is | PROPOSED |
| POST | `/work-orders/{id}/assign` | ngo | Adjust the plan: `{ resourceIds, deadline, overrideReason }` | PROPOSED |
| POST | `/work-orders/{id}/assign-worker` | ngo | `assignTask` / `assignToWorker`: `{ memberId }`; backend checks the worker belongs to the NGO and holds the qualification | PROPOSED |
| POST | `/work-orders/{id}/verify` | ngo, authority | Step 1 (ngo) or step 2 (authority): `{ outcome, notes? }` | PROPOSED |
| POST | `/volunteers/applications` | citizen | `applyToVolunteer`: `{ name, skills, availability, ngoId?, consent: true }` | PROPOSED |
| GET | `/volunteers/applications?owner=me` | citizen | Own application with status and reason | PROPOSED |
| GET | `/ngo/volunteer-applications` | ngo | `listVolunteerApplications` with `eligibility` | PROPOSED |
| POST | `/ngo/volunteer-applications/{id}/decision` | ngo | `decideVolunteerApplication`: `{ decision: 'APPROVE' \| 'REJECT' \| 'REVOKE', reason? }` (reason required for reject/revoke) | PROPOSED |

`createWorker`, `disableWorker`, `resetWorkerPassword` and `workerLogin` are listed under
"Field worker accounts" above. An approved volunteer becomes an `NgoMember` with
`kind: 'VOLUNTEER'`; the backend issues their credentials.

## Contributors and resource allocation (PROPOSED)

All items in this section are **PROPOSED**; none is a verified server endpoint. The app calls
them through `ApiClient` (`src/services/api/types.ts`); `httpApi` throws `NotImplementedError`
until they exist, and `mockApi` simulates them with labelled sample data.

**Registered capacity is not available capacity.** The backend owns check-in policy, freshness,
staleness, eligibility, priorities, nearby-NGO selection, allocation, validation, plan versions
and audit history. The app only displays what comes back.

### Errors

Non-2xx responses use the existing shape `{ "error": { "code", "message" } }`. The app maps
`code` to `ApiError.code` and shows `message` unchanged.

| HTTP | `code` | When |
|---|---|---|
| 400 | `REASON_REQUIRED`, `INVALID_QUANTITY`, `INVALID_TYPE`, `CONSENT_REQUIRED` | Bad input |
| 401 | `INVALID_CREDENTIALS`, `CODE_EXPIRED` | Contributor sign-in failed |
| 403 | `UNAUTHORIZED`, `REVOKED` | Caller may not do this / access revoked |
| 404 | `NOT_FOUND` | Unknown or not visible to the caller |
| 409 | `VERSION_CONFLICT`, `INVALID_STATE` | Plan changed since the caller read it / wrong state |
| 422 | `RESOURCE_STALE`, `RESOURCE_UNAVAILABLE`, `RESOURCE_INELIGIBLE` | Allocation rejected |

### Types

```ts
interface ResourceTypePolicy { type: string; label: string; unit: string; checkInIntervalHours: number }

interface Resource {
  id: string;
  contributorId: string;
  ngoId: string;                 // the NGO that approved the contributor (no cross-NGO sharing)
  type: string; typeLabel: string; quantity: number; unit: string;
  condition: 'GOOD' | 'FAIR' | 'POOR';
  availability: 'AVAILABLE' | 'UNAVAILABLE';
  freshness: 'FRESH' | 'DUE' | 'STALE' | 'PENDING' | 'UNVERIFIED';   // backend-decided
  statusReason?: string;         // backend explanation shown verbatim
  eligibleForAllocation: boolean;
  lastCheckInAt?: string;
  checkInDueAt?: string;         // backend deadline (UTC ISO 8601)
  checkInIntervalHours?: number;
  evidence?: {                   // supporting evidence, not proof; kept apart from descriptive fields
    gps?: { latitude: number; longitude: number; accuracyMeters: number | null };
    capturedAt: string;          // device capture time
    photoUrl?: string;           // from the upload flow below
    unverified: boolean;         // true when live GPS or camera photo is missing
    reviewNote?: string;         // NGO doubt about the evidence
  };
}

interface ResourcePlan {
  id: string; ngoId: string;
  version: number;               // incremented on every replan or manual change
  generatedAt: string;
  lastChangedBy?: { name: string; kind: 'SYSTEM' | 'NGO' };
  lastChangedAt?: string;
  allocations: {
    id: string; workOrderId: string; workOrderLabel: string;
    resourceId: string; resourceLabel: string; quantity: number;
    source: 'AUTO' | 'MANUAL';
    reason?: string;             // required for MANUAL
    changedBy?: { name: string; kind: 'SYSTEM' | 'NGO' }; changedAt?: string;
  }[];
  notes?: string[];              // e.g. manual allocations dropped on replan, and why
}
```

### Operations

| Operation | Method / path | Who | Notes |
|---|---|---|---|
| `applyToContribute` | POST `/contributors/applications` | citizen | `{ name, ngoId, offering, area, consent: true }` → 201 `ContributorApplication` (status `PENDING`) |
| `decideContributorApplication` | POST `/ngo/contributor-applications/{id}/decision` | ngo (owning NGO) | `{ decision: 'APPROVE'\|'REJECT'\|'REVOKE', reason? }`; reason required unless approving. On approve → `{ application, credentials: { contributorId, signInCode, codeExpiresAt? } }`, returned **once** |
| `contributorLogin` | POST `/auth/contributor-session` | any | `{ contributorId, signInCode }` → token + `Contributor`; 401 `INVALID_CREDENTIALS`/`CODE_EXPIRED`, 403 `REVOKED` |
| `getResourceTypePolicies` | GET `/resource-types` | contributor, ngo | `ResourceTypePolicy[]` |
| `getMyResources` | GET `/contributors/me/resources` | contributor | `Resource[]` |
| `registerResource` | POST `/contributors/me/resources` | contributor | `{ type, quantity, condition, evidence: { gps?, capturedAt, photoUrl?, note? } }` → 201 `Resource` with backend `freshness`, `checkInDueAt` |
| `checkInResource` | POST `/contributors/me/resources/{id}/check-ins` | contributor (owner) | `{ available, evidence? }` → 200 updated `Resource`. The app changes nothing until this returns |
| `getResourcePlan` | GET `/ngo/resource-plan` | ngo | Current `ResourcePlan` for the caller's NGO |
| `requestReplan` | POST `/ngo/resource-plan/{id}/replan` | ngo | `{ expectedVersion }` → 200 new `ResourcePlan`; 409 `VERSION_CONFLICT` |
| `allocateManually` | POST `/ngo/resource-plan/{id}/allocations` | ngo | `{ expectedVersion, workOrderId, resourceId, quantity, reason }` → 200 new `ResourcePlan`; 400/403/409/422 as above |

Example rejection:

```json
HTTP 422
{ "error": { "code": "RESOURCE_STALE", "message": "Generator × 1 missed its check-in and cannot be allocated." } }
```

### Photo upload (unresolved backend dependency)

The app uploads the camera photo first, then sends only `photoUrl`. Proposed:
`POST /evidence/upload-url` → `{ uploadUrl, photoUrl, expiresAt }` (presigned PUT), then PUT the
JPEG to `uploadUrl`. Size/type limits, bucket and retention are backend decisions. Until this
exists, `httpApi.uploadEvidencePhoto` is not implemented and mock mode returns a
`simulated-upload://` URL. No AWS credentials or bucket names are in the app.

### Privacy and access

- Contributor GPS, photos and contact go only to the backend and the owning NGO's staff. They are
  never included in public responses, alerts, logs or analytics.
- Device GPS may be inaccurate or spoofed and photos may be reused; the NGO can mark evidence as
  doubtful (`evidence.reviewNote`) and the backend may keep the resource ineligible.
- Sign-in codes are shown once to the approving NGO and never stored by the app.
- The UI hides actions by role for convenience only; every operation above must be authorized by
  the backend.

### Assumptions (smallest reversible choices; please confirm)

1. **Check-in cadence** comes from `ResourceTypePolicy`. Mock defaults (boat 5 h, food 24 h, …)
   live only in `src/fixtures/sample-contributors.ts`.
2. **Missed check-ins:** the backend's `freshness`, `statusReason` and `checkInDueAt` govern. The
   app adds no grace period and does not turn `DUE` into `STALE` itself.
3. **Photo storage:** isolated behind `uploadEvidencePhoto` (see above).
4. **Replanning:** previous versions are kept by the backend. Proposed deterministic rule (used by
   the mock): on replan, AUTO allocations are recomputed; MANUAL allocations are carried forward
   only while their resource stays eligible, otherwise dropped with an entry in `notes`. Every
   change increments `version`; writes carry `expectedVersion` to prevent lost updates.
5. **Ownership:** a contributor's resources belong to the NGO that approved them; no cross-NGO
   sharing unless the backend adds it.
6. **Credential delivery:** credentials go to the NGO once, which passes them on. Direct delivery
   to the contributor (SMS/email) is an open question.

## Relations and IDs (PROPOSED)

All items in this section are **PROPOSED**. One data model links every role's view; the app
refers to records only by these IDs and re-reads after every action.

```
Ngo(id, ngoCode, serviceArea)
 ├─< Incident(id)                     incidents are scoped to NGOs by area (backend-side)
 │    └─< ResourcePlan(id, incidentId, version, status)
 │         └─< Allocation(id, workOrderId, resourceId, quantity, source)
 │                └─> WorkOrder/Task(id, incidentId, planId, assignedWorkerId)
 │                        └─> NgoMember/FieldWorker(id, ngoId, kind)
 ├─< Contributor(contributorId, ngoId)
 │    └─< Resource(id, contributorId, ngoId)
 └─< NgoMember(id, ngoId)
Task ─< Evidence(id, subjectType: 'TASK', subjectId)
Resource ─< Evidence(id, subjectType: 'RESOURCE', subjectId)
Contributor ─< Instruction(id, contributorId, resourceId, taskId, planId, planVersion)
```

| Entity | ID example | Key foreign keys |
|---|---|---|
| Ngo | `ngo-drn-india` | — |
| Incident | `INC-2026-081` | (scoped to NGO by area) |
| ResourcePlan | `plan-…` | `ngoId`, `incidentId` |
| Allocation | `alloc-…` | `workOrderId`, `resourceId` |
| WorkOrder | `INT-101` | `incidentId`, `planId?`, `assignedWorkerId?` |
| NgoMember | `mem-001` (sign-in `workerId`) | `ngoId`, `teamId?` |
| Contributor | `SAMPLE-C-0001` | `ngoId` |
| Resource | `res-…` | `contributorId`, `ngoId`, `evidenceIds[]` |
| Evidence | `ev-…` | `subjectType`, `subjectId` |
| Instruction | `ins-…` | `contributorId`, `resourceId`, `taskId`, `planId` |

Additions:

```ts
interface ResourcePlan {
  incidentId: string;
  status: 'PROPOSED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED';
  replanSuggested?: boolean;     // backend flag
  replanReasons?: string[];      // e.g. task problem, missed check-in
  approvedAt?: string;
  approvedBy?: { name: string; kind: 'SYSTEM' | 'NGO' };
}
interface WorkOrder { planId?: string; publishedAt?: string; evidenceIds?: string[] }
interface EvidenceRecord {
  id: string; subjectType: 'TASK' | 'RESOURCE'; subjectId: string;
  gps?: GpsReading; photoUrl?: string; note?: string; capturedAt: string; unverified: boolean;
}
interface Instruction {          // what a contributor must do for an approved plan
  id: string; contributorId: string; resourceId: string; resourceLabel: string;
  taskId: string; planId: string; planVersion: number;
  where: string; what: string; deadline?: string; ngoName: string; issuedAt: string;
}
```

| Operation | Method / path | Who | Notes |
|---|---|---|---|
| `getResourcePlans` | GET `/ngo/resource-plans` | ngo | One plan per incident in the NGO's area |
| `getResourcePlan` | GET `/ngo/resource-plans?incidentId=` | ngo | |
| `approvePlan` | POST `/ngo/resource-plans/{id}/approve` | ngo | `{ expectedVersion }`; 409 `VERSION_CONFLICT`, 422 `RESOURCE_INELIGIBLE` if an allocated resource is no longer eligible. Publishes tasks and instructions |
| `getMyInstructions` | GET `/contributors/me/instructions` | contributor | Instructions from approved plans |
| `allocateManually` | (above) | ngo | Also 422 `OVER_ALLOCATED` when the resource's quantity is already used elsewhere in the plan; 400 `INVALID_TASK` when the task is not in the plan's incident |

### Second linking pass (PROPOSED)

```
Ngo ─< NgoMessage(id, ngoId, eventId, incidentId?)
Ngo ─< NgoUpdate(id, ngoId, eventId, incidentId?, status)      public when PUBLISHED
PublicAlert(eventId) ─> Incident(incidentId)                    0..1, backend-maintained link
NgoApplication(id, area, status) ─> Ngo(id, status: ACTIVE | SUSPENDED) on approval
VolunteerApplication(id, ngoId) ─> NgoMember(id = mem-{applicationId}, kind: VOLUNTEER) on approval
ContributorApplication(id, ngoId) ─> Contributor(contributorId, ngoId) on approval
```

- `NgoUpdate.incidentId` is set by the backend from the alert the update is about, so the public
  alert page and the ops incident show the same updates.
- `GET /alerts/{eventId}/updates` (public) → published `NgoUpdate[]` for that alert or its linked
  incident. `GET /alerts/{eventId}/incident` (staff) → `{ incidentId } | null`. Both PROPOSED.
- `GET /ngos?status=APPROVED` (public verified list) includes NGOs as soon as the authority
  approves them and drops suspended ones.

### Expected backend side effects (simulated in mock mode)

Mock mode imitates these in `src/services/mock/` only, labelled "Simulated". Screens never
implement them.

1. **Task change** (assign, acknowledge, start, problem, complete, verify): the plan status
   follows its tasks (`IN_PROGRESS`, `COMPLETED`); a problem or failure sets `replanSuggested`
   with a reason.
2. **Missed check-in:** when `checkInDueAt` passes without a check-in, the resource becomes
   `STALE` and ineligible, and every plan allocating it gets `replanSuggested`.
3. **Contributor revoked:** their resources become ineligible and plans using them are flagged.
4. **Plan change** (replan or manual allocation): new `version`, status back to `PROPOSED`;
   the previous version is kept for audit.
5. **NGO approval:** status `APPROVED`; each allocated task gets `planId` + `publishedAt` and a
   history entry; each allocated resource's contributor gets an `Instruction`. A new approved
   version replaces that plan's earlier instructions.
6. **Volunteer / contributor approval:** creates the worker (`kind: VOLUNTEER`) or contributor
   account in the approving NGO; revoke disables it and removes the contributor's resources from
   plans.
7. **NGO approval by the authority** (or `createNgo`): the NGO becomes `ACTIVE`, appears in the
   public verified list, and gets a plan for each incident in its area. Reject/suspend: `SUSPENDED`,
   removed from the public list, its plans flagged.

## Open questions for the backend

1. Auth mechanism and token lifetime; how roles are assigned.
2. Live updates: polling interval, SSE, or push? (App will poll until told otherwise.)
3. Evidence upload: presigned S3 URL flow and size/type limits.
4. Who triggers reassignment (scheduler on ack timeout?) and how the app learns of it.
5. Rate-limit policy for public messages.
6. Whether resource `distanceKm` is computed server-side per incident.
7. Worker credentials: temporary password policy, expiry, and lockout after failed sign-ins.
8. OTP: code length, expiry, resend limits, and which SMS/email provider.
9. Offer matching: how and when offers are matched, and how the citizen is told.
10. Push notifications: provider (Expo push?) and how device tokens are registered.
11. Authority final verification: which authority role signs off, and in which screen (the app
    currently only displays its status).
12. Eligibility checks for volunteers: which checks run (ID, certificates) and how reasons are worded.
13. Contributor credential delivery (via NGO, SMS or email) and sign-in code expiry.
14. Evidence upload: presigned URL flow, limits and retention.
15. Resource freshness policy per type and what happens on a missed check-in.
