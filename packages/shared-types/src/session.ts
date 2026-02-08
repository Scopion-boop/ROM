/**
 * @rom/shared-types — Session domain contracts.
 *
 * All session-related types shared between web, API, and services.
 */

import { z } from 'zod';
import { JointType } from './clinical/joints';

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

// ─── Exam Mode ─────────────────────────────────────────────────────
export const ExamMode = z.enum([
    'clinician_assisted',
    'self_guided',
]);
export type ExamMode = z.infer<typeof ExamMode>;

// ─── Session ───────────────────────────────────────────────────────
export const SessionSchema = z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    clinicianId: z.string().uuid(),
    patientId: z.string().uuid().optional(),
    status: SessionStatus,
    examMode: ExamMode.default('clinician_assisted'),
    joints: z.array(JointType).min(1),
    requiresClinicianReview: z.boolean().default(true),
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
    joints: z.array(JointType).min(1),
    examMode: ExamMode.default('clinician_assisted'),
});
export type CreateSession = z.infer<typeof CreateSessionSchema>;
