# Findings - Musculoskeletal ROM Planning

## Repository Findings
- Repository is not blank; current files include `README.md` and initial planning docs under `docs/planning/`.
- No application source code yet (`apps/`, `packages/`, and infrastructure code are not present).
- Existing docs appear draft-level and need consolidation into an execution-ready plan.

## Founder Intent (Captured)
- Build a musculoskeletal exam note-taking product with AI-assisted ROM measurement.
- Start with ROM capture + clean note output that clinicians can copy into existing systems.
- Version 1.1 should summarize exam notes and support patient self-assessment workflows.
- Long-term workflow includes pre-assessment scenarios where nurses/patients run guided checks before clinician review.
- Wants a team-lead operating model with multiple sub-agents working in parallel.
- Wants production readiness: frontend, backend, stack, security, legal, release, and support planning.

## Technical Direction (Recommended Baseline)
- Start with web-first (clinic desktop/browser) for V1.
- Add guided patient mode in V1.1 with responsive web/mobile web capture.
- Use 2D pose + confidence scoring first, then add dual-camera fusion after baseline reliability is proven.
- Keep video processing edge-first where possible; persist structured measurements and clinician notes.

## Compliance/Regulatory Reality
- Must treat as sensitive health data from day one.
- HIPAA-style controls should be baseline even pre-regulatory launch.
- Medical-device claim strategy must be decided early to avoid legal exposure.
