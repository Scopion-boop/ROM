import { Router } from 'express';

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
    // TODO: check DB connectivity, queue health
    res.json({ ready: true });
});
