# AI Session Context — PhysioLens

> **Read this file first.** It gives you everything you need to understand the project, codebase, architecture, conventions, and current state before doing any work.

---

## 1. What This Project Is

**PhysioLens** — a web-based platform that helps physiotherapists, chiropractors, and sports medicine clinicians capture Range-of-Motion (ROM) measurements using computer vision and generate structured clinical exam notes automatically.

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
- **Browser-side CV pipeline** — MediaPipe Pose landmark detection running entirely in-browser (edge processing)
- **Pluggable vision strategies** — auto-detect (body part + movement recognition) and guided capture modes
- **Dual-camera support** — desktop webcam as primary + phone as secondary camera via QR code pairing over WebRTC
- **Real-time ROM measurement** — 3D landmark angles with temporal filtering and confidence scoring
- **Normative ROM data** — 46 entries (AMA6/AAOS) for shoulder, elbow, knee, hip; automatic comparison and deficit classification
- **Structured clinical note generation** — auto-generated notes with joint groups, deficit summaries, and measurement tables
- **AI-powered interpretation** — LLM analysis (OpenAI GPT-4o / Anthropic Claude) with clinical recommendations
- **Clinical special tests** — database of 23 physical exam tests (shoulder/knee/hip) recommended based on observed deficits
- **Multi-format export** — copy-to-clipboard (plain text), print/PDF (via browser print), screen view
- Camera setup wizard with lighting/distance checks
- Session history and audit trail (backend API)

### V1.1 (Future — Enhanced Workflow)
- NLP summarization service (Python worker — skeleton exists)
- Guided patient self-assessment mode (self-guided page exists as shell)
- Clinician approval queue for remotely collected sessions
- Movement-quality checks and retake prompts
- Additional joint support (wrist, ankle, cervical spine)
- PDF export via server-side generation (replacing browser print)

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Monorepo (@physiolens/root)                      │
│  pnpm 9.15 + Turborepo 2.8 workspace                            │
│                                                                  │
│  apps/                                                           │
│  ├── web/        — Next.js 15 + React 19 (clinician UI)         │
│  │   ├── src/lib/cv/          — Browser-side CV pipeline        │
│  │   ├── src/lib/strategies/  — Pluggable vision strategies     │
│  │   ├── src/lib/interpretation/ — LLM client + clinical tests  │
│  │   ├── src/lib/rom-utils.ts    — Normative enrichment         │
│  │   ├── src/lib/note-generator.ts — Clinical note builder      │
│  │   └── src/app/api/interpret/   — Server-side LLM route       │
│  └── api/        — Express 4 (TypeScript, REST API)             │
│                                                                  │
│  packages/                                                       │
│  └── shared-types/ — Zod schemas + clinical normative data      │
│                                                                  │
│  services/                                                       │
│  ├── cv/         — FastAPI (Python 3.11) — pose/angle pipeline  │
│  ├── nlp/        — FastAPI (Python 3.11) — note summarization   │
│  └── signaling/  — WebSocket signaling server (phone pairing)   │
│                                                                  │
│  docs/           — Planning, legal, security, release docs       │
└──────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 15, React 19, TypeScript | App Router, Framer Motion, Lucide icons |
| **Browser CV** | MediaPipe Pose (in-browser) | `worldLandmarks` (3D) + `landmarks` (2D), edge processing |
| **Vision Strategies** | Auto-detect + Guided | Pluggable strategy pattern with registry |
| **Dual Camera** | WebRTC + WebSocket signaling | Phone as secondary camera via QR pairing |
| **LLM Integration** | OpenAI GPT-4o / Anthropic Claude | Server-side via Next.js API route, JSON structured output |
| **Backend API** | Express 4, TypeScript | Modular monolith, JWT auth, Zod validation |
| **CV Service** | FastAPI, Python 3.11, NumPy | Pose landmark → angle computation (standalone) |
| **NLP Service** | FastAPI, Python 3.11 | Stub — V1.1 scope |
| **Signaling** | ws (WebSocket), Node.js | Port 4001 — relays WebRTC offer/answer/ICE |
| **Shared Types** | Zod schemas, TypeScript | Domain contracts + 46 normative ROM ranges |
| **Build** | Turborepo, pnpm workspaces | `turbo run build/test/lint` |
| **Testing** | Vitest (TS), pytest (Python) | 29 web tests + API/CV/NLP tests |
| **Linting** | ESLint 9 flat config (strict), Ruff | Max cognitive complexity 15, max nesting 4 |
| **Target DB** | PostgreSQL (planned) | Currently **in-memory Maps** as placeholders |
| **Target Infra** | AWS managed services | Not yet provisioned |

