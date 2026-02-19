/**
 * @rom/web — Body Detector
 *
 * Pure function that takes a PoseFrame (from pose-estimator.ts) and
 * determines which body parts / joints are currently visible to the camera.
 *
 * Algorithm:
 *   1. Iterate every entry in LANDMARK_MAP (76 triples).
 *   2. For each triple, check that all 3 landmarks have visibility ≥ threshold.
 *   3. Group passing triples by (joint, side).
 *   4. Per group, compute mean confidence across all qualifying triples.
 *   5. Return VisibleJoint[] sorted by confidence descending.
 *
 * This is a stateless, per-frame function. No React, no hooks.
 */

import { LANDMARK_MAP } from '@physiolens/shared-types';
import type { JointType, MovementType, LandmarkTriple, Side } from '@physiolens/shared-types';
import type { PoseFrame } from './pose-estimator';

// ─── Constants ─────────────────────────────────────────────────────

/** Minimum per-landmark visibility to consider the triple "visible". */
export const DEFAULT_VISIBILITY_THRESHOLD = 0.5;

// ─── Public Types ──────────────────────────────────────────────────

/** A single movement that can be measured for a visible joint. */
export interface DetectedMovement {
    movement: MovementType;
    triple: LandmarkTriple;
    /** Mean visibility of the 3 landmarks in this triple. */
    confidence: number;
}

/** A joint + side combination that the camera can currently see. */
export interface VisibleJoint {
    joint: JointType;
    side: Side;
    /** Detected movements available for this joint+side. */
    movements: DetectedMovement[];
    /** Aggregate confidence: mean of all qualifying triple confidences. */
    confidence: number;
}

// ─── Core Detection ────────────────────────────────────────────────

/** Minimal landmark shape matching MediaPipe output. */
interface LandmarkPoint {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

/**
 * Check whether all 3 landmarks in a triple are visible above the threshold.
 *
 * @returns The mean visibility of the 3 landmarks, or -1 if any is below threshold.
 */
function tripleVisibility(
    landmarks: LandmarkPoint[],
    triple: LandmarkTriple,
    threshold: number,
): number {
    const indices = [triple.proximal, triple.center, triple.distal];
    const visibilities = indices.map((i) => landmarks[i]?.visibility ?? 0);

    if (visibilities.some((v) => v < threshold)) return -1;

    return visibilities.reduce((a, b) => a + b, 0) / 3;
}

/**
 * Detect which joints are currently visible in a single pose frame.
 *
 * @param frame          PoseFrame from PoseEstimator.detect().
 * @param threshold      Per-landmark visibility threshold. Default 0.5.
 * @returns              Visible joints sorted by confidence (highest first).
 */
export function detectVisibleJoints(
    frame: PoseFrame,
    threshold = DEFAULT_VISIBILITY_THRESHOLD,
): VisibleJoint[] {
    const groupMap = new Map<string, {
        joint: JointType;
        side: Side;
        movements: DetectedMovement[];
    }>();

    // Iterate all 76 landmark triples
    for (const [key, triple] of Object.entries(LANDMARK_MAP)) {
        if (!triple) continue;
        // Key format: "joint:movement:side"
        const parts = key.split(':');
        if (parts.length < 3) continue;

        const joint = parts[0] as JointType;
        const movement = parts[1] as MovementType;
        const side = parts[2] as Side;

        // Check visibility using normalized landmarks (they have visibility scores)
        const confidence = tripleVisibility(frame.landmarks, triple, threshold);
        if (confidence < 0) continue;

        const groupKey = `${joint}:${side}`;
        let group = groupMap.get(groupKey);
        if (!group) {
            group = { joint, side, movements: [] };
            groupMap.set(groupKey, group);
        }

        group.movements.push({ movement, triple, confidence });
    }

    // Build VisibleJoint[] with aggregate confidence
    const result: VisibleJoint[] = [];
    for (const group of groupMap.values()) {
        const meanConfidence =
            group.movements.reduce((sum, m) => sum + m.confidence, 0) /
            group.movements.length;

        result.push({
            joint: group.joint,
            side: group.side,
            movements: [...group.movements].sort((a, b) => b.confidence - a.confidence),
            confidence: Math.round(meanConfidence * 1000) / 1000,
        });
    }

    // Sort by confidence descending
    return result.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Convenience: get just the unique joint types visible in a frame.
 */
export function getVisibleJointTypes(frame: PoseFrame): JointType[] {
    const joints = detectVisibleJoints(frame);
    const seen = new Set<JointType>();
    const result: JointType[] = [];
    for (const vj of joints) {
        if (!seen.has(vj.joint)) {
            seen.add(vj.joint);
            result.push(vj.joint);
        }
    }
    return result;
}
