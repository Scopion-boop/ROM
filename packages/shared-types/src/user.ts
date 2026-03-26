/**
 * @physiolens/shared-types — User and auth contracts.
 */

import { z } from 'zod';

export const UserRole = z.enum(['clinic_admin', 'clinician', 'reviewer', 'support_readonly']);
export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: UserRole,
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;
