/**
 * GuidedCaptureFlow — Orchestrates the full ROM exam capture sequence.
 *
 * Auto-cycles through each (joint, movement, side) triple in clinical
 * exam order, displaying patient instructions and capturing measurements
 * when the angle stabilises.
 *
 * Now streams pose landmarks back to the parent for PoseOverlay rendering.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Clock, RotateCcw, SkipForward, Play, Pause } from 'lucide-react';
import type {
  JointType,
  MovementType,
  BodySide,
  CapturedMeasurement,
} from '@physiolens/shared-types';
import { JOINT_MOVEMENT_MAP, getLandmarkTriple, getSidesForJoint } from '@physiolens/shared-types';
import type { WebcamCaptureHandle } from './WebcamCapture';
import type { OverlayLandmark, AngleIndicator } from './PoseOverlay';

// Re-export CapturedMeasurement from shared-types for backward compatibility
export type { CapturedMeasurement } from '@physiolens/shared-types';

// ─── Types ─────────────────────────────────────────────────────────

interface MeasurementStep {
  joint: JointType;
  movement: MovementType;
  side: BodySide;
  instruction: string;
  preferredView: string;
}

interface StreamMeasurementMsg {
  joint: string;
  movement: string;
  side: string;
  rom_degrees: number;
  smoothed_rom_degrees: number;
  confidence_score: number;
  is_stable: boolean;
  stable_for_ms: number;
  auto_captured: boolean;
}

interface StreamResponseMsg {
  frame_index: number;
  measurements: StreamMeasurementMsg[];
  pose_landmarks: OverlayLandmark[] | null;
  error?: string;
}

type ExamMode = 'clinician_assisted' | 'self_guided';

interface GuidedCaptureFlowProps {
  /** Joints to include in this exam */
  joints: JointType[];
  /** Exam mode */
  mode: ExamMode;
  /** CV service WebSocket URL */
  cvStreamUrl: string;
  /** Ref to WebcamCapture for frame capture */
  webcamRef: React.RefObject<WebcamCaptureHandle | null>;
  /** Called when all measurements are complete */
  onComplete: (measurements: CapturedMeasurement[]) => void;
  /** Called on each individual capture */
  onCapture?: (measurement: CapturedMeasurement) => void;
  /** Called each frame with pose landmarks for PoseOverlay rendering */
  onLandmarksUpdate?: (landmarks: OverlayLandmark[] | null) => void;
  /** Called each frame with angle indicator data for PoseOverlay */
  onAngleUpdate?: (angles: AngleIndicator[]) => void;
  /** Optional session_id to enable calibration offsets */
  sessionId?: string;
  className?: string;
}

// ─── Patient Instructions ──────────────────────────────────────────

const INSTRUCTION_MAP: Record<string, string> = {
  'shoulder-flexion': 'Raise your arm straight forward and up as far as you can.',
  'shoulder-extension': 'Move your arm straight backward as far as possible.',
  'shoulder-abduction': 'Raise your arm out to the side and up overhead.',
  'shoulder-adduction': 'Bring your arm across your body toward the opposite side.',
  'shoulder-internal_rotation': 'With elbow bent at 90°, rotate your forearm inward.',
  'shoulder-external_rotation': 'With elbow bent at 90°, rotate your forearm outward.',
  'elbow-flexion': 'Bend your elbow, bringing your hand toward your shoulder.',
  'elbow-extension': 'Straighten your arm fully.',
  'hip-flexion': 'Raise your knee toward your chest.',
  'hip-extension': 'Move your leg straight backward.',
  'hip-abduction': 'Move your leg out to the side.',
  'hip-adduction': 'Bring your leg across your body.',
  'knee-flexion': 'Bend your knee, bringing your heel toward your buttock.',
  'knee-extension': 'Straighten your knee fully.',
  'ankle-dorsiflexion': 'Pull your toes up toward your shin.',
  'ankle-plantarflexion': 'Point your toes downward.',
  'cervical_spine-flexion': 'Tilt your chin down toward your chest.',
  'cervical_spine-extension': 'Look up toward the ceiling.',
  'cervical_spine-lateral_flexion': 'Tilt your ear toward your shoulder.',
  'cervical_spine-rotation': 'Turn your head to look over your shoulder.',
  'thoracic_spine-rotation': 'Keep hips still and rotate your upper body.',
  'lumbar_spine-flexion': 'Bend forward at the waist.',
  'lumbar_spine-extension': 'Lean backward gently.',
  'lumbar_spine-lateral_flexion': 'Lean to the side, sliding your hand down your thigh.',
  'wrist-flexion': 'Bend your wrist, curling your fingers toward your forearm.',
  'wrist-extension': 'Bend your wrist backward, fingers pointing up.',
};

