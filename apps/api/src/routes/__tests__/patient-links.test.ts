import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { getRepos } from '../../repositories/repo-factory';

const TEST_USER = {
    email: `pl-test-${Date.now()}@test.com`,
    password: 'P@ssw0rd!',
    clinicName: 'PatientLink Clinic',
    role: 'clinician',
};

async function registerAndGetAuth(): Promise<{ token: string; orgId: string }> {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    return { token: res.body.token, orgId: res.body.organizationId };
}

/**
 * Create an active subscription so planGuard('solo') passes when creating links.
 */
async function grantSoloPlan(orgId: string): Promise<void> {
    const { subscriptions } = getRepos();
    await subscriptions.upsertByOrgId(orgId, {
        stripeCustomerId: `cus_test_${Date.now()}`,
        plan: 'solo',
        status: 'active',
        cancelAtPeriodEnd: false,
    });
}

describe('Patient Links routes', () => {
    let authToken: string;
    let orgId: string;

    beforeEach(async () => {
        const repos = getRepos();
        await repos.users._clear();
        await repos.orgs._clear();
        await repos.patientLinks._clear();
        await repos.subscriptions._clear();
        await repos.audit._clear();
        TEST_USER.email = `pl-test-${Date.now()}@test.com`;
        const auth = await registerAndGetAuth();
        authToken = auth.token;
        orgId = auth.orgId;
        await grantSoloPlan(orgId);
    });

    // ── POST /api/patient-links ───────────────────────────────────

    it('POST /api/patient-links — 401 without auth', async () => {
        const res = await request(app)
            .post('/api/patient-links')
            .send({ joints: ['right_shoulder'] });
        expect(res.status).toBe(401);
    });

    it('POST /api/patient-links — creates a link with token and URL', async () => {
        const res = await request(app)
            .post('/api/patient-links')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ joints: ['right_shoulder'] });

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(typeof res.body.token).toBe('string');
        expect(res.body.url).toBeDefined();
        expect(res.body.url).toContain('/patient/');
        expect(res.body.expiresAt).toBeDefined();
    });

    // ── GET /api/patient-links/:token ─────────────────────────────

    it('GET /api/patient-links/:token — returns link data for valid token', async () => {
        // Create a link first
        const createRes = await request(app)
            .post('/api/patient-links')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ joints: ['left_knee'] });

        const linkToken = createRes.body.token;

        const res = await request(app).get(`/api/patient-links/${linkToken}`);

        expect(res.status).toBe(200);
        expect(res.body.joints).toBeDefined();
        expect(res.body.sessionId).toBeDefined();
        expect(res.body.expiresAt).toBeDefined();
    });

    it('GET /api/patient-links/:token — 404 for non-existent token', async () => {
        const res = await request(app).get('/api/patient-links/nonexistent-token-abc');
        expect(res.status).toBe(404);
        expect(res.body.error).toContain('not found');
    });

    // ── POST /api/patient-links/:token/measurement ────────────────

    it('POST /api/patient-links/:token/measurement — 404 for non-existent token', async () => {
        const res = await request(app)
            .post('/api/patient-links/nonexistent-token-xyz/measurement')
            .send({
                measurements: [
                    {
                        joint: 'shoulder',
                        movement: 'flexion',
                        side: 'right',
                        romDegrees: 150,
                        confidence: 0.9,
                    },
                ],
            });
        expect(res.status).toBe(404);
    });

    it('POST /api/patient-links/:token/measurement — 201 for valid token and measurements', async () => {
        // Create a link first
        const createRes = await request(app)
            .post('/api/patient-links')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ joints: ['right_shoulder'] });

        const linkToken = createRes.body.token;

        const res = await request(app)
            .post(`/api/patient-links/${linkToken}/measurement`)
            .send({
                measurements: [
                    {
                        joint: 'shoulder',
                        movement: 'flexion',
                        side: 'right',
                        romDegrees: 155,
                        confidence: 0.93,
                    },
                ],
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('successfully');
    });

    it('POST /api/patient-links/:token/measurement — 409 when link already used', async () => {
        // Create and use a link
        const createRes = await request(app)
            .post('/api/patient-links')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ joints: ['right_shoulder'] });

        const linkToken = createRes.body.token;

        // First use — should succeed
        await request(app)
            .post(`/api/patient-links/${linkToken}/measurement`)
            .send({
                measurements: [
                    {
                        joint: 'shoulder',
                        movement: 'flexion',
                        side: 'right',
                        romDegrees: 150,
                        confidence: 0.9,
                    },
                ],
            });

        // Second use — should fail with 409
        const res = await request(app)
            .post(`/api/patient-links/${linkToken}/measurement`)
            .send({
                measurements: [
                    {
                        joint: 'shoulder',
                        movement: 'flexion',
                        side: 'right',
                        romDegrees: 150,
                        confidence: 0.9,
                    },
                ],
            });

        expect(res.status).toBe(409);
    });
});
