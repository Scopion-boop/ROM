# ROM Platform — Placeholder Buildout & CV Implementation Plan

> **Date:** 8 February 2026
> **Status:** PROPOSED
> **Scope:** Replace every placeholder, stub, and mock with production functionality

---

## Executive Audit Summary

The ROM Platform has a **polished UI shell** and a **well-structured API skeleton**, but almost everything behind the surface is a placeholder. Here's the current state:

| Component | Visual | Functional | Key Gap |
|---|---|---|---|
| Dashboard | ✅ 90% | ❌ 0% | All stats/sessions are hardcoded mock arrays |
| Session Wizard | ✅ 80% | ❌ 0% | "Start Capture" does nothing; measurements are fake |
| Camera | ✅ Preview box | ❌ 0% | No `getUserMedia`, no `<video>`, no frame capture |
| CV Pipeline | — | ⚠️ 20% | Angle calc works from pre-computed landmarks; **no pose estimation model** |
| API Routes | — | ⚠️ 70% | Endpoints work but all data is in-memory Maps (dies on restart) |
| Database | — | ❌ 0% | No PostgreSQL, no ORM, no migrations |
| Frontend↔API | — | ❌ 0% | Only call is a health check; data never flows |
| NLP Service | — | ❌ 5% | Health endpoint only; no note generation |
| PDF Export | — | ❌ 0% | Returns stub text |
| Auth in UI | — | ❌ 0% | No login page, no token storage |
| Missing Pages | — | ❌ 0% | /sessions, /reports, /compliance, /settings — don't exist |

---

## Phase 1 — Clinical Data Model & Joint Movement Matrix *(Week 1)*

### Why First
Everything downstream (CV, camera, API, UI) depends on a correct, validated clinical data model. Right now `joint` and `movement` are unvalidated free-text strings.

### Tasks

#### 1.1 — Joint–Movement–Landmark Matrix
Create a canonical clinical reference that defines every valid combination:

```
packages/domain-contracts/src/clinical/
├── joints.ts           ← JointType enum + metadata
├── movements.ts        ← MovementType enum
├── joint-movement-map.ts  ← which movements apply to which joints
├── normative-ranges.ts ← normal ROM ranges per joint/movement (AMA Guides / AAOS)
└── landmark-map.ts     ← MediaPipe landmark indices per joint/movement
```

**Joint Types** (expand from current 12 to include spine):
| Joint | Side | Applicable Movements |
|---|---|---|
| Shoulder | L/R | Flexion, Extension, Abduction, Adduction, Internal Rotation, External Rotation, Horizontal Adduction, Horizontal Abduction |
| Elbow | L/R | Flexion, Extension, Pronation, Supination |
| Wrist | L/R | Flexion, Extension, Radial Deviation, Ulnar Deviation |
| Hip | L/R | Flexion, Extension, Abduction, Adduction, Internal Rotation, External Rotation |
| Knee | L/R | Flexion, Extension |
| Ankle | L/R | Dorsiflexion, Plantarflexion, Inversion, Eversion |
| Cervical Spine | N/A | Flexion, Extension, Lateral Flexion (L/R), Rotation (L/R) |
| Lumbar Spine | N/A | Flexion, Extension, Lateral Flexion (L/R), Rotation (L/R) |

**Normative Ranges** (example):
| Joint | Movement | Normal ROM | Source |
|---|---|---|---|
| Shoulder | Flexion | 0–180° | AMA Guides 6th Ed |
| Shoulder | Extension | 0–60° | AMA Guides 6th Ed |
| Shoulder | Abduction | 0–180° | AMA Guides 6th Ed |
| Knee | Flexion | 0–140° | AAOS |
| Knee | Extension | 140–0° | AAOS |

