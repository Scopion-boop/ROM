import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { validateBody, validateParams } from '../middleware/validation';
import { getRepos } from '../repositories/repo-factory';
import { createMeasurementSchema, sessionIdParamSchema } from '../schemas/api-schemas';

export const measurementRouter: IRouter = Router();

measurementRouter.use(requireAuth);

/**
 * POST /api/sessions/:sessionId/measurements — record a ROM measurement.
 */
measurementRouter.post(
  '/:sessionId/measurements',
  validateParams(sessionIdParamSchema),
  validateBody(createMeasurementSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { sessions, measurements, audit } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const {
      joint,
      movement,
      side,
      romDegrees,
      confidenceScore,
      qualityFlags,
      algorithmVersion,
      captureDurationMs,
    } = req.body;

    const measurement = await measurements.create({
      sessionId: session.id,
      joint,
      movement,
      side,
      romDegrees,
      confidenceScore,
      qualityFlags,
      algorithmVersion,
      captureDurationMs,
    });

    // Audit log: measurement recorded (PHI data captured)
    await audit.record({
      eventType: 'measurement.recorded',
      entityType: 'measurement',
      entityId: measurement.id,
      actorId: req.user!.userId,
      organizationId: req.user!.organizationId,
      metadata: {
        sessionId: session.id,
        joint,
        movement,
        side,
        romDegrees,
        confidenceScore: measurement.confidenceScore,
      },
    });

    res.status(201).json(measurement);
  },
);

/**
 * GET /api/sessions/:sessionId/measurements — list measurements for a session.
 */
measurementRouter.get(
  '/:sessionId/measurements',
  validateParams(sessionIdParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { sessions, measurements } = getRepos();
    const session = await sessions.getById(String(req.params.sessionId));
    if (!session || session.organizationId !== req.user!.organizationId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const list = await measurements.listBySession(session.id);
    res.json(list);
  },
);
