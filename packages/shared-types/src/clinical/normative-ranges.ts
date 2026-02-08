/**
 * @rom/shared-types — Normative ROM ranges.
 *
 * Normal ROM for each (joint × movement) pair.
 * Sources: AMA Guides to the Evaluation of Permanent Impairment 6th Ed,
 *          AAOS (American Academy of Orthopaedic Surgeons).
 *
 * All values in degrees. Range is [minNormal, maxNormal].
 */

import type { JointType } from './joints';
import type { MovementType } from './movements';

export interface NormativeRange {
    /** Typical minimum of normal range (usually 0). */
    minDegrees: number;
    /** Typical maximum of normal range. */
    maxDegrees: number;
    /** Reference source abbreviation. */
    source: 'AMA6' | 'AAOS';
}

type NormativeKey = `${JointType}:${MovementType}`;

/**
 * Normative ranges keyed as "joint:movement".
 * Values represent active ROM for healthy adults.
 */
export const NORMATIVE_RANGES: Partial<Record<NormativeKey, NormativeRange>> = {
    // ─── Shoulder ──────────────────────────────────────────
    'shoulder:flexion': { minDegrees: 0, maxDegrees: 180, source: 'AMA6' },
    'shoulder:extension': { minDegrees: 0, maxDegrees: 60, source: 'AMA6' },
    'shoulder:abduction': { minDegrees: 0, maxDegrees: 180, source: 'AMA6' },
    'shoulder:adduction': { minDegrees: 0, maxDegrees: 50, source: 'AMA6' },
    'shoulder:internal_rotation': { minDegrees: 0, maxDegrees: 80, source: 'AMA6' },
    'shoulder:external_rotation': { minDegrees: 0, maxDegrees: 90, source: 'AMA6' },
    'shoulder:horizontal_adduction': { minDegrees: 0, maxDegrees: 135, source: 'AAOS' },
    'shoulder:horizontal_abduction': { minDegrees: 0, maxDegrees: 45, source: 'AAOS' },

    // ─── Elbow ─────────────────────────────────────────────
    'elbow:flexion': { minDegrees: 0, maxDegrees: 150, source: 'AMA6' },
    'elbow:extension': { minDegrees: 0, maxDegrees: 0, source: 'AMA6' },
    'elbow:pronation': { minDegrees: 0, maxDegrees: 80, source: 'AMA6' },
    'elbow:supination': { minDegrees: 0, maxDegrees: 80, source: 'AMA6' },

    // ─── Wrist ─────────────────────────────────────────────
    'wrist:flexion': { minDegrees: 0, maxDegrees: 80, source: 'AMA6' },
    'wrist:extension': { minDegrees: 0, maxDegrees: 70, source: 'AMA6' },
    'wrist:radial_deviation': { minDegrees: 0, maxDegrees: 20, source: 'AMA6' },
    'wrist:ulnar_deviation': { minDegrees: 0, maxDegrees: 30, source: 'AMA6' },

    // ─── Hip ───────────────────────────────────────────────
    'hip:flexion': { minDegrees: 0, maxDegrees: 120, source: 'AMA6' },
    'hip:extension': { minDegrees: 0, maxDegrees: 30, source: 'AMA6' },
    'hip:abduction': { minDegrees: 0, maxDegrees: 45, source: 'AMA6' },
    'hip:adduction': { minDegrees: 0, maxDegrees: 30, source: 'AMA6' },
    'hip:internal_rotation': { minDegrees: 0, maxDegrees: 40, source: 'AMA6' },
    'hip:external_rotation': { minDegrees: 0, maxDegrees: 45, source: 'AMA6' },

    // ─── Knee ──────────────────────────────────────────────
    'knee:flexion': { minDegrees: 0, maxDegrees: 140, source: 'AAOS' },
    'knee:extension': { minDegrees: 0, maxDegrees: 0, source: 'AAOS' },

    // ─── Ankle ─────────────────────────────────────────────
    'ankle:dorsiflexion': { minDegrees: 0, maxDegrees: 20, source: 'AAOS' },
    'ankle:plantarflexion': { minDegrees: 0, maxDegrees: 50, source: 'AAOS' },
    'ankle:inversion': { minDegrees: 0, maxDegrees: 35, source: 'AAOS' },
    'ankle:eversion': { minDegrees: 0, maxDegrees: 25, source: 'AAOS' },

    // ─── Cervical Spine ────────────────────────────────────
    'cervical_spine:flexion': { minDegrees: 0, maxDegrees: 50, source: 'AMA6' },
    'cervical_spine:extension': { minDegrees: 0, maxDegrees: 60, source: 'AMA6' },
    'cervical_spine:lateral_flexion_left': { minDegrees: 0, maxDegrees: 45, source: 'AMA6' },
    'cervical_spine:lateral_flexion_right': { minDegrees: 0, maxDegrees: 45, source: 'AMA6' },
    'cervical_spine:rotation_left': { minDegrees: 0, maxDegrees: 80, source: 'AMA6' },
    'cervical_spine:rotation_right': { minDegrees: 0, maxDegrees: 80, source: 'AMA6' },

    // ─── Thoracic Spine ────────────────────────────────────
    'thoracic_spine:flexion': { minDegrees: 0, maxDegrees: 50, source: 'AAOS' },
    'thoracic_spine:extension': { minDegrees: 0, maxDegrees: 25, source: 'AAOS' },
    'thoracic_spine:rotation_left': { minDegrees: 0, maxDegrees: 30, source: 'AAOS' },
    'thoracic_spine:rotation_right': { minDegrees: 0, maxDegrees: 30, source: 'AAOS' },

    // ─── Lumbar Spine ──────────────────────────────────────
    'lumbar_spine:flexion': { minDegrees: 0, maxDegrees: 60, source: 'AMA6' },
    'lumbar_spine:extension': { minDegrees: 0, maxDegrees: 25, source: 'AMA6' },
    'lumbar_spine:lateral_flexion_left': { minDegrees: 0, maxDegrees: 25, source: 'AMA6' },
    'lumbar_spine:lateral_flexion_right': { minDegrees: 0, maxDegrees: 25, source: 'AMA6' },
    'lumbar_spine:rotation_left': { minDegrees: 0, maxDegrees: 30, source: 'AAOS' },
    'lumbar_spine:rotation_right': { minDegrees: 0, maxDegrees: 30, source: 'AAOS' },
};

/**
 * Look up the normative range for a joint/movement combo.
 */
export function getNormativeRange(
    joint: JointType,
    movement: MovementType,
): NormativeRange | undefined {
    return NORMATIVE_RANGES[`${joint}:${movement}`];
}

/**
 * Compare a measured angle against normative range.
 */
export function compareToNormative(
    joint: JointType,
    movement: MovementType,
    measuredDegrees: number,
): {
    withinNormal: boolean;
    percentOfNormal: number;
    deficitDegrees: number;
    normativeRange: NormativeRange | undefined;
} {
    const range = getNormativeRange(joint, movement);
    if (!range) {
        return { withinNormal: false, percentOfNormal: 0, deficitDegrees: 0, normativeRange: undefined };
    }

    const maxNormal = range.maxDegrees;
    const withinNormal = measuredDegrees >= range.minDegrees && measuredDegrees <= maxNormal;
    const percentOfNormal = maxNormal > 0 ? Math.round((measuredDegrees / maxNormal) * 100) : 100;
    const deficitDegrees = maxNormal > 0 ? Math.max(0, maxNormal - measuredDegrees) : 0;

    return { withinNormal, percentOfNormal, deficitDegrees, normativeRange: range };
}
