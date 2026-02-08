/**
 * @rom/shared-types — Clinical domain barrel export.
 */

// Core enums
export { JointType, JOINT_TYPES, JOINT_META, type JointMeta } from './joints';
export { MovementType, MOVEMENT_TYPES, MOVEMENT_META, type MovementMeta } from './movements';

// Joint ↔ Movement mapping
export {
    JOINT_MOVEMENT_MAP,
    isValidJointMovement,
    getMovementsForJoint,
    TOTAL_MEASUREMENT_TYPES,
} from './joint-movement-map';

// Normative ranges
export {
    NORMATIVE_RANGES,
    getNormativeRange,
    compareToNormative,
    type NormativeRange,
} from './normative-ranges';

// Landmark mapping
export {
    LANDMARK_MAP,
    getLandmarkTriple,
    getSidesForJoint,
    type Side,
    type LandmarkTriple,
} from './landmark-map';
