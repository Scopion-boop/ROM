/**
 * @physiolens/shared-types — Capture domain contracts.
 *
 * Defines the universal interface that any vision strategy must satisfy
 * to plug into the CameraSetupWizard capture step. This allows multiple
 * vision intelligence implementations to be developed independently
 * (on separate branches) and swapped into the main application.
 *
 * Architecture:
 *   CameraSetupWizard → renders <ActiveVisionStrategy {...strategyProps} />
 *   Each strategy (guided, auto-detect, ML-based, etc.) implements
 *   VisionStrategyProps and registers itself in VISION_STRATEGY_REGISTRY.
 */

import { z } from 'zod';
import { JointType } from './clinical/joints';
import { MovementType } from './clinical/movements';
import { BodySide } from './measurement';

// ─── CapturedMeasurement ───────────────────────────────────────────
// The universal output shape any vision strategy must produce.
// This is the sole contract between the capture layer and the rest of the app.

export const CapturedMeasurementSchema = z.object({
    /** Which joint was measured */
    joint: JointType,
    /** Which movement was performed */
    movement: MovementType,
    /** Body side */
    side: BodySide,
    /** Computed ROM angle in degrees */
    romDegrees: z.number().min(0).max(360),
    /** Confidence score 0–1 */
    confidence: z.number().min(0).max(1),
    /** Capture timestamp (Date.now()) */
    timestamp: z.number(),
});

export type CapturedMeasurement = z.infer<typeof CapturedMeasurementSchema>;

// ─── Vision Strategy Metadata ──────────────────────────────────────

export interface VisionStrategyMeta {
    /** Unique key for the strategy (e.g. 'guided', 'auto-detect') */
    key: string;
    /** Human-readable label */
    label: string;
    /** Description shown in strategy picker */
    description: string;
    /** Whether this strategy requires pre-selecting joints */
    requiresJointSelection: boolean;
    /** Whether this strategy needs a WebSocket CV backend */
    requiresCvBackend: boolean;
}

// ─── Built-in Strategy Keys ────────────────────────────────────────

export const VISION_STRATEGY_KEYS = ['guided', 'auto-detect'] as const;
export type VisionStrategyKey = (typeof VISION_STRATEGY_KEYS)[number];
