# FUHSI ERS Backend

Emergency Response System backend for the FUHSI Health Emergency Service:
**SOS → location → triage → responder → facility → record.**

Node.js + Express + PostgreSQL, plain `pg` (no ORM).

## Setup

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL and JWT_SECRET
createdb fuhsi_ers      # or use an existing Postgres instance
npm run migrate         # applies src/db/schema.sql
npm run dev             # starts on http://localhost:4000
```

## Design principles (carried over from the platform's core rules)

- **Students own their profile and contacts.** `PUT /api/profile/me` and the
  `/api/contacts` routes only ever touch the caller's own records.
- **Clinicians enter/verify clinical information.** Every write to
  `clinical_entries` is mirrored into `clinical_entry_audit` with actor,
  action, and timestamp. Emergency overrides (a responder documenting
  something in the field) require an `overrideReason`.
- **Every incident action is logged.** `incident_logs` is an append-only
  timeline; `incident_locations` is a live location trail for the SOS map.
- **Status transitions are guarded**, not free-form — see
  `VALID_TRANSITIONS` in `src/models/incidentModel.js`:
  `reported → triaged → responder_assigned → dispatched → at_facility → resolved`,
  with `cancelled` reachable from any non-terminal state.

## Auth

JWT bearer tokens. Roles: `student`, `clinician`, `responder`, `admin`.
Send `Authorization: Bearer <token>` on all routes except
`/api/auth/register` and `/api/auth/login`.

## API reference

### Auth
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | public | `role`-specific: students need `matricNumber`, staff need `staffId` |
| POST | `/api/auth/login` | public | returns `{ user, token }` |
| GET | `/api/auth/me` | any | current user |

### Profile (student-owned)
| Method | Route | Access |
|---|---|---|
| GET | `/api/profile/me` | self |
| PUT | `/api/profile/me` | self |
| GET | `/api/profile/:studentId` | clinician/responder/admin |

### Clinical entries (clinician-verified)
| Method | Route | Access |
|---|---|---|
| POST | `/api/clinical-entries` | clinician, responder (override) |
| GET | `/api/clinical-entries/student/:studentId` | self, clinician, responder, admin |
| PATCH | `/api/clinical-entries/:id/verify` | clinician |
| GET | `/api/clinical-entries/:id/audit` | clinician, admin |

### Emergency contacts (student-owned)
| Method | Route | Access |
|---|---|---|
| GET/POST | `/api/contacts` | self |
| PATCH/DELETE | `/api/contacts/:id` | self |

### Facilities
| Method | Route | Access |
|---|---|---|
| GET | `/api/facilities` | any |
| POST | `/api/facilities` | admin |

### Incidents — the ERS core
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/incidents` | student | SOS trigger; finds nearest facility, notifies responders/clinicians + trusted contacts |
| GET | `/api/incidents` | any | students see only their own; `?status=` filter |
| GET | `/api/incidents/:id` | owner or staff | |
| PATCH | `/api/incidents/:id/status` | clinician/responder/admin | body: `{ status, notes?, responderId?, triageNotes? }` |
| POST | `/api/incidents/:id/location` | reporting student | live location ping |
| GET | `/api/incidents/:id/locations` | owner or staff | location trail |
| GET | `/api/incidents/:id/logs` | owner or staff | full timeline |

## Still stubbed / next steps

- `src/models/notificationModel.js` marks notifications `sent` immediately —
  wire it to a real push/SMS/email provider (e.g. Expo push for mobile,
  Termii/Africa's Talking for SMS to trusted contacts).
- No refresh-token flow yet — access tokens are long-lived (`JWT_EXPIRES_IN`).
- No rate limiting on `/api/auth/login` or `POST /api/incidents` — add
  `express-rate-limit` before production deployment.
- Deploy behind HTTPS; the mobile app's `expo-location` and any SMS provider
  will require it.
