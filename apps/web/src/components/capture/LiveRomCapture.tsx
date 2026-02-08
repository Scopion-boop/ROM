/**
 * LiveRomCapture — Auto-detect vision strategy component.
 *
 * Renders the camera feed with real-time pose overlay, shows live
 * tracking channels (joint+movement+side being detected), and
 * auto-captures measurements when the angle stabilises.
 *
 * Implements VisionStrategyProps so it plugs into the strategy registry.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Trash2, Camera as CameraIcon } from 'lucide-react';

import type { CapturedMeasurement } from '@rom/shared-types';
import type { VisionStrategyProps } from '../../lib/vision-strategy-registry';
import {
    MovementDetector,
    type ChannelStatus,
    type AutoCaptureEvent,
} from '../../lib/cv/movement-detector';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { PoseOverlay, type OverlayLandmark } from './PoseOverlay';

// ─── State badge colours ───────────────────────────────────────────

const STATE_STYLES: Record<string, string> = {
    idle: 'bg-gray-200 text-gray-600',
    moving: 'bg-blue-100 text-blue-700 animate-pulse',
    stabilising: 'bg-yellow-100 text-yellow-700',
    captured: 'bg-green-100 text-green-700',
};

// ─── Component ─────────────────────────────────────────────────────

export function LiveRomCapture({
    webcamRef,
    onComplete,
    onCapture,
    className = '',
}: Readonly<VisionStrategyProps>) {
    // Fallback ref for when WebcamCapture hasn't mounted yet
    const fallbackRef = useRef<HTMLVideoElement>(null);
    const videoRef = webcamRef.current?.videoRef ?? fallbackRef;

    // Pose detection hook
    const { frame, loading, ready, fps } = usePoseDetection(videoRef, { enabled: true });

    // State
    const [channels, setChannels] = useState<ChannelStatus[]>([]);
    const [captures, setCaptures] = useState<CapturedMeasurement[]>([]);

    // ── Movement detector (singleton per mount) ────────────────────

    const detectorRef = useRef<MovementDetector | null>(null);

    const handleAutoCapture = useCallback(
        (event: AutoCaptureEvent) => {
            setCaptures((prev) => [...prev, event.measurement]);
            onCapture?.(event.measurement);
        },
        [onCapture],
    );

    const handleStateChange = useCallback((ch: ChannelStatus[]) => {
        setChannels(ch);
    }, []);

    useEffect(() => {
        const detector = new MovementDetector({
            onAutoCapture: handleAutoCapture,
            onStateChange: handleStateChange,
        });
        detectorRef.current = detector;
        return () => {
            detector.reset();
            detectorRef.current = null;
        };
    }, [handleAutoCapture, handleStateChange]);

    // Update callbacks when handlers change
    useEffect(() => {
        detectorRef.current?.setCallbacks({
            onAutoCapture: handleAutoCapture,
            onStateChange: handleStateChange,
        });
    }, [handleAutoCapture, handleStateChange]);

    // ── Feed frames into detector ──────────────────────────────────

    useEffect(() => {
        if (frame && detectorRef.current) {
            detectorRef.current.processFrame(frame);
        }
    }, [frame]);

    // ── Overlay landmarks ──────────────────────────────────────────

    const overlayLandmarks: OverlayLandmark[] | null = useMemo(() => {
        if (!frame) return null;
        return frame.landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 0,
        }));
    }, [frame]);

    // ── Actions ────────────────────────────────────────────────────

    const removeCapture = useCallback((index: number) => {
        setCaptures((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const finalize = useCallback(() => {
        onComplete(captures);
    }, [captures, onComplete]);

    // ── Render ─────────────────────────────────────────────────────

    return (
        <div className={`flex gap-4 ${className}`}>
            {/* Camera + overlay */}
            <div className="relative flex-1 min-h-[400px] rounded-xl overflow-hidden bg-black">
                {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                        <span className="ml-2 text-white text-sm">Loading pose model…</span>
                    </div>
                )}

                {/* PoseOverlay draws on its own canvas */}
                <PoseOverlay
                    videoRef={videoRef}
                    landmarks={overlayLandmarks}
                    angles={[]}
                    className="absolute inset-0 z-[5] pointer-events-none"
                />

                {/* FPS badge */}
                {ready && (
                    <span className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-black/50 text-white text-xs font-mono">
                        {fps} FPS
                    </span>
                )}
            </div>

            {/* Sidebar: channels + captures */}
            <div className="w-72 flex flex-col gap-3 overflow-y-auto max-h-[600px]">
                {/* Live tracking channels */}
                <section>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">
                        Live Tracking ({channels.length})
                    </h3>
                    {channels.length === 0 && ready && (
                        <p className="text-xs text-gray-400 italic">Move a joint in front of the camera…</p>
                    )}
                    <div className="space-y-1">
                        {channels.map((ch) => {
                            const key = `${ch.joint}:${ch.movement}:${ch.side}`;
                            return (
                                <div
                                    key={key}
                                    className="flex items-center justify-between rounded-lg border px-2 py-1.5 text-sm"
                                >
                                    <div className="truncate">
                                        <span className="capitalize">{ch.side}</span>{' '}
                                        <span className="font-medium capitalize">{ch.joint.replace('_', ' ')}</span>{' '}
                                        <span className="text-gray-500 capitalize">{ch.movement.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-mono text-xs">{ch.currentAngle.toFixed(0)}°</span>
                                        <span
                                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATE_STYLES[ch.state] ?? ''}`}
                                        >
                                            {ch.state}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Auto-captured measurements */}
                <section>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-1">
                        Captured ({captures.length})
                    </h3>
                    {captures.length === 0 && (
                        <p className="text-xs text-gray-400 italic">
                            Measurements appear here once the angle stabilises.
                        </p>
                    )}
                    <div className="space-y-1">
                        {captures.map((cap, i) => (
                            <div
                                key={`${cap.joint}-${cap.movement}-${cap.side}-${cap.timestamp}`}
                                className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-2 py-1.5 text-sm"
                            >
                                <div className="flex items-center gap-1 truncate">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                    <span className="capitalize">{cap.side}</span>{' '}
                                    <span className="font-medium capitalize">{cap.joint.replace('_', ' ')}</span>
                                    <span className="font-mono ml-1">{cap.romDegrees}°</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCapture(i)}
                                    className="text-gray-400 hover:text-red-500 p-0.5"
                                    aria-label="Remove capture"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Finalize button */}
                <button
                    type="button"
                    onClick={finalize}
                    disabled={captures.length === 0}
                    className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    <CameraIcon className="w-4 h-4" />
                    Complete ({captures.length} measurement{captures.length === 1 ? '' : 's'})
                </button>
            </div>
        </div>
    );
}
