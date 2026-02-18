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

---

## Implementation Status (v0.1.0 - February 2026)

### Actual Stack Implemented

#### Frontend (Next.js 15.1 + React 19)
- **Framework**: Next.js App Router with TypeScript
- **Computer Vision**: MediaPipe Pose (browser-side WASM)
- **State Management**: React hooks + local state
- **Real-time Communication**: WebRTC via Simple Peer
- **UI Components**: Custom components with Lucide icons, Framer Motion
- **Testing**: Vitest + React Testing Library (29 tests passing)

#### Backend (Node.js + Express)
- **API Framework**: Express with TypeScript
- **Database ORM**: Drizzle ORM (PostgreSQL ready)
- **Current Storage**: In-memory repositories (development)
- **Authentication**: JWT + bcryptjs (infrastructure ready, not enforced)
- **Security**: Helmet, CORS middleware
- **Logging**: Pino structured logging

#### AI/ML Integration
- **Computer Vision**: MediaPipe Pose Landmarker (33 body landmarks)
- **LLM Integration**: OpenAI GPT-4o / Anthropic Claude Sonnet
- **Interpretation**: Server-side Next.js API route (`/api/interpret`)
- **Clinical Knowledge**: 23 special tests database (shoulder/knee/hip)

#### Real-time Communication
- **WebRTC Signaling**: Custom Node.js server (Socket.io, port 4001)
- **Dual-Camera Pairing**: QR code-based room joining
- **3D Landmark Fusion**: Client-side fusion algorithm

### Architecture Deviations from Plan

#### What's Different
1. **No Python microservice**: AI interpretation handled via Next.js API routes calling OpenAI/Anthropic directly
2. **No FastAPI service**: Eliminated for MVP simplicity
3. **No message queue**: Async jobs not yet needed (all operations synchronous)
4. **CV in browser only**: MediaPipe runs client-side, no backend CV worker
5. **No audit service yet**: Logging implemented, immutable audit trail pending

#### What Matches Plan
✅ Next.js web app with TypeScript
✅ Browser-side CV (MediaPipe WASM)
✅ Node.js backend API
✅ PostgreSQL database (schema defined, not integrated)
✅ Modular monolith approach
✅ TypeScript across stack

### Current Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Web App (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Capture    │  │    Notes     │  │  AI Interp   │      │
│  │   Wizard     │  │  Generator   │  │   (/api)     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼─────────────────▼─────────────────▼───────┐      │
│  │         MediaPipe CV Engine (WASM)               │      │
│  │    • Pose detection  • Angle calculation         │      │
│  │    • 3D fusion       • Vision strategies         │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                   WebRTC Signaling (Socket.io)
                              │
┌─────────────────────────────▼─────────────────────────────┐
│                   API Server (Express)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Sessions   │  │ Measurements │  │    Notes     │    │
│  │   Routes     │  │   Routes     │  │   Routes     │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │             │
│  ┌──────▼─────────────────▼─────────────────▼───────┐    │
│  │           Repository Layer (In-Memory)            │    │
│  │        (Drizzle ORM schemas ready for PG)         │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
                              │
                  ┌───────────▼────────────┐
                  │  PostgreSQL (Planned)  │
                  │   Drizzle migrations   │
                  └────────────────────────┘
```

### Data Flow - Capture to Note

1. **User initiates capture** → Camera wizard UI
2. **MediaPipe processes video** → Real-time landmark detection
3. **Calculate ROM angles** → 3D angle math on landmarks
4. **Optional: Dual camera** → WebRTC signaling → Landmark fusion
5. **Filter max ROM** → Select highest per joint/movement
6. **Enrich with normative ranges** → Add AMA/AAOS standards
7. **Generate clinical note** → Template with measurement table
8. **Optional: AI interpretation** → `/api/interpret` → LLM → Clinical insights
9. **Display & print** → NoteRenderer component with print CSS

### Technology Decisions - Rationale

#### Why MediaPipe in Browser (not backend CV)
- **Latency**: Real-time feedback requires <50ms processing
- **Privacy**: Video never leaves device (HIPAA advantage)
- **Cost**: No server-side GPU compute needed
- **Scale**: Offloads compute to client devices

#### Why Next.js API Routes (not FastAPI)
- **Simplicity**: One deployment, one codebase
- **Developer velocity**: TypeScript end-to-end
- **Serverless-ready**: Vercel/AWS Lambda compatible
- **Adequate performance**: LLM calls are I/O-bound, not CPU-bound

#### Why In-Memory Storage (MVP)
- **Rapid iteration**: No database setup friction
- **Stateless testing**: Tests run without DB dependencies
- **Easy migration**: Repository pattern → swap for Drizzle later
- **Development speed**: Focus on features, not schema migrations

### Database Schema (Ready, Not Integrated)

**Drizzle ORM schemas defined** in `apps/api/src/db/schema.ts`:
- `users` - Authentication & user profiles
- `organizations` - Multi-tenancy
- `sessions` - Exam sessions
- `measurements` - ROM data points
- `notes` - Generated clinical documentation
- Migrations ready via `drizzle-kit push`

### Security Implementation

✅ **Implemented**:
- Helmet.js security headers
- CORS protection
- bcryptjs password hashing (12 rounds)
- JWT token generation (HS256)
- Environment variable isolation

⚠️ **Not Enforced** (Development mode):
- Authentication middleware (commented out)
- Authorization checks
- Rate limiting
- Input sanitization (basic validation only)

### Performance Characteristics

**Current Benchmarks** (Development):
- MediaPipe inference: ~16ms/frame (60 FPS)
- Angle calculation: <1ms
- AI interpretation: 2-5s (OpenAI API latency)
- Note generation: <10ms
- WebRTC connection time: 1-3s

### Deployment Architecture (Current)

**Development**:
```
localhost:2000  → Next.js dev server
localhost:3000  → Express API server
localhost:4001  → WebRTC signaling server
```

**Production** (Planned):
```
Vercel Edge Network → Next.js (serverless)
AWS ECS/Fargate    → Express API
AWS ALB            → Load balancing
AWS RDS PostgreSQL → Database
CloudWatch         → Logging & monitoring
```

### Missing Components vs. Plan

**Not Yet Implemented**:
- [ ] Python FastAPI microservice
- [ ] Message queue (RabbitMQ/SQS)
- [ ] Audit service (immutable event log)
- [ ] Object storage (S3 for video artifacts)
- [ ] CV worker service
- [ ] NLP worker service
- [ ] Regional deployment
- [ ] Data residency controls

**Reason for Omissions**: MVP scope focused on core capture → note → AI flow with minimal infrastructure complexity.

### Migration Path Forward

**Phase 6: Production Readiness**
1. Enable database persistence (swap repository implementations)
2. Activate authentication middleware
3. Add rate limiting & input validation
4. Implement audit logging

**Phase 7: Scale & Compliance**
1. Add Python microservice if LLM latency/cost becomes issue
2. Introduce message queue for async exports
3. Implement immutable audit trail
4. Add S3 storage for video artifacts (if retention needed)

### References
- MediaPipe architecture: [apps/web/src/lib/cv/](../../apps/web/src/lib/cv/)
- Vision strategies: [apps/web/src/lib/strategies/](../../apps/web/src/lib/strategies/)
- API routes: [apps/api/src/routes/](../../apps/api/src/routes/)
- Database schema: [apps/api/src/db/schema.ts](../../apps/api/src/db/schema.ts)
