/**
 * E2E Smoke Tests — Full User Journey
 *
 * Validates the complete API flow that a pilot user would exercise:
 *   1. Register a new clinician account
 *   2. Login and receive auth token
 *   3. Verify authenticated identity via /me
 *   4. Create a ROM session
 *   5. Add a measurement to the session
 *   6. Generate a clinical note from the session
 *   7. Retrieve dashboard statistics
 *   8. Retrieve ROM trend data
 *   9. Export the note as JSON
 *  10. Verify audit trail for the session
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app';
import { getRepos } from '../repositories/repo-factory';

const SMOKE_EMAIL = `smoke-e2e-${Date.now()}@test.com`;
const SMOKE_PASSWORD = 'Test123!@#';

describe('E2E Smoke: Full User Journey', () => {
  let token: string;
  let userId: string;
  let sessionId: string;
  let noteId: string;

  beforeAll(async () => {
    const repos = getRepos();
    await repos.users._clear();
    await repos.orgs._clear();
    await repos.sessions._clear();
    await repos.measurements._clear();
    await repos.notes._clear();
    await repos.audit._clear();
    await repos.subscriptions._clear();
  });

  // ── Step 1: Register ────────────────────────────────────────────

  it('POST /api/auth/register — registers a new clinician account', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: SMOKE_EMAIL,
      password: SMOKE_PASSWORD,
      clinicName: 'Smoke Test Clinic',
      role: 'clinician',
    });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.userId).toBeDefined();
    expect(res.body.organizationId).toBeDefined();

    // Cookie should be set
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(String(cookies)).toContain('pl_token');

    token = res.body.token;
    userId = res.body.userId;
  });

  // ── Step 2: Login ───────────────────────────────────────────────

  it('POST /api/auth/login — logs in with same credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: SMOKE_EMAIL, password: SMOKE_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.userId).toBe(userId);

    // Use the fresh login token for subsequent requests
    token = res.body.token;
  });

  // ── Step 3: Get current user ────────────────────────────────────

  it('GET /api/auth/me — returns authenticated user info', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(SMOKE_EMAIL);
    expect(res.body.role).toBe('clinician');
    expect(res.body.passwordHash).toBeUndefined();
  });

  // ── Step 4: Create a session ────────────────────────────────────

  it('POST /api/sessions — creates a ROM assessment session', async () => {
    const res = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        joints: ['left_shoulder'],
        patientId: 'smoke-patient-001',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('created');
    expect(res.body.joints).toContain('left_shoulder');

    sessionId = res.body.id;
  });

  // ── Step 5: Add a measurement ───────────────────────────────────

  it('POST /api/sessions/:sessionId/measurements — records a ROM measurement', async () => {
    const res = await request(app)
      .post(`/api/sessions/${sessionId}/measurements`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        joint: 'shoulder',
        movement: 'flexion',
        side: 'left',
        romDegrees: 165,
        confidenceScore: 0.94,
        qualityFlags: [],
        algorithmVersion: 'v1.0',
        captureDurationMs: 2100,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.joint).toBe('shoulder');
    expect(res.body.romDegrees).toBe(165);
    expect(res.body.confidenceScore).toBe(0.94);
  });

  // ── Step 6: Generate a clinical note ────────────────────────────

  it('POST /api/sessions/:sessionId/notes/generate — generates a clinical note', async () => {
    const res = await request(app)
      .post(`/api/sessions/${sessionId}/notes/generate`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.blocks).toBeDefined();
    expect(Array.isArray(res.body.blocks)).toBe(true);

    noteId = res.body.id;
  });

  // ── Step 7: Dashboard stats ─────────────────────────────────────

  it('GET /api/dashboard/stats — returns stats with at least 1 session', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalSessions');
    expect(res.body).toHaveProperty('totalMeasurements');
    expect(res.body).toHaveProperty('sessionsThisMonth');
    expect(res.body).toHaveProperty('sessionLimit');
    expect(res.body).toHaveProperty('sessionChange');
    expect(res.body.totalSessions).toBeGreaterThanOrEqual(1);
    expect(res.body.totalMeasurements).toBeGreaterThanOrEqual(1);
  });

  // ── Step 8: ROM trend ───────────────────────────────────────────

  it('GET /api/dashboard/rom-trend — returns trend data arrays', async () => {
    const res = await request(app)
      .get('/api/dashboard/rom-trend')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('dates');
    expect(res.body).toHaveProperty('avgRom');
    expect(Array.isArray(res.body.dates)).toBe(true);
    expect(Array.isArray(res.body.avgRom)).toBe(true);
    expect(res.body.dates.length).toBe(res.body.avgRom.length);
  });

  // ── Step 9: Export note as JSON ─────────────────────────────────

  it('GET /api/notes/:noteId/export/json — exports the clinical note', async () => {
    expect(noteId).toBeDefined();

    const res = await request(app)
      .get(`/api/notes/${noteId}/export/json`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.format).toBe('json');
    expect(res.body.note).toBeDefined();
    expect(res.body.note.id).toBe(noteId);
    expect(res.body.note.sessionId).toBe(sessionId);
  });

  // ── Step 10: Audit trail ────────────────────────────────────────

  it('GET /api/sessions/:sessionId/audit — contains audit events including export', async () => {
    const res = await request(app)
      .get(`/api/sessions/${sessionId}/audit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.events).toBeDefined();
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeGreaterThan(0);

    // Verify key event types present (audit queries by entityId=sessionId;
    // measurement.recorded and note.generated use their own entityIds,
    // so only session.created and note.exported appear here)
    const eventTypes = res.body.events.map((e: { eventType: string }) => e.eventType);
    expect(eventTypes).toContain('session.created');
    expect(eventTypes).toContain('note.exported');
  });
});
