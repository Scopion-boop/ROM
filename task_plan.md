# Task Plan - Musculoskeletal ROM Platform

## Goal

Production-ready, AI-first musculoskeletal ROM note-taking platform with browser-side computer vision, dual-camera support, normative data comparison, clinical note generation, and AI-powered interpretation.

## Completed Phases

### Phase 0: Planning & Scaffold ✅

- Product scope, architecture, security, legal/regulatory planning
- Monorepo scaffold (pnpm + Turbo), domain contracts, auth, CRUD APIs
- CV pipeline, web UI shell, export, security, observability, legal docs
- 83 tests passing (13 shared-types + 53 API + 9 web + 7 CV + 1 NLP)

### Phase 1: Browser CV Pipeline ✅ (committed)

- Pluggable vision strategy architecture (auto-detect + guided)
- MediaPipe Pose integration, angle computation, joint routing
- Body/movement detection, temporal filtering, calibration
- Camera hooks (useCamera, usePoseDetection)

### Phase 2: Clinical Features ✅ (uncommitted — 20 files)

- ROM enrichment pipeline (max per joint, normative comparison, deficit classification)
- Dual-camera via QR phone pairing (WebRTC + WebSocket signaling)
- Clinical note generation with typed sections
- Rich note renderer with multi-format export (copy/print/PDF)
- AI interpretation via OpenAI GPT-4o / Anthropic Claude
- 23 clinical special tests database (shoulder/knee/hip)
- 29/29 web tests passing, TypeScript clean

## Current Phase

- Phase 3: Commit & ship → Database → API wiring → Additional joints

## Next Steps (Priority Order)

1. **Commit Phase 2** — 20 uncommitted files on feat/vision-auto-detect
2. **PostgreSQL integration** — replace in-memory repos with Prisma/Drizzle
3. **Wire frontend to backend** — connect session/measurement flows to Express
4. **Additional joints** — wrist, ankle, cervical spine normative ranges + clinical tests
5. **Server-side PDF** — real PDF generation replacing browser print
6. **CI/CD pipeline** — GitHub Actions
7. **Environment setup** — dev/staging/prod with feature flags

## Risks Logged

- Platform uncertainty (web vs mobile-first) may cause rework if not decided early.
- Regulatory classification (wellness vs SaMD) can materially change roadmap, budget, and timeline.
- Clinical accuracy target not yet locked; impacts validation burden.
- 20 uncommitted files need to be committed before further development.
- LLM interpretation requires API keys (OPENAI_API_KEY or ANTHROPIC_API_KEY) — not functional without them.

## Definition of Done

- All features committed and tests passing
- Database integration complete (PostgreSQL)
- Frontend wired to backend API
- CI/CD pipeline operational
- Pilot deployment readiness verified
