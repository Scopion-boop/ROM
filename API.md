# API Documentation

Complete API reference for the PhysioLens platform.

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
  - [Health Check](#health-check)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Session Management](#session-management)
  - [Measurements](#measurements)
  - [Clinical Notes](#clinical-notes)
  - [AI Interpretation](#ai-interpretation)
- [WebRTC Signaling](#webrtc-signaling)
- [Data Models](#data-models)
- [Error Handling](#error-handling)

## Overview

### Base URLs
- **Web App**: http://localhost:2000 (development)
- **API Server**: http://localhost:3000 (development)
- **WebRTC Signaling**: http://localhost:4001 (development)

### API Architecture
- **Next.js API Routes**: `/api/*` endpoints (server-side)
- **Express API**: RESTful endpoints for sessions, measurements, notes
- **WebRTC Signaling**: WebSocket server for dual-camera pairing

### Content Type
All API endpoints use `application/json` unless otherwise specified.

## Authentication

### Current Status
⚠️ **Development Mode**: Authentication infrastructure is implemented but **not enforced** in MVP v0.1.0.

### Future: JWT Authentication

**Login** to obtain a JWT token:
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "clinician@example.com",
  "password": "secure_password"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "user_123",
    "username": "clinician@example.com",
    "organizationId": "org_456"
  }
}
```

**Using the token**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## API Endpoints

### Health Check

Check API server health status.

```http
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T12:34:56.789Z"
}
```

---

### Authentication Endpoints

#### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK)**:
```json
{
  "token": "string",
  "user": {
    "userId": "string",
    "username": "string",
    "organizationId": "string"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Invalid credentials"
}
```

---

### Session Management

#### Create Session

Create a new examination session.

```http
POST /api/sessions
Authorization: Bearer {token}
Content-Type: application/json

{
  "joints": ["shoulder", "knee"],
  "patientId": "patient_123"  // Optional
}
```

**Response (201 Created)**:
```json
{
  "id": "session_abc123",
  "organizationId": "org_456",
  "clinicianId": "user_789",
  "patientId": "patient_123",
  "joints": ["shoulder", "knee"],
  "status": "in_progress",
  "createdAt": "2026-02-08T12:34:56.789Z",
  "updatedAt": "2026-02-08T12:34:56.789Z"
}
```

#### List Sessions

Get all sessions for the authenticated user's organization.

```http
GET /api/sessions
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
[
  {
    "id": "session_abc123",
    "organizationId": "org_456",
    "clinicianId": "user_789",
    "patientId": "patient_123",
    "joints": ["shoulder"],
    "status": "completed",
    "createdAt": "2026-02-08T12:00:00.000Z",
    "updatedAt": "2026-02-08T12:30:00.000Z"
  }
]
```

#### Get Session

Retrieve a specific session by ID.

```http
GET /api/sessions/:id
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "id": "session_abc123",
  "organizationId": "org_456",
  "clinicianId": "user_789",
  "patientId": "patient_123",
  "joints": ["shoulder"],
  "status": "in_progress",
  "createdAt": "2026-02-08T12:34:56.789Z",
  "updatedAt": "2026-02-08T12:34:56.789Z"
}
```

#### Update Session Status

Update the status of a session.

```http
PATCH /api/sessions/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed"  // "in_progress" | "completed" | "cancelled"
}
```

**Response (200 OK)**:
```json
{
  "id": "session_abc123",
  "status": "completed",
  "updatedAt": "2026-02-08T12:45:00.000Z"
}
```

---

### Measurements

#### Record Measurement

Record a ROM measurement for a session.

```http
POST /api/sessions/:sessionId/measurements
Authorization: Bearer {token}
Content-Type: application/json

{
  "joint": "shoulder",
  "movement": "flexion",
  "side": "right",
  "romDegrees": 165.5,
  "confidenceScore": 0.92,
  "qualityFlags": ["good_lighting", "full_body_visible"],
  "algorithmVersion": "v1.0",
  "captureDurationMs": 5000
}
```

**Response (201 Created)**:
```json
{
  "id": "measurement_xyz789",
  "sessionId": "session_abc123",
  "joint": "shoulder",
  "movement": "flexion",
  "side": "right",
  "romDegrees": 165.5,
  "confidenceScore": 0.92,
  "qualityFlags": ["good_lighting", "full_body_visible"],
  "algorithmVersion": "v1.0",
  "captureDurationMs": 5000,
  "timestamp": "2026-02-08T12:34:56.789Z"
}
```

#### List Measurements

Get all measurements for a session.

```http
GET /api/sessions/:sessionId/measurements
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
[
  {
    "id": "measurement_xyz789",
    "sessionId": "session_abc123",
    "joint": "shoulder",
    "movement": "flexion",
    "side": "right",
    "romDegrees": 165.5,
    "confidenceScore": 0.92,
    "qualityFlags": ["good_lighting"],
    "algorithmVersion": "v1.0",
    "captureDurationMs": 5000,
    "timestamp": "2026-02-08T12:34:56.789Z"
  }
]
```

---

### Clinical Notes

#### Generate Note

Generate a clinical note from session measurements.

```http
POST /api/sessions/:sessionId/note
Authorization: Bearer {token}
Content-Type: application/json

{
  "format": "markdown"  // "markdown" | "plaintext"
}
```

**Response (200 OK)**:
```json
{
  "noteId": "note_123",
  "sessionId": "session_abc123",
  "content": "# ROM Assessment\n\n## Shoulder - Right\n...",
  "format": "markdown",
  "generatedAt": "2026-02-08T12:34:56.789Z"
}
```

#### Get Note

Retrieve a clinical note by ID.

```http
GET /api/notes/:noteId
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "noteId": "note_123",
  "sessionId": "session_abc123",
  "content": "# ROM Assessment\n\n## Shoulder - Right\n...",
  "format": "markdown",
  "generatedAt": "2026-02-08T12:34:56.789Z"
}
```

---

### AI Interpretation

#### Request Interpretation

Request AI-powered clinical interpretation of ROM measurements.

```http
POST /api/interpret
Content-Type: application/json

{
  "measurements": [
    {
      "joint": "shoulder",
      "movement": "flexion",
      "side": "right",
      "degrees": 145,
      "normativeMin": 150,
      "normativeMax": 180,
      "status": "restricted"
    }
  ],
  "metadata": {
    "patientAge": 45,
    "gender": "female",
    "chiefComplaint": "shoulder pain"
  }
}
```

**Request Body Types**:
- `measurements`: Array of `EnrichedMeasurement` objects
- `metadata`: Optional contextual information

**Response (200 OK)**:
```json
{
  "interpretation": "The patient demonstrates restricted shoulder flexion bilaterally...",
  "recommendations": [
    "Consider rotator cuff assessment",
    "Evaluate for adhesive capsulitis"
  ],
  "clinicalTests": [
    {
      "joint": "shoulder",
      "tests": [
        {
          "name": "Neer Impingement Test",
          "purpose": "Detect subacromial impingement",
          "procedure": "Stabilize scapula, passively flex arm...",
          "positiveSign": "Pain with forced flexion",
          "indication": ["impingement", "rotator cuff pathology"]
        }
      ]
    }
  ]
}
```

**Error Responses**:

**400 Bad Request**:
```json
{
  "error": "measurements array is required and must be non-empty"
}
```

**503 Service Unavailable**:
```json
{
  "error": "LLM API key not configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env.local"
}
```

**500 Internal Server Error**:
```json
{
  "error": "OpenAI API error: Rate limit exceeded"
}
```

---

## WebRTC Signaling

The signaling server enables dual-camera pairing for 3D ROM measurement.

### Server Details
- **Protocol**: WebSocket (Socket.io)
- **Port**: 4001
- **URL**: http://localhost:4001

### Message Flow

#### 1. Desktop: Create Room

```javascript
socket.emit('create-room');

// Response
socket.on('room-created', ({ roomId }) => {
  console.log('Room ID:', roomId); // e.g., "room_abc123"
  // Display QR code with roomId
});
```

#### 2. Phone: Join Room

```javascript
socket.emit('join-room', { roomId: 'room_abc123' });

// Response
socket.on('room-joined', () => {
  console.log('Successfully joined room');
});
```

#### 3. WebRTC Signaling

**Desktop sends offer**:
```javascript
socket.emit('offer', { roomId, offer: peerConnection.localDescription });
```

**Phone receives offer**:
```javascript
socket.on('offer', async ({ offer }) => {
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { roomId, answer });
});
```

**Desktop receives answer**:
```javascript
socket.on('answer', async ({ answer }) => {
  await peerConnection.setRemoteDescription(answer);
});
```

**ICE Candidate Exchange**:
```javascript
// Send ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', { roomId, candidate: event.candidate });
  }
};

