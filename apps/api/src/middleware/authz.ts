import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../auth/jwt';

/**
 * Extend Express Request with authenticated user context.
 */
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

/**
 * Middleware: require a valid Bearer token in the Authorization header.
 * Populates req.user on success, returns 401 on failure.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header' });
        return;
    }

    try {
        const token = header.slice(7);
        req.user = verifyToken(token);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Middleware factory: restrict access to specific roles.
 * Must be used after requireAuth.
 */
export function requireRole(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
