# PhysioLens Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and launch V1 of a clinician-focused, AI-assisted ROM capture and note generation web platform, production-ready for a controlled pilot.

**Architecture:** Web-first Next.js app with TypeScript API core, PostgreSQL storage, browser-side pose capture, and isolated AI/CV worker services. Security, compliance, and observability are built into the first release path.

**Tech Stack:** Next.js, TypeScript, Node.js, FastAPI (Python), PostgreSQL, Redis/queue, AWS-managed services, GitHub Actions.

---

### Task 1: Initialize Monorepo and Core Tooling

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`
- Create: `apps/web/`, `apps/api/`, `services/cv/`, `services/nlp/`, `packages/shared-types/`
- Create: `.github/workflows/ci.yml`

**Step 1: Scaffold workspace**
Run: `pnpm init && pnpm add -D turbo typescript eslint prettier`
Expected: workspace files created successfully

**Step 2: Add package boundaries and scripts**
Run: `pnpm -r run lint` (after script creation)
Expected: command resolves all packages (may fail before code exists)

**Step 3: Create CI skeleton**
Run: `git diff -- .github/workflows/ci.yml`
Expected: CI includes install, lint, test, build jobs

**Step 4: Commit**
Run: `git add . && git commit -m "chore: bootstrap monorepo and CI skeleton"`

---

### Task 2: Define Domain Contracts and Shared Types

**Files:**
- Create: `packages/shared-types/src/measurement.ts`
- Create: `packages/shared-types/src/note.ts`
- Create: `packages/shared-types/src/session.ts`
- Create: `packages/shared-types/src/index.ts`
- Test: `packages/shared-types/src/__tests__/schema.test.ts`

**Step 1: Write failing type/schema tests**
Run: `pnpm --filter @physiolens/shared-types test`
Expected: FAIL (missing or incomplete schemas)

**Step 2: Implement shared contracts**
Add explicit schemas for session, measurement, note export payload.

**Step 3: Re-run tests**
Run: `pnpm --filter @physiolens/shared-types test`
Expected: PASS

**Step 4: Commit**
Run: `git add packages/shared-types && git commit -m "feat: add shared domain contracts"`

---

### Task 3: Implement Authentication and RBAC Baseline

**Files:**
- Create: `apps/api/src/auth/`
- Create: `apps/api/src/middleware/authz.ts`
- Create: `apps/api/src/routes/auth.ts`
- Test: `apps/api/src/auth/__tests__/authz.test.ts`

**Step 1: Write failing authz tests**
Run: `pnpm --filter @physiolens/api test authz`
Expected: FAIL for unauthorized role access

**Step 2: Implement minimal auth and role middleware**
Support roles: clinic_admin, clinician, reviewer, support_readonly.

**Step 3: Verify tests**
Run: `pnpm --filter @physiolens/api test authz`
Expected: PASS

**Step 4: Commit**
Run: `git add apps/api/src/auth apps/api/src/middleware apps/api/src/routes/auth.ts && git commit -m "feat: add auth and RBAC baseline"`

---

### Task 4: Build Session and Measurement APIs

**Files:**
- Create: `apps/api/src/routes/sessions.ts`
- Create: `apps/api/src/routes/measurements.ts`
- Create: `apps/api/src/repositories/session-repo.ts`
- Create: `apps/api/src/repositories/measurement-repo.ts`
- Test: `apps/api/src/routes/__tests__/session-measurement.test.ts`

**Step 1: Write failing route tests**
Run: `pnpm --filter @physiolens/api test session-measurement`
Expected: FAIL (routes missing)

**Step 2: Implement CRUD for session and measurement records**
Include validation and organization scoping.

**Step 3: Verify tests**
Run: `pnpm --filter @physiolens/api test session-measurement`
Expected: PASS

**Step 4: Commit**
Run: `git add apps/api/src/routes apps/api/src/repositories && git commit -m "feat: add session and measurement APIs"`

---

### Task 5: Implement Note Generation and Editing API

**Files:**
- Create: `apps/api/src/services/note-builder.ts`
- Create: `apps/api/src/routes/notes.ts`
- Test: `apps/api/src/services/__tests__/note-builder.test.ts`

**Step 1: Write failing note-generation tests**
Run: `pnpm --filter @physiolens/api test note-builder`
Expected: FAIL

**Step 2: Implement deterministic note template engine**
Input: measurements + quality flags; Output: editable note block.

**Step 3: Verify tests**
Run: `pnpm --filter @physiolens/api test note-builder`
Expected: PASS

**Step 4: Commit**
Run: `git add apps/api/src/services apps/api/src/routes/notes.ts && git commit -m "feat: add note generation service"`

---

### Task 6: Build Web Capture Workflow (Clinician UI)

**Files:**
- Create: `apps/web/src/app/sessions/new/page.tsx`
- Create: `apps/web/src/components/capture/CameraSetupWizard.tsx`
- Create: `apps/web/src/components/capture/MeasurementPanel.tsx`
- Create: `apps/web/src/components/notes/NoteEditor.tsx`
- Test: `apps/web/src/components/__tests__/capture-flow.test.tsx`

**Step 1: Write failing UI flow tests**
Run: `pnpm --filter @physiolens/web test capture-flow`
Expected: FAIL

**Step 2: Implement minimal clinician capture and note edit flow**
Camera setup -> movement capture placeholder -> note editor.

**Step 3: Verify tests**
Run: `pnpm --filter @physiolens/web test capture-flow`
Expected: PASS

**Step 4: Commit**
Run: `git add apps/web/src && git commit -m "feat: add clinician capture and note editor flow"`

---

### Task 7: Integrate CV Worker (V1 Algorithm Path)

**Files:**
- Create: `services/cv/app/main.py`
- Create: `services/cv/app/pipeline.py`
- Create: `services/cv/app/schemas.py`
- Test: `services/cv/tests/test_pipeline.py`

**Step 1: Write failing pipeline tests**
Run: `cd services/cv && pytest -q`
Expected: FAIL

**Step 2: Implement minimal pipeline contract**
Input key landmarks, output ROM angle + confidence + quality flags.

**Step 3: Verify tests**
Run: `cd services/cv && pytest -q`
Expected: PASS

**Step 4: Commit**
Run: `git add services/cv && git commit -m "feat: add cv pipeline service skeleton"`

---

### Task 8: Implement Export and Audit Event Trail

**Files:**
- Create: `apps/api/src/routes/export.ts`
- Create: `apps/api/src/services/audit-log.ts`
- Create: `apps/api/src/repositories/audit-repo.ts`
- Test: `apps/api/src/routes/__tests__/export-audit.test.ts`

**Step 1: Write failing export/audit tests**
Run: `pnpm --filter @physiolens/api test export-audit`
Expected: FAIL

**Step 2: Implement copy payload + PDF stub + immutable audit events**
Track note generation, edits, and exports.

**Step 3: Verify tests**
Run: `pnpm --filter @physiolens/api test export-audit`
Expected: PASS

**Step 4: Commit**
Run: `git add apps/api/src/routes/export.ts apps/api/src/services/audit-log.ts apps/api/src/repositories/audit-repo.ts && git commit -m "feat: add export and audit trail"`

---

### Task 9: Enforce Security Baseline in Code and CI

**Files:**
- Create: `apps/api/src/middleware/rate-limit.ts`
- Create: `apps/api/src/middleware/security-headers.ts`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/security/THREAT_MODEL_V1.md`

