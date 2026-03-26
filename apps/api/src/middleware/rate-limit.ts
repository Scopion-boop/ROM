import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100;

export function rateLimit(
  windowMs: number = DEFAULT_WINDOW_MS,
  maxRequests: number = DEFAULT_MAX_REQUESTS,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(maxRequests - 1));
      next();
      return;
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - entry.count));
    next();
  };
}

/** Test helper */
export function _clearRateLimitStore(): void {
  store.clear();
}
