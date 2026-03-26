import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authz';
import { validateBody } from '../middleware/validation';
import { planGuard } from '../middleware/plan-guard';
import { getRepos } from '../repositories/repo-factory';
import crypto from 'node:crypto';

export const patientLinksRouter: IRouter = Router();

const createLinkSchema = z.object({
  sessionId: z.string().uuid().optional(),
  joints: z.array(z.string()).optional(),
});

// POST /api/patient-links
patientLinksRouter.post(
  '/',
  requireAuth,
  planGuard('solo'),
  validateBody(createLinkSchema),
  async (req, res, next) => {
    try {
      const { organizationId } = req.user!;
      const { sessionId, joints = [] } = req.body as { sessionId?: string; joints?: string[] };
      const { patientLinks } = getRepos();

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Use the interface's actual create signature
      const link = await patientLinks.create({
        sessionId: sessionId ?? crypto.randomUUID(),
        organizationId,
        joints: joints.length > 0 ? joints : [],
        expiresAt,
      });

      const appUrl = process.env.APP_URL ?? 'http://localhost:2000';
      res.status(201).json({
        token: link.token,
        url: `${appUrl}/patient/${link.token}`,
        expiresAt: link.expiresAt,
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/patient-links/:token
patientLinksRouter.get('/:token', async (req, res, next) => {
  try {
    const token = req.params.token;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Invalid token parameter' });
      return;
    }
    const { patientLinks } = getRepos();
    const link = await patientLinks.getByToken(token);
    if (!link) {
      res.status(404).json({ error: 'Link not found' });
      return;
    }
    if (link.usedAt) {
      res.status(410).json({ error: 'This link has already been used' });
      return;
    }
    if (new Date() > new Date(link.expiresAt)) {
      res.status(410).json({ error: 'This link has expired' });
      return;
    }
    res.json({ joints: link.joints, sessionId: link.sessionId, expiresAt: link.expiresAt });
  } catch (err) {
    next(err);
  }
});

const measurementSchema = z.object({
  measurements: z
    .array(
      z.object({
        joint: z.string(),
        movement: z.string(),
        side: z.string(),
        romDegrees: z.number().min(0).max(200),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1),
});

// POST /api/patient-links/:token/measurement
patientLinksRouter.post(
  '/:token/measurement',
  validateBody(measurementSchema),
  async (req, res, next) => {
    try {
      const token = req.params.token;
      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: 'Invalid token parameter' });
        return;
      }
      const { patientLinks } = getRepos();
      const link = await patientLinks.getByToken(token);
      if (!link) {
        res.status(404).json({ error: 'Link not found' });
        return;
      }
      if (link.usedAt) {
        res.status(409).json({ error: 'Already used' });
        return;
      }
      if (new Date() > new Date(link.expiresAt)) {
        res.status(410).json({ error: 'Expired' });
        return;
      }
      await patientLinks.markUsed(token);
      res.status(201).json({ message: 'Measurement submitted successfully' });
    } catch (err) {
      next(err);
    }
  },
);
