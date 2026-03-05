import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { getRepos } from '../../repositories/repo-factory';

const ADMIN_USER = {
    email: `clinic-admin-${Date.now()}@test.com`,
    password: 'P@ssw0rd!',
    clinicName: 'Test Clinic',
    role: 'clinic_admin',
};

const CLINICIAN_USER = {
    email: `clinic-clin-${Date.now()}@test.com`,
    password: 'P@ssw0rd!',
    clinicName: 'Clinician Clinic',
    role: 'clinician',
};

async function registerAndGetToken(user: Record<string, string>): Promise<{ token: string; orgId: string }> {
    const res = await request(app).post('/api/auth/register').send(user);
    return { token: res.body.token, orgId: res.body.organizationId };
}

/**
 * Create an active subscription for an organization so planGuard('solo') passes.
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

describe('Clinic routes', () => {
    beforeEach(async () => {
        const repos = getRepos();
        await repos.users._clear();
        await repos.orgs._clear();
        await repos.subscriptions._clear();
        await repos.clinicInvites._clear();
        await repos.audit._clear();
        ADMIN_USER.email = `clinic-admin-${Date.now()}@test.com`;
        CLINICIAN_USER.email = `clinic-clin-${Date.now()}@test.com`;
    });

    // ── GET /api/clinic/clinicians ────────────────────────────────

    it('GET /api/clinic/clinicians — 401 without auth', async () => {
        const res = await request(app).get('/api/clinic/clinicians');
        expect(res.status).toBe(401);
    });

    it('GET /api/clinic/clinicians — returns clinicians list when authenticated with plan', async () => {
        const { token, orgId } = await registerAndGetToken(ADMIN_USER);
        await grantSoloPlan(orgId);

        const res = await request(app)
            .get('/api/clinic/clinicians')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.clinicians).toBeDefined();
        expect(Array.isArray(res.body.clinicians)).toBe(true);
    });

    it('GET /api/clinic/clinicians — 402 without active subscription (free plan)', async () => {
        const { token } = await registerAndGetToken(ADMIN_USER);
        // No subscription granted → free plan → planGuard blocks

        const res = await request(app)
            .get('/api/clinic/clinicians')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(402);
        expect(res.body.error).toBe('PLAN_UPGRADE_REQUIRED');
    });

    // ── GET /api/clinic/stats ─────────────────────────────────────

    it('GET /api/clinic/stats — 401 without auth', async () => {
        const res = await request(app).get('/api/clinic/stats');
        expect(res.status).toBe(401);
    });

    it('GET /api/clinic/stats — returns stats object when authenticated with plan', async () => {
        const { token, orgId } = await registerAndGetToken(ADMIN_USER);
        await grantSoloPlan(orgId);

        const res = await request(app)
            .get('/api/clinic/stats')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('totalSessionsThisMonth');
        expect(res.body).toHaveProperty('clinicianCount');
    });

    // ── POST /api/clinic/invite ───────────────────────────────────

    it('POST /api/clinic/invite — 401 without auth', async () => {
        const res = await request(app)
            .post('/api/clinic/invite')
            .send({ email: 'invite@test.com', role: 'clinician' });
        expect(res.status).toBe(401);
    });

    it('POST /api/clinic/invite — 403 without clinic_admin role', async () => {
        const { token, orgId } = await registerAndGetToken(CLINICIAN_USER);
        await grantSoloPlan(orgId);

        const res = await request(app)
            .post('/api/clinic/invite')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'someone@test.com', role: 'clinician' });

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('permissions');
    });

    it('POST /api/clinic/invite — 201 when clinic_admin with plan', async () => {
        const { token, orgId } = await registerAndGetToken(ADMIN_USER);
        await grantSoloPlan(orgId);

        const res = await request(app)
            .post('/api/clinic/invite')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: `invited-${Date.now()}@test.com`, role: 'clinician' });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('Invite sent');
        expect(res.body.inviteUrl).toBeDefined();
    });

    // ── DELETE /api/clinic/clinicians/:id ──────────────────────────

    it('DELETE /api/clinic/clinicians/:id — 401 without auth', async () => {
        const res = await request(app).delete('/api/clinic/clinicians/some-id');
        expect(res.status).toBe(401);
    });
});
