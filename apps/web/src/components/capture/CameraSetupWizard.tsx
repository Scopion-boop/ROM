/**
 * CameraSetupWizard – Multi-step wizard for ROM exam session setup.
 *
 * Steps:
 *   1. select_joint  – choose which joints (typed JointType) to measure
 *   2. camera_setup  – live WebcamCapture preview & positioning
 *   3. capture       – GuidedCaptureFlow with WebcamCapture + PoseOverlay
 *   4. review        – table of CapturedMeasurement[] before note generation
 */

'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
    Camera,
    Check,
    ArrowRight,
    ArrowLeft,
    Play,
    RotateCcw,
} from 'lucide-react';
import {
    type JointType,
    JOINT_TYPES,
    JOINT_META,
    JOINT_MOVEMENT_MAP,
} from '@rom/shared-types';
import { WebcamCapture, type WebcamCaptureHandle } from './WebcamCapture';
import { PoseOverlay, type OverlayLandmark } from './PoseOverlay';
import { GuidedCaptureFlow, type CapturedMeasurement } from './GuidedCaptureFlow';

// ─── Constants ─────────────────────────────────────────────────────

const CV_STREAM_URL =
    process.env.NEXT_PUBLIC_CV_STREAM_URL ?? 'ws://localhost:8100/api/v1/capture/stream';

type Step = 'select_joint' | 'camera_setup' | 'capture' | 'review';

const REGION_LABELS: Record<string, string> = {
    upper_extremity: 'Upper Extremity',
    lower_extremity: 'Lower Extremity',
    spine: 'Spine',
};

const REGIONS = ['upper_extremity', 'lower_extremity', 'spine'] as const;

// ─── Component ─────────────────────────────────────────────────────

