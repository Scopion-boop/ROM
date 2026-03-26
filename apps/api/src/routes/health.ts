import { Router, type IRouter } from 'express';
import { getMetricsSummary } from '../observability/metrics';
import { checkDbHealth } from '../db/connection';

export const healthRouter: IRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: '@physiolens/api',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
  });
});

healthRouter.get('/ready', async (_req, res) => {
  // Readiness: verifies the service can accept traffic.
  // Check database connectivity if configured.
  const dbHealth = await checkDbHealth();

  if (!dbHealth.healthy) {
    res.status(503).json({
      ready: false,
      checks: {
        database: { healthy: false, error: dbHealth.error },
      },
    });
    return;
  }

  res.json({
    ready: true,
    checks: {
      database: { healthy: true },
    },
  });
});

healthRouter.get('/metrics', (_req, res) => {
  res.json(getMetricsSummary());
});
