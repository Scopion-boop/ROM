import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { getRepos } from '../../repositories/repo-factory';

const BASE_USER = {
  email: `auth-test-${Date.now()}@test.com`,
  password: 'P@ssw0rd!',
  clinicName: 'Test Clinic',
  role: 'clinician',
};

describe('Auth routes', () => {
  beforeEach(async () => {
    const repos = getRepos();
    await repos.users._clear();
    await repos.orgs._clear();
    await repos.audit._clear();
    await repos.clinicInvites._clear();
    BASE_USER.email = `auth-test-${Date.now()}@test.com`;
  });

  // ── Register ──────────────────────────────────────────────────

  it('POST /api/auth/register — success with clinicName (returns token + userId)', async () => {
    const res = await request(app).post('/api/auth/register').send(BASE_USER);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
    expect(res.body.userId).toBeDefined();
    expect(res.body.organizationId).toBeDefined();
    // Should set httpOnly cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(String(cookies)).toContain('pl_token');
  });

  it('POST /api/auth/register — 409 for duplicate email', async () => {
    const email = `dup-${Date.now()}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_USER, email });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_USER, email });

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('already exists');
  });

  it('POST /api/auth/register — 400 when missing organizationId, clinicName, and inviteToken', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `no-org-${Date.now()}@test.com`,
        password: 'P@ssw0rd!',
        role: 'clinician',
      });

    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register — 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'P@ssw0rd!',
      clinicName: 'Test',
    });

    expect(res.status).toBe(400);
  });

  it('POST /api/auth/register — clinicName auto-creates an organization', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `clinic-auto-${Date.now()}@test.com`,
        password: 'P@ssw0rd!',
        clinicName: 'Auto Created Clinic',
        role: 'clinician',
      });

    expect(res.status).toBe(201);
    expect(res.body.organizationId).toBeDefined();
    expect(typeof res.body.organizationId).toBe('string');
  });

  // ── Login ─────────────────────────────────────────────────────

  it('POST /api/auth/login — success (returns token + cookie)', async () => {
    const email = `login-ok-${Date.now()}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_USER, email });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: BASE_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.userId).toBeDefined();
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(String(cookies)).toContain('pl_token');
  });

  it('POST /api/auth/login — 401 for wrong password', async () => {
    const email = `login-bad-pw-${Date.now()}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_USER, email });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'WrongPassword1!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('POST /api/auth/login — 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: `ghost-${Date.now()}@test.com`, password: 'P@ssw0rd!' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // ── GET /me ───────────────────────────────────────────────────

  it('GET /api/auth/me — returns user data when authenticated', async () => {
    const email = `me-ok-${Date.now()}@test.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_USER, email, displayName: 'Dr. Test' });

    const token = regRes.body.token;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    // passwordHash must NOT be in response
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('GET /api/auth/me — 401 when not authenticated', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  // ── PATCH /me ─────────────────────────────────────────────────

  it('PATCH /api/auth/me — updates displayName', async () => {
    const email = `patch-me-${Date.now()}@test.com`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ ...BASE_USER, email });

    const token = regRes.body.token;
    const res = await request(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ displayName: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.displayName).toBe('Updated Name');
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('PATCH /api/auth/me — 401 when not authenticated', async () => {
    const res = await request(app).patch('/api/auth/me').send({ displayName: 'Nope' });

    expect(res.status).toBe(401);
  });

  // ── Account lockout ───────────────────────────────────────────

  describe('Account lockout', () => {
    // Each test registers its own unique user so the in-memory
    // loginAttempts map entries from one test cannot bleed into another.

    it('After 5 failed login attempts, the 6th attempt returns 429', async () => {
      const email = `lockout-trigger-${Date.now()}@test.com`;
      await request(app)
        .post('/api/auth/register')
        .send({ ...BASE_USER, email });

      // Exhaust the 5 allowed attempts (LOGIN_MAX_ATTEMPTS = 5).
      // The 5th attempt sets lockedUntil; attempts 1-5 still return 401.
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'WrongPassword1!' });
        expect(res.status).toBe(401);
      }

      // The 6th attempt must be blocked by the lockout guard.
      const lockedRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword1!' });

      expect(lockedRes.status).toBe(429);
    });

    it('A locked account returns retryAfterMs in the response body', async () => {
      const email = `lockout-retry-${Date.now()}@test.com`;
      await request(app)
        .post('/api/auth/register')
        .send({ ...BASE_USER, email });

      // Trigger the lockout.
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/auth/login').send({ email, password: 'WrongPassword1!' });
      }

      const lockedRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword1!' });

      expect(lockedRes.status).toBe(429);
      expect(lockedRes.body.retryAfterMs).toBeDefined();
      expect(typeof lockedRes.body.retryAfterMs).toBe('number');
      // retryAfterMs must be a positive value no greater than 15 minutes.
      expect(lockedRes.body.retryAfterMs).toBeGreaterThan(0);
      expect(lockedRes.body.retryAfterMs).toBeLessThanOrEqual(15 * 60 * 1000);
    });

    it('Successful login clears the failed-attempt counter', async () => {
      const email = `lockout-clear-${Date.now()}@test.com`;
      await request(app)
        .post('/api/auth/register')
        .send({ ...BASE_USER, email });

      // Accumulate 4 failures (one below the threshold that would lock).
      for (let i = 0; i < 4; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'WrongPassword1!' });
        expect(res.status).toBe(401);
      }

      // A correct login must succeed and clear the counter.
      const okRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: BASE_USER.password });
      expect(okRes.status).toBe(200);
      expect(okRes.body.token).toBeDefined();

      // After the counter is cleared, a wrong password must return 401
      // (not 429), proving the counter was reset rather than still at 4.
      const afterRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword1!' });
      expect(afterRes.status).toBe(401);
    });
  });
});
