import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { getRepos } from '../../repositories/repo-factory';

const TEST_USER = {
    email: `dash-test-${Date.now()}@test.com`,
    password: 'P@ssw0rd!',
    clinicName: 'Dashboard Clinic',
    role: 'clinician',
};

async function getToken(): Promise<string> {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    return res.body.token;
}

describe('Dashboard routes', () => {
    let token: string;

    beforeEach(async () => {
        const repos = getRepos();
        await repos.users._clear();
        await repos.orgs._clear();
        await repos.sessions._clear();
        await repos.measurements._clear();
        await repos.subscriptions._clear();
        await repos.audit._clear();
        TEST_USER.email = `dash-test-${Date.now()}@test.com`;
        token = await getToken();
    });

    // ── GET /api/dashboard/stats ──────────────────────────────────

    it('GET /api/dashboard/stats — 401 without auth', async () => {
        const res = await request(app).get('/api/dashboard/stats');
        expect(res.status).toBe(401);
    });

    it('GET /api/dashboard/stats — returns stats object with expected shape', async () => {
        const res = await request(app)
            .get('/api/dashboard/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('totalSessions');
        expect(res.body).toHaveProperty('totalMeasurements');
        expect(res.body).toHaveProperty('sessionsThisMonth');
        expect(res.body).toHaveProperty('sessionLimit');
        expect(res.body).toHaveProperty('sessionChange');
        expect(typeof res.body.totalSessions).toBe('number');
        expect(typeof res.body.totalMeasurements).toBe('number');
    });

    it('GET /api/dashboard/stats — totalSessions increments after creating a session', async () => {
        // Create a session
        await request(app)
            .post('/api/sessions')
            .set('Authorization', `Bearer ${token}`)
            .send({ joints: ['right_shoulder'] });

        const res = await request(app)
            .get('/api/dashboard/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.totalSessions).toBeGreaterThanOrEqual(1);
    });

    // ── GET /api/dashboard/rom-trend ──────────────────────────────

    it('GET /api/dashboard/rom-trend — 401 without auth', async () => {
        const res = await request(app).get('/api/dashboard/rom-trend');
        expect(res.status).toBe(401);
    });

    it('GET /api/dashboard/rom-trend — returns trend data with dates and avgRom arrays', async () => {
        const res = await request(app)
            .get('/api/dashboard/rom-trend')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.dates)).toBe(true);
        expect(Array.isArray(res.body.avgRom)).toBe(true);
        expect(res.body.dates.length).toBe(res.body.avgRom.length);
    });

    it('GET /api/dashboard/rom-trend?days=7 — respects days param', async () => {
        const res = await request(app)
            .get('/api/dashboard/rom-trend?days=7')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.dates.length).toBe(7);
        expect(res.body.avgRom.length).toBe(7);
    });

    it('GET /api/dashboard/rom-trend?days=90 — caps at 90 days', async () => {
        const res = await request(app)
            .get('/api/dashboard/rom-trend?days=90')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.dates.length).toBe(90);
    });

    it('GET /api/dashboard/rom-trend — defaults to 30 days when no param', async () => {
        const res = await request(app)
            .get('/api/dashboard/rom-trend')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.dates.length).toBe(30);
    });
});
