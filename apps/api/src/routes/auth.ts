import { Router, Request, Response } from 'express';
import { hashPassword, comparePassword, signToken } from '../auth/jwt';

export const authRouter = Router();

/**
 * In-memory user store (placeholder until DB integration in Task 4+).
 * Maps email → { passwordHash, userId, organizationId, role }.
 */
const users: Map<string, {
    passwordHash: string;
    userId: string;
    organizationId: string;
    role: string;
}> = new Map();

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

    if (users.has(email)) {
        res.status(409).json({ error: 'User already exists' });
        return;
    }

    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();
    users.set(email, { passwordHash, userId, organizationId, role });

    const token = signToken({ userId, organizationId, role, email });
    res.status(201).json({ token, userId });
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

    const user = users.get(email);
    if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }

    const token = signToken({
        userId: user.userId,
        organizationId: user.organizationId,
        role: user.role,
        email,
    });
    res.json({ token, userId: user.userId });
});
