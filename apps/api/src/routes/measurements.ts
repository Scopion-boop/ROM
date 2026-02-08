import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { getRepos } from '../repositories/repo-factory';

export const measurementRouter: IRouter = Router();

measurementRouter.use(requireAuth);

/**
 * POST /api/sessions/:sessionId/measurements — record a ROM measurement.
 */
measurementRouter.post('/:sessionId/measurements', async (req: Request, res: Response): Promise<void> => {
    const { sessions, measurements } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    const { joint, movement, side, romDegrees, confidenceScore, qualityFlags, algorithmVersion, captureDurationMs } = req.body;

    if (joint === undefined || movement === undefined || side === undefined || romDegrees === undefined) {
        res.status(400).json({ error: 'joint, movement, side, and romDegrees are required' });
        return;
    }

    const measurement = await measurements.create({
        sessionId: session.id,
        joint,
        movement,
        side,
        romDegrees,
        confidenceScore: confidenceScore ?? 0,
        qualityFlags: qualityFlags ?? [],
        algorithmVersion: algorithmVersion ?? 'v1.0',
        captureDurationMs: captureDurationMs ?? 0,
    });

    res.status(201).json(measurement);
});

/**
 * GET /api/sessions/:sessionId/measurements — list measurements for a session.
 */
measurementRouter.get('/:sessionId/measurements', async (req: Request, res: Response): Promise<void> => {
    const { sessions, measurements } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    const list = await measurements.listBySession(session.id);
    res.json(list);
});
