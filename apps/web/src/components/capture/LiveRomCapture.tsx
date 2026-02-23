/**
 * LiveRomCapture — Auto-detect vision strategy component.
 *
 * Renders capture controls with real-time pose detection and
 * auto-captures measurements when the angle stabilises.
 *
 * Supports optional dual-camera mode: when a secondaryStream is
 * provided (phone camera via WebRTC), a second PoseEstimator runs
 * and landmarks are fused via visibility-weighted averaging.
 *
 * Implements VisionStrategyProps so it plugs into the strategy registry.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Camera as CameraIcon, Smartphone } from 'lucide-react';

import type { CapturedMeasurement } from '@physiolens/shared-types';
import type { VisionStrategyProps } from '../../lib/vision-strategy-registry';
import {
    MovementDetector,
    type AutoCaptureEvent,
} from '../../lib/cv/movement-detector';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { fuseLandmarks, isSecondaryUseful, type Landmark3D } from '../../lib/cv/landmark-fusion';
import type { PoseFrame } from '../../lib/cv/pose-estimator';
import type { OverlayLandmark } from './PoseOverlay';

// ─── Component ─────────────────────────────────────────────────────

export function LiveRomCapture({
    webcamRef,
    secondaryStream,
    onComplete,
    onCapture,
    onLandmarksUpdate,
    onAngleUpdate: _onAngleUpdate,
    className = '',
}: Readonly<VisionStrategyProps>) {
    // Fallback ref for when WebcamCapture hasn't mounted yet
    const fallbackRef = useRef<HTMLVideoElement>(null);
    const videoRef = webcamRef.current?.videoRef ?? fallbackRef;

    // Hidden video element for secondary (phone) camera
    const secondaryVideoRef = useRef<HTMLVideoElement>(null);

    // Pose detection — primary camera
    const { frame: primaryFrame, loading, ready } = usePoseDetection(videoRef, { enabled: true });

    // Pose detection — secondary camera (only when stream is available)
    const { frame: secondaryFrame } = usePoseDetection(secondaryVideoRef, {
        enabled: !!secondaryStream,
    });

    // Attach secondary stream to its hidden video element
    useEffect(() => {
        const video = secondaryVideoRef.current;
        if (video && secondaryStream) {
            video.srcObject = secondaryStream;
            video.play().catch(() => { /* autoplay may be blocked */ });
        }
        return () => {
            if (video) video.srcObject = null;
        };
    }, [secondaryStream]);

    // Track whether secondary camera is providing useful data
    const [dualActive, setDualActive] = useState(false);

    useEffect(() => {
        if (!primaryFrame || !secondaryFrame) {
            setDualActive(false);
            return;
        }
        const primaryWL = primaryFrame.worldLandmarks as Landmark3D[];
        const secondaryWL = secondaryFrame.worldLandmarks as Landmark3D[];
        setDualActive(isSecondaryUseful(primaryWL, secondaryWL));
    }, [primaryFrame, secondaryFrame]);

    // Fuse frames when dual camera is active
    const effectiveFrame: PoseFrame | null = useMemo(() => {
        if (!primaryFrame) return null;
        if (!secondaryFrame || !dualActive) return primaryFrame;

        const fusedWorld = fuseLandmarks(
            primaryFrame.worldLandmarks as Landmark3D[],
            secondaryFrame.worldLandmarks as Landmark3D[],
        );

        return {
            landmarks: primaryFrame.landmarks, // overlay uses primary camera's 2D landmarks
            worldLandmarks: fusedWorld,
            timestampMs: primaryFrame.timestampMs,
        };
    }, [primaryFrame, secondaryFrame, dualActive]);

    // State
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

    useEffect(() => {
        const detector = new MovementDetector({
            onAutoCapture: handleAutoCapture,
        });
        detectorRef.current = detector;
        return () => {
            detector.reset();
            detectorRef.current = null;
        };
    }, [handleAutoCapture]);

    // Update callbacks when handlers change
    useEffect(() => {
        detectorRef.current?.setCallbacks({
            onAutoCapture: handleAutoCapture,
        });
    }, [handleAutoCapture]);

    // ── Feed frames into detector (using fused frame when available)

    useEffect(() => {
        if (effectiveFrame && detectorRef.current) {
            detectorRef.current.processFrame(effectiveFrame);
        }
    }, [effectiveFrame]);

    // ── Overlay landmarks ──────────────────────────────────────────

    const overlayLandmarks: OverlayLandmark[] | null = useMemo(() => {
        if (!primaryFrame) return null;
        return primaryFrame.landmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 0,
        }));
    }, [primaryFrame]);

    // Forward landmarks to parent (for shared PoseOverlay in CameraSetupWizard)
    useEffect(() => {
        onLandmarksUpdate?.(overlayLandmarks);
    }, [overlayLandmarks, onLandmarksUpdate]);

    // ── Actions ────────────────────────────────────────────────────

    const finalize = useCallback(() => {
        onComplete(captures);
    }, [captures, onComplete]);

    // ── Render ─────────────────────────────────────────────────────

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} className={className}>
            {/* Hidden video for secondary (phone) camera */}
            {secondaryStream && (
                <video
                    ref={secondaryVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
                />
            )}

            {/* Loading indicator */}
            {loading && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                }}>
                    <Loader2 size={24} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 13 }}>Loading pose model…</span>
                </div>
            )}

            {/* Dual Camera Active indicator */}
            {dualActive && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(99,102,241,0.08)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#818cf8',
                }}>
                    <Smartphone size={14} />
                    Dual Camera Active — fusing landmarks
                </div>
            )}

            {/* Capture count badge */}
            {ready && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                    background: captures.length > 0 ? 'rgba(74,222,128,0.05)' : 'transparent',
                }}>
                    <CheckCircle2 size={16} style={{
                        color: captures.length > 0 ? 'rgba(74,222,128,0.8)' : 'var(--text-muted)',
                    }} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {captures.length} measurement{captures.length === 1 ? '' : 's'} captured
                    </span>
                    {captures.length === 0 && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            — move joints in front of the camera
                        </span>
                    )}
                </div>
            )}

            {/* Finish Capture button */}
            <button
                type="button"
                onClick={finalize}
                disabled={captures.length === 0}
                className="btn btn-primary"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: captures.length === 0 ? 0.4 : 1,
                    cursor: captures.length === 0 ? 'not-allowed' : 'pointer',
                }}
            >
                <CameraIcon size={16} />
                Finish Capture
            </button>
        </div>
    );
}
