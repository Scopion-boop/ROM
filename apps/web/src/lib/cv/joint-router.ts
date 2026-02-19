/**
 * @rom/web — Joint Router
 *
 * Routes a measurement specification (joint + movement + side)
 * to the correct MediaPipe landmark triple, extracts the 3D
 * coordinates from the PoseLandmarker result, and computes the
 * ROM angle.
 */

import type { JointType, MovementType } from '@physiolens/shared-types';
import { LANDMARK_MAP, getLandmarkTriple, type LandmarkTriple, type Side } from '@physiolens/shared-types';
import { computeAngle, type Point3D } from './angle-calculator';

/** The full result of routing + computing one measurement. */
export interface MeasurementReading {
    joint: JointType;
    movement: MovementType;
    side: Side;
    angleDeg: number;
    mode: '2d' | '3d';
    confidenceScore: number;
    qualityFlags: QualityFlag[];
    landmarkTriple: LandmarkTriple;
}

export interface QualityFlag {
    code: string;
    message: string;
    severity: 'warning' | 'error';
}

/** Minimal landmark interface matching MediaPipe's NormalizedLandmark / Landmark. */
interface LandmarkPoint {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

/**
 * Extract a Point3D from a landmarks array by index.
 * Falls back to {0,0,0} if index is out of range (shouldn't happen with MediaPipe 33 landmarks).
 */
function extractPoint(landmarks: LandmarkPoint[], index: number): Point3D {
    const lm = landmarks[index];
    if (!lm) return { x: 0, y: 0, z: 0 };
    return { x: lm.x, y: lm.y, z: lm.z };
}

/**
 * Assess quality of the three landmarks used for angle computation.
 */
function assessQuality(landmarks: LandmarkPoint[], triple: LandmarkTriple): QualityFlag[] {
    const flags: QualityFlag[] = [];
    const indices = [triple.proximal, triple.center, triple.distal];

    const visibilities = indices.map((i) => landmarks[i]?.visibility ?? 0);
    const minVis = Math.min(...visibilities);

    if (minVis < 0.5) {
        flags.push({
            code: 'LOW_VISIBILITY',
            message: `Minimum landmark visibility is ${minVis.toFixed(2)} (< 0.5 threshold)`,
            severity: 'warning',
        });
    }

    if (minVis < 0.2) {
        flags.push({
            code: 'OCCLUSION',
            message: 'Severe occlusion detected — measurement may be unreliable',
            severity: 'error',
        });
    }

    return flags;
}

/**
 * Compute a single ROM measurement from raw landmark data.
 *
 * @param joint   JointType enum value (e.g. 'shoulder')
 * @param movement MovementType enum value (e.g. 'flexion')
 * @param side     'left' | 'right' | 'midline'
 * @param worldLandmarks 33 world landmarks from PoseLandmarker (meters, 3D)
 * @param normalizedLandmarks 33 normalized landmarks (used for 2D fallback and visibility)
 * @param prefer3D Whether to prefer 3D computation. Default: true.
 * @returns MeasurementReading or null if no landmark mapping exists.
 */
export function computeMeasurement(
    joint: JointType,
    movement: MovementType,
    side: Side,
    worldLandmarks: LandmarkPoint[],
    normalizedLandmarks: LandmarkPoint[],
    prefer3D = true,
): MeasurementReading | null {
    const triple = getLandmarkTriple(joint, movement, side);
    if (!triple) return null;

    // Use world landmarks (meters) for 3D, normalized for 2D fallback
    const sourceForAngle = prefer3D ? worldLandmarks : normalizedLandmarks;

    const proximal = extractPoint(sourceForAngle, triple.proximal);
    const center = extractPoint(sourceForAngle, triple.center);
    const distal = extractPoint(sourceForAngle, triple.distal);

    const { angleDeg, mode } = computeAngle(proximal, center, distal, prefer3D);

    // Quality assessment uses normalized landmarks (they have visibility scores)
    const qualityFlags = assessQuality(normalizedLandmarks, triple);

    // Confidence = mean visibility of the 3 landmarks
    const indices = [triple.proximal, triple.center, triple.distal];
    const meanVisibility =
        indices.reduce((sum, i) => sum + (normalizedLandmarks[i]?.visibility ?? 0), 0) / 3;

    let confidenceScore = Math.round(meanVisibility * 1000) / 1000;

    // Reduce confidence if quality errors exist
    const errorCount = qualityFlags.filter((f) => f.severity === 'error').length;
    if (errorCount > 0) {
        confidenceScore = Math.round(confidenceScore * 0.5 * 1000) / 1000;
    }

    return {
        joint,
        movement,
        side,
        angleDeg: Math.round(angleDeg * 100) / 100,
        mode,
        confidenceScore,
        qualityFlags,
        landmarkTriple: triple,
    };
}

/**
 * Get all valid sides for a joint×movement combination.
 * Utility for the UI to know which sides have landmark mappings.
 */
export function getAvailableSides(
    joint: JointType,
    movement: MovementType,
): Side[] {
    const sides: Side[] = ['left', 'right', 'midline'];
    return sides.filter((s) => getLandmarkTriple(joint, movement, s) !== undefined);
}

/**
 * Get the total number of mapped landmark triples.
 */
export function getMappedMeasurementCount(): number {
    return Object.keys(LANDMARK_MAP).length;
}
