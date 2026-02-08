import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import {
    createSession,
    getSession,
    listSessionsByOrg,
    updateSessionStatus,
} from '../repositories/session-repo';

export const sessionRouter: IRouter = Router();

sessionRouter.use(requireAuth);

/**
 * POST /api/sessions — create a new examination session.
 */
sessionRouter.post('/', (req: Request, res: Response): void => {
    const { joints, patientId } = req.body;

    if (!joints || !Array.isArray(joints) || joints.length === 0) {
        res.status(400).json({ error: 'joints array is required and must not be empty' });
        return;
    }

    const session = createSession({
        organizationId: req.user!.organizationId,
        clinicianId: req.user!.userId,
        patientId,
        joints,
    });

    res.status(201).json(session);
});

/**
 * GET /api/sessions — list sessions for the authenticated user's organization.
 */
sessionRouter.get('/', (req: Request, res: Response): void => {
    const sessions = listSessionsByOrg(req.user!.organizationId);
    res.json(sessions);
});

/**
 * GET /api/sessions/:id — get a single session.
 */
sessionRouter.get('/:id', (req: Request, res: Response): void => {
    const session = getSession(String(req.params.id));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    res.json(session);
});

/**
 * PATCH /api/sessions/:id/status — update session status.
 */
sessionRouter.patch('/:id/status', (req: Request, res: Response): void => {
    const { status } = req.body;
    if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
    }
    const session = updateSessionStatus(String(req.params.id), status);
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    res.json(session);
});
