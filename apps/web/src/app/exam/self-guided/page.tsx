/**
 * /exam/self-guided — Patient self-guided ROM exam page.
 *
 * Displays large, clear instructions for the patient to follow
 * while capturing ROM measurements automatically via the webcam.
 * Designed for pre-consultation passive ROM data collection.
 */

'use client';

import { Suspense, useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Activity, CheckCircle, User } from 'lucide-react';
import type { JointType } from '@rom/shared-types';
import { WebcamCapture, type WebcamCaptureHandle } from '../../../components/capture/WebcamCapture';
import { PoseOverlay, type OverlayLandmark } from '../../../components/capture/PoseOverlay';
import {
    GuidedCaptureFlow,
    type CapturedMeasurement,
} from '../../../components/capture/GuidedCaptureFlow';

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
    const jointsParam = searchParams.get('joints');
    const joints: JointType[] = jointsParam
        ? (jointsParam.split(',') as JointType[])
        : DEFAULT_JOINTS;

    const webcamRef = useRef<WebcamCaptureHandle>(null);
    const [landmarks] = useState<OverlayLandmark[] | null>(null);
    const [phase, setPhase] = useState<'intro' | 'capturing' | 'complete'>('intro');
    const [results, setResults] = useState<CapturedMeasurement[]>([]);

    const handleComplete = useCallback((measurements: CapturedMeasurement[]) => {
        setResults(measurements);
        setPhase('complete');

        // TODO: POST results to API for clinician review
    }, []);

    if (phase === 'intro') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-8 text-center">
                <div className="max-w-lg">
                    <User className="mx-auto h-16 w-16 text-blue-400" />
                    <h1 className="mt-6 text-3xl font-bold text-white">
                        Self-Guided ROM Assessment
                    </h1>
                    <p className="mt-4 text-lg text-gray-400 leading-relaxed">
                        You&apos;ll be guided through a series of movements. Follow the
                        on-screen instructions and hold each position until the
                        measurement is captured automatically.
                    </p>

                    <div className="mt-8 rounded-xl bg-gray-800 p-6 text-left">
                        <h3 className="mb-3 text-sm font-semibold text-gray-300">Before you begin:</h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                                Wear comfortable, fitted clothing
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                                Stand 6–8 feet from the camera
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                                Ensure good lighting — face a window if possible
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
                                Stop if you feel sharp pain
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={() => setPhase('capturing')}
                        className="mt-8 rounded-xl bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-500 transition-colors"
                    >
                        Begin Assessment
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'complete') {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-8 text-center">
                <CheckCircle className="h-20 w-20 text-green-400" />
                <h1 className="mt-6 text-3xl font-bold text-white">Assessment Complete</h1>
                <p className="mt-3 text-gray-400">
                    {results.length} measurements captured. Your clinician will review
                    these results at your next appointment.
                </p>

                <div className="mt-8 w-full max-w-md rounded-xl bg-gray-800 p-6">
                    <h3 className="mb-4 text-sm font-semibold text-gray-300">Summary</h3>
                    <div className="space-y-2">
                        {results.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">
                                    {r.side !== 'midline' ? `${r.side} ` : ''}{r.joint} {r.movement}
                                </span>
                                <span className="font-mono font-semibold text-white">
                                    {Math.round(r.romDegrees)}°
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Capturing phase
    return (
        <div className="flex min-h-screen flex-col bg-gray-950 lg:flex-row">
            {/* Camera feed — 60% */}
            <div className="relative flex-[3] overflow-hidden">
                <WebcamCapture ref={webcamRef} className="h-full min-h-[400px]" />
                {webcamRef.current?.videoRef && (
                    <PoseOverlay videoRef={webcamRef.current.videoRef} landmarks={landmarks} />
                )}
            </div>

            {/* Instructions panel — 40% */}
            <div className="flex flex-[2] flex-col gap-6 p-6 lg:max-w-md">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-white">Self-Guided Exam</h2>
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
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">Loading…</div>}>
            <SelfGuidedExamContent />
        </Suspense>
    );
}
