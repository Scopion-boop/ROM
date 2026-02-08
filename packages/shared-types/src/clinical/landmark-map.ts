/**
 * @rom/shared-types — MediaPipe PoseLandmarker landmark mapping.
 *
 * Maps each (joint, movement, side) triple to 3 MediaPipe landmarks:
 *   proximal, center, distal
 * The angle is measured at the CENTER landmark.
 *
 * MediaPipe Pose Landmark indices (0-32):
 *   0  nose                    11 left_shoulder    23 left_hip
 *   1  left_eye_inner          12 right_shoulder   24 right_hip
 *   2  left_eye                13 left_elbow       25 left_knee
 *   3  left_eye_outer          14 right_elbow      26 right_knee
 *   4  right_eye_inner         15 left_wrist       27 left_ankle
 *   5  right_eye               16 right_wrist      28 right_ankle
 *   6  right_eye_outer         17 left_pinky       29 left_heel
 *   7  left_ear                18 right_pinky      30 right_heel
 *   8  right_ear               19 left_index       31 left_foot_index
 *   9  mouth_left              20 right_index      32 right_foot_index
 *  10  mouth_right             21 left_thumb
 *                              22 right_thumb
 */

import type { JointType } from './joints';
import type { MovementType } from './movements';

export type Side = 'left' | 'right' | 'midline';

export interface LandmarkTriple {
    /** Landmark forming the first ray of the angle. */
    proximal: number;
    /** Landmark at the vertex of the angle. */
    center: number;
    /** Landmark forming the second ray of the angle. */
    distal: number;
    /** Which camera view is best for this measurement. */
    preferredView: 'sagittal' | 'frontal' | 'transverse';
}

type LandmarkKey = `${JointType}:${MovementType}:${Side}`;

/**
 * Landmark triples for angle calculation.
 *
 * Spine measurements use virtual midpoints calculated at runtime:
 * - "mid_shoulder" = midpoint(11, 12)
 * - "mid_hip" = midpoint(23, 24)
 * For spine, we use the closest approximation with existing landmarks.
 */
