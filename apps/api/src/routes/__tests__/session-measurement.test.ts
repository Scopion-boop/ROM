import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { _clearSessions } from '../../repositories/session-repo';
import { _clearMeasurements } from '../../repositories/measurement-repo';

const TEST_USER = {
    email: `session-test-${Date.now()}@test.com`,
    password: 'P@ssw0rd!',
    organizationId: 'org-test-001',
    role: 'clinician',
};

async function getToken(): Promise<string> {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    return res.body.token;
}

describe('Session & Measurement APIs', () => {
    let token: string;

    beforeEach(async () => {
        _clearSessions();
        _clearMeasurements();
        // Re-register each time with a unique email
        TEST_USER.email = `session-test-${Date.now()}@test.com`;
        token = await getToken();
    });

    // ── Sessions ──────────────────────────────────────────────

    it('POST /api/sessions — creates a session', async () => {
        const res = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['right_shoulder'], patientId: 'patient-001' });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            status: 'created',
            joints: ['right_shoulder'],
            organizationId: 'org-test-001',
        });
        expect(res.body.id).toBeDefined();
    });

    it('POST /api/sessions — rejects empty joints', async () => {
        const res = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: [] });

        expect(res.status).toBe(400);
    });

    it('POST /api/sessions — rejects without auth', async () => {
        const res = await request(app)
            .post('/api/sessions')
            .send({ joints: ['right_shoulder'] });

        expect(res.status).toBe(401);
    });

    it('GET /api/sessions — lists org sessions', async () => {
        await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['left_knee'] });

        const res = await request(app)
            .get('/api/sessions')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/sessions/:id — returns a specific session', async () => {
        const created = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['right_knee'] });

        const res = await request(app)
            .get(`/api/sessions/${created.body.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(created.body.id);
    });

    it('GET /api/sessions/:id — 404 for non-existent session', async () => {
        const res = await request(app)
            .get('/api/sessions/nonexistent-id')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it('PATCH /api/sessions/:id/status — updates status', async () => {
        const created = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['right_elbow'] });

        const res = await request(app)
            .patch(`/api/sessions/${created.body.id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'in_progress' });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('in_progress');
    });

    // ── Measurements ──────────────────────────────────────────

    it('POST /api/sessions/:id/measurements — creates a measurement', async () => {
        const session = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['right_shoulder'] });

        const res = await request(app)
            .post(`/api/sessions/${session.body.id}/measurements`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                joint: 'right_shoulder',
                movement: 'flexion',
                side: 'right',
                romDegrees: 145,
                confidenceScore: 0.92,
                qualityFlags: [],
                algorithmVersion: 'v1.0',
                captureDurationMs: 2300,
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            joint: 'right_shoulder',
            romDegrees: 145,
            confidenceScore: 0.92,
            sessionId: session.body.id,
        });
        expect(res.body.id).toBeDefined();
    });

    it('POST /api/sessions/:id/measurements — rejects missing fields', async () => {
        const session = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['left_knee'] });

        const res = await request(app)
            .post(`/api/sessions/${session.body.id}/measurements`)
            .set('Authorization', `Bearer ${token}`)
            .send({ joint: 'left_knee' }); // missing movement, side, romDegrees

        expect(res.status).toBe(400);
    });

    it('GET /api/sessions/:id/measurements — lists session measurements', async () => {
        const session = await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['right_knee'] });

        await request(app)
            .post(`/api/sessions/${session.body.id}/measurements`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                joint: 'right_knee',
                movement: 'extension',
                side: 'right',
                romDegrees: 10,
            });

        const res = await request(app)
            .get(`/api/sessions/${session.body.id}/measurements`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBe(1);
        expect(res.body[0].joint).toBe('right_knee');
    });

    it('POST /api/sessions/:id/measurements — 404 for non-existent session', async () => {
        const res = await request(app)
            .post('/api/sessions/fake-session/measurements')
            .set('Authorization', `Bearer ${token}`)
            .send({
                joint: 'right_knee',
                movement: 'flexion',
                side: 'right',
                romDegrees: 130,
            });

        expect(res.status).toBe(404);
    });
});
