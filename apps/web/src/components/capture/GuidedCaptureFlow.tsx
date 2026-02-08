/**
 * GuidedCaptureFlow — Orchestrates the full ROM exam capture sequence.
 *
 * Auto-cycles through each (joint, movement, side) triple in clinical
 * exam order, displaying patient instructions and capturing measurements
 * when the angle stabilises.
 *
 * Supports both clinician-assisted (physician controls flow) and
 * self-guided (patient follows on-screen instructions) modes.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    RotateCcw,
    SkipForward,
    Play,
    Pause,
} from 'lucide-react';
import type {
    JointType,
    MovementType,
    BodySide,
} from '@rom/shared-types';
import {
    JOINT_MOVEMENT_MAP,
    getLandmarkTriple,
    getSidesForJoint,
} from '@rom/shared-types';
import type { WebcamCaptureHandle } from './WebcamCapture';

// ─── Types ─────────────────────────────────────────────────────────

export interface CapturedMeasurement {
    joint: JointType;
    movement: MovementType;
    side: BodySide;
    romDegrees: number;
    confidence: number;
    timestamp: number;
}

interface MeasurementStep {
    joint: JointType;
    movement: MovementType;
    side: BodySide;
    instruction: string;
    preferredView: string;
}

interface StreamMeasurement {
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
    const base = INSTRUCTION_MAP[`${joint}-${movement}`]
        ?? `Perform ${movement} of the ${joint}.`;
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
    className = '',
}: Readonly<GuidedCaptureFlowProps>) {
    const steps = useMemo(() => buildSteps(joints), [joints]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [captured, setCaptured] = useState<CapturedMeasurement[]>([]);
    const [isPaused, setIsPaused] = useState(mode === 'clinician_assisted');
    const [liveMeasurement, setLiveMeasurement] = useState<StreamMeasurement | null>(null);
    const [autoCapturePending, setAutoCapturePending] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const frameIdxRef = useRef(0);
    const captureIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

    const currentStep = steps[currentIdx];
    const isComplete = currentIdx >= steps.length;
    const progress = steps.length > 0 ? (captured.length / steps.length) * 100 : 0;

    // ── WebSocket stream connection ────────────────────────────────
    useEffect(() => {
        if (isComplete || !currentStep) return;

        const ws = new WebSocket(cvStreamUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(
                JSON.stringify({
                    joints: [currentStep.joint],
                    movements: [currentStep.movement],
                    sides: [currentStep.side],
                    fps_target: 15,
                    temporal_window: 10,
                    auto_capture_threshold_degrees: 2,
                    auto_capture_hold_ms: 800,
                    algorithm_version: 'v1.0',
                }),
            );
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.measurements && msg.measurements.length > 0) {
                const m = msg.measurements[0] as StreamMeasurement;
                setLiveMeasurement(m);

                if (m.auto_captured && !autoCapturePending) {
                    setAutoCapturePending(true);
                }
            }
        };

        return () => {
            ws.close();
            wsRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIdx, cvStreamUrl]);

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

    // TODO: Wire angleIndicators to PoseOverlay callback when parent supports it
    // See getLandmarkTriple(joint, movement, side) → { center, proximal, distal }

    if (isComplete) {
        return (
            <div className={`flex flex-col items-center gap-4 p-8 ${className}`}>
                <CheckCircle className="h-16 w-16 text-green-400" />
                <h2 className="text-xl font-bold text-white">Exam Complete</h2>
                <p className="text-gray-400">
                    Captured {captured.length} of {steps.length} measurements.
                </p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-4 ${className}`}>
            {/* Progress bar */}
            <div className="relative h-2 rounded-full bg-gray-700">
                <motion.div
                    className="absolute left-0 top-0 h-full rounded-full bg-blue-500"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>
            <p className="text-xs text-gray-500">
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
                        className="rounded-xl border border-gray-700 bg-gray-800 p-6"
                    >
                        <div className="mb-2 flex items-center gap-2">
                            <span className="rounded bg-blue-900/50 px-2 py-0.5 text-xs font-semibold text-blue-300 uppercase">
                                {currentStep.joint.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-500">
                                {currentStep.movement.replace('_', ' ')} · {currentStep.side}
                            </span>
                        </div>

                        <p className="text-lg font-medium text-white leading-snug">
                            {currentStep.instruction}
                        </p>

                        {/* Live measurement readout */}
                        {liveMeasurement && (
                            <div className="mt-4 flex items-center gap-4">
                                <div className="text-3xl font-bold tabular-nums text-white">
                                    {Math.round(liveMeasurement.smoothed_rom_degrees)}°
                                </div>
                                {liveMeasurement.is_stable ? (
                                    <span className="flex items-center gap-1 text-sm text-green-400">
                                        <CheckCircle className="h-4 w-4" />
                                        Stable — capturing…
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-sm text-yellow-400">
                                        <Clock className="h-4 w-4" />
                                        Hold position…
                                    </span>
                                )}
                            </div>
                        )}

                        <p className="mt-2 text-xs text-gray-500">
                            Preferred camera angle: <span className="text-gray-400">{currentStep.preferredView}</span>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center gap-3">
                {mode === 'clinician_assisted' && (
                    <button
                        onClick={() => setIsPaused((p) => !p)}
                        className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600 transition-colors"
                    >
                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        {isPaused ? 'Start Capture' : 'Pause'}
                    </button>
                )}

                <button
                    onClick={manualCapture}
                    disabled={!liveMeasurement}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <CheckCircle className="h-4 w-4" />
                    Capture
                </button>

                <button
                    onClick={skip}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600 transition-colors"
                >
                    <SkipForward className="h-4 w-4" />
                    Skip
                </button>

                {captured.length > 0 && (
                    <button
                        onClick={retakeLast}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Retake
                    </button>
                )}
            </div>
        </div>
    );
}