function getInstruction(joint: JointType, movement: MovementType, side: BodySide): string {
  const base = INSTRUCTION_MAP[`${joint}-${movement}`] ?? `Perform ${movement} of the ${joint}.`;
  if (side === 'left' || side === 'right') {
    return `${side.charAt(0).toUpperCase() + side.slice(1)} side: ${base}`;
  }
  return base;
}

// ─── Step Builder ──────────────────────────────────────────────────

function buildSteps(joints: JointType[]): MeasurementStep[] {
  const steps: MeasurementStep[] = [];
  for (const joint of joints) {
    const movements = JOINT_MOVEMENT_MAP[joint] ?? [];
    const sides = getSidesForJoint(joint);
    for (const movement of movements) {
      for (const side of sides) {
        const triple = getLandmarkTriple(joint, movement, side);
        steps.push({
          joint,
          movement,
          side,
          instruction: getInstruction(joint, movement, side),
          preferredView: triple?.preferredView ?? 'lateral',
        });
      }
    }
  }
  return steps;
}

// ─── Component ─────────────────────────────────────────────────────

export function GuidedCaptureFlow({
  joints,
  mode,
  cvStreamUrl,
  webcamRef,
  onComplete,
  onCapture,
  onLandmarksUpdate,
  onAngleUpdate,
  sessionId,
  className = '',
}: Readonly<GuidedCaptureFlowProps>) {
  const steps = useMemo(() => buildSteps(joints), [joints]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [captured, setCaptured] = useState<CapturedMeasurement[]>([]);
  const [isPaused, setIsPaused] = useState(mode === 'clinician_assisted');
  const [liveMeasurement, setLiveMeasurement] = useState<StreamMeasurementMsg | null>(null);
  const [autoCapturePending, setAutoCapturePending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const frameIdxRef = useRef(0);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const currentStep = steps[currentIdx];
  const isComplete = currentIdx >= steps.length;
  const progress = steps.length > 0 ? (captured.length / steps.length) * 100 : 0;

  // ── Build angle indicators from current step + live measurement ──
  const buildAngleIndicators = useCallback(
    (measurement: StreamMeasurementMsg | null): AngleIndicator[] => {
      if (!measurement || !currentStep) return [];

      const triple = getLandmarkTriple(currentStep.joint, currentStep.movement, currentStep.side);
      if (!triple) return [];

      const sideLabel =
        currentStep.side === 'midline' ? '' : `${currentStep.side.charAt(0).toUpperCase()} `;
      const jointLabel = currentStep.joint.replace('_', ' ');
      const movementLabel = currentStep.movement.replace('_', ' ');

      return [
        {
          vertexIdx: triple.center,
          armAIdx: triple.proximal,
          armBIdx: triple.distal,
          degrees: measurement.smoothed_rom_degrees,
          label: `${sideLabel}${jointLabel} ${movementLabel}`,
          isStable: measurement.is_stable,
        },
      ];
    },
    [currentStep],
  );

  // ── WebSocket stream connection ────────────────────────────────
  useEffect(() => {
    if (isComplete || !currentStep) return;

    const ws = new WebSocket(cvStreamUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      const configPayload: Record<string, unknown> = {
        joints: [currentStep.joint],
        movements: [currentStep.movement],
        sides: [currentStep.side],
        fps_target: 15,
        temporal_window: 10,
        auto_capture_threshold_degrees: 2,
        auto_capture_hold_ms: 800,
        algorithm_version: 'v1.0',
      };
      if (sessionId) {
        configPayload.session_id = sessionId;
      }
      ws.send(JSON.stringify(configPayload));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as StreamResponseMsg;

        // Forward landmarks to parent for PoseOverlay
        if (msg.pose_landmarks) {
          onLandmarksUpdate?.(msg.pose_landmarks);
        }

        if (msg.measurements && msg.measurements.length > 0) {
          const m = msg.measurements[0]!;
          setLiveMeasurement(m);

          // Build and forward angle indicators
          const indicators = buildAngleIndicators(m);
          onAngleUpdate?.(indicators);

          if (m.auto_captured && !autoCapturePending) {
            setAutoCapturePending(true);
          }
        }
      } catch {
        // Malformed message — skip
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
      // Clear overlay when switching steps
      onLandmarksUpdate?.(null);
      onAngleUpdate?.([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, cvStreamUrl, sessionId]);

  // ── Frame capture loop ─────────────────────────────────────────
  useEffect(() => {
    if (isPaused || isComplete) {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      return;
    }

    const interval = setInterval(() => {
      const frame = webcamRef.current?.captureFrame();
      if (!frame || !wsRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;

      wsRef.current.send(
        JSON.stringify({
          frame_index: frameIdxRef.current++,
          image_base64: frame,
        }),
      );
    }, 1000 / 15);

    captureIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [isPaused, isComplete, webcamRef]);

  // ── Auto-capture handler ───────────────────────────────────────
  useEffect(() => {
    if (!autoCapturePending || !liveMeasurement || !currentStep) return;

    const measurement: CapturedMeasurement = {
      joint: currentStep.joint,
      movement: currentStep.movement,
      side: currentStep.side,
      romDegrees: liveMeasurement.smoothed_rom_degrees,
      confidence: liveMeasurement.confidence_score,
      timestamp: Date.now(),
    };

    setCaptured((prev) => [...prev, measurement]);
    onCapture?.(measurement);
    setAutoCapturePending(false);
    setLiveMeasurement(null);

    const timer = setTimeout(() => {
      if (currentIdx + 1 >= steps.length) {
        onComplete([...captured, measurement]);
      } else {
        setCurrentIdx((prev) => prev + 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCapturePending]);

  // ── Manual capture ─────────────────────────────────────────────
  const manualCapture = useCallback(() => {
    if (!currentStep || !liveMeasurement) return;

    const measurement: CapturedMeasurement = {
      joint: currentStep.joint,
      movement: currentStep.movement,
      side: currentStep.side,
      romDegrees: liveMeasurement.smoothed_rom_degrees ?? liveMeasurement.rom_degrees,
      confidence: liveMeasurement.confidence_score,
      timestamp: Date.now(),
    };

    setCaptured((prev) => [...prev, measurement]);
    onCapture?.(measurement);
    setLiveMeasurement(null);

    if (currentIdx + 1 >= steps.length) {
      onComplete([...captured, measurement]);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentStep, liveMeasurement, currentIdx, steps.length, captured, onComplete, onCapture]);

  const skip = useCallback(() => {
    if (currentIdx + 1 >= steps.length) {
      onComplete(captured);
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  }, [currentIdx, steps.length, captured, onComplete]);

  const retakeLast = useCallback(() => {
    setCaptured((prev) => prev.slice(0, -1));
    setCurrentIdx((prev) => Math.max(0, prev - 1));
  }, []);

  if (isComplete) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-4)',
          padding: 'var(--space-8)',
        }}
      >
        <CheckCircle size={64} style={{ color: 'var(--data-normal)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Exam Complete
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Captured {captured.length} of {steps.length} measurements.
        </p>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      {/* Progress bar */}
      <div
        style={{
          position: 'relative',
          height: 8,
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-tertiary)',
        }}
      >
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            borderRadius: 'var(--radius-full)',
            background: 'var(--accent)',
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        Step {currentIdx + 1} of {steps.length} · {captured.length} captured
      </p>

      {/* Current instruction card */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={`${currentStep.joint}-${currentStep.movement}-${currentStep.side}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-secondary)',
              padding: 'var(--space-6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-2)',
              }}
            >
              <span
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(14,205,186,0.1)',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                }}
              >
                {currentStep.joint.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {currentStep.movement.replace('_', ' ')} · {currentStep.side}
              </span>
            </div>

            <p
              style={{
                fontSize: '1.125rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              {currentStep.instruction}
            </p>

            {/* Live measurement readout */}
            {liveMeasurement && (
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    fontVariantNumeric: 'tabular-nums',
                    color: 'var(--text-primary)',
                  }}
                >
                  {Math.round(liveMeasurement.smoothed_rom_degrees)}°
                </div>
                {liveMeasurement.is_stable ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.875rem',
                      color: 'var(--data-normal)',
                    }}
                  >
                    <CheckCircle size={16} />
                    Stable — capturing…
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '0.875rem',
                      color: 'var(--data-borderline)',
                    }}
                  >
                    <Clock size={16} />
                    Hold position…
                  </span>
                )}
              </div>
            )}

            <p
              style={{
                marginTop: 'var(--space-2)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              Preferred camera angle:{' '}
              <span style={{ color: 'var(--text-secondary)' }}>{currentStep.preferredView}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {mode === 'clinician_assisted' && (
          <button
            onClick={() => setIsPaused((p) => !p)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-primary)',
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'background var(--duration-structural) ease',
            }}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? 'Start Capture' : 'Pause'}
          </button>
        )}

        <button
          onClick={manualCapture}
          disabled={!liveMeasurement}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            border: 'none',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#000',
            cursor: liveMeasurement ? 'pointer' : 'not-allowed',
            opacity: liveMeasurement ? 1 : 0.4,
            transition: 'opacity var(--duration-structural) ease',
          }}
        >
          <CheckCircle size={16} />
          Capture
        </button>

        <button
          onClick={skip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            transition: 'background var(--duration-structural) ease',
          }}
        >
          <SkipForward size={16} />
          Skip
        </button>

        {captured.length > 0 && (
          <button
            onClick={retakeLast}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              border: 'none',
              padding: '8px 12px',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color var(--duration-structural) ease',
            }}
          >
            <RotateCcw size={16} />
            Retake
          </button>
        )}
      </div>
    </div>
  );
}
