import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { hashPassword, comparePassword, signToken } from '../auth/jwt';
import { validateBody } from '../middleware/validation';
import { requireAuth } from '../middleware/authz';
import { getRepos } from '../repositories/repo-factory';
import { registerSchema, loginSchema } from '../schemas/api-schemas';
import { z } from 'zod';

const SENTINEL_UUID = '00000000-0000-0000-0000-000000000000';

export const authRouter: IRouter = Router();

/**
 * POST /api/auth/register
 * Body: { email, password, organizationId?, clinicName?, inviteToken?, displayName?, role? }
 *
 * One of organizationId, clinicName, or inviteToken must be provided.
 * When clinicName is provided, a new organization is created automatically.
 * When inviteToken is provided, the user joins the inviting organization.
 */
authRouter.post('/register', validateBody(registerSchema), async (req: Request, res: Response): Promise<void> => {
    const { email, password, organizationId, clinicName, inviteToken, displayName, role } = req.body;

    const { users, orgs, audit, clinicInvites } = getRepos();
    const existing = await users.getByEmail(email);
    if (existing) {
        res.status(409).json({ error: 'User already exists' });
        return;
    }

    let resolvedOrgId = organizationId as string | undefined;

    // Invite-based registration: resolve org from invite token
    if (!resolvedOrgId && inviteToken) {
        const invite = await clinicInvites.getByToken(inviteToken);
        if (!invite || new Date(invite.expiresAt) < new Date() || invite.acceptedAt) {
            res.status(400).json({ error: 'Invalid or expired invite' });
            return;
        }
        resolvedOrgId = invite.organizationId;
    }

    // Self-registration: auto-create org from clinicName
    if (!resolvedOrgId && clinicName) {
        const org = await orgs.create({ name: clinicName, billingEmail: email });
        resolvedOrgId = org.id;
    }

    if (!resolvedOrgId) {
        res.status(400).json({ error: 'Organization ID, clinic name, or invite token is required' });
        return;
    }

    const passwordHash = await hashPassword(password);
    const user = await users.create({
        email,
        passwordHash,
        organizationId: resolvedOrgId,
        role,
        displayName,
    });

    // Mark invite as accepted after successful registration
    if (inviteToken) {
        await clinicInvites.markAccepted(inviteToken);
    }

    // Audit log: user registration
    await audit.record({
        eventType: 'user.created',
        entityType: 'user',
        entityId: user.id,
        actorId: user.id, // Self-registration
        organizationId: user.organizationId,
        metadata: { email, role, selfRegistered: !!clinicName, inviteUsed: !!inviteToken },
    });

    const token = signToken({ userId: user.id, organizationId: resolvedOrgId, role, email });

    // Set httpOnly cookie
    res.cookie('pl_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
        path: '/',
        ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
    });

    res.status(201).json({ token, userId: user.id, organizationId: resolvedOrgId });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
authRouter.post('/login', validateBody(loginSchema), async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    const { users, audit } = getRepos();
    const user = await users.getByEmail(email);
    if (!user) {
        // Audit log: failed login attempt (user not found)
        await audit.record({
            eventType: 'auth.failed',
            entityType: 'auth',
            entityId: SENTINEL_UUID,
            actorId: SENTINEL_UUID,
            organizationId: SENTINEL_UUID,
            metadata: { email, reason: 'user_not_found' },
        });
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
        // Audit log: failed login attempt (invalid password)
        await audit.record({
            eventType: 'auth.failed',
            entityType: 'user',
            entityId: user.id,
            actorId: user.id,
            organizationId: user.organizationId,
            metadata: { email, reason: 'invalid_password' },
        });
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    // Audit log: successful login
    await audit.record({
        eventType: 'auth.login',
        entityType: 'user',
        entityId: user.id,
        actorId: user.id,
        organizationId: user.organizationId,
        metadata: { email },
    });

    const token = signToken({
        userId: user.id,
        organizationId: user.organizationId,
        role: user.role,
        email,
    });

    // Set httpOnly cookie
    res.cookie('pl_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000,
        path: '/',
        ...(process.env.NODE_ENV === 'production' ? { secure: true } : {}),
    });

    res.json({ token, userId: user.id });
});

/**
 * GET /api/auth/me
 * Get current user information
 */
authRouter.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { users } = getRepos();
        const user = await users.getByEmail(req.user!.email);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Omit passwordHash from response
        const { passwordHash: _passwordHash, ...userResponse } = user;
        res.json(userResponse);
    } catch (_err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

const updateMeSchema = z.object({
    displayName: z.string().min(1).max(255).optional(),
    onboardingCompleted: z.boolean().optional(),
    country: z.string().max(64).optional(),
    specialty: z.string().max(128).optional(),
});

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
authRouter.patch('/me', requireAuth, validateBody(updateMeSchema), async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.user!;
        const { users } = getRepos();
        const updated = await users.update(userId, req.body);
        if (!updated) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const { passwordHash: _, ...userResponse } = updated;
        res.json(userResponse);
    } catch (_err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