### Package Names
- `@physiolens/root` — monorepo root
- `@physiolens/api` — backend API
- `@physiolens/web` — frontend web app
- `@physiolens/shared-types` — shared Zod domain schemas
- `physiolens-cv-worker` — Python CV service
- `physiolens-nlp-worker` — Python NLP service

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

## 6. CV Pipeline

### 6a. Browser-Side CV (Primary — `apps/web/src/lib/cv/`)

The primary CV pipeline runs **entirely in the browser** using MediaPipe Pose. No server round-trip for measurement.

| Module | Purpose |
|--------|---------|
| `pose-estimator.ts` | MediaPipe Pose wrapper, captures `worldLandmarks` (3D) and `landmarks` (2D) |
| `body-detector.ts` | Identifies which body part is visible in frame |
| `movement-detector.ts` | Detects which movement is being performed |
| `joint-router.ts` | Maps (joint, movement, side) → landmark triple indices; defaults to 3D (`prefer3D = true`) |
| `angle-calculator.ts` | Computes angle at joint center from 3 landmarks; supports 2D + 3D + plane projection |
| `temporal-filter.ts` | Smooths noisy per-frame angles with rolling window |
| `landmark-fusion.ts` | Fuses landmarks from two cameras (desktop + phone); `isSecondaryUseful()` decides blend weight |

### 6b. Python CV Service (Standalone — `services/cv/`)

`POST /api/v1/pipeline/measure` — compute ROM angle from pre-extracted landmarks.

Used for batch processing or server-side validation. Same algorithm as browser pipeline but in Python/NumPy.

### 6c. Vision Strategies (`apps/web/src/lib/strategies/`)

Pluggable capture modes registered in `vision-strategy-registry.ts`:

| Strategy | File | Behavior |
|----------|------|---------|
| `auto-detect` | `auto-detect-strategy.tsx` | Detects body part + movement automatically, streams measurements |
| `guided` | `guided-strategy.tsx` | Step-by-step prompts for specific joint/movement combinations |

Registry auto-detects best strategy based on device capabilities.

### 6d. Dual Camera + Signaling

| Component | Location | Port |
|-----------|----------|------|
| Signaling server | `services/signaling/server.js` | 4001 |
| Phone remote page | `apps/web/src/app/camera/remote/page.tsx` | — |
| Phone link + QR | `components/capture/PhoneCameraLink.tsx` | — |
| Landmark fusion | `src/lib/cv/landmark-fusion.ts` | — |

Flow: Desktop generates QR code → phone scans → WebSocket signaling exchanges WebRTC offer/answer/ICE → phone streams video → desktop runs dual-camera fusion.

---

## 7. Frontend (Next.js Web App)

**Location:** `apps/web/`
**Dev port:** `4500` (NEVER 3000 — reserved for other project)

### Pages
| Page | Path | Purpose |
|------|------|---------|
| Dashboard | `/` | Stats, recent sessions, quick actions |
| New Session | `/sessions/new` | 3-phase: setup → capture/results → clinical note |
| Phone Remote | `/camera/remote` | Phone camera page for dual-camera capture |
| Self-Guided | `/exam/self-guided` | Patient self-assessment (shell — V1.1) |

### Key Components

