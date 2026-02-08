import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

/**
 * Attach a correlation ID and log request metadata.
 * PHI-safe: only method, path, status, and duration are logged.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.headers['x-correlation-id'] as string) ?? randomUUID();
    req.headers['x-correlation-id'] = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(
            JSON.stringify({
                correlationId,
                method: req.method,
                path: req.path,
                status: res.statusCode,
                durationMs: duration,
                timestamp: new Date().toISOString(),
            }),
        );
    });

    next();
}
