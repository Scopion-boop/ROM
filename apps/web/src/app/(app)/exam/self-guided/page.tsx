/**
 * /exam/self-guided - Patient self-guided ROM exam page.
 *
 * Displays large, clear instructions for the patient to follow
 * while capturing ROM measurements automatically via the webcam.
 * Designed for pre-consultation passive ROM data collection.
 */

'use client';

import { Suspense, useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Activity, CheckCircle, User } from 'lucide-react';
import type { JointType } from '@physiolens/shared-types';
import { WebcamCapture, type WebcamCaptureHandle } from '@/components/capture/WebcamCapture';
import { PoseOverlay, type OverlayLandmark } from '@/components/capture/PoseOverlay';
import {
    GuidedCaptureFlow,
    type CapturedMeasurement,
} from '@/components/capture/GuidedCaptureFlow';

const CV_STREAM_URL = process.env.NEXT_PUBLIC_CV_WS_URL ?? 'ws://localhost:8000/api/v1/capture/stream';

// Default joints for a standard self-guided exam
const DEFAULT_JOINTS: JointType[] = [
    'shoulder',
    'elbow',
    'hip',
    'knee',
];

function SelfGuidedExamContent() {
    const searchParams = useSearchParams();
    const patientToken = searchParams.get('token');
    const jointsParam = searchParams.get('joints');
    const joints: JointType[] = jointsParam
        ? (jointsParam.split(',') as JointType[])
        : DEFAULT_JOINTS;

    const webcamRef = useRef<WebcamCaptureHandle>(null);
    const [landmarks] = useState<OverlayLandmark[] | null>(null);
    const [phase, setPhase] = useState<'intro' | 'capturing' | 'complete'>('intro');
    const [results, setResults] = useState<CapturedMeasurement[]>([]);

    const handleComplete = useCallback(async (measurements: CapturedMeasurement[]) => {
        setResults(measurements);
        setPhase('complete');

        // POST results to API for clinician review if patient token present
        if (patientToken) {
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            try {
                await fetch(`${API}/api/patient-links/${patientToken}/measurement`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ measurements, completedAt: new Date().toISOString() }),
                });
            } catch {
                // Silently handle error - still show completion
            }
        }
    }, [patientToken]);

    if (phase === 'intro') {
        return (
            <div
                style={{
                    display: 'flex',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-primary)',
                    padding: '2rem',
                    textAlign: 'center',
                }}
            >
                <div style={{ maxWidth: '32rem' }}>
                    <User style={{ margin: '0 auto', height: 64, width: 64, color: 'var(--accent)' }} />
                    <h1
                        style={{
                            marginTop: '1.5rem',
                            fontSize: '1.875rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}
                    >
                        Self-Guided ROM Assessment
                    </h1>
                    <p
                        style={{
                            marginTop: '1rem',
                            fontSize: '1.125rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                        }}
                    >
                        You&apos;ll be guided through a series of movements. Follow the
                        on-screen instructions and hold each position until the
                        measurement is captured automatically.
                    </p>

                    <div
                        style={{
                            marginTop: '2rem',
                            borderRadius: '12px',
                            background: 'var(--bg-secondary)',
                            padding: '1.5rem',
                            textAlign: 'left',
                            border: '1px solid var(--border-primary)',
                        }}
                    >
                        <h3
                            style={{
                                marginBottom: '0.75rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                            }}
                        >
                            Before you begin:
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {[
                                'Wear comfortable, fitted clothing',
                                'Stand 6-8 feet from the camera',
                                'Ensure good lighting - face a window if possible',
                                'Stop if you feel sharp pain',
                            ].map((item) => (
                                <li
                                    key={item}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.5rem',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.875rem',
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    <CheckCircle
                                        style={{
                                            marginTop: '0.125rem',
                                            height: 16,
                                            width: 16,
                                            flexShrink: 0,
                                            color: 'var(--success)',
                                        }}
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => setPhase('capturing')}
                        style={{
                            marginTop: '2rem',
                            borderRadius: '12px',
                            background: 'var(--accent)',
                            padding: '1rem 2rem',
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            color: '#000',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'background 200ms',
                        }}
                    >
                        Begin Assessment
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'complete') {
        return (
            <div
                style={{
                    display: 'flex',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-primary)',
                    padding: '2rem',
                    textAlign: 'center',
                }}
            >
                <CheckCircle style={{ height: 80, width: 80, color: 'var(--success)' }} />
                <h1
                    style={{
                        marginTop: '1.5rem',
                        fontSize: '1.875rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                    }}
                >
                    Assessment Complete
                </h1>

                {patientToken ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                            {results.length} measurements captured
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Your physiotherapist will review your results and be in touch.
                        </div>
                    </div>
                ) : (
                    <>
                        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
                            {results.length} measurements captured. Your clinician will review
                            these results at your next appointment.
                        </p>

                        <div
                            style={{
                                marginTop: '2rem',
                                width: '100%',
                                maxWidth: '28rem',
                                borderRadius: '12px',
                                background: 'var(--bg-secondary)',
                                padding: '1.5rem',
                                border: '1px solid var(--border-primary)',
                            }}
                        >
                            <h3
                                style={{
                                    marginBottom: '1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                Summary
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {results.map((r, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                            {r.side !== 'midline' ? `${r.side} ` : ''}{r.joint} {r.movement}
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                            }}
                                        >
                                            {Math.round(r.romDegrees)}°
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Capturing phase
    return (
        <div
            style={{
                display: 'flex',
                minHeight: '100vh',
                flexDirection: 'column',
                background: 'var(--bg-primary)',
            }}
        >
            {/* Camera feed */}
            <div style={{ position: 'relative', flex: 3, overflow: 'hidden', minHeight: 400 }}>
                <WebcamCapture ref={webcamRef} />
                {webcamRef.current?.videoRef && (
                    <PoseOverlay videoRef={webcamRef.current.videoRef} landmarks={landmarks} />
                )}
            </div>

            {/* Instructions panel */}
            <div
                style={{
                    display: 'flex',
                    flex: 2,
                    flexDirection: 'column',
                    gap: '1.5rem',
                    padding: '1.5rem',
                    maxWidth: '28rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity style={{ height: 20, width: 20, color: 'var(--accent)' }} />
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        Self-Guided Exam
                    </h2>
                </div>

                <GuidedCaptureFlow
                    joints={joints}
                    mode="self_guided"
                    cvStreamUrl={CV_STREAM_URL}
                    webcamRef={webcamRef}
                    onComplete={handleComplete}
                />
            </div>
        </div>
    );
}

export default function SelfGuidedExamPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        display: 'flex',
                        minHeight: '100vh',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    Loading...
                </div>
            }
        >
            <SelfGuidedExamContent />
        </Suspense>
    );
}