**Capture (`components/capture/`):**
| Component | Purpose |
|-----------|---------|
| `CameraSetupWizard.tsx` | Multi-step wizard: joint/body selection → camera setup → phone pairing (QR) |
| `MeasurementPanel.tsx` | Enriched ROM display with normative comparison, status badges, progress bars |
| `PhoneCameraLink.tsx` | QR code generation for phone camera pairing |
| `LiveRomCapture.tsx` | Real-time ROM capture with pose overlay |
| `DualFeedView.tsx` | Side-by-side desktop + phone camera display |
| `WebcamCapture.tsx` | Single webcam feed with canvas overlay |
| `GuidedCaptureFlow.tsx` | Step-by-step guided capture flow |
| `PoseOverlay.tsx` | Landmark skeleton rendering on video feed |

**Notes (`components/notes/`):**
| Component | Purpose |
|-----------|---------|
| `NoteRenderer.tsx` | Rich clinical note display with export (copy/print) and AI interpretation button |
| `NoteEditor.tsx` | Legacy note block editor |

**Layout (`components/layout/`):** `Sidebar.tsx`, `TopBar.tsx`

### Hooks
| Hook | Purpose |
|------|---------|
| `useCamera.ts` | Camera stream management |
| `usePoseDetection.ts` | MediaPipe Pose integration |

### Server-Side Routes (Next.js API)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/interpret` | POST | LLM interpretation — sends enriched measurements to OpenAI/Claude, returns interpretation + recommendations + clinical test recommendations |

### Interpretation Pipeline (`src/lib/interpretation/`)
| Module | Purpose |
|--------|---------|
| `clinical-tests.ts` | 23 clinical special tests (8 shoulder, 8 knee, 7 hip) with trigger movements |
| `system-prompt.ts` | MSK system prompt instructing LLM for JSON output |
| `prompt-builder.ts` | Builds user prompt from measurements grouped by joint |
| `llm-client.ts` | Unified LLM client — auto-detects OpenAI/Anthropic from env vars |

### ROM Processing (`src/lib/`)
| Module | Purpose |
|--------|---------|
| `rom-utils.ts` | `filterMaxRom()` → `enrichWithNormative()` → `classifyStatus()` pipeline |
| `note-generator.ts` | Transforms `EnrichedMeasurement[]` into `GeneratedNote` with typed sections |
| `vision-strategy-registry.ts` | Strategy pattern registry for capture modes |

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
Active development branch: **`feat/vision-auto-detect`** (branched from `main`)

### Status: MVP v0.1.0 Complete ✅
**All 5 core phases complete** — February 8, 2026
- 29/29 tests passing
- TypeScript: 0 compilation errors
- All infrastructure documentation updated

### Completed Phases

**Phase 0 — Monorepo Scaffold** ✅ (13 tasks, committed)
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

**Phase 1 — Browser CV Pipeline** ✅ (committed `358f710` + `a96a2b5` + `93a7738`)
- Pluggable vision strategy architecture with auto-detect
- MediaPipe Pose integration (pose-estimator, angle-calculator, joint-router)
- Body detector, movement detector, temporal filter
- Camera capture hooks (`useCamera`, `usePoseDetection`)
- Calibration and streaming support
- Landmark triples for 3D angle computation
- Plane projection for accurate ROM measurement

**Phase 2-5 — MVP Core Features** ✅ (committed February 8, 2026)
| Feature | Implementation | Status |
|---------|---------------|--------|
| **3D Dual-Camera Capture** | WebRTC signaling + QR pairing + landmark fusion | ✅ Complete |
| **Max ROM Filtering** | `filterMaxRom()` selects highest per joint/movement | ✅ Complete |
| **Clinical Notes** | Note generator + NoteRenderer + print CSS | ✅ Complete |
| **AI Interpretation** | LLM client (OpenAI/Anthropic) + `/api/interpret` | ✅ Complete |
| **Special Tests DB** | 23 tests (shoulder/knee/hip) with recommendations | ✅ Complete |

