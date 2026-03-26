/**
 * GuidedStrategy — registers the existing GuidedCaptureFlow as the
 * "guided" vision strategy in the pluggable vision registry.
 *
 * This is the original step-by-step approach: pre-select joints,
 * cycle through each (joint, movement, side) triple, stream frames
 * to the Python CV backend via WebSocket.
 */

'use client';

import { GuidedCaptureFlow } from '../../components/capture/GuidedCaptureFlow';
import { registerVisionStrategy, type VisionStrategyProps } from '../vision-strategy-registry';

const CV_STREAM_URL =
  process.env.NEXT_PUBLIC_CV_STREAM_URL ?? 'ws://localhost:8100/api/v1/capture/stream';

/**
 * Adapter component that wraps GuidedCaptureFlow to satisfy VisionStrategyProps.
 */
function GuidedStrategyAdapter({
  joints,
  webcamRef,
  onComplete,
  onCapture,
  onLandmarksUpdate,
  onAngleUpdate,
  className,
}: Readonly<VisionStrategyProps>) {
  return (
    <GuidedCaptureFlow
      joints={joints ?? []}
      mode="clinician_assisted"
      cvStreamUrl={CV_STREAM_URL}
      webcamRef={webcamRef}
      onComplete={onComplete}
      onCapture={onCapture}
      onLandmarksUpdate={onLandmarksUpdate}
      onAngleUpdate={onAngleUpdate}
      className={className}
    />
  );
}

// ── Register on import ─────────────────────────────────────────────

registerVisionStrategy({
  meta: {
    key: 'guided',
    label: 'Step-by-Step Guided',
    description:
      'Pre-select joints, then cycle through each movement with real-time guidance. Streams to CV backend.',
    requiresJointSelection: true,
    requiresCvBackend: true,
  },
  component: GuidedStrategyAdapter,
});

export default GuidedStrategyAdapter;
