/**
 * Auto-detect vision strategy registration.
 *
 * Registers the LiveRomCapture component as the 'auto-detect' strategy.
 * This module is imported by strategies/index.ts to trigger side-effect registration.
 */

import { registerVisionStrategy } from '../vision-strategy-registry';
import { LiveRomCapture } from '../../components/capture/LiveRomCapture';

registerVisionStrategy({
  meta: {
    key: 'auto-detect',
    label: 'Auto-Detect',
    description:
      'Automatically identifies visible joints and captures ROM measurements when movement stabilises.',
    requiresJointSelection: false,
    requiresCvBackend: false,
  },
  component: LiveRomCapture,
});