**Key Implementation Files:**
- `rom-utils.ts` — filterMaxRom, enrichWithNormative, classifyStatus
- `MeasurementPanel.tsx` — normative comparison with progress bars
- `PhoneCameraLink.tsx` + `signaling/server.mjs` — QR pairing
- `landmark-fusion.ts` — dual-camera 3D fusion
- `note-generator.ts` — clinical note builder
- `NoteRenderer.tsx` — rich display + copy/print + AI button
- `globals.css` — @media print rules
- `interpretation/` — clinical-tests, system-prompt, llm-client
- `api/interpret/route.ts` — server-side LLM endpoint
- `sessions/new/page.tsx` — 3-phase session flow
- `.env.local.example` — API keys, signaling port config
- `vitest.config.ts` — @/ path alias for tests

**Test Status: ✅ 29/29 web tests passing** | ✅ TypeScript compiles clean (0 errors)

### Key Schemas (Frontned-Side)

| Type | Location | Fields |
|------|----------|---------|
| `CapturedMeasurement` | capture types | `joint`, `movement`, `side`, `romDegrees`, `confidence` (0-1), `timestamp` (number) |
| `EnrichedMeasurement` | `rom-utils.ts` | extends CapturedMeasurement + `normalRomDegrees`, `percentOfNormal`, `deficitDegrees`, `withinNormal`, `status` |
| `NoteSection` | `note-generator.ts` | `id`, `type` (header/joint_group/summary/interpretation/recommendations/disclaimer), `title`, `content`, `measurements?` |
| `GeneratedNote` | `note-generator.ts` | `sections`, `generatedAt`, `measurementCount`, `deficitCount`, `jointsCovered` |

