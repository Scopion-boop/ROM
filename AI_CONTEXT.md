# AI Session Context — Musculoskeletal ROM Platform

> **Read this file first.** It gives you everything you need to understand the project, codebase, architecture, conventions, and current state before doing any work.

---

## 1. What This Project Is

**Musculoskeletal ROM Assistant** — a web-based platform that helps physiotherapists, chiropractors, and sports medicine clinicians capture Range-of-Motion (ROM) measurements using computer vision and generate structured clinical exam notes automatically.

### Core Problem
Manual ROM measurement with goniometers is slow, inconsistent, and documentation-heavy. Clinicians lose time to admin overhead and objective progression tracking is poor.

### Core Value Proposition
- Reduce per-exam measurement + note time by ≥40%
- Improve measurement consistency vs visual estimation
- Produce structured, copy-ready clinical notes immediately

### Target Users
- **Primary:** Physiotherapists, chiropractors, orthopedic/sports medicine clinicians
- **Secondary (V1.1):** Nurses in pre-assessment, patients doing guided home ROM checks

### What This Is NOT
- Not a diagnostic tool — outputs are labeled "measurement assistance"
- Not an EHR — no billing, payer workflows, or deep EHR write-back
- Not full-body biomechanical modeling
- Clinician confirmation is required before finalizing any note

---

## 2. Product Scope

### V1 (Current Build Target — Clinical Assisted)
- Single-session guided ROM capture for core joints (shoulder, elbow, knee)
- Camera setup wizard with lighting/distance checks
- Real-time pose landmark detection → joint angle computation
- Confidence scoring, quality flags, and retake prompts
- Auto-generated clinical note blocks (editable by clinician)
- Export: copy-to-clipboard, JSON, PDF (stub), CSV
- Session history and audit trail

### V1.1 (Future — Enhanced Workflow)
- AI summary of full exam text (NLP worker)
- Guided patient self-assessment mode
- Clinician approval queue for remotely collected sessions
- Movement-quality checks and retake prompts

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Monorepo (@rom/root)                  │
│  pnpm 9.15 + Turborepo 2.8 workspace                        │
│                                                              │
│  apps/                                                       │
│  ├── web/     — Next.js 15 + React 19 (clinician UI)        │
│  └── api/     — Express 4 (TypeScript, REST API)            │
│                                                              │
│  packages/                                                   │
│  └── shared-types/  — Zod domain schemas (shared contracts) │
│                                                              │
│  services/                                                   │
│  ├── cv/      — FastAPI (Python 3.11) — pose/angle pipeline │
│  └── nlp/     — FastAPI (Python 3.11) — note summarization  │
│                                                              │
│  docs/        — Planning, legal, security, release docs      │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 15, React 19, TypeScript | App Router, Framer Motion, Lucide icons |
| **Backend API** | Express 4, TypeScript | Modular monolith, JWT auth, Zod validation |
| **CV Service** | FastAPI, Python 3.11, NumPy | Pose landmark → angle computation |
| **NLP Service** | FastAPI, Python 3.11 | Stub — V1.1 scope |
| **Shared Types** | Zod schemas, TypeScript | Domain contracts shared across web + API |
| **Build** | Turborepo, pnpm workspaces | `turbo run build/test/lint` |
| **Testing** | Vitest (TS), pytest (Python) | 83 tests total across all packages |
| **Linting** | ESLint 9 flat config, Ruff (Python) | All packages configured |
| **Target DB** | PostgreSQL (planned) | Currently **in-memory Maps** as placeholders |
| **Target Infra** | AWS managed services | Not yet provisioned |

### Package Names
- `@rom/root` — monorepo root
- `@rom/api` — backend API
- `@rom/web` — frontend web app
- `@rom/shared-types` — shared Zod domain schemas
- `rom-cv-worker` — Python CV service
- `rom-nlp-worker` — Python NLP service

---

## 4. Domain Model & Data Contracts

All domain types are defined as **Zod schemas** in `packages/shared-types/src/`. These are the source of truth.

### Core Entities