**Step 1: Add failing security middleware tests**
Run: `pnpm --filter @physiolens/api test security`
Expected: FAIL

**Step 2: Implement middleware and CI scans**
Add dependency audit and static checks into CI workflow.

**Step 3: Verify tests and CI locally**
Run: `pnpm --filter @physiolens/api test security && pnpm -r lint`
Expected: PASS

**Step 4: Commit**
Run: `git add apps/api/src/middleware .github/workflows/ci.yml docs/security/THREAT_MODEL_V1.md && git commit -m "feat: enforce security baseline and threat model"`

---

### Task 10: Add Observability and Operational Hooks

**Files:**
- Create: `apps/api/src/observability/logger.ts`
- Create: `apps/api/src/observability/metrics.ts`
- Create: `apps/api/src/routes/health.ts`
- Modify: `docs/ops/SERVICE_SUPPORT_MODEL.md`

**Step 1: Write failing health/metrics tests**
Run: `pnpm --filter @physiolens/api test observability`
Expected: FAIL

**Step 2: Implement health, metrics, and structured logging**
Include correlation IDs and PHI-safe log policy.

**Step 3: Verify tests**
Run: `pnpm --filter @physiolens/api test observability`
Expected: PASS

**Step 4: Commit**
Run: `git add apps/api/src/observability apps/api/src/routes/health.ts docs/ops/SERVICE_SUPPORT_MODEL.md && git commit -m "feat: add health, metrics, and logging"`

---

### Task 11: Prepare Legal/Compliance Launch Pack

**Files:**
- Modify: `docs/legal/PRIVACY_POLICY_TEMPLATE.md`
- Modify: `docs/legal/TERMS_OF_SERVICE_TEMPLATE.md`
- Modify: `docs/legal/MEDICAL_DISCLAIMER_TEMPLATE.md`
- Create: `docs/legal/PILOT_CONTRACT_REQUIREMENTS.md`

**Step 1: Draft pilot-ready legal clauses (template level)**
Run: `rg -n "TODO|TBD" docs/legal`
Expected: placeholder fields visible for counsel review

**Step 2: Add review checklist and sign-off section**
Run: `rg -n "review|sign-off|counsel" docs/legal`
Expected: checklist terms present

**Step 3: Commit**
Run: `git add docs/legal && git commit -m "docs: add pilot legal/compliance pack"`

---

### Task 12: Pilot Release Execution and Evidence Capture

**Files:**
- Modify: `docs/release/RELEASE_CHECKLIST.md`
- Modify: `docs/release/GO_LIVE_RUNBOOK.md`
- Create: `docs/release/PILOT_RELEASE_EVIDENCE_TEMPLATE.md`

**Step 1: Add concrete pilot release criteria and metrics**
Run: `rg -n "SLO|rollback|severity|evidence" docs/release`
Expected: release gates and rollback terms present

**Step 2: Add sign-off matrix (engineering/security/product)**
Run: `rg -n "sign-off|approval" docs/release`
Expected: matrix included

**Step 3: Commit**
Run: `git add docs/release && git commit -m "docs: finalize pilot release runbooks and evidence template"`

---

### Task 13: End-to-End Verification and Readiness Report

**Files:**
- Create: `docs/planning-v2/PILOT_READINESS_REPORT_TEMPLATE.md`

**Step 1: Run full verification suite**
Run: `pnpm -r test && pnpm -r lint && pnpm -r build`
Expected: all pass

**Step 2: Generate readiness report from test/security/ops outcomes**
Run: `git status && rg -n "FAIL|ERROR" -S .`
Expected: no unresolved blockers

**Step 3: Commit readiness artifacts**
Run: `git add docs/planning-v2/PILOT_READINESS_REPORT_TEMPLATE.md && git commit -m "docs: add pilot readiness reporting template"`

---

## Execution Notes
- Use one implementer subagent per task.
- After each task: spec-compliance review, then code-quality review.
- Do not parallelize tasks that touch shared schema or shared API contracts.
- Enforce verification evidence before task closure.
