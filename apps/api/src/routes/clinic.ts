import { Router, type IRouter } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/authz';
import { validateBody } from '../middleware/validation';
import { planGuard } from '../middleware/plan-guard';
import { getRepos } from '../repositories/repo-factory';
import { sendInviteEmail } from '../services/email';
import crypto from 'node:crypto';

export const clinicRouter: IRouter = Router();

clinicRouter.use(requireAuth);

// GET /api/clinic/clinicians — Practice tier
clinicRouter.get('/clinicians', planGuard('solo'), async (req, res, next) => {
  try {
    const { organizationId } = req.user!;
    const { users } = getRepos();
    const clinicians = await users.listByOrg(organizationId);
    res.json({ clinicians });
  } catch (err) {
    next(err);
  }
});

// GET /api/clinic/stats — Practice tier
clinicRouter.get('/stats', planGuard('solo'), async (req, res, next) => {
  try {
    const { organizationId } = req.user!;
    const { orgs } = getRepos();
    const org = await orgs.getById(organizationId);
    res.json({
      totalSessionsThisMonth: org?.monthlySessionCount ?? 0,
      avgConfidenceScore: null,
      topJoint: null,
      clinicianCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['clinician', 'reviewer']).default('clinician'),
});

// POST /api/clinic/invite — Practice tier + admin role
clinicRouter.post(
  '/invite',
  requireRole('clinic_admin'),
  planGuard('solo'),
  validateBody(inviteSchema),
  async (req, res, next) => {
    try {
      const { organizationId, email: inviterEmail, userId } = req.user!;
      const { email, role } = req.body as { email: string; role: string };
      const { orgs, clinicInvites } = getRepos();
      const org = await orgs.getById(organizationId);
      if (!org) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const appUrl = process.env.APP_URL ?? 'http://localhost:2000';
      const inviteUrl = `${appUrl}/register?invite=${token}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await clinicInvites.create({
        token,
        organizationId,
        invitedEmail: email,
        invitedByUserId: userId,
        role,
        expiresAt,
      });

      await sendInviteEmail(email, inviterEmail, org.name, inviteUrl);
      res.status(201).json({ message: 'Invite sent', inviteUrl });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/clinic/clinicians/:id — Practice tier + admin role
clinicRouter.delete(
  '/clinicians/:id',
  requireRole('clinic_admin'),
  planGuard('solo'),
  async (req, res, next) => {
    try {
      const { organizationId, userId: actorId } = req.user!;
      const targetId = String(req.params.id);
      const { users, audit } = getRepos();

      // Cannot delete yourself
      if (targetId === actorId) {
        res.status(400).json({ error: 'Cannot remove yourself' });
        return;
      }

      // Verify target belongs to same organization
      const target = await users.getById(targetId);
      if (!target || target.organizationId !== organizationId) {
        res.status(404).json({ error: 'Clinician not found' });
        return;
      }

      // Cannot delete another admin
      if (target.role === 'clinic_admin') {
        res.status(403).json({ error: 'Cannot remove another administrator' });
        return;
      }

      await users.delete(targetId);
      await audit.record({
        eventType: 'user.removed',
        entityType: 'user',
        entityId: targetId,
        actorId,
        organizationId,
        metadata: { removedEmail: target.email, removedRole: target.role },
      });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
