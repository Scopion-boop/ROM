/**
 * @rom/shared-types — Session domain contracts.
 *
 * All session-related types shared between web, API, and services.
 */

import { z } from 'zod';

// ─── Session Status ────────────────────────────────────────────────
export const SessionStatus = z.enum([
    'created',
    'capture_in_progress',
    'capture_complete',
    'review',
    'finalized',
    'exported',
    'archived',
]);
export type SessionStatus = z.infer<typeof SessionStatus>;

// ─── Session ───────────────────────────────────────────────────────
export const SessionSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    clinicianId: z.string().uuid(),
    patientId: z.string().uuid().optional(),
    status: SessionStatus,
    joints: z.array(z.string()).min(1),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    finalizedAt: z.string().datetime().optional(),
});
export type Session = z.infer<typeof SessionSchema>;

// ─── Create Session ────────────────────────────────────────────────
export const CreateSessionSchema = z.object({
    organizationId: z.string().uuid(),
    clinicianId: z.string().uuid(),
    patientId: z.string().uuid().optional(),
    joints: z.array(z.string()).min(1),
});
export type CreateSession = z.infer<typeof CreateSessionSchema>;