// Receive ICE candidates
socket.on('ice-candidate', async ({ candidate }) => {
  await peerConnection.addIceCandidate(candidate);
});
```

### Signaling Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `create-room` | Client → Server | - | Request new room creation |
| `room-created` | Server → Client | `{ roomId }` | Room created successfully |
| `join-room` | Client → Server | `{ roomId }` | Join existing room |
| `room-joined` | Server → Client | - | Successfully joined room |
| `offer` | Client → Server → Client | `{ roomId, offer }` | WebRTC offer |
| `answer` | Client → Server → Client | `{ roomId, answer }` | WebRTC answer |
| `ice-candidate` | Client → Server → Client | `{ roomId, candidate }` | ICE candidate |

### QR Code Format

The QR code encodes a URL with the room ID:
```
http://localhost:2000/camera/remote?room=room_abc123
```

Phone scans QR, navigates to URL, extracts room ID, and joins via WebSocket.

---

## Data Models

### Session

```typescript
interface Session {
  id: string;
  organizationId: string;
  clinicianId: string;
  patientId?: string;
  joints: string[];
  status: 'in_progress' | 'completed' | 'cancelled';
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
```

### Measurement

```typescript
interface Measurement {
  id: string;
  sessionId: string;
  joint: string;           // 'shoulder' | 'elbow' | 'wrist' | 'hip' | 'knee' | 'ankle'
  movement: string;        // 'flexion' | 'extension' | 'abduction' | 'adduction' | 'rotation'
  side: 'left' | 'right';
  romDegrees: number;
  confidenceScore: number; // 0.0 to 1.0
  qualityFlags: string[];
  algorithmVersion: string;
  captureDurationMs: number;
  timestamp: string;       // ISO 8601
}
```

### EnrichedMeasurement

```typescript
interface EnrichedMeasurement {
  joint: string;
  movement: string;
  side: 'left' | 'right';
  degrees: number;
  normativeMin: number;
  normativeMax: number;
  status: 'normal' | 'restricted' | 'hypermobile' | 'unknown';
}
```

### Clinical Note

```typescript
interface ClinicalNote {
  noteId: string;
  sessionId: string;
  content: string;
  format: 'markdown' | 'plaintext';
  generatedAt: string; // ISO 8601
}
```

### Special Test

```typescript
interface SpecialTest {
  name: string;
  purpose: string;
  procedure: string;
  positiveSign: string;
  indication: string[];
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Missing required fields, invalid data format |
| 401 | Unauthorized | Missing or invalid authentication token |
| 404 | Not Found | Resource does not exist |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | External service (LLM API) unavailable |

### Error Examples

**Missing required field**:
```json
{
  "error": "joints array is required and must not be empty"
}
```

**Resource not found**:
```json
{
  "error": "Session not found"
}
```

**LLM API error**:
```json
{
  "error": "OpenAI API error: Rate limit exceeded"
}
```

---

## Rate Limiting

⚠️ **Not Implemented**: Rate limiting is planned for production but not enforced in MVP v0.1.0.

**Future implementation**:
- 100 requests/minute per user
- 10 AI interpretation requests/hour per organization
- 429 Too Many Requests response when exceeded

---

## CORS Configuration

**Development**:
- Allowed origins: `http://localhost:2000`
- Credentials: Enabled

**Production** (planned):
- Allowed origins: Configured via `CORS_ORIGIN` environment variable
- Credentials: Enabled
- Preflight caching: 600 seconds

---

## Testing the API

### Using cURL

**Health check**:
```bash
curl http://localhost:3000/health
```

**AI Interpretation** (requires API key in .env.local):
```bash
curl -X POST http://localhost:2000/api/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "measurements": [{
      "joint": "shoulder",
      "movement": "flexion",
      "side": "right",
      "degrees": 145,
      "normativeMin": 150,
      "normativeMax": 180,
      "status": "restricted"
    }]
  }'
```

### Using Postman

1. Import API collection (coming soon)
2. Set environment variables:
   - `BASE_URL`: http://localhost:3000
   - `WEB_URL`: http://localhost:2000
   - `JWT_TOKEN`: (obtain via login)
3. Run requests

---

## Changelog

### v0.1.0 (2026-02-08)
- ✅ AI interpretation endpoint (`POST /api/interpret`)
- ✅ WebRTC signaling server (port 4001)
- ✅ Session, measurement, and note endpoints (infrastructure ready)
- ⚠️ Authentication not enforced (development mode)

### Planned
- [ ] Enable JWT authentication
- [ ] Database persistence integration
- [ ] Rate limiting
- [ ] OpenAPI/Swagger documentation
- [ ] GraphQL API option
- [ ] Webhook support for async processing

---

## Support

For API questions or issues:
- Check [SETUP.md](./SETUP.md) for environment configuration
- Review [Architecture docs](./docs/planning-v2/03-architecture-stack.md)
- See [Troubleshooting](./SETUP.md#troubleshooting)
