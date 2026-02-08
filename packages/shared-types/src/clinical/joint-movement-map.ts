/**
 * @rom/shared-types — Joint ↔ Movement valid combination map.
 *
 * Defines which movements are clinically applicable to each joint.
 * Used for schema validation, UI rendering, and capture flow ordering.
 */

import type { JointType } from './joints';
import type { MovementType } from './movements';

/**
 * For each joint, the ordered list of movements to measure.
 * Order reflects typical clinical exam sequence.
 */
export const JOINT_MOVEMENT_MAP: Record<JointType, readonly MovementType[]> = {
    shoulder: [
        'flexion',
        'extension',
        'abduction',
        'adduction',
        'internal_rotation',
        'external_rotation',
        'horizontal_adduction',
        'horizontal_abduction',
    ],
    elbow: ['flexion', 'extension', 'pronation', 'supination'],
    wrist: ['flexion', 'extension', 'radial_deviation', 'ulnar_deviation'],
    hip: [
        'flexion',
        'extension',
        'abduction',
        'adduction',
        'internal_rotation',
        'external_rotation',
    ],
    knee: ['flexion', 'extension'],
    ankle: ['dorsiflexion', 'plantarflexion', 'inversion', 'eversion'],
    cervical_spine: [
        'flexion',
        'extension',
        'lateral_flexion_left',
        'lateral_flexion_right',
        'rotation_left',
        'rotation_right',
    ],
    thoracic_spine: ['flexion', 'extension', 'rotation_left', 'rotation_right'],
    lumbar_spine: [
        'flexion',
        'extension',
        'lateral_flexion_left',
        'lateral_flexion_right',
        'rotation_left',
        'rotation_right',
    ],
};

/**
 * Validate that a (joint, movement) pair is clinically valid.
 */
export function isValidJointMovement(joint: JointType, movement: MovementType): boolean {
    const allowed = JOINT_MOVEMENT_MAP[joint];
    return allowed !== undefined && (allowed as readonly string[]).includes(movement);
}

/**
 * Get all valid movement types for a given joint.
 */
export function getMovementsForJoint(joint: JointType): readonly MovementType[] {
    return JOINT_MOVEMENT_MAP[joint] ?? [];
}

/**
 * Total number of unique (joint × movement) combinations.
 */
export const TOTAL_MEASUREMENT_TYPES = Object.values(JOINT_MOVEMENT_MAP).reduce(
    (sum, movements) => sum + movements.length,
    0,
);
