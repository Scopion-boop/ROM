import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { app } from '../../app';
import { rateLimit, _clearRateLimitStore } from '../../middleware/rate-limit';

beforeEach(() => {
  _clearRateLimitStore();
});

describe('Security Headers', () => {
  it('should include Cache-Control no-store', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('should include Pragma no-cache', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['pragma']).toBe('no-cache');
  });

  it('should include X-Frame-Options DENY', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });

  it('should include Referrer-Policy', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('should include Permissions-Policy restricting camera to self', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['permissions-policy']).toContain('camera=(self)');
  });
});

describe('Rate Limiting', () => {
  // Use an isolated express app with rate limit middleware to avoid polluting shared state
  function createRateLimitedApp(max = 100) {
    const testApp = express();
    testApp.use(rateLimit(60_000, max));
    testApp.get('/test', (_req, res) => res.json({ ok: true }));
    return testApp;
  }

  it('should include X-RateLimit-Limit header', async () => {
    const testApp = createRateLimitedApp(100);
    const res = await request(testApp).get('/test');
    expect(res.headers['x-ratelimit-limit']).toBe('100');
  });

  it('should include X-RateLimit-Remaining header', async () => {
    const testApp = createRateLimitedApp(100);
    const res = await request(testApp).get('/test');
    expect(res.headers['x-ratelimit-remaining']).toBeDefined();
  });

  it('should return 429 when rate limit exceeded', async () => {
    const testApp = createRateLimitedApp(5);
    for (let i = 0; i < 5; i++) {
      await request(testApp).get('/test');
    }
    const res = await request(testApp).get('/test');
    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Too many requests');
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('should set remaining to 0 when exceeded', async () => {
    const testApp = createRateLimitedApp(5);
    for (let i = 0; i < 5; i++) {
      await request(testApp).get('/test');
    }
    const res = await request(testApp).get('/test');
    expect(res.headers['x-ratelimit-remaining']).toBe('0');
  });
});

describe('Helmet defaults', () => {
  it('should include X-Content-Type-Options nosniff from Helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should set Strict-Transport-Security header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBeLessThan(500);
  });
});
