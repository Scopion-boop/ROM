import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app';

describe('Billing routes', () => {
  it('GET /api/billing/subscription requires auth', async () => {
    const res = await request(app).get('/api/billing/subscription');
    expect(res.status).toBe(401);
  });

  it('POST /api/billing/checkout requires auth', async () => {
    const res = await request(app).post('/api/billing/checkout').send({ priceId: 'price_test' });
    expect(res.status).toBe(401);
  });

  it('POST /api/billing/portal requires auth', async () => {
    const res = await request(app).post('/api/billing/portal');
    expect(res.status).toBe(401);
  });
});