**MediaPipe Landmark Mapping** (example):
| Joint | Movement | Proximal | Center | Distal | Viewing Plane |
|---|---|---|---|---|---|
| Right Shoulder | Flexion/Extension | RIGHT_HIP (24) | RIGHT_SHOULDER (12) | RIGHT_ELBOW (14) | Sagittal |
| Right Shoulder | Abduction/Adduction | LEFT_SHOULDER (11) | RIGHT_SHOULDER (12) | RIGHT_ELBOW (14) | Frontal |
| Right Elbow | Flexion/Extension | RIGHT_SHOULDER (12) | RIGHT_ELBOW (14) | RIGHT_WRIST (16) | Sagittal |
| Right Knee | Flexion/Extension | RIGHT_HIP (24) | RIGHT_KNEE (26) | RIGHT_ANKLE (28) | Sagittal |

#### 1.2 — Update Shared Types
- Replace `joint: z.string()` → `joint: JointTypeEnum`
- Replace `movement: z.string()` → `movement: MovementTypeEnum`
- Add `plane: z.enum(['sagittal', 'frontal', 'transverse'])`
- Validate joint↔movement combos at schema level

#### 1.3 — Reconcile Schema Mismatches
- Note statuses: unify `shared-types` (`draft | review | approved | exported`) with API (`draft | reviewed | finalized | amended`)
- Pick one canonical set and update both sides

**Deliverables:** `packages/domain-contracts/` with full clinical matrices, updated `shared-types`, 100% test coverage on valid/invalid combos.

---

## Phase 2 — Computer Vision Pipeline *(Weeks 2–3)* 🔴 CRITICAL

### Current State
The CV service at `services/cv/` has:
- ✅ `_angle_between_points()` — correct 2D angle calculation from 3 landmarks
- ✅ `_assess_quality()` — basic visibility/occlusion detection
- ✅ `POST /api/v1/pipeline/measure` — accepts pre-computed landmarks, returns angle
- ❌ **No pose estimation model** (MediaPipe/MoveNet not imported or installed)
- ❌ **No image/video input** (no endpoint accepts frames)
- ❌ **No landmark extraction** (the whole image→landmarks step is missing)
- ❌ **No joint-specific landmark mapping**
- ❌ **No multi-frame/temporal smoothing**
- ❌ **No 3D angle support** (z-coordinate exists but is unused)
- ❌ **No streaming/WebSocket support**
- ❌ **No normative range comparison**

### Architecture

```
┌──────────────┐     WebSocket (frames)      ┌──────────────────────┐
│  Browser      │ ──────────────────────────▶ │  CV Service (FastAPI) │
│  (webcam +    │                             │                      │
│   phone cam)  │ ◀────────────────────────── │  ┌────────────────┐  │
│               │     JSON (measurements)     │  │ MediaPipe Pose │  │
└──────────────┘                              │  │ (BlazePose)    │  │
                                              │  └───────┬────────┘  │
                                              │          │ landmarks  │
                                              │  ┌───────▼────────┐  │
                                              │  │ Joint Router   │  │
                                              │  │ (landmark map) │  │
                                              │  └───────┬────────┘  │
                                              │          │ 3 points   │
                                              │  ┌───────▼────────┐  │
                                              │  │ Angle Engine   │  │
                                              │  │ (existing)     │  │
                                              │  └───────┬────────┘  │
                                              │          │ degrees    │
                                              │  ┌───────▼────────┐  │
                                              │  │ Temporal Filter │  │
                                              │  │ (smoothing)    │  │
                                              │  └───────┬────────┘  │
                                              │          │            │
                                              │  ┌───────▼────────┐  │
                                              │  │ Normative Comp │  │
                                              │  │ (range check)  │  │
                                              │  └────────────────┘  │
                                              └──────────────────────┘
```

### Tasks

#### 2.1 — Install & Integrate MediaPipe Pose
- Add `mediapipe>=0.10.14` to `services/cv/pyproject.toml`
- Create `services/cv/app/pose_estimator.py`:
  - Initialize `mp.solutions.pose.Pose(model_complexity=2, min_detection_confidence=0.7, min_tracking_confidence=0.5)`
  - Function `extract_landmarks(frame: np.ndarray) -> list[Landmark] | None`
  - Returns all 33 MediaPipe pose landmarks with visibility scores
  - Handle edge cases: no person detected, multiple people, partial body

