# 03 - Architecture and Stack

## Recommended architecture for speed + production readiness
- Frontend: `Next.js` web app (TypeScript), responsive for clinic desktop and mobile browser
- CV runtime: Browser-side pose inference for immediate feedback (WebAssembly/WebGPU path)
- Backend API: `Node.js` (TypeScript, modular monolith initially)
- AI service (summarization / advanced processing): `Python` microservice (`FastAPI`) behind internal API
- Database: `PostgreSQL` (primary), object store for artifacts if needed
- Queue/events: lightweight message broker for async jobs (summary generation, exports)
- Infra: AWS managed services with strong encryption and audit support

## Why this stack
- Web-first reduces launch friction for clinics.
- TypeScript across frontend/backend improves velocity and consistency.
- Python service isolates model-serving concerns from transactional API domain.
- Modular monolith first avoids early microservice overhead.

## High-level components
1. `web-app`: clinician and patient interfaces
2. `api-core`: auth, sessions, measurements, notes, exports
3. `cv-worker`: pose pipeline orchestration and quality scoring
4. `nlp-worker`: summary generation and templated note enhancement
5. `audit-service`: immutable event trail and compliance views

## Boundary decisions
- Keep measurement and note-domain logic in backend domain layer.
- Keep model and CV provider adapters behind interfaces.
- Keep export adapters (PDF/clipboard/JSON) decoupled from capture flow.

## Data model (initial)
- `users`, `organizations`, `roles`
- `patients` (minimal dataset)
- `exam_sessions`
- `measurements`
- `notes`
- `summary_jobs`
- `audit_events`

## Deployment topology (initial)
- `web-app` served via CDN + edge
- `api-core` in private compute with autoscaling
- managed `PostgreSQL`
- encrypted object storage
- central logging/metrics/tracing

## Future scaling path
- Split `api-core` by bounded contexts when throughput or team boundaries require it.
- Add regional deployment and data residency controls if expanding jurisdictions.
