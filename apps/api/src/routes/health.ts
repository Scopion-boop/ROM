import { Router } from 'express';
import { getMetricsSummary } from '../observability/metrics';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        service: '@rom/api',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? '0.1.0',
    });
});

healthRouter.get('/ready', (_req, res) => {
    // Readiness: verifies the service can accept traffic.
    // Phase B will add DB connectivity and queue health checks.
    res.json({ ready: true });
});

healthRouter.get('/metrics', (_req, res) => {
    res.json(getMetricsSummary());
});
