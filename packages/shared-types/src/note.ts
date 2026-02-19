/**
 * @physiolens/shared-types — Note domain contracts.
 *
 * Types for clinician exam notes generated from measurements.
 */

import { z } from 'zod';
import { JointType } from './clinical/joints';
import { MovementType } from './clinical/movements';

// ─── Note Status ───────────────────────────────────────────────────
export const NoteStatus = z.enum([
    'draft',
    'reviewed',
    'finalized',
    'amended',
    'exported',
]);
export type NoteStatus = z.infer<typeof NoteStatus>;

// ─── Note Block ────────────────────────────────────────────────────
export const NoteBlockSchema = z.object({
    joint: JointType,
    movement: MovementType,
    side: z.enum(['left', 'right', 'midline']),
    romDegrees: z.number(),
    normalRomDegrees: z.number().optional(),
    percentOfNormal: z.number().optional(),
    confidenceScore: z.number(),
    qualityNote: z.string().optional(),
    clinicianComment: z.string().optional(),
});
export type NoteBlock = z.infer<typeof NoteBlockSchema>;

// ─── Note ──────────────────────────────────────────────────────────
export const NoteSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    clinicianId: z.string().uuid(),
    status: NoteStatus,
    blocks: z.array(NoteBlockSchema).min(1),
    summaryText: z.string().optional(),
    generatedAt: z.string().datetime(),
    editedAt: z.string().datetime().optional(),
    reviewedAt: z.string().datetime().optional(),
    finalizedAt: z.string().datetime().optional(),
    exportedAt: z.string().datetime().optional(),
});
export type Note = z.infer<typeof NoteSchema>;

// ─── Export Payload ────────────────────────────────────────────────
export const NoteExportPayloadSchema = z.object({
    noteId: z.string().uuid(),
    sessionId: z.string().uuid(),
    format: z.enum(['clipboard', 'pdf', 'json']),
    content: z.string(),
    exportedAt: z.string().datetime(),
    exportedBy: z.string().uuid(),
});
export type NoteExportPayload = z.infer<typeof NoteExportPayloadSchema>;
