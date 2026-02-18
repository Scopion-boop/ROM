/**
 * Zod validation schemas for API requests.
 *
 * Centralized location for all request validation schemas used across routes.
 */

import { z } from 'zod';
import { commonSchemas, sanitizeString, validateArray } from '../middleware/validation';

// ── Session Schemas ──────────────────────────────────────────────────

export const createSessionSchema = z.object({
    joints: validateArray(sanitizeString(50), 1, 10).describe('Array of joint names to assess'),
    patientId: sanitizeString(100).optional().describe('Optional patient identifier'),
});

export const updateSessionStatusSchema = z.object({
    status: commonSchemas.sessionStatus.describe('New session status'),
});

export const sessionIdParamSchema = z.object({
    sessionId: commonSchemas.uuid.or(commonSchemas.nonEmptyString).describe('Session ID'),
});

// ── Measurement Schemas ──────────────────────────────────────────────

export const createMeasurementSchema = z.object({
    joint: sanitizeString(50).describe('Joint being measured (e.g., "shoulder", "knee")'),
    movement: sanitizeString(50).describe('Movement type (e.g., "flexion", "abduction")'),
    side: commonSchemas.side.describe('Body side (left or right)'),
    romDegrees: commonSchemas.romDegrees.describe('Range of motion measurement in degrees'),
    confidenceScore: commonSchemas.confidenceScore
        .default(0)
        .describe('Algorithm confidence score (0-1)'),
    qualityFlags: validateArray(sanitizeString(50), 0, 20)
        .default([])
        .describe('Quality indicators array'),
    algorithmVersion: sanitizeString(20).default('v1.0').describe('CV algorithm version'),
    captureDurationMs: z
        .number()
        .int()
        .nonnegative()
        .default(0)
        .describe('Capture duration in milliseconds'),
});

export const measurementIdParamSchema = z.object({
    measurementId: commonSchemas.uuid.or(commonSchemas.nonEmptyString).describe('Measurement ID'),
});

// ── Note Schemas ─────────────────────────────────────────────────────

export const generateNoteSchema = z.object({
    format: z.enum(['markdown', 'plaintext']).default('markdown').describe('Note output format'),
});

export const updateNoteBlocksSchema = z.object({
    blocks: validateArray(
        z.object({
            type: z.string(),
            content: z.string(),
        }),
        1,
        100,
    ).describe('Array of note content blocks'),
});

export const updateNoteStatusSchema = z.object({
    status: z
        .enum(['draft', 'reviewed', 'finalized'])
        .describe('Note status for clinical workflow'),
});

export const noteIdParamSchema = z.object({
    noteId: commonSchemas.uuid.or(commonSchemas.nonEmptyString).describe('Note ID'),
});

// ── Auth Schemas ─────────────────────────────────────────────────────

export const registerSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }).describe('User email'),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters' })
        .max(128, { message: 'Password too long' })
        .describe('User password'),
    organizationId: sanitizeString(100).optional().describe('Organization ID for multi-tenancy'),
    role: z
        .enum(['clinician', 'admin', 'viewer'])
        .default('clinician')
        .describe('User role'),
});

export const loginSchema = z.object({
    username: z.string().email({ message: 'Invalid email address' }).describe('User email'),
    password: z.string().min(1, { message: 'Password required' }).describe('User password'),
});

// ── Export/Audit Schemas ─────────────────────────────────────────────

export const exportFormatParamSchema = z.object({
    format: z.enum(['json', 'text', 'pdf']).describe('Export format'),
});

export const auditQuerySchema = z.object({
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(z.number().positive().max(1000).optional())
        .describe('Maximum number of audit events to return'),
    offset: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : undefined))
        .pipe(z.number().nonnegative().optional())
        .describe('Number of audit events to skip'),
});

// ── Type exports for TypeScript inference ────────────────────────────

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionStatusInput = z.infer<typeof updateSessionStatusSchema>;
export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type GenerateNoteInput = z.infer<typeof generateNoteSchema>;
export type UpdateNoteBlocksInput = z.infer<typeof updateNoteBlocksSchema>;
export type UpdateNoteStatusInput = z.infer<typeof updateNoteStatusSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AuditQueryParams = z.infer<typeof auditQuerySchema>;
