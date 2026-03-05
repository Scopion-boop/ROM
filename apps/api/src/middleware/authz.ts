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
            plan?: string;
        }
    }
}

/**
 * Middleware: require a valid JWT.
 *
 * Resolution order:
 *   1. Authorization: Bearer <token>  (API / test clients)
 *   2. pl_token httpOnly cookie       (browser sessions)
 *
 * Populates req.user on success, returns 401 on failure.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    // 1. Try Authorization header first
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            req.user = verifyToken(header.slice(7));
            return next();
        } catch { /* fall through to cookie */ }
    }

    // 2. Fallback: check httpOnly cookie
    const cookieToken = req.cookies?.pl_token;
    if (cookieToken) {
        try {
            req.user = verifyToken(cookieToken);
            return next();
        } catch { /* invalid cookie */ }
    }

    res.status(401).json({ error: 'Missing or invalid authorization' });
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