### Known Limitations (MVP v0.1.0)
- **Database:** API repositories use **in-memory `Map`s** — PostgreSQL schemas ready, not integrated
- **Authentication:** Infrastructure implemented but **not enforced** (development mode)
- **PDF export:** Uses browser print (Cmd/Ctrl+P) — server-side PDF generation planned for v1.1
- **NLP service:** Skeleton only (health endpoint) — V1.1 scope
- **Environments:** Local development only — no staging/prod yet
- **CI/CD:** No GitHub Actions pipeline yet
- **SSO/MFA:** Not implemented — basic email/password only
- **Patient mode:** V1.1 scope (shell page exists)
- **Feature flags:** Not implemented
- **WebRTC signaling:** Runs separately on port 4001 — needs production deployment strategy

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
cd apps/web && pnpm dev -p 4500   # Next.js on port 4500 (NEVER 3000)

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
│   └── web/
│       ├── .env.local.example        # API keys (OPENAI/ANTHROPIC), port config
│       ├── vitest.config.ts          # Vitest with @/ path alias
│       └── src/
│           ├── app/
│           │   ├── layout.tsx            # Root layout (sidebar + topbar)
│           │   ├── page.tsx              # Dashboard home page
│           │   ├── globals.css           # Theme vars + @media print rules
│           │   ├── sessions/new/page.tsx # 3-phase session: setup → results → note
│           │   ├── camera/remote/page.tsx # Phone remote camera page
│           │   ├── exam/self-guided/    # Patient self-assessment (shell)
│           │   └── api/
│           │       └── interpret/route.ts # POST — LLM interpretation endpoint
│           ├── components/
│           │   ├── __tests__/
│           │   │   └── capture-flow.test.tsx # 29 tests (wizard, panel, note)
│           │   ├── capture/
│           │   │   ├── CameraSetupWizard.tsx  # Multi-step wizard + phone_pair
│           │   │   ├── MeasurementPanel.tsx   # Enriched ROM with normative comparison
│           │   │   ├── PhoneCameraLink.tsx    # QR code for phone pairing
│           │   │   ├── LiveRomCapture.tsx     # Real-time capture
│           │   │   ├── DualFeedView.tsx       # Dual camera display
│           │   │   ├── WebcamCapture.tsx      # Single webcam feed
│           │   │   ├── GuidedCaptureFlow.tsx  # Guided step-by-step capture
│           │   │   └── PoseOverlay.tsx        # Skeleton overlay on video
│           │   ├── notes/
│           │   │   ├── NoteRenderer.tsx       # Rich note display + export + AI button
│           │   │   └── NoteEditor.tsx         # Legacy note block editor
│           │   └── layout/
│           │       ├── Sidebar.tsx
│           │       └── TopBar.tsx
│           ├── hooks/
│           │   ├── useCamera.ts           # Camera stream management
│           │   └── usePoseDetection.ts    # MediaPipe Pose integration
│           └── lib/
│               ├── rom-utils.ts           # Max ROM filter, normative enrichment
│               ├── note-generator.ts      # Clinical note section builder
│               ├── vision-strategy-registry.ts # Strategy pattern registry
│               ├── cv/
│               │   ├── pose-estimator.ts      # MediaPipe Pose wrapper
│               │   ├── body-detector.ts       # Body part detection
│               │   ├── movement-detector.ts   # Movement identification
│               │   ├── joint-router.ts        # Joint → landmark triple mapping
│               │   ├── angle-calculator.ts    # Angle computation (2D/3D)
│               │   ├── temporal-filter.ts     # Rolling window smoothing
│               │   ├── landmark-fusion.ts     # Dual-camera landmark fusion
│               │   └── __tests__/             # CV unit tests
│               ├── strategies/
│               │   ├── index.ts               # Strategy exports
│               │   ├── auto-detect-strategy.tsx
│               │   └── guided-strategy.tsx
│               └── interpretation/
│                   ├── clinical-tests.ts      # 23 special tests DB
│                   ├── system-prompt.ts       # LLM system prompt
│                   ├── prompt-builder.ts      # User prompt builder
│                   └── llm-client.ts          # OpenAI/Anthropic unified client
├── packages/
│   └── shared-types/src/
│       ├── index.ts                  # Barrel exports
│       ├── session.ts                # Session Zod schemas
│       ├── measurement.ts            # Measurement Zod schemas
│       ├── capture.ts                # CapturedMeasurement type
│       ├── note.ts                   # Note Zod schemas
│       ├── audit.ts                  # Audit event Zod schemas
│       ├── user.ts                   # User/role Zod schemas
│       └── clinical/
│           ├── index.ts              # Clinical data barrel exports
│           ├── joints.ts             # Joint enum/types
│           ├── movements.ts          # Movement types per joint
│           ├── joint-movement-map.ts # Joint → movement mapping
│           ├── normative-ranges.ts   # 46 AMA6/AAOS normative ROM entries
│           ├── landmark-map.ts       # Joint → MediaPipe landmark mapping
│           └── landmark-map.json     # Landmark data (JSON)
├── services/
│   ├── cv/
│   │   ├── pyproject.toml            # Python project config
│   │   └── app/
│   │       ├── main.py               # FastAPI app
│   │       ├── pipeline.py           # Angle computation + quality scoring
│   │       ├── schemas.py            # Pydantic models
│   │       └── routes/               # API routes
│   ├── nlp/
│   │   ├── pyproject.toml
│   │   └── app/main.py               # Skeleton FastAPI app
│   └── signaling/
│       ├── package.json              # ws dependency
│       └── server.js                 # WebSocket signaling (port 4001)
├── docs/
│   ├── planning-v2/                  # 12 comprehensive planning documents
│   ├── legal/                        # Privacy, ToS, BAA, disclaimer templates
│   ├── security/                     # Threat model, security checklist
│   ├── release/                      # Release checklist, go-live runbook
│   └── ops/                          # Support model
├── turbo.json                        # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace package declarations
├── package.json                      # Root scripts & dev dependencies
├── tsconfig.base.json                # Shared TypeScript config
└── AI_CONTEXT.md                     # This file — project context for AI agents
```

---

## 12. Roadmap

### ✅ Completed: MVP v0.1.0 (Phase 0-5)
- [x] Monorepo scaffold with Turborepo + pnpm
- [x] Domain contracts (Zod schemas)
- [x] Express API with JWT auth infrastructure
- [x] Browser-side CV pipeline (MediaPipe)
- [x] Pluggable vision strategies (auto-detect + guided)
- [x] 3D dual-camera via WebRTC + QR pairing
- [x] Max ROM filtering per joint/movement
- [x] Clinical notes with normative ranges
- [x] AI interpretation (OpenAI GPT-4o / Anthropic Claude)
- [x] Clinical special tests database (23 tests)
- [x] Print-ready reports with CSS
- [x] Comprehensive documentation (README, SETUP, API, DEPLOYMENT, Architecture)
- [x] 29 passing tests, 0 TypeScript errors

### 🚧 Phase 6: Production Readiness (Next Priority)
1. **Database Integration** — Enable PostgreSQL persistence (Drizzle ORM schemas ready)
2. **Authentication Enforcement** — Activate JWT middleware on all protected routes
3. **Session Persistence** — Wire frontend session flow to backend API
4. **Rate Limiting** — Implement API rate limits (100 req/min per user)
5. **Input Validation** — Add comprehensive Zod validation on all endpoints
6. **Audit Logging** — Enable immutable audit trail for all sensitive operations
7. **Error Handling** — Standardize error responses and logging
8. **Performance Testing** — Load testing, optimization, caching strategy

### 📋 Phase 7: Hardening & Deployment
9. **CI/CD Pipeline** — GitHub Actions (lint, test, build, deploy)
10. **Environment Setup** — dev → staging → prod with secrets management
11. **Deployment** — Vercel (Next.js) + AWS ECS (API) + RDS (PostgreSQL)
12. **Monitoring** — Datadog/CloudWatch dashboards, alerting
13. **Security Audit** — SAST/DAST scanning, penetration testing
14. **Backup/Restore** — Automated backups, tested restore procedures
15. **Server-side PDF Export** — Replace browser print with proper PDF generation

### 🏥 Phase 8: Pilot Launch
16. **Clinic Onboarding Kit** — Training materials, SOPs, admin guides
17. **Controlled Pilot** — 1-3 clinic deployment
18. **Metrics Collection** — Accuracy validation, time savings, clinician satisfaction
19. **Feedback Loop** — Iteration based on pilot results

### 🚀 Phase 9: V1.1 Enhancements
20. **Additional Joints** — Wrist, ankle, cervical spine
21. **NLP Summarization** — Wire up Python NLP service
22. **Patient Self-Assessment** — Complete self-guided flow
23. **Clinician Approval Queue** — For remotely collected sessions
24. **Session Comparison** — ROM progression charts across visits
25. **Movement Quality Checks** — Real-time feedback and retake prompts
26. **SSO/MFA** — Enterprise authentication
27. **EHR Integration** — FHIR/HL7 export capabilities

---

## 13. Conventions & Rules

### Code Style
- TypeScript: strict mode, ESLint 9 flat config, Prettier
- **ESLint strict rules:** max cognitive complexity 15, max function nesting 4 levels, no nested template literals, no passing functions directly to `.map()` (wrap in arrow), Readonly props required, no multiple `Array#push()` calls, `globalThis` over `window`
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

