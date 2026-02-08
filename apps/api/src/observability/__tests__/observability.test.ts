import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { incrementCounter, getCounter, getMetricsSummary, _resetCounters } from '../../observability/metrics';
import { logger } from '../../observability/logger';
import { _clearRateLimitStore } from '../../middleware/rate-limit';

beforeEach(() => {
  _resetCounters();
  _clearRateLimitStore();
});

describe('Logger', () => {
  it('should expose log level methods', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });
});

describe('Metrics', () => {
  it('should increment counters', () => {
    incrementCounter('test.requests');
    incrementCounter('test.requests');
    expect(getCounter('test.requests')).toBe(2);
  });

  it('should return 0 for unknown counters', () => {
    expect(getCounter('nonexistent')).toBe(0);
  });

  it('should produce a metrics summary with uptime', () => {
    incrementCounter('test.ops', 5);
    const summary = getMetricsSummary();
    expect(summary.uptime_seconds).toBeGreaterThanOrEqual(0);
    expect(summary.counters['test.ops']).toBe(5);
  });
});

describe('Health endpoints with metrics', () => {
  it('GET /api/health/metrics returns uptime and counters', async () => {
    const res = await request(app).get('/api/health/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uptime_seconds');
    expect(res.body).toHaveProperty('counters');
    expect(typeof res.body.uptime_seconds).toBe('number');
  });

  it('GET /api/health still returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/health/ready returns ready true', async () => {
    const res = await request(app).get('/api/health/ready');
    expect(res.status).toBe(200);
    expect(res.body.ready).toBe(true);
  });
});
