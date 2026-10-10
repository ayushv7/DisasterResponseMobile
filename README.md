# Disaster Response Mobile (Floods MVP)

Expo / React Native app for flood response: public alerts and NGO messaging, NGO operations
(plans, field team, contributors, verification), field worker tasks, contributor resources and
an authority console. The backend (FastAPI + MongoDB Atlas + AWS) is separate and authoritative;
see [`docs/api-contract-proposal.md`](docs/api-contract-proposal.md) (all endpoints **PROPOSED**).

## Setup

Requirements: Node 20+, npm, and Expo Go (SDK 57) on a phone, or an emulator.

```bash
npm install
npx expo start        # scan the QR code with Expo Go
npx tsc --noEmit      # typecheck
npx expo lint         # lint
npm test              # unit tests (jest-expo): sample store and simulated cascades
```

- **Sample mode (default):** with `EXPO_PUBLIC_API_BASE_URL` unset, the app runs on an in-memory
  sample store (`src/services/mock/`). Every sample record, sign-in, upload, plan and
  notification is labelled **Sample** or **Simulated**. Nothing is sent to a server.
- **Live mode:** set `EXPO_PUBLIC_API_BASE_URL` in `.env`. `httpApi` methods throw
  "not implemented" until the backend endpoints exist.
- **Dev tools (development builds only):** Sign in → "Development build: open role switcher".
  Switch between visitor, citizen, NGO, field worker, contributor and authority, and use
  **Reset sample data** to restore the seed (also shows the start screen again).

## Sample sign-ins (sample mode only)

| Role | Where | Credentials |
|---|---|---|
| Visitor | Start screen → Browse alerts | none |
| Citizen | Profile → Sign in to offer help | any phone/email, code `123456` |
| NGO | Sign in | `ngo@sample.org`, any password |
| Authority | Sign in | `admin@sample.org` or `coordinator@sample.org`, any password |
| Field worker | Sign in → Field worker sign-in | NGO code `SAMPLE-DRN`, worker `SAMPLE-W-0001`, any password (first sign-in asks for a new 8+ character password) |
| Contributor | Sign in → Contributor sign-in | `SAMPLE-C-0001` / `SAMPLE-CODE` (`SAMPLE-C-0002` = expired code, `SAMPLE-C-0003` = revoked) |

## 2-minute demo script

Incident → plan → approve → worker acts → problem → replan → verify.

0. **Reset.** Open the dev screen → **Reset sample data**.
1. **Incident (NGO).** Sign in as NGO → **Ops** tab → **Incidents** → *Majuli Island
   (INC-2026-081)*. Note "Incidents near Disaster Relief Network India".
2. **Plan.** Tap **Resource plan for this incident**. Version 1 shows *Replan suggested:
   Generator × 1 is stale* (missed check-in). Tap **Approve and publish**: it is refused because
   that resource is no longer eligible. Tap **Replan**: version 2 drops the generator, with a note.
3. **Approve.** **Approve and publish** → confirm. Toast: tasks published, contributor
   instructions sent. Back in the incident, select **INT-101** → **Accept plan**, then
   **Assign to my field worker…** → *A. Bora*. Do the same for **INT-102**.
4. **Worker acts.** NGO tab → Organization → **Switch to public view**. Sign in →
   **Field worker sign-in** (`SAMPLE-DRN` / `SAMPLE-W-0001`, set a new password). On **Tasks**
   each card shows Where / What / By / NGO and **Search in Maps**. On **INT-102**:
   **Acknowledge** → **Start work** → **Submit completion** (note, optional photo).
5. **Problem.** On **INT-101**: **Acknowledge** → **Start work** → **Report problem**
   (*Route blocked*, "Road washed out").
6. **Replan.** Sign out → sign in as NGO → Ops → **Resource plan**: *Replan suggested: INT-101
   reported a problem*. Tap **Replan**, then **Approve and publish**. On the **Verify** tab,
   the replanning queue has INT-101 for reassignment.
7. **Verify.** On the **Verify** tab, **INT-102** → **Verify**. Its card shows
   *1. NGO check: Verified* and *2. Authority final: Pending* (the authority's step is shown as
   status only for now).

Optional: sign in as contributor `SAMPLE-C-0001` to see *Your assignments* and check-ins
due, or open **Notifications (Simulated)** from Organization / Profile.

## Project layout

- `src/app/`: routes (Expo Router). Role areas: `ops/` (NGO operations, field worker tasks),
  `ngo/`, `authority/`, `contributor/`; public screens at the top level.
- `src/services/api/`: `ApiClient` interface with `mockApi` (sample store) and `httpApi`.
- `src/services/mock/`: the shared sample store and its simulated cascades.
- `src/theme/`: colors, spacing, the 4-size text scale, theme context.
- `src/i18n/strings.ts`: English / Hindi strings for the main demo screens.

## Not yet available

- Real authentication, push notifications, photo upload (presigned URLs) and every backend
  endpoint. See the open questions in the API proposal.
