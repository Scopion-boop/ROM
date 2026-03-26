/**
 * @physiolens/shared-types — Clinical movement type definitions.
 *
 * Every movement pattern the platform can measure.
 * Source: AMA Guides 6th Ed, AAOS standard nomenclature.
 */

import { z } from 'zod';

export const MovementType = z.enum([
  'flexion',
  'extension',
  'abduction',
  'adduction',
  'internal_rotation',
  'external_rotation',
  'horizontal_adduction',
  'horizontal_abduction',
  'pronation',
  'supination',
  'radial_deviation',
  'ulnar_deviation',
  'dorsiflexion',
  'plantarflexion',
  'inversion',
  'eversion',
  'lateral_flexion_left',
  'lateral_flexion_right',
  'rotation_left',
  'rotation_right',
]);
export type MovementType = z.infer<typeof MovementType>;

export const MOVEMENT_TYPES = MovementType.options;

export interface MovementMeta {
  label: string;
  /** Primary plane this movement occurs in. */
  plane: 'sagittal' | 'frontal' | 'transverse';
}

export const MOVEMENT_META: Record<MovementType, MovementMeta> = {
  flexion: { label: 'Flexion', plane: 'sagittal' },
  extension: { label: 'Extension', plane: 'sagittal' },
  abduction: { label: 'Abduction', plane: 'frontal' },
  adduction: { label: 'Adduction', plane: 'frontal' },
  internal_rotation: { label: 'Internal Rotation', plane: 'transverse' },
  external_rotation: { label: 'External Rotation', plane: 'transverse' },
  horizontal_adduction: { label: 'Horizontal Adduction', plane: 'transverse' },
  horizontal_abduction: { label: 'Horizontal Abduction', plane: 'transverse' },
  pronation: { label: 'Pronation', plane: 'transverse' },
  supination: { label: 'Supination', plane: 'transverse' },
  radial_deviation: { label: 'Radial Deviation', plane: 'frontal' },
  ulnar_deviation: { label: 'Ulnar Deviation', plane: 'frontal' },
  dorsiflexion: { label: 'Dorsiflexion', plane: 'sagittal' },
  plantarflexion: { label: 'Plantarflexion', plane: 'sagittal' },
  inversion: { label: 'Inversion', plane: 'frontal' },
  eversion: { label: 'Eversion', plane: 'frontal' },
  lateral_flexion_left: { label: 'Lateral Flexion (Left)', plane: 'frontal' },
  lateral_flexion_right: { label: 'Lateral Flexion (Right)', plane: 'frontal' },
  rotation_left: { label: 'Rotation (Left)', plane: 'transverse' },
  rotation_right: { label: 'Rotation (Right)', plane: 'transverse' },
};