export default function CameraSetupWizard({
    onComplete,
}: Readonly<{
    onComplete: (measurements: CapturedMeasurement[]) => void;
}>) {
    const [step, setStep] = useState<Step>('select_joint');
    const [selectedJoints, setSelectedJoints] = useState<JointType[]>([]);
    const [measurements, setMeasurements] = useState<CapturedMeasurement[]>([]);
    const [landmarks] = useState<OverlayLandmark[] | null>(null);

    const webcamRef = useRef<WebcamCaptureHandle | null>(null);

    const toggleJoint = (joint: JointType) => {
        setSelectedJoints((prev) =>
            prev.includes(joint) ? prev.filter((j) => j !== joint) : [...prev, joint],
        );
    };

    const handleCaptureComplete = useCallback((captured: CapturedMeasurement[]) => {
        setMeasurements(captured);
        setStep('review');
    }, []);

    // ── Step 1: Select Joints ──────────────────────────────────────
    if (step === 'select_joint') {
        return (
            <div data-testid="step-select-joint" className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 4 }}>
                    Select Joints to Measure
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
                    Choose the joints you&apos;d like to capture range-of-motion for.
                </p>

                {REGIONS.map((region) => {
                    const jointsInRegion = JOINT_TYPES.filter(
                        (j) => JOINT_META[j].region === region,
                    );
                    return (
                        <fieldset key={region} style={{ border: 0, padding: 0, margin: '0 0 20px 0' }}>
                            <legend
                                style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: 'var(--text-muted)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    marginBottom: 8,
                                }}
                            >
                                {REGION_LABELS[region]}
                            </legend>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                    gap: 8,
                                }}
                            >
                                {jointsInRegion.map((joint) => {
                                    const meta = JOINT_META[joint];
                                    const isSelected = selectedJoints.includes(joint);
                                    const movementCount = JOINT_MOVEMENT_MAP[joint]?.length ?? 0;
                                    return (
                                        <label
                                            key={joint}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                padding: '10px 14px',
                                                borderRadius: 'var(--radius-md)',
                                                border: `1px solid ${isSelected ? 'var(--border-accent)' : 'var(--border-primary)'}`,
                                                background: isSelected
                                                    ? 'var(--accent-glow)'
                                                    : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontSize: 14,
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleJoint(joint)}
                                                data-testid={`joint-${joint}`}
                                                style={{ display: 'none' }}
                                            />
                                            <span
                                                style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: 6,
                                                    border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`,
                                                    background: isSelected
                                                        ? 'var(--accent)'
                                                        : 'transparent',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s ease',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isSelected && (
                                                    <Check size={13} color="#fff" strokeWidth={3} />
                                                )}
                                            </span>
                                            <span style={{ flex: 1 }}>
                                                {meta.label}
                                                {meta.bilateral && (
                                                    <span
                                                        style={{
                                                            marginLeft: 6,
                                                            fontSize: 10,
                                                            padding: '1px 5px',
                                                            borderRadius: 4,
                                                            background: 'rgba(99,102,241,0.15)',
                                                            color: 'var(--accent-light)',
                                                        }}
                                                    >
                                                        L + R
                                                    </span>
                                                )}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                {movementCount} mov.
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>
                    );
                })}

                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        className="btn-primary"
                        disabled={selectedJoints.length === 0}
                        onClick={() => setStep('camera_setup')}
                        data-testid="btn-next-camera"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <Camera size={16} /> Camera Setup <ArrowRight size={14} />
                    </button>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {selectedJoints.length} joint{selectedJoints.length === 1 ? '' : 's'}{' '}
                        selected
                    </span>
                </div>
            </div>
        );
    }

    // ── Step 2: Camera Setup (live preview) ────────────────────────
    if (step === 'camera_setup') {
        return (
            <div data-testid="step-camera-setup" className="card" style={{ padding: 28 }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 4 }}>
                    Camera Setup
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
                    Position the camera so the patient&apos;s joints are clearly visible.
                </p>
                <div
                    style={{
                        width: '100%',
                        maxWidth: 640,
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-primary)',
                    }}
                >
                    <WebcamCapture ref={webcamRef} onStreamReady={() => { }} showDeviceSwitcher />
                </div>
                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                    <button
                        className="btn-ghost"
                        onClick={() => setStep('select_joint')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => setStep('capture')}
                        data-testid="btn-start-capture"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                        <Play size={16} /> Start Capture
                    </button>
                </div>
            </div>
        );
    }

    // ── Step 3: Capture (WebcamCapture + PoseOverlay + GuidedCaptureFlow)
    if (step === 'capture') {
        return (
            <div
                data-testid="step-capture"
                style={{ display: 'flex', gap: 20, width: '100%' }}
            >
                {/* Left: Camera feed with pose overlay */}
                <div
                    style={{
                        flex: '0 0 60%',
                        position: 'relative',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        border: '1px solid var(--border-primary)',
                        background: '#000',
                    }}
                >
                    <WebcamCapture ref={webcamRef} />
                    {webcamRef.current?.videoRef && (
                        <PoseOverlay
                            videoRef={webcamRef.current.videoRef}
                            landmarks={landmarks}
                        />
                    )}
                </div>

                {/* Right: Guided capture panel */}
                <div style={{ flex: '1 1 40%', minWidth: 300 }}>
                    <GuidedCaptureFlow
                        joints={selectedJoints}
                        mode="clinician_assisted"
                        cvStreamUrl={CV_STREAM_URL}
                        webcamRef={webcamRef}
                        onComplete={handleCaptureComplete}
                    />
                </div>
            </div>
        );
    }

    // ── Step 4: Review ─────────────────────────────────────────────
    return (
        <div data-testid="step-review" className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 4 }}>
                Review &amp; Confirm
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
                Verify captured measurements before generating the clinical note.
            </p>

            {measurements.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                    No measurements captured.
                </p>
            ) : (
                <div style={{ overflowX: 'auto', marginBottom: 20 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr
                                style={{
                                    borderBottom: '2px solid var(--border-primary)',
                                    textAlign: 'left',
                                }}
                            >
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Joint</th>
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Movement</th>
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Side</th>
                                <th
                                    style={{
                                        padding: '8px 12px',
                                        fontWeight: 600,
                                        textAlign: 'right',
                                    }}
                                >
                                    ROM°
                                </th>
                                <th
                                    style={{
                                        padding: '8px 12px',
                                        fontWeight: 600,
                                        textAlign: 'right',
                                    }}
                                >
                                    Confidence
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {measurements.map((m) => (
                                <tr
                                    key={`${m.joint}-${m.movement}-${m.side}`}
                                    style={{
                                        borderBottom: '1px solid var(--border-primary)',
                                    }}
                                >
                                    <td style={{ padding: '8px 12px' }}>
                                        {JOINT_META[m.joint]?.label ?? m.joint}
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 12px',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {m.movement.replaceAll('_', ' ')}
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 12px',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {m.side}
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 12px',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {m.romDegrees.toFixed(1)}°
                                    </td>
                                    <td
                                        style={{
                                            padding: '8px 12px',
                                            textAlign: 'right',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}
                                    >
                                        {(m.confidence * 100).toFixed(0)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
                <button
                    className="btn-primary"
                    onClick={() => onComplete(measurements)}
                    disabled={measurements.length === 0}
                    data-testid="btn-confirm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                    Confirm &amp; Generate Note <ArrowRight size={14} />
                </button>
                <button
                    className="btn-ghost"
                    onClick={() => {
                        setMeasurements([]);
                        setStep('select_joint');
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                    <RotateCcw size={14} /> Start Over
                </button>
            </div>
        </div>
    );
}
