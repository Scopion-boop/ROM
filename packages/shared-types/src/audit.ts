/**
 * @physiolens/shared-types — Audit event contracts.
 */

import { z } from 'zod';

export const AuditActionSchema = z.enum([
  'session.created',
  'session.finalized',
  'measurement.recorded',
  'note.generated',
  'note.edited',
  'note.approved',
  'note.exported',
  'auth.login',
  'auth.logout',
  'auth.failed',
  'user.created',
  'user.role_changed',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AuditEventSchema = z.object({
  id: z.string().uuid(),
  action: AuditActionSchema,
  actorId: z.string().uuid(),
  organizationId: z.string().uuid(),
  resourceType: z.string(),
  resourceId: z.string().uuid(),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().datetime(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;