export const LANDMARK_MAP: Partial<Record<LandmarkKey, LandmarkTriple>> = {
    // ─── Shoulder ──────────────────────────────────────────
    // Flexion/Extension: sagittal plane – hip→shoulder→elbow
    'shoulder:flexion:left': { proximal: 23, center: 11, distal: 13, preferredView: 'sagittal' },
    'shoulder:flexion:right': { proximal: 24, center: 12, distal: 14, preferredView: 'sagittal' },
    'shoulder:extension:left': { proximal: 23, center: 11, distal: 13, preferredView: 'sagittal' },
    'shoulder:extension:right': { proximal: 24, center: 12, distal: 14, preferredView: 'sagittal' },
    // Abduction/Adduction: frontal plane – opposite_shoulder→shoulder→elbow
    'shoulder:abduction:left': { proximal: 12, center: 11, distal: 13, preferredView: 'frontal' },
    'shoulder:abduction:right': { proximal: 11, center: 12, distal: 14, preferredView: 'frontal' },
    'shoulder:adduction:left': { proximal: 12, center: 11, distal: 13, preferredView: 'frontal' },
    'shoulder:adduction:right': { proximal: 11, center: 12, distal: 14, preferredView: 'frontal' },
    // Internal/External Rotation: transverse plane – wrist→elbow→shoulder
    'shoulder:internal_rotation:left': { proximal: 15, center: 13, distal: 11, preferredView: 'transverse' },
    'shoulder:internal_rotation:right': { proximal: 16, center: 14, distal: 12, preferredView: 'transverse' },
    'shoulder:external_rotation:left': { proximal: 15, center: 13, distal: 11, preferredView: 'transverse' },
    'shoulder:external_rotation:right': { proximal: 16, center: 14, distal: 12, preferredView: 'transverse' },
    // Horizontal ab/adduction: transverse plane
    'shoulder:horizontal_adduction:left': { proximal: 12, center: 11, distal: 13, preferredView: 'transverse' },
    'shoulder:horizontal_adduction:right': { proximal: 11, center: 12, distal: 14, preferredView: 'transverse' },
    'shoulder:horizontal_abduction:left': { proximal: 12, center: 11, distal: 13, preferredView: 'transverse' },
    'shoulder:horizontal_abduction:right': { proximal: 11, center: 12, distal: 14, preferredView: 'transverse' },

    // ─── Elbow ─────────────────────────────────────────────
    // Flexion/Extension: sagittal – shoulder→elbow→wrist
    'elbow:flexion:left': { proximal: 11, center: 13, distal: 15, preferredView: 'sagittal' },
    'elbow:flexion:right': { proximal: 12, center: 14, distal: 16, preferredView: 'sagittal' },
    'elbow:extension:left': { proximal: 11, center: 13, distal: 15, preferredView: 'sagittal' },
    'elbow:extension:right': { proximal: 12, center: 14, distal: 16, preferredView: 'sagittal' },
    // Pronation/Supination: measure from wrist rotation – not directly observable from 2D landmarks
    // These require the phone (secondary) camera for overhead view. Use wrist→pinky as proxy axis.
    'elbow:pronation:left': { proximal: 15, center: 17, distal: 19, preferredView: 'transverse' },
    'elbow:pronation:right': { proximal: 16, center: 18, distal: 20, preferredView: 'transverse' },
    'elbow:supination:left': { proximal: 15, center: 17, distal: 19, preferredView: 'transverse' },
    'elbow:supination:right': { proximal: 16, center: 18, distal: 20, preferredView: 'transverse' },

    // ─── Wrist ─────────────────────────────────────────────
    // Flexion/Extension: sagittal – elbow→wrist→index
    'wrist:flexion:left': { proximal: 13, center: 15, distal: 19, preferredView: 'sagittal' },
    'wrist:flexion:right': { proximal: 14, center: 16, distal: 20, preferredView: 'sagittal' },
    'wrist:extension:left': { proximal: 13, center: 15, distal: 19, preferredView: 'sagittal' },
    'wrist:extension:right': { proximal: 14, center: 16, distal: 20, preferredView: 'sagittal' },
    // Radial/Ulnar deviation: frontal – elbow→wrist→index
    'wrist:radial_deviation:left': { proximal: 13, center: 15, distal: 19, preferredView: 'frontal' },
    'wrist:radial_deviation:right': { proximal: 14, center: 16, distal: 20, preferredView: 'frontal' },
    'wrist:ulnar_deviation:left': { proximal: 13, center: 15, distal: 19, preferredView: 'frontal' },
    'wrist:ulnar_deviation:right': { proximal: 14, center: 16, distal: 20, preferredView: 'frontal' },

    // ─── Hip ───────────────────────────────────────────────
    // Flexion/Extension: sagittal – shoulder→hip→knee
    'hip:flexion:left': { proximal: 11, center: 23, distal: 25, preferredView: 'sagittal' },
    'hip:flexion:right': { proximal: 12, center: 24, distal: 26, preferredView: 'sagittal' },
    'hip:extension:left': { proximal: 11, center: 23, distal: 25, preferredView: 'sagittal' },
    'hip:extension:right': { proximal: 12, center: 24, distal: 26, preferredView: 'sagittal' },
    // Abduction/Adduction: frontal – opposite_hip→hip→knee
    'hip:abduction:left': { proximal: 24, center: 23, distal: 25, preferredView: 'frontal' },
    'hip:abduction:right': { proximal: 23, center: 24, distal: 26, preferredView: 'frontal' },
    'hip:adduction:left': { proximal: 24, center: 23, distal: 25, preferredView: 'frontal' },
    'hip:adduction:right': { proximal: 23, center: 24, distal: 26, preferredView: 'frontal' },
    // Internal/External rotation: transverse – ankle→knee→hip
    'hip:internal_rotation:left': { proximal: 27, center: 25, distal: 23, preferredView: 'transverse' },
    'hip:internal_rotation:right': { proximal: 28, center: 26, distal: 24, preferredView: 'transverse' },
    'hip:external_rotation:left': { proximal: 27, center: 25, distal: 23, preferredView: 'transverse' },
    'hip:external_rotation:right': { proximal: 28, center: 26, distal: 24, preferredView: 'transverse' },

    // ─── Knee ──────────────────────────────────────────────
    // Flexion/Extension: sagittal – hip→knee→ankle
    'knee:flexion:left': { proximal: 23, center: 25, distal: 27, preferredView: 'sagittal' },
    'knee:flexion:right': { proximal: 24, center: 26, distal: 28, preferredView: 'sagittal' },
    'knee:extension:left': { proximal: 23, center: 25, distal: 27, preferredView: 'sagittal' },
    'knee:extension:right': { proximal: 24, center: 26, distal: 28, preferredView: 'sagittal' },

    // ─── Ankle ─────────────────────────────────────────────
    // Dorsiflexion/Plantarflexion: sagittal – knee→ankle→foot_index
    'ankle:dorsiflexion:left': { proximal: 25, center: 27, distal: 31, preferredView: 'sagittal' },
    'ankle:dorsiflexion:right': { proximal: 26, center: 28, distal: 32, preferredView: 'sagittal' },
    'ankle:plantarflexion:left': { proximal: 25, center: 27, distal: 31, preferredView: 'sagittal' },
    'ankle:plantarflexion:right': { proximal: 26, center: 28, distal: 32, preferredView: 'sagittal' },
    // Inversion/Eversion: frontal – knee→ankle→foot_index
    'ankle:inversion:left': { proximal: 25, center: 27, distal: 31, preferredView: 'frontal' },
    'ankle:inversion:right': { proximal: 26, center: 28, distal: 32, preferredView: 'frontal' },
    'ankle:eversion:left': { proximal: 25, center: 27, distal: 31, preferredView: 'frontal' },
    'ankle:eversion:right': { proximal: 26, center: 28, distal: 32, preferredView: 'frontal' },

    // ─── Cervical Spine ────────────────────────────────────
    // Uses ear and shoulder landmarks as proxy
    'cervical_spine:flexion:midline': { proximal: 0, center: 11, distal: 23, preferredView: 'sagittal' },
    'cervical_spine:extension:midline': { proximal: 0, center: 11, distal: 23, preferredView: 'sagittal' },
    'cervical_spine:lateral_flexion_left:midline': { proximal: 7, center: 0, distal: 8, preferredView: 'frontal' },
    'cervical_spine:lateral_flexion_right:midline': { proximal: 8, center: 0, distal: 7, preferredView: 'frontal' },
    'cervical_spine:rotation_left:midline': { proximal: 0, center: 7, distal: 11, preferredView: 'transverse' },
    'cervical_spine:rotation_right:midline': { proximal: 0, center: 8, distal: 12, preferredView: 'transverse' },

    // ─── Thoracic Spine ────────────────────────────────────
    // Approximate with shoulder→mid_spine→hip
    'thoracic_spine:flexion:midline': { proximal: 11, center: 23, distal: 25, preferredView: 'sagittal' },
    'thoracic_spine:extension:midline': { proximal: 11, center: 23, distal: 25, preferredView: 'sagittal' },
    'thoracic_spine:rotation_left:midline': { proximal: 11, center: 12, distal: 24, preferredView: 'transverse' },
    'thoracic_spine:rotation_right:midline': { proximal: 12, center: 11, distal: 23, preferredView: 'transverse' },

    // ─── Lumbar Spine ──────────────────────────────────────
    // Approximate with shoulder→hip→knee
    'lumbar_spine:flexion:midline': { proximal: 11, center: 23, distal: 25, preferredView: 'sagittal' },
    'lumbar_spine:extension:midline': { proximal: 11, center: 23, distal: 25, preferredView: 'sagittal' },
    'lumbar_spine:lateral_flexion_left:midline': { proximal: 11, center: 23, distal: 12, preferredView: 'frontal' },
    'lumbar_spine:lateral_flexion_right:midline': { proximal: 12, center: 24, distal: 11, preferredView: 'frontal' },
    'lumbar_spine:rotation_left:midline': { proximal: 11, center: 23, distal: 24, preferredView: 'transverse' },
    'lumbar_spine:rotation_right:midline': { proximal: 12, center: 24, distal: 23, preferredView: 'transverse' },
};

/**
 * Look up the landmark triple for a (joint, movement, side) measurement.
 */
export function getLandmarkTriple(
    joint: JointType,
    movement: MovementType,
    side: Side,
): LandmarkTriple | undefined {
    return LANDMARK_MAP[`${joint}:${movement}:${side}`];
}

/**
 * Determine the preferred side(s) for a joint.
 */
export function getSidesForJoint(joint: JointType): readonly Side[] {
    const spineJoints: JointType[] = ['cervical_spine', 'thoracic_spine', 'lumbar_spine'];
    if (spineJoints.includes(joint)) return ['midline'] as const;
    return ['left', 'right'] as const;
}