#### 2.2 — Joint Routing Layer
- Create `services/cv/app/joint_router.py`:
  - Given a target `(joint, movement, side)` and the full 33-landmark set, extract the correct 3 landmarks
  - Uses the `landmark-map` from Phase 1
  - Handles mirroring for left/right sides
  - Determines correct viewing plane (sagittal/frontal/transverse)
  - Validates that the required landmarks are visible above threshold

#### 2.3 — Frame Processing Endpoint
- Create `POST /api/v1/pipeline/process-frame`:
  - Accepts: `{ frame: base64_image, joints: [JointMovement], side: "left"|"right" }`
  - Pipeline: decode frame → MediaPipe → extract landmarks → route per joint → compute angles → return measurements
  - Returns: `{ measurements: MeasurementResponse[], landmarks: Landmark[], pose_overlay: base64_image }`
  - The `pose_overlay` is the frame with skeleton drawn on it (for UI display)

#### 2.4 — WebSocket Streaming Endpoint
- Create `WS /api/v1/pipeline/stream`:
  - Client sends binary frames (JPEG/WebP)
  - Server processes each frame through the full pipeline
  - Server sends back JSON: `{ measurements, landmarks, frame_id, timestamp }`
  - Maintains a per-connection state for temporal filtering
  - Target: 15+ FPS processing (MediaPipe is fast enough)

#### 2.5 — Temporal Smoothing (Multi-Frame Averaging)
- Create `services/cv/app/temporal_filter.py`:
  - Sliding window of last N frames (e.g., 10)
  - Exponential moving average for angle stability
  - Outlier rejection (discard frames where angle jumps > 20° from window mean)
  - Reports `stable: true` when variance drops below threshold (measurement ready)
  - This prevents jitter and gives the clinician a "hold still" → "captured" flow

#### 2.6 — Normative Range Comparison
- Create `services/cv/app/normative.py`:
  - Load normative ranges from the Phase 1 matrix
  - Compare measured ROM to normal range
  - Return: `{ within_normal: bool, percent_of_normal: float, deficit_degrees: float }`

#### 2.7 — Pose Overlay Renderer
- Create `services/cv/app/overlay.py`:
  - Draw detected skeleton on frame using OpenCV
  - Highlight the measured joint angle with an arc visualization
  - Color-code: green (within normal) / yellow (mild deficit) / red (significant deficit)
  - Return as base64 PNG overlay

#### 2.8 — 3D Angle Support
- Extend `_angle_between_points()` to use (x, y, z) when the z-coordinate is available
  - BlazePose provides z-coordinates in world-space landmarks
  - Critical for rotation measurements (IR/ER) which can't be accurately measured in 2D

**New dependencies:**
```toml
dependencies = [
    "mediapipe>=0.10.14",
    "opencv-python-headless>=4.9.0",
    "numpy>=2.2.0",
    # ... existing
]
```

**Deliverables:** Full image→measurement pipeline, WebSocket streaming at 15+ FPS, temporal smoothing, normative comparison, skeleton overlay, 3D angle support. Comprehensive test suite with synthetic landmark data + real test images.

---

## Phase 3 — Dual Camera System *(Week 3–4)* 🔴 CRITICAL

### Architecture: Webcam + Phone Camera

