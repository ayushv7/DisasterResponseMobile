# API Contract Proposal — Disaster Response Orchestration Network (Floods MVP)

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

`coordinator` and `admin` stay **separate roles** in this contract. The app shows both the same
staff console for now (Ops console + "Approve NGOs"). The backend must still enforce that only
`admin` can call `POST /admin/ngos/{id}/approve` and only `coordinator` performs dispatch actions
unless the backend decides otherwise. Listing registrations uses `GET /ngos?status=PENDING`.

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
