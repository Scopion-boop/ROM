import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { requireAuth } from '../middleware/authz';
import { planGuard } from '../middleware/plan-guard';
import { validateBody, validateParams } from '../middleware/validation';
import { getRepos } from '../repositories/repo-factory';
import {
  createSessionSchema,
  updateSessionStatusSchema,
  idParamSchema,
} from '../schemas/api-schemas';
import type { SessionRecord } from '../repositories/interfaces';
import { hasExceededSessionLimit } from '../lib/plan-utils';

export const sessionRouter: IRouter = Router();

sessionRouter.use(requireAuth);

/**
 * POST /api/sessions — create a new examination session.
 */
sessionRouter.post(
  '/',
  validateBody(createSessionSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { joints, patientId } = req.body;

    // Check free-tier session limit
    const { sessions, audit, subscriptions } = getRepos();
    const sub = await subscriptions.getActiveByOrgId(req.user!.organizationId);
    const isPaid = sub?.plan === 'solo';
    if (!isPaid) {
      const org = await getRepos().orgs.getById(req.user!.organizationId);
      const monthlyCount = org?.monthlySessionCount ?? 0;
      if (hasExceededSessionLimit(null, monthlyCount)) {
        res.status(402).json({
          error: 'SESSION_LIMIT_REACHED',
          message: 'Free plan limited to 10 sessions/month. Upgrade to continue.',
        });
        return;
      }
    }

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
  },
);

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
sessionRouter.get(
  '/:id',
  validateParams(idParamSchema),
  async (req: Request, res: Response): Promise<void> => {
    const session = await getRepos().sessions.getById(String(req.params.id));
    if (!session || session.organizationId !== req.user!.organizationId) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  },
);

/**
 * PATCH /api/sessions/:id/status — update session status.
 */
sessionRouter.patch(
  '/:id/status',
  validateParams(idParamSchema),
  validateBody(updateSessionStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
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
  },
);

/**
 * GET /api/sessions/export/csv — export sessions as CSV
 */
sessionRouter.get(
  '/export/csv',
  planGuard('solo'),
  async (req: Request, res: Response): Promise<void> => {
    const { sessions } = getRepos();
    const sessionList = await sessions.listByOrg(req.user!.organizationId);

    const csvRows = [
      ['Session ID', 'Patient ID', 'Date', 'Joints', 'Status', 'Clinician ID'].join(','),
      ...sessionList.map((s: SessionRecord) =>
        [
          s.id,
          s.patientId ?? '',
          new Date(s.createdAt).toISOString(),
          Array.isArray(s.joints) ? s.joints.join('|') : '',
          s.status,
          s.clinicianId,
        ]
          .map((v: string) => `"${String(v).replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="physiolens-sessions.csv"');
    res.send(csvRows.join('\n'));
  },
);
