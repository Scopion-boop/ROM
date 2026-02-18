import { Router, Request, Response } from 'express';
import type { IRouter } from 'express';
import { hashPassword, comparePassword, signToken } from '../auth/jwt';
import { getRepos } from '../repositories/repo-factory';

export const authRouter: IRouter = Router();

/**
 * POST /api/auth/register
 * Body: { email, password, organizationId, role }
 */
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
    const { email, password, organizationId, role } = req.body;

    if (!email || !password || !organizationId || !role) {
        res.status(400).json({ error: 'email, password, organizationId, and role are required' });
        return;
    }

    const { users, audit } = getRepos();
    const existing = await users.getByEmail(email);
    if (existing) {
        res.status(409).json({ error: 'User already exists' });
        return;
    }

    const passwordHash = await hashPassword(password);
    const user = await users.create({ email, passwordHash, organizationId, role });

    // Audit log: user registration
    await audit.record({
        eventType: 'user.created',
        entityType: 'user',
        entityId: user.id,
        actorId: user.id, // Self-registration
        organizationId: user.organizationId,
        metadata: { email, role },
    });

    const token = signToken({ userId: user.id, organizationId, role, email });
    res.status(201).json({ token, userId: user.id });
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'email and password are required' });
        return;
    }

    const { users, audit } = getRepos();
    const user = await users.getByEmail(email);
    if (!user) {
        // Audit log: failed login attempt (user not found)
        await audit.record({
            eventType: 'auth.failed',
            entityType: 'auth',
            entityId: 'unknown',
            actorId: 'unknown',
            organizationId: 'unknown',
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
    res.json({ token, userId: user.id });
});
