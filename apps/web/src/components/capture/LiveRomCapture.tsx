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

import type { CapturedMeasurement } from '@physiolens/shared-types';
import type { VisionStrategyProps } from '../../lib/vision-strategy-registry';
import {
    MovementDetector,
    type ChannelStatus,
    type AutoCaptureEvent,
} from '../../lib/cv/movement-detector';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { PoseOverlay, type OverlayLandmark } from './PoseOverlay';

// ─── State badge styles (dark-themed, 4-colour data system) ─────────

const STATE_STYLES: Record<string, { bg: string; text: string }> = {
    idle: { bg: 'rgba(75,85,99,0.1)', text: '#4B5563' },
    moving: { bg: 'rgba(14,205,186,0.1)', text: '#0ECDBA' },
    stabilising: { bg: 'rgba(245,158,11,0.1)', text: '#F59E0B' },
    captured: { bg: 'rgba(74,222,128,0.1)', text: 'rgba(74,222,128,0.8)' },
};

// ─── Component ─────────────────────────────────────────────────────

export function LiveRomCapture({
    webcamRef,
    onComplete,
    onCapture,
    onLandmarksUpdate,
    onAngleUpdate: _onAngleUpdate,
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

    // Forward landmarks to parent (for shared PoseOverlay in CameraSetupWizard)
    useEffect(() => {
        onLandmarksUpdate?.(overlayLandmarks);
    }, [overlayLandmarks, onLandmarksUpdate]);

    // ── Actions ────────────────────────────────────────────────────

    const removeCapture = useCallback((index: number) => {
        setCaptures((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const finalize = useCallback(() => {
        onComplete(captures);
    }, [captures, onComplete]);

    // ── Render ─────────────────────────────────────────────────────

    return (
        <div style={{ display: 'flex', gap: 'var(--space-4)' }} className={className}>
            {/* Camera + overlay — sacred space */}
            <div style={{
                position: 'relative',
                flex: 1,
                minHeight: 400,
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                background: '#000',
            }}>
                {loading && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                    }}>
                        <Loader2 size={32} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                        <span style={{ marginLeft: 8, color: '#fff', fontSize: 13 }}>Loading pose model…</span>
                    </div>
                )}

                {/* PoseOverlay draws on its own canvas */}
                <PoseOverlay
                    videoRef={videoRef}
                    landmarks={overlayLandmarks}
                    angles={[]}
                />

                {/* FPS badge — subdued */}
                {ready && (
                    <span style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'var(--text-tertiary)',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        fontVariantNumeric: 'tabular-nums',
                    }}>
                        {fps} FPS
                    </span>
                )}
            </div>

            {/* Sidebar: channels + captures */}
            <div style={{
                width: 288,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                overflowY: 'auto',
                maxHeight: 600,
            }}>
                {/* Live tracking channels */}
                <section>
                    <h3 style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--font-section-tracking)',
                        color: 'var(--text-tertiary)',
                        marginBottom: 'var(--space-1)',
                    }}>
                        Live Tracking ({channels.length})
                    </h3>
                    {channels.length === 0 && ready && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Move a joint in front of the camera…
                        </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {channels.map((ch) => {
                            const key = `${ch.joint}:${ch.movement}:${ch.side}`;
                            const stateStyle = STATE_STYLES[ch.state] ?? STATE_STYLES.idle!;
                            return (
                                <div
                                    key={key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-primary)',
                                        padding: '6px 8px',
                                        fontSize: 13,
                                    }}
                                >
                                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{ch.side}</span>{' '}
                                        <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                                            {ch.joint.replace('_', ' ')}
                                        </span>{' '}
                                        <span style={{ color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                                            {ch.movement.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                        <span style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontVariantNumeric: 'tabular-nums',
                                            fontSize: 12,
                                        }}>
                                            {ch.currentAngle.toFixed(0)}°
                                        </span>
                                        <span style={{
                                            fontSize: 10,
                                            padding: '2px 6px',
                                            borderRadius: 'var(--radius-full)',
                                            fontWeight: 500,
                                            background: stateStyle.bg,
                                            color: stateStyle.text,
                                        }}>
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
                    <h3 style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 'var(--font-section-tracking)',
                        color: 'var(--text-tertiary)',
                        marginBottom: 'var(--space-1)',
                    }}>
                        Captured ({captures.length})
                    </h3>
                    {captures.length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Measurements appear here once the angle stabilises.
                        </p>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {captures.map((cap, i) => (
                            <div
                                key={`${cap.joint}-${cap.movement}-${cap.side}-${cap.timestamp}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(74,222,128,0.2)',
                                    background: 'rgba(74,222,128,0.05)',
                                    padding: '6px 8px',
                                    fontSize: 13,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <CheckCircle2 size={14} style={{ color: 'rgba(74,222,128,0.8)', flexShrink: 0 }} />
                                    <span style={{ textTransform: 'capitalize' }}>{cap.side}</span>{' '}
                                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>
                                        {cap.joint.replace('_', ' ')}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', marginLeft: 4 }}>
                                        {cap.romDegrees}°
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeCapture(i)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: 2,
                                        display: 'flex',
                                    }}
                                    aria-label="Remove capture"
                                >
                                    <Trash2 size={14} />
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
                    className="btn btn-primary"
                    style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '10px 16px',
                        fontSize: 13,
                        fontWeight: 500,
                        opacity: captures.length === 0 ? 0.4 : 1,
                        cursor: captures.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                >
                    <CameraIcon size={16} />
                    Complete ({captures.length} measurement{captures.length === 1 ? '' : 's'})
                </button>
            </div>
        </div>
    );
}