## 14. Documentation Reference

### Quick Start Guides (Root Directory)
| Doc | Contents |
|-----|----------|
| `README.md` | Project overview, quick start, tech stack, roadmap, status |
| `SETUP.md` | Development environment setup, installation, configuration, troubleshooting |
| `API.md` | Complete API reference, WebRTC signaling, data models, error handling |
| `DEPLOYMENT.md` | Production deployment guide, Docker, Vercel, AWS, monitoring, security |

### Planning Documents (`docs/planning-v2/`)
| Doc | Contents |
|-----|----------|
| `01-product-charter.md` | Vision, scope, success metrics, constraints |
| `02-prd-v1-v1_1.md` | User stories, functional requirements, acceptance criteria |
| `03-architecture-stack.md` | Stack decisions, component boundaries, **Implementation Status v0.1.0** |
| `04-ai-cv-measurement-design.md` | Pipeline steps, algorithm versioning, clinical guardrails |
| `05-security-privacy-compliance.md` | Controls, privacy-by-design, compliance tracks |
| `06-legal-regulatory-doc-pack.md` | Legal artifacts needed, regulatory decision points |
| `07-dev-agent-orchestration.md` | Agent streams, coordination protocol, tooling |
| `08-delivery-roadmap-release-ops.md` | Phase roadmap, release gates, SRE baseline, incident response |
| `09-test-validation-clinical-plan.md` | Test pyramid, clinical validation framework, quality thresholds |
| `10-backlog-implementation-sprints.md` | Epics, sprint sequence, backlog governance |
| `11-open-questions-for-founder.md` | 20 unresolved decisions needing founder input |

