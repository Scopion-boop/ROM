/**
 * @rom/shared-types — Measurement domain contracts.
 *
 * Types for ROM measurements captured during sessions.
 */

import { z } from 'zod';

// ─── Quality Flag ──────────────────────────────────────────────────
export const QualityFlagSchema = z.object({
    code: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'error']),
});
export type QualityFlag = z.infer<typeof QualityFlagSchema>;

// ─── Side ──────────────────────────────────────────────────────────
export const BodySide = z.enum(['left', 'right']);
export type BodySide = z.infer<typeof BodySide>;

// ─── Measurement ───────────────────────────────────────────────────
export const MeasurementSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    joint: z.string(),
    movement: z.string(),
    side: BodySide,
    romDegrees: z.number().min(0).max(360),
    confidenceScore: z.number().min(0).max(1),
    qualityFlags: z.array(QualityFlagSchema),
    algorithmVersion: z.string(),
    captureDurationMs: z.number().int().nonnegative(),
    createdAt: z.string().datetime(),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

// ─── Create Measurement ────────────────────────────────────────────
export const CreateMeasurementSchema = z.object({
    sessionId: z.string().uuid(),
    joint: z.string(),
    movement: z.string(),
    side: BodySide,
    romDegrees: z.number().min(0).max(360),
    confidenceScore: z.number().min(0).max(1),
    qualityFlags: z.array(QualityFlagSchema).default([]),
    algorithmVersion: z.string(),
    captureDurationMs: z.number().int().nonnegative(),
});
export type CreateMeasurement = z.infer<typeof CreateMeasurementSchema>;
