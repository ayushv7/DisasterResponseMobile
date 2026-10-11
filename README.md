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

- **Live (default):** slices with a real backend (health, incidents, observations) call the
  backend; everything else still runs on the in-memory sample store (`src/services/mock/`) and
  is labelled **Simulated**. The banner shows "Live: … · rest simulated". Without a backend URL
  the live screens say **No backend URL set**; the app never switches to sample data by itself.
- **Sample data:** Settings → Data source → turn on **Use sample data (simulated)**. Every screen
  then uses the sample store at once (no restart) and nothing is sent to a server. Turn it off
  to go back to Live. If the backend is unreachable, live screens also offer
  **Use sample data instead**.
- **Dev tools (development builds only):** Sign in → "Development build: open role switcher".
  Switch between visitor, citizen, NGO, field worker, contributor and authority, and use
  **Reset sample data** to restore the seed (also shows the start screen again).

## Connecting to the local backend

The per-slice switch is in `src/services/api/index.ts` (`LIVE_SLICE_SOURCES`). In Live mode
**health, incidents and observations** come from the backend
(`GET /health/ready`, `/api/v1/flood-events`, `/api/v1/flood-events/{id}`,
`/api/v1/flood-events/{id}/observations`). Everything else, including public area alerts, stays
mock and labelled Simulated.

**Easiest (works in a release APK too):** Settings → Data source → enter the Backend URL, tap
**Test connection**, then **Save URL**. A saved URL overrides the build value and is kept on the
device.

**Or at build time:** create `.env.local` in the project root (git-ignored) with the address **as the device sees it**:

```bash
# Phone on the same Wi-Fi: your computer's LAN IP (find it with `hostname -I`)
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:8000
# Android emulator: 10.0.2.2 is the host machine
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
```

- `localhost` does not work from a phone or emulator: it points at the device itself.
- For a phone, the backend must listen on all interfaces (e.g. `--host 0.0.0.0`) and the port
  must be open in the firewall.
- `EXPO_PUBLIC_*` values are baked in when the bundle is built: after changing `.env.local`, restart
  Expo with a clean cache: `npx expo start -c`. A release APK needs a rebuild.
- Check: the banner should read "Live: health, incidents, observations, sign-in · rest simulated".

**Signing in (Live).** The backend requires a bearer token for everything except `/health/*`.
Staff sign in on the normal Sign in screen with a backend account (`POST /api/v1/auth/login`):
`authority@sample.local` opens the authority area, `ngo1@sample.local` / `ngo2@sample.local`
the NGO area. Field workers use Field worker sign-in (`POST /api/v1/auth/worker-login`, e.g.
NGO code `RIVERAID`, worker `W-001`). The backend's seed script prints new passwords on each run.
The token is kept in memory only: sign in again after restarting the app. Without a backend
sign-in, live screens show **Sign in required**; the dev role switcher does not sign in to the
backend.

## Sample sign-ins (sample mode only)

| Role | Where | Credentials |
|---|---|---|
| Visitor | Start screen → Alerts for my area | none (use location, or pick an area) |
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

Public side: as a visitor, open **My area** and pick *Majuli* to see an Evacuate alert with
what to do, or *East Delhi* for the calm state. East Delhi gets its alert once the authority adds
an NGO serving "Delhi" (Add NGO). Public users only ever see their own area.

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
