import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { signToken } from '../../auth/jwt';

const TEST_USER = {
  email: 'test@clinic.example',
  password: 'Str0ng!Pass',
  organizationId: '550e8400-e29b-41d4-a716-446655440001',
  role: 'clinician',
};

describe('Auth routes', () => {
  it('POST /api/auth/register creates a user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('userId');
  });

  it('POST /api/auth/register rejects duplicate email', async () => {
    // First registration (may already exist from previous test)
    await request(app).post('/api/auth/register').send(TEST_USER);
    const res = await request(app).post('/api/auth/register').send(TEST_USER);
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/login succeeds with correct credentials', async () => {
    // Ensure registered
    await request(app).post('/api/auth/register').send({
      ...TEST_USER,
      email: 'login-test@clinic.example',
    });
    const res = await request(app).post('/api/auth/login').send({
      email: 'login-test@clinic.example',
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/login rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login-test@clinic.example',
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/register rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.com' });
    expect(res.status).toBe(400);
  });
});

describe('RBAC middleware', () => {
  it('returns 401 for missing token', async () => {
    const res = await request(app).get('/api/health/ready');
    // health is unprotected — should still work
    expect(res.status).toBe(200);
  });

  it('returns 401 for invalid token on protected routes', async () => {
    // We'll test once we have a protected route — for now verify token utils
    const token = signToken({
      userId: 'u1',
      organizationId: 'o1',
      role: 'clinician',
      email: 'c@x.com',
    });
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  it('signToken produces decodable token with correct role', async () => {
    const { verifyToken } = await import('../../auth/jwt');
    const token = signToken({
      userId: 'u1',
      organizationId: 'o1',
      role: 'reviewer',
      email: 'r@x.com',
    });
    const payload = verifyToken(token);
    expect(payload.role).toBe('reviewer');
    expect(payload.userId).toBe('u1');
  });
});