```
┌─────────────────────────────────────────────┐
│                CLINICIAN'S DEVICE            │
│                                              │
│  ┌─────────────────┐  ┌──────────────────┐  │
│  │  Webcam Feed     │  │  Phone Feed       │  │
│  │  (getUserMedia)  │  │  (WebRTC peer)    │  │
│  │  @ 720p/30fps    │  │  @ 720p/30fps     │  │
│  └────────┬─────────┘  └────────┬──────────┘  │
│           │                       │             │
│           ▼                       ▼             │
│  ┌──────────────────────────────────────────┐  │
│  │  Frame Selector / Dual-View Compositor    │  │
│  │  (pick best angle per joint movement)     │  │
│  └────────────────────┬─────────────────────┘  │
│                       │ frames @ 10fps          │
│                       ▼                         │
│  ┌──────────────────────────────────────────┐  │
│  │  WebSocket → CV Service                   │  │
│  │  (sends frames, receives measurements)    │  │
│  └──────────────────────────────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            PATIENT'S PHONE (optional)        │
│                                              │
│  Browser → Camera → WebRTC Peer Connection   │
│  Scans QR code from clinician's screen       │
│  Streams rear-camera video to clinician      │
│                                              │
└─────────────────────────────────────────────┘
```

### Tasks

#### 3.1 — Webcam Capture Component
- Create `apps/web/src/components/capture/WebcamCapture.tsx`:
  - `navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })`
  - `<video ref>` with `autoPlay playsInline muted`
  - Camera permission request flow with error handling (denied, not found, in-use)
  - Device enumeration (`navigator.mediaDevices.enumerateDevices()`) for camera selection dropdown
  - Stream lifecycle: start on mount, cleanup on unmount (stop all tracks)
  - Frame extraction: `canvas.drawImage(video)` → `canvas.toBlob('image/webp', 0.8)` at configurable FPS
  - Mirror mode toggle for user-facing camera

#### 3.2 — Phone Camera via WebRTC
- Create `apps/web/src/components/capture/PhoneCameraLink.tsx`:
  - Generate a unique session room ID
  - Display QR code (use `qrcode.react`) that opens `/camera/remote?room=XXXX`
  - Create `/app/camera/remote/page.tsx` — lightweight page for the phone:
    - Opens rear camera (`facingMode: 'environment'`)
    - Establishes WebRTC peer connection to the clinician's browser
    - Streams video track over peer connection
    - Shows connection status and a "Disconnect" button

