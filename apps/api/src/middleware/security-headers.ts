import type { Request, Response, NextFunction } from 'express';

/**
 * Additional security headers beyond what Helmet provides.
 * Specifically for healthcare/PHI contexts.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Prevent caching of PHI responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Prevent MIME type sniffing (defense-in-depth with Helmet)
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Frame protection (defense-in-depth with Helmet CSP)
  res.setHeader('X-Frame-Options', 'DENY');

  // Referrer policy — do not leak PHI through referrer headers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy — restrict powerful browser features
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');

  next();
}