| Entity | File | Key Fields |
|--------|------|------------|
| **Session** | `session.ts` | `id`, `organizationId`, `clinicianId`, `patientId?`, `status` (created→capture_in_progress→capture_complete→review→finalized→exported→archived), `joints[]` |
| **Measurement** | `measurement.ts` | `id`, `sessionId`, `joint`, `movement`, `side` (left/right), `romDegrees`, `confidenceScore`, `qualityFlags[]`, `algorithmVersion`, `captureDurationMs` |
| **Note** | `note.ts` | `id`, `sessionId`, `clinicianId`, `status` (draft→review→approved→exported), `blocks[]` (NoteBlock), `summaryText?` |
| **NoteBlock** | `note.ts` | `joint`, `movement`, `side`, `romDegrees`, `confidenceScore`, `qualityNote?`, `clinicianComment?` |
| **AuditEvent** | `audit.ts` | `id`, `action` (enum of ~12 events), `actorId`, `resourceType`, `resourceId`, `metadata?`, `timestamp` |
| **User** | `user.ts` | `id`, `organizationId`, `email`, `displayName`, `role` (clinic_admin/clinician/reviewer/support_readonly) |

### Quality Flags (CV Pipeline)
```
{ code: string, message: string, severity: "info" | "warning" | "error" }
```
Codes: `LOW_VISIBILITY`, `OCCLUSION`

---

## 5. API Surface (Express Backend)

