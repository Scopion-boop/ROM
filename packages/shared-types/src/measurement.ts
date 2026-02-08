/**
 * @rom/shared-types — Measurement domain contracts.
 *
 * Types for ROM measurements captured during sessions.
 */

import { z } from 'zod';
import { JointType } from './clinical/joints';
import { MovementType } from './clinical/movements';

// ─── Quality Flag ──────────────────────────────────────────────────
export const QualityFlagSchema = z.object({
    code: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'error']),
});
export type QualityFlag = z.infer<typeof QualityFlagSchema>;

// ─── Side ──────────────────────────────────────────────────────────
export const BodySide = z.enum(['left', 'right', 'midline']);
export type BodySide = z.infer<typeof BodySide>;

// ─── Measurement Plane ─────────────────────────────────────────────
export const MeasurementPlane = z.enum(['sagittal', 'frontal', 'transverse']);
export type MeasurementPlane = z.infer<typeof MeasurementPlane>;

// ─── Measurement ───────────────────────────────────────────────────
export const MeasurementSchema = z.object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    joint: JointType,
    movement: MovementType,
    side: BodySide,
    plane: MeasurementPlane.optional(),
    romDegrees: z.number().min(0).max(360),
    normalRomDegrees: z.number().min(0).max(360).optional(),
    percentOfNormal: z.number().min(0).max(200).optional(),
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
    joint: JointType,
    movement: MovementType,
    side: BodySide,
    plane: MeasurementPlane.optional(),
    romDegrees: z.number().min(0).max(360),
    confidenceScore: z.number().min(0).max(1),
    qualityFlags: z.array(QualityFlagSchema).default([]),
    algorithmVersion: z.string(),
    captureDurationMs: z.number().int().nonnegative(),
});
export type CreateMeasurement = z.infer<typeof CreateMeasurementSchema>;