- Create `apps/web/src/lib/webrtc/signaling.ts`:
  - Signaling server (can use the API's WebSocket or a simple Socket.io namespace)
  - ICE candidate exchange
  - Offer/answer negotiation
  - Peer connection lifecycle management

- Create `apps/api/src/routes/signaling.ts`:
  - WebSocket-based signaling relay
  - Room-based: only two peers per room
  - Auto-cleanup on disconnect

#### 3.3 — Dual Feed Compositor
- Create `apps/web/src/components/capture/DualFeedView.tsx`:
  - Side-by-side or picture-in-picture layout for two camera feeds
  - Clinician can designate "primary" feed per joint measurement
  - The primary feed's frames are sent to the CV service
  - Label overlay: "Webcam (Frontal)" / "Phone (Sagittal)" etc.
  - Full-screen toggle per feed
  - The system recommends which camera to use based on the movement being measured:
    - Sagittal plane movements → side view (usually phone camera placed to the side)
    - Frontal plane movements → front view (usually the webcam)

#### 3.4 — Frame Transport to CV Service
- Create `apps/web/src/lib/cv/frame-streamer.ts`:
  - WebSocket connection to `ws://localhost:8001/api/v1/pipeline/stream`
  - Send frames as binary blobs at 10 FPS (throttled)
  - Receive measurement results + pose overlay
  - Reconnection logic with exponential backoff
  - Buffer management (drop frames if processing falls behind)

#### 3.5 — Pose Overlay Canvas
- Create `apps/web/src/components/capture/PoseOverlay.tsx`:
  - Canvas overlay on top of `<video>` element
  - Receives landmark data from WebSocket
  - Draws skeleton connections + joint points
  - Draws measured angle arc with degree label
  - Color-codes based on normative range
  - Shows real-time ROM reading as a heads-up overlay

#### 3.6 — Rewrite CameraSetupWizard
Complete rewrite of the existing placeholder:
1. **Select Joints** — keep existing UI but add movement selection per joint (dropdown/chips)
2. **Camera Setup** — replace placeholder box with real WebcamCapture, device selector, PhoneCameraLink QR code
3. **Capture** — real-time video with pose overlay, per-joint capture flow:
   - System prompts: "Measure RIGHT SHOULDER FLEXION — raise arm forward"
   - Real-time angle display from CV service
   - "Hold" indicator when angle is stable
   - Auto-capture when stability threshold met (or manual capture button)
   - Progress through each joint/movement combination
4. **Review** — show captured measurements with angle values, confidence scores, and a thumbnail/snapshot of the capture moment

**New dependencies:**
```json
{
  "qrcode.react": "^4.0.0"
}
```

**Deliverables:** Working dual-camera system, WebRTC phone-to-browser streaming, real-time pose visualization, per-joint guided capture flow.

---

## Phase 4 — Database & API Integration *(Week 4)*

### Tasks

#### 4.1 — PostgreSQL Database Setup
- Add `prisma` or `drizzle-orm` to `apps/api`
- Create schema:
  - `users` (id, email, passwordHash, role, orgId, createdAt)
  - `organizations` (id, name, settings)
  - `patients` (id, orgId, name, dob, mrn)
  - `sessions` (id, orgId, clinicianId, patientId, status, joints, createdAt, updatedAt, finalizedAt)
  - `measurements` (id, sessionId, joint, movement, side, romDegrees, confidence, qualityFlags, algorithmVersion, captureDurationMs, captureSnapshot, createdAt)
  - `notes` (id, sessionId, blocks, status, generatedBy, createdAt, updatedAt)
  - `audit_logs` (id, entityType, entityId, action, actorId, diff, timestamp)
- Generate and run migrations
- Add `DATABASE_URL` env variable + connection pool config

#### 4.2 — Replace In-Memory Repositories
- Rewrite `session-repo.ts` → Prisma/Drizzle queries
- Rewrite `measurement-repo.ts` → Prisma/Drizzle queries
- Rewrite `audit-repo.ts` → Prisma/Drizzle queries
- Add note repository (currently inline in route)
- Add user repository (replace in-memory Map)
- Data persists across restarts

#### 4.3 — PDF Export Implementation
- Replace the stub in `export.ts`
- Use `@react-pdf/renderer` or `puppeteer` to generate real clinical PDF:
  - Header: clinic logo, patient info, exam date
  - Measurement table: joint, movement, side, ROM°, confidence, vs normal range
  - Clinical note text
  - Capture snapshots (thumbnails of the frame at measurement moment)
  - Footer: disclaimer, generated timestamp
- Store PDF in filesystem or S3-compatible storage

#### 4.4 — Environment Configuration
- Create `.env.example` with all required variables
- `DATABASE_URL`, `JWT_SECRET`, `CV_SERVICE_URL`, `NLP_SERVICE_URL`, `API_PORT`, `CORS_ORIGINS`
- Docker Compose for local development (API + PostgreSQL + CV + NLP)

**Deliverables:** Persistent PostgreSQL storage, real PDF generation, env config, Docker Compose.

---

## Phase 5 — Frontend ↔ API Integration *(Week 5)*

### Tasks

#### 5.1 — API Client Layer
- Create `apps/web/src/lib/api/client.ts`:
  - Typed fetch wrapper with auth headers, error handling, base URL config
  - Request/response interceptors
  - Token refresh logic

#### 5.2 — Auth Flow in UI
- Create `/app/login/page.tsx` — login form
- Create `/app/register/page.tsx` — registration form (for pilot, may be invite-only)
- Create `apps/web/src/context/AuthContext.tsx`:
  - Store JWT in httpOnly cookie or secure localStorage
  - Check auth on app load
  - Redirect to login if unauthenticated
  - Expose `user`, `login()`, `logout()` to all components

#### 5.3 — Dashboard → Real Data
- Replace hardcoded `STATS` array with API calls:
  - `GET /api/sessions` → count sessions, extract recent list
  - `GET /api/measurements` → count, compute average confidence
  - Show real data with loading skeletons

#### 5.4 — Session Workflow → API Writes
- `POST /api/sessions` on wizard start → get real session ID
- `POST /api/sessions/:id/measurements` after each joint capture
- `POST /api/sessions/:id/notes/generate` when entering note phase
- `PUT /api/notes/:id` on note edits
- `POST /api/sessions/:id/finalize` on completion

#### 5.5 — Build Missing Pages
| Route | Description |
|---|---|
| `/sessions` | Paginated session list with filters (status, date, patient) |
| `/sessions/[id]` | Session detail: measurements, note, export button |
| `/reports` | Analytics dashboard: ROM trends, patient progress, clinic stats |
| `/compliance` | Audit log viewer, data retention settings |
| `/settings` | User profile, clinic settings, camera defaults |

**Deliverables:** All pages functional, all data flows through the API, auth-gated UI.

---

## Phase 6 — NLP Note Generation *(Week 5)*

### Tasks

#### 6.1 — Intelligent Note Builder
- Expand `services/nlp/` service with actual routes
- `POST /api/v1/notes/generate`:
  - Input: `{ measurements: Measurement[], patient_context?: string }`
  - Output: structured clinical note blocks
  - **Option A (no external AI):** Template engine with clinical language rules:
    - Per-joint paragraph: "{Joint} {movement} measured at {X}° ({Y}% of normal). {Assessment}."
    - Summary paragraph synthesizing all findings
    - Recommendation section based on deficits
  - **Option B (with LLM):** Send measurement summary to OpenAI/Claude API:
    - System prompt with clinical note formatting rules
    - Structured output (JSON blocks)
    - Human review required before finalizing

#### 6.2 — Note Status Workflow
- Implement: `draft → reviewed → finalized → amended`
- Only finalized notes can be exported
- Amendment creates a new version with diff tracking

**Deliverables:** Automated clinical note generation from measurements, note versioning.

---

## Phase 7 — Observability, Testing & Hardening *(Week 6)*

### Tasks

#### 7.1 — Re-run & Fix All Existing Tests
- Verify 83 existing tests still pass after all changes
- Update tests that reference old schemas/interfaces

#### 7.2 — E2E Tests for Critical Flows
- Playwright tests:
  - Login → Dashboard → New Session → Select Joints → Capture → Results → Note → Export
  - Dual camera connection flow
  - Session list filtering and pagination

#### 7.3 — CV Pipeline Test Suite
- Unit tests with synthetic landmarks (known angles)
- Integration tests with real test images (annotated reference frames)
- WebSocket streaming load test
- Multi-frame smoothing accuracy tests

#### 7.4 — CI/CD Pipeline
- Replace `echo "Tests would run here"` with actual test commands
- Add: lint, type-check, unit test, integration test, build stages

#### 7.5 — Error Handling & Edge Cases
- Camera disconnection during capture
- WebSocket reconnection
- CV service unavailable (graceful degradation)
- Concurrent session handling
- Network interruption during measurement

**Deliverables:** Comprehensive test coverage, production CI/CD, error resilience.

---

## Priority & Dependency Order

```
Phase 1 (Clinical Data Model)
    │
    ├───▶ Phase 2 (CV Pipeline) ────▶ Phase 3 (Dual Camera)
    │                                       │
    ├───▶ Phase 4 (Database + API)          │
    │         │                             │
    │         ▼                             ▼
    │    Phase 5 (Frontend ↔ API Integration)
    │         │
    │         ▼
    │    Phase 6 (NLP Notes)
    │
    └───▶ Phase 7 (Testing & Hardening)
```

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 5
This is the camera problem: nothing works without the CV pipeline processing real video frames from real cameras.

---

## Complete Placeholder Inventory (for tracking)

### Frontend Placeholders
- [ ] Dashboard `STATS` array — 4 hardcoded stats
- [ ] Dashboard `RECENT_SESSIONS` — 5 fake sessions with fake patients
- [ ] Dashboard `QUICK_ACTIONS` — 3 of 4 link to `#` (dead links)
- [ ] Dashboard stat numbers (1,284 / 8,462 / 312 / 94.2%)
- [ ] Dashboard "View all" link → `#`
- [ ] Sidebar: Sessions (#), Measurements (#), Reports (#), Compliance (#), Settings (#) — 5 dead nav links
- [ ] Camera preview — grey box with text "Camera preview placeholder"
- [ ] Measurement data — `placeholderMeasurements` array with `romDegrees: 0`
- [ ] Note blocks — `placeholderBlocks` with empty content
- [ ] "Save Draft" / "Finalize" buttons — just `alert()`
- [ ] No `/sessions` list page
- [ ] No `/sessions/[id]` detail page
- [ ] No `/reports` page
- [ ] No `/compliance` page
- [ ] No `/settings` page
- [ ] No `/login` page
- [ ] No auth context/provider
- [ ] No API calls from frontend (except health check)

### API Placeholders
- [ ] User store — in-memory `Map`
- [ ] Session store — in-memory `Map`
- [ ] Measurement store — in-memory `Map`
- [ ] Note store — in-memory `Map`
- [ ] Audit store — in-memory `Array`
- [ ] PDF export — returns `{ message: "..." }` stub
- [ ] No environment variable config
- [ ] No database connection

### CV Service Placeholders
- [ ] No MediaPipe/pose estimation model
- [ ] No image/video input endpoint
- [ ] No frame processing
- [ ] No WebSocket streaming
- [ ] No landmark extraction from images
- [ ] No joint-specific landmark routing
- [ ] No temporal smoothing
- [ ] No normative range comparison
- [ ] No pose overlay rendering
- [ ] No 3D angle support
- [ ] Readiness check always returns `true` (TODO comment)

### NLP Service Placeholders
- [ ] Only health endpoint exists
- [ ] No note generation routes
- [ ] No clinical language processing
- [ ] Test file labeled "Placeholder test"

### CI/CD Placeholders
- [ ] Test job runs `echo "Tests would run here"`

### Schema Issues
- [ ] `joint` and `movement` are unvalidated `z.string()`
- [ ] No `MovementType` enum exists
- [ ] No `JointType` enum with validation
- [ ] Note status mismatch: shared-types vs API
- [ ] Duplicate audit repository implementations

---

## Estimated Effort

| Phase | Duration | Complexity | Dependencies |
|---|---|---|---|
| Phase 1 — Clinical Data Model | 3–4 days | Medium | None |
| Phase 2 — CV Pipeline | 7–10 days | **Very High** | Phase 1 |
| Phase 3 — Dual Camera | 5–7 days | **High** | Phase 2 |
| Phase 4 — Database + API | 4–5 days | Medium | Phase 1 |
| Phase 5 — Frontend Integration | 5–7 days | Medium–High | Phase 3, 4 |
| Phase 6 — NLP Notes | 2–3 days | Medium | Phase 4 |
| Phase 7 — Testing & Hardening | 4–5 days | Medium | All |
| **Total** | **~6 weeks** | | |

---

## Open Questions for Founder

1. **Phone camera connection:** Is WebRTC (peer-to-peer, no server relay) acceptable, or do you need a media server (Twilio/LiveKit) for reliability?
2. **CV model choice:** MediaPipe BlazePose (free, runs locally, ~30 FPS) vs. cloud-based pose estimation (more accurate but adds latency and cost)?
3. **NLP notes:** Template-based (deterministic, no AI cost) vs. LLM-powered (more natural language, requires API key)?
4. **Database hosting:** Self-hosted PostgreSQL, Supabase, Neon, or managed cloud?
5. **Measurement recording:** Store video clips of each measurement, or just the snapshot frame at capture moment?
6. **Multi-patient:** Should the system support selecting/creating patients within the app, or are patients identified externally?
7. **Offline capability:** Should the camera + CV work offline (MediaPipe can run in-browser via WASM)?
