/**
 * @rom/shared-types — Clinical joint type definitions.
 *
 * Canonical list of joints supported for ROM measurement.
 * Source: AMA Guides to the Evaluation of Permanent Impairment, 6th Ed.
 */

import { z } from 'zod';

/**
 * Every joint the platform can measure.
 * Bilateral joints use BodySide; spine joints do not.
 */
export const JointType = z.enum([
    'shoulder',
    'elbow',
    'wrist',
    'hip',
    'knee',
    'ankle',
    'cervical_spine',
    'thoracic_spine',
    'lumbar_spine',
]);
export type JointType = z.infer<typeof JointType>;

/** All joint type values as a readonly array. */
export const JOINT_TYPES = JointType.options;

/** Metadata per joint. */
export interface JointMeta {
    label: string;
    bilateral: boolean;
    region: 'upper_extremity' | 'lower_extremity' | 'spine';
}

export const JOINT_META: Record<JointType, JointMeta> = {
    shoulder: { label: 'Shoulder', bilateral: true, region: 'upper_extremity' },
    elbow: { label: 'Elbow', bilateral: true, region: 'upper_extremity' },
    wrist: { label: 'Wrist', bilateral: true, region: 'upper_extremity' },
    hip: { label: 'Hip', bilateral: true, region: 'lower_extremity' },
    knee: { label: 'Knee', bilateral: true, region: 'lower_extremity' },
    ankle: { label: 'Ankle', bilateral: true, region: 'lower_extremity' },
    cervical_spine: { label: 'Cervical Spine', bilateral: false, region: 'spine' },
    thoracic_spine: { label: 'Thoracic Spine', bilateral: false, region: 'spine' },
    lumbar_spine: { label: 'Lumbar Spine', bilateral: false, region: 'spine' },
};
