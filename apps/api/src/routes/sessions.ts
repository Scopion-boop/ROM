import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { getRepos } from '../repositories/repo-factory';

export const sessionRouter: IRouter = Router();

sessionRouter.use(requireAuth);

/**
 * POST /api/sessions — create a new examination session.
 */
sessionRouter.post('/', async (req: Request, res: Response): Promise<void> => {
    const { joints, patientId } = req.body;

    if (!joints || !Array.isArray(joints) || joints.length === 0) {
        res.status(400).json({ error: 'joints array is required and must not be empty' });
        return;
    }

    const { sessions, audit } = getRepos();
    const session = await sessions.create({
        organizationId: req.user!.organizationId,
        clinicianId: req.user!.userId,
        patientId,
        joints,
    });

    // Audit log: session creation (PHI access initiation)
    await audit.record({
        eventType: 'session.created',
        entityType: 'session',
        entityId: session.id,
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        metadata: { joints, patientId: patientId || 'anonymous' },
    });

    res.status(201).json(session);
});

/**
 * GET /api/sessions — list sessions for the authenticated user's organization.
 */
sessionRouter.get('/', async (req: Request, res: Response): Promise<void> => {
    const sessions = await getRepos().sessions.listByOrg(req.user!.organizationId);
    res.json(sessions);
});

/**
 * GET /api/sessions/:id — get a single session.
 */
sessionRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const session = await getRepos().sessions.getById(String(req.params.id));
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }
    res.json(session);
});

/**
 * PATCH /api/sessions/:id/status — update session status.
 */
sessionRouter.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    if (!status) {
        res.status(400).json({ error: 'status is required' });
        return;
    }
    const { sessions, audit } = getRepos();
    const session = await sessions.updateStatus(String(req.params.id), status);
    if (!session || session.organizationId !== req.user!.organizationId) {
        res.status(404).json({ error: 'Session not found' });
        return;
    }

    // Audit log: session status change (especially finalization)
    await audit.record({
        eventType: status === 'finalized' ? 'session.finalized' : 'session.status_updated',
        entityType: 'session',
        entityId: session.id,
        actorId: req.user!.userId,
        organizationId: req.user!.organizationId,
        metadata: { status, previousStatus: 'updated' },
    });

    res.json(session);
});