Base path: `/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check |
| `GET` | `/health/ready` | No | Readiness probe |
| `GET` | `/health/metrics` | No | In-process metrics |
| `POST` | `/auth/register` | No | Register user (email, password, orgId, role) → JWT |
| `POST` | `/auth/login` | No | Login → JWT |
| `POST` | `/sessions` | Yes | Create exam session |
| `GET` | `/sessions` | Yes | List sessions (org-scoped) |
| `GET` | `/sessions/:id` | Yes | Get single session |
| `PATCH` | `/sessions/:id/status` | Yes | Update session status |
| `POST` | `/sessions/:sessionId/measurements` | Yes | Record a measurement |
| `GET` | `/sessions/:sessionId/measurements` | Yes | List measurements for session |
| `POST` | `/sessions/:sessionId/notes/generate` | Yes | Generate draft note from measurements |
| `GET` | `/sessions/:sessionId/notes` | Yes | List notes for session |
| `PATCH` | `/notes/:noteId/blocks` | Yes | Edit note blocks |
| `PATCH` | `/notes/:noteId/status` | Yes | Transition note status |
| `GET` | `/notes/:noteId/export/json` | Yes | Export note as JSON |
| `GET` | `/notes/:noteId/export/text` | Yes | Export note as plain text |
| `GET` | `/notes/:noteId/export/pdf` | Yes | PDF export (stub) |
| `GET` | `/sessions/:sessionId/audit` | Yes | Audit trail for session |

### Auth Model
- JWT Bearer tokens (`Authorization: Bearer <token>`)
- Payload: `{ userId, organizationId, role, email }`
- Token expiry: 8 hours
- Passwords: bcrypt with 12 salt rounds
- Middleware: `requireAuth` → `requireRole(...roles)`

---

## 6. CV Pipeline (Python Service)

**Location:** `services/cv/`

### Endpoint
`POST /api/v1/pipeline/measure` — compute ROM angle from landmarks

### Input Schema (`MeasurementRequest`)
```python
{
    "joint": "shoulder",
    "movement": "flexion",
    "side": "left",
    "landmarks": [
        { "x": 0.5, "y": 0.3, "z": 0.0, "visibility": 0.95 },  # proximal
        { "x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.90 },  # joint center
        { "x": 0.5, "y": 0.7, "z": 0.0, "visibility": 0.88 }   # distal
    ],
    "algorithm_version": "v1.0"
}
```

### Pipeline Steps
1. Receive 3 ordered landmarks (proximal, joint center, distal)
2. Compute angle at joint center using 2D vector math
3. Assess quality (visibility thresholds → `LOW_VISIBILITY`, `OCCLUSION` flags)
4. Calculate confidence from mean visibility (halved if errors present)
5. Return `MeasurementResponse` with `rom_degrees`, `confidence_score`, `quality_flags`

---

## 7. Frontend (Next.js Web App)

**Location:** `apps/web/`

### Pages
- `/` — Dashboard with stats, recent sessions, quick actions
- `/sessions/new` — New session creation page

### Components
- `components/capture/CameraSetupWizard.tsx` — Camera readiness wizard (lighting, distance, framing)
- `components/capture/MeasurementPanel.tsx` — Live measurement display during capture
- `components/notes/NoteEditor.tsx` — Editable note block viewer/editor
- `components/layout/Sidebar.tsx` — App navigation sidebar
- `components/layout/TopBar.tsx` — Top navigation bar

### Styling
- CSS variables for theme (defined in `globals.css`)
- Framer Motion for animations
- Inter font family
- Responsive layout with sidebar

---

## 8. Security & Compliance

### Implemented Controls
- Helmet security headers
- CORS enabled
- Rate limiting: 100 requests/minute per IP
- Custom security headers middleware
- JWT auth with bcrypt password hashing
- Organization-scoped data access (all queries filter by `organizationId`)
- Audit logging (append-only immutable event trail)
- PHI-safe structured JSON logging (never logs patient names, measurements, or note content)

### Compliance Posture
- HIPAA-aligned controls from V1
- SOC 2 Type I readiness target during pilot
- Privacy-by-design: minimize PHI, prefer edge processing
- All outputs labeled as "measurement assistance" (not diagnostic claims)
- Clinician confirmation required before finalizing notes

### Documents
- `docs/security/THREAT_MODEL_V1.md` — threat model
- `docs/security/SECURITY_BASELINE_CHECKLIST.md`
- `docs/legal/` — Privacy policy, ToS, BAA, medical disclaimer templates (all have `[TBD]` placeholders for counsel review)

---

## 9. Current State & What's Built

### Branch
Active development branch: **`feat/platform-monorepo-scaffold`**

### Completed Tasks (13/13 from Phase 0 scaffold)
| # | Task | Tests |
|---|------|-------|
| 1 | Monorepo scaffold (pnpm + Turbo) | — |
| 2 | Domain contracts (Zod schemas) | 13 |
| 3 | Auth & RBAC (JWT, bcrypt, role middleware) | 8 |
| 4 | Session & Measurement CRUD APIs | 11 |
| 5 | Note generation service | 7 |
| 6 | Web capture UI shell (wizard, panel, editor) | 9 |
| 7 | CV pipeline worker (angle computation) | 7 |
| 8 | Export & audit trail | 6 |
| 9 | Security baseline (rate limiting, headers) | 11 |
| 10 | Observability & logging | 7 |
| 11 | Legal/compliance document pack | — |
| 12 | Pilot release artifacts | — |
| 13 | E2E verification (all green) | — |

**Total: 83 tests passing** (13 shared-types + 53 API + 9 web + 7 CV + 1 NLP)

### Key Limitations (Still Placeholder / TODO)
- **Database:** All repositories use **in-memory `Map`s** — PostgreSQL integration needed
- **PDF export:** Returns stub response, real generation deferred
- **CV integration:** Browser-side pose inference (MediaPipe/TensorFlow.js) not integrated with frontend — pipeline tested in isolation
- **NLP service:** Skeleton only (health endpoint) — V1.1 scope
- **Environments:** No staging/prod — local dev only
- **CI/CD:** No GitHub Actions pipeline yet
- **Real-time capture:** Frontend components are UI shells — not wired to camera/WebRTC or API calls yet
- **SSO/MFA:** Not implemented — basic email/password only
- **File storage:** No object store for artifacts
- **Patient mode:** V1.1 scope
- **Feature flags:** Not implemented

---

## 10. How to Work in This Codebase

### Prerequisites
- Node.js ≥ 20
- pnpm ≥ 9.0
- Python ≥ 3.11 (for CV/NLP services)

### Install & Run
```bash
# Install all dependencies
pnpm install

# Run all tests
pnpm test         # or: turbo run test

# Lint all packages
pnpm lint         # or: turbo run lint

# Type check
pnpm typecheck

# Dev servers
pnpm dev          # starts all dev servers via Turbo

# Individual package dev
cd apps/api && pnpm dev    # API on default port
cd apps/web && pnpm dev    # Next.js on port 3000

# Python services
cd services/cv && pip install -e ".[dev]" && pytest
cd services/nlp && pip install -e ".[dev]" && pytest
```

### Key Commands
```bash
turbo run build     # Build all packages
turbo run test      # Test all packages
turbo run lint      # Lint all packages
turbo run typecheck # Type check all TS packages
```

### Adding a New API Route
1. Create route file in `apps/api/src/routes/`
2. Use `requireAuth` middleware for protected routes
3. Access user context via `req.user` (contains `userId`, `organizationId`, `role`)
4. Scope all data queries by `organizationId`
5. Add audit logging for sensitive operations via `recordEvent()`
6. Register the router in `apps/api/src/app.ts`
7. Write tests in `apps/api/src/__tests__/`

### Adding a New Component
1. Create component in `apps/web/src/components/<domain>/`
2. Use the CSS variable theming system from `globals.css`
3. Write tests in `apps/web/src/components/__tests__/`

### Modifying Domain Contracts
1. Edit Zod schemas in `packages/shared-types/src/`
2. Update barrel exports in `packages/shared-types/src/index.ts`
3. Run `turbo run build` — shared-types must build before dependents
4. Update affected API routes and frontend consumers
5. Update tests

---

## 11. File Structure Quick Reference

```
/
├── apps/
│   ├── api/src/
│   │   ├── app.ts                    # Express app setup & middleware
│   │   ├── server.ts                 # Server entry point
│   │   ├── auth/jwt.ts               # JWT sign/verify, bcrypt helpers
│   │   ├── middleware/
│   │   │   ├── authz.ts              # requireAuth, requireRole middleware
│   │   │   ├── rate-limit.ts         # Rate limiting (100 req/min)
│   │   │   ├── security-headers.ts   # Security headers middleware
│   │   │   └── request-logger.ts     # Request logging middleware
│   │   ├── repositories/
│   │   │   ├── session-repo.ts       # Session CRUD (in-memory)
│   │   │   ├── measurement-repo.ts   # Measurement CRUD (in-memory)
│   │   │   └── audit-repo.ts         # Audit event storage
│   │   ├── routes/
│   │   │   ├── auth.ts               # /api/auth (register, login)
│   │   │   ├── sessions.ts           # /api/sessions CRUD
│   │   │   ├── measurements.ts       # /api/sessions/:id/measurements
│   │   │   ├── notes.ts              # /api/sessions/:id/notes + note ops
│   │   │   ├── export.ts             # /api/notes/:id/export + audit trail
│   │   │   └── health.ts             # /api/health, /ready, /metrics
│   │   ├── services/
│   │   │   ├── note-builder.ts       # Note generation from measurements
│   │   │   └── audit-log.ts          # Immutable audit event log
│   │   └── observability/
│   │       ├── logger.ts             # Structured JSON logger (PHI-safe)
│   │       └── metrics.ts            # In-process counters
│   └── web/src/
│       ├── app/
│       │   ├── layout.tsx            # Root layout (sidebar + topbar)
│       │   ├── page.tsx              # Dashboard home page
│       │   └── sessions/new/page.tsx # New session creation
│       └── components/
│           ├── capture/
│           │   ├── CameraSetupWizard.tsx
│           │   └── MeasurementPanel.tsx
│           ├── notes/NoteEditor.tsx
│           └── layout/
│               ├── Sidebar.tsx
│               └── TopBar.tsx
├── packages/
│   └── shared-types/src/
│       ├── index.ts                  # Barrel exports
│       ├── session.ts                # Session Zod schemas
│       ├── measurement.ts            # Measurement Zod schemas
│       ├── note.ts                   # Note Zod schemas
│       ├── audit.ts                  # Audit event Zod schemas
│       └── user.ts                   # User/role Zod schemas
├── services/
│   ├── cv/
│   │   ├── pyproject.toml            # Python project config
│   │   └── app/
│   │       ├── main.py               # FastAPI app
│   │       ├── pipeline.py           # Angle computation + quality scoring
│   │       ├── schemas.py            # Pydantic models
│   │       └── routes/               # API routes
│   └── nlp/
│       ├── pyproject.toml
│       └── app/main.py               # Skeleton FastAPI app
├── docs/
│   ├── planning-v2/                  # 12 comprehensive planning documents
│   ├── legal/                        # Privacy, ToS, BAA, disclaimer templates
│   ├── security/                     # Threat model, security checklist
│   ├── release/                      # Release checklist, go-live runbook
│   └── ops/                          # Support model
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace package declarations
├── package.json                      # Root scripts & dev dependencies
└── tsconfig.base.json                # Shared TypeScript config
```

---

## 12. Roadmap / What Comes Next

### Phase 1: V1 Core Build (Next Priority)
1. **PostgreSQL integration** — replace all in-memory repos with real DB (Prisma or Drizzle)
2. **Browser-side pose inference** — integrate MediaPipe/TensorFlow.js into web capture flow
3. **Wire frontend to API** — connect CameraSetupWizard, MeasurementPanel, NoteEditor to live endpoints
4. **Real-time capture pipeline** — WebRTC camera feed → pose detection → angle computation → measurement save
5. **Session history UI** — comparison charts across visits
6. **PDF export** — real PDF generation (replacing stub)

### Phase 2: Hardening
7. **CI/CD pipeline** — GitHub Actions for lint, test, build, deploy
8. **Environment setup** — dev → staging → prod with feature flags
9. **SSO/MFA** — replace basic auth
10. **Security verification** — SAST/DAST scanning, pen test
11. **Backup/restore drills**

### Phase 3: Pilot Launch
12. **Clinic onboarding kit** — training, SOP, admin setup
13. **Monitoring dashboard** — Grafana/Datadog
14. **Controlled pilot** at 1-3 clinics
15. **Metrics collection** — accuracy, time savings, satisfaction

### Phase 4: V1.1
16. **NLP summarization** — wire up nlp service
17. **Patient self-assessment** — guided movement mode
18. **Clinician approval queue** — for remote sessions

---

## 13. Conventions & Rules

### Code Style
- TypeScript: strict mode, ESLint 9 flat config, Prettier
- Python: Ruff linting, mypy strict, Python 3.11+
- All functions should have JSDoc/docstring comments
- No `any` types in TypeScript

### Security Rules
- **NEVER** log PHI (patient names, measurement values, note content)
- **ALWAYS** scope data access by `organizationId`
- **ALWAYS** use `requireAuth` on protected endpoints
- **ALWAYS** record audit events for sensitive operations
- Label all AI outputs as "measurement assistance"

### Git Conventions
- Branch naming: `feat/<domain>-<description>`
- Trunk-based with short-lived feature branches
- Conventional commit messages (`feat:`, `fix:`, `chore:`, `docs:`)
- CODEOWNERS gate on security-sensitive paths

### Testing
- Vitest for all TypeScript packages
- pytest for Python services
- Test files: `__tests__/` directories or `*.test.ts` / `test_*.py`
- All PRs must have passing tests before merge

---

## 14. Planning Documents Reference

Comprehensive planning lives in `docs/planning-v2/`:

| Doc | Contents |
|-----|----------|
| `01-product-charter.md` | Vision, scope, success metrics, constraints |
| `02-prd-v1-v1_1.md` | User stories, functional requirements, acceptance criteria |
| `03-architecture-stack.md` | Stack decisions, component boundaries, deployment topology |
| `04-ai-cv-measurement-design.md` | Pipeline steps, algorithm versioning, clinical guardrails |
| `05-security-privacy-compliance.md` | Controls, privacy-by-design, compliance tracks |
| `06-legal-regulatory-doc-pack.md` | Legal artifacts needed, regulatory decision points |
| `07-dev-agent-orchestration.md` | Agent streams, coordination protocol, tooling |
| `08-delivery-roadmap-release-ops.md` | Phase roadmap, release gates, SRE baseline, incident response |
| `09-test-validation-clinical-plan.md` | Test pyramid, clinical validation framework, quality thresholds |
| `10-backlog-implementation-sprints.md` | Epics, sprint sequence, backlog governance |
| `11-open-questions-for-founder.md` | 20 unresolved decisions needing founder input |

---

## 15. GitHub Repository

- **Repo:** `Scopion-boop/ROM`
- **Main branch:** `main`
- **Active dev branch:** `feat/platform-monorepo-scaffold`
- **Owner:** `@Scopion-boop`

---

## 16. Quick Orientation Checklist

When starting a new task:

1. ✅ Read this file (`AI_CONTEXT.md`)
2. ✅ Read `IMPACT_GRAPH.md` — the **live dependency & impact graph** that shows what ripples when you change any file
3. ✅ Check `progress.md` for latest completed work
4. ✅ Identify which package your task affects (`apps/api`, `apps/web`, `packages/shared-types`, `services/cv`, `services/nlp`)
5. ✅ Use the Impact Lookup Tables in `IMPACT_GRAPH.md` to find all files you must also review/update
6. ✅ Check existing tests in that package before writing code
7. ✅ Run `pnpm test` after changes to verify nothing breaks
8. ✅ Follow the security rules (org-scoping, audit logging, no PHI in logs)
9. ✅ Use existing Zod schemas from `@rom/shared-types` for validation
10. ✅ Keep in-memory repos consistent with their interfaces (they'll be replaced with DB later)
11. ✅ **After completing your change:** Update `IMPACT_GRAPH.md` if you added/removed files or dependencies
