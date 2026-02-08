import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

describe('Health routes', () => {
    it('GET /api/health returns status ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body).toHaveProperty('timestamp');
    });

    it('GET /api/health/ready returns readiness', async () => {
        const res = await request(app).get('/api/health/ready');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('ready', true);
    });

    it('GET /unknown returns 404', async () => {
        const res = await request(app).get('/does-not-exist');
        expect(res.status).toBe(404);
    });
});