### Compliance & Legal (`docs/security/`, `docs/legal/`)
| Doc | Contents |
|-----|----------|
| `SECURITY_BASELINE_CHECKLIST.md` | Security controls checklist |
| `THREAT_MODEL_V1.md` | Threat modeling for HIPAA/SOC2 |
| `PRIVACY_POLICY_TEMPLATE.md` | Privacy policy template |
| `TERMS_OF_SERVICE_TEMPLATE.md` | ToS template |
| `MEDICAL_DISCLAIMER_TEMPLATE.md` | Clinical disclaimer template |
| `BAA_DPA_CHECKLIST.md` | Business Associate Agreement checklist |

### Operations (`docs/release/`, `docs/ops/`)
| Doc | Contents |
|-----|----------|
| `RELEASE_CHECKLIST.md` | Pre-release verification checklist |
| `GO_LIVE_RUNBOOK.md` | Production go-live procedures |
| `SERVICE_SUPPORT_MODEL.md` | Support tiers and escalation |

---

## 15. GitHub Repository

- **Repo:** `Scopion-boop/ROM`
- **Main branch:** `main`
- **Active dev branch:** `feat/vision-auto-detect`
- **Owner:** `@Scopion-boop`
- **Latest commit:** `93a7738` — feat(cv): add auto-detect vision strategy with body/movement detection
- **Status:** MVP v0.1.0 complete (all 5 phases committed), infrastructure docs updated

---

## 16. Quick Orientation Checklist

### For New Developers

**Before starting ANY task:**
1. ✅ Read `AI_CONTEXT.md` (this file) — comprehensive project context
2. ✅ Read `README.md` — project overview and quick start
3. ✅ Read `SETUP.md` — set up your development environment
4. ✅ Review `API.md` — understand API surface and WebRTC signaling
5. ✅ Check `IMPACT_GRAPH.md` — dependency graph showing file relationships

**When working on a task:**
6. ✅ Identify which package your task affects:
   - `apps/web` — Next.js frontend, CV pipeline, UI components
   - `apps/api` — Express backend, auth, repositories
   - `packages/shared-types` — Zod schemas, clinical data
   - `services/cv` — Python CV worker (standalone)
   - `services/nlp` — Python NLP worker (V1.1 scope)
7. ✅ Use `IMPACT_GRAPH.md` to find all related files to review/update
8. ✅ Check existing tests before writing code (`__tests__/` directories)
9. ✅ Run `pnpm test` after changes to verify nothing breaks
10. ✅ Run `pnpm typecheck` to ensure TypeScript compiles
11. ✅ Run `pnpm lint` to verify code style compliance

**Follow these conventions:**
12. ✅ Security rules: org-scoping, audit logging, no PHI in logs
13. ✅ Use existing Zod schemas from `@physiolens/shared-types` for validation
14. ✅ Keep in-memory repos consistent with their interfaces (DB integration pending)
15. ✅ Max cognitive complexity: 15, max nesting: 4 levels
16. ✅ JSDoc comments for all functions
17. ✅ Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

**After completing your change:**
18. ✅ Update `IMPACT_GRAPH.md` if you added/removed files or dependencies
19. ✅ Update relevant documentation (README, API.md, SETUP.md if needed)
20. ✅ Ensure all tests pass: `pnpm test && pnpm typecheck && pnpm lint`

### Quick Command Reference

```bash
# Development
pnpm dev              # Start all services
pnpm --filter @physiolens/web dev -p 4500   # Web app only (port 4500, NEVER 3000)
pnpm --filter @physiolens/api dev           # API only

# Quality Checks
pnpm test             # All tests
pnpm typecheck        # TypeScript compilation
pnpm lint             # ESLint + Prettier

# Build
pnpm build            # Build all packages

# Signaling Server (for dual-camera)
cd apps/web && node src/lib/signaling/server.mjs  # Port 4001
```
