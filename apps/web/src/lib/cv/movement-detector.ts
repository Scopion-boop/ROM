/**
 * @rom/web — Movement Detector
 *
 * Stateful engine that tracks smoothed ROM angles for every visible
 * (joint, movement, side) triple across frames, detects when the
 * clinician is actively moving a joint, and auto-captures a measurement
 * once the angle stabilises.
 *
 * Lifecycle per measurement channel:
 *   1. IDLE        → angle being tracked, no significant movement detected.
 *   2. MOVING      → Δangle ≥ MOVEMENT_THRESHOLD within MOVEMENT_WINDOW_MS.
 *   3. STABILISING → Δangle < STABILITY_THRESHOLD for STABILITY_HOLD_MS.
 *   4. CAPTURED    → stable measurement emitted via callback; channel resets to IDLE.
 *
 * Uses TemporalFilterBank for per-channel temporal smoothing.
 */

import type { JointType, MovementType, CapturedMeasurement, Side } from '@physiolens/shared-types';
import { TemporalFilterBank } from './temporal-filter';
import { computeMeasurement } from './joint-router';
import type { PoseFrame } from './pose-estimator';
import { detectVisibleJoints } from './body-detector';

// ─── Tuning Constants ──────────────────────────────────────────────

/** Minimum angle change (degrees) within MOVEMENT_WINDOW_MS to be "moving". */
export const MOVEMENT_THRESHOLD_DEG = 5;

/** Time window to evaluate movement onset (ms). */
export const MOVEMENT_WINDOW_MS = 500;

/** Maximum angle change (degrees) per frame to be considered "stable". */
export const STABILITY_THRESHOLD_DEG = 2;

/** How long the angle must remain stable to trigger auto-capture (ms). */
export const STABILITY_HOLD_MS = 800;

/** Minimum confidence to consider a measurement worth tracking. */
export const MIN_TRACKING_CONFIDENCE = 0.4;

// ─── Types ─────────────────────────────────────────────────────────

export type ChannelState = 'idle' | 'moving' | 'stabilising' | 'captured';

export interface ChannelStatus {
    joint: JointType;
    movement: MovementType;
    side: Side;
    state: ChannelState;
    /** Current smoothed angle. */
    currentAngle: number;
    /** Peak angle recorded during MOVING phase. */
    peakAngle: number;
    /** Confidence score from the last measurement reading. */
    confidence: number;
    /** Time spent in the current state (ms). */
    stateElapsedMs: number;
}

export interface AutoCaptureEvent {
    measurement: CapturedMeasurement;
    channelKey: string;
}

export interface MovementDetectorCallbacks {
    /** Fired when a channel auto-captures a stable measurement. */
    onAutoCapture?: (event: AutoCaptureEvent) => void;
    /** Fired when any channel changes state (for UI updates). */
    onStateChange?: (channels: ChannelStatus[]) => void;
}

// ─── Internal Channel State ────────────────────────────────────────

interface ChannelInternal {
    joint: JointType;
    movement: MovementType;
    side: Side;
    state: ChannelState;
    /** History of (smoothedAngle, timestampMs) for movement detection. */
    history: { angle: number; ts: number }[];
    /** Timestamp when current state was entered. */
    stateEnteredAt: number;
    /** Peak angle during MOVING phase. */
    peakAngle: number;
    /** Last smoothed angle. */
    lastAngle: number;
    /** Last frame confidence. */
    confidence: number;
    /** Used to detect when stable → captured to avoid re-emitting. */
    capturedAt: number | null;
}

// ─── Movement Detector ─────────────────────────────────────────────

export class MovementDetector {
    private readonly filterBank = new TemporalFilterBank({ medianWindow: 5, emaAlpha: 0.3 });
    private readonly channels = new Map<string, ChannelInternal>();
    private callbacks: MovementDetectorCallbacks;

    /** How long between auto-capture emissions for the same channel (ms). */
    private static readonly RECAPTURE_COOLDOWN_MS = 3000;

    constructor(callbacks: MovementDetectorCallbacks = {}) {
        this.callbacks = callbacks;
    }

    /** Build a unique key. */
    private static key(joint: string, movement: string, side: string): string {
        return `${joint}:${movement}:${side}`;
    }

    /**
     * Process one frame. Call this on every rAF tick.
     *
     * 1. Run body detection to find visible joints.
     * 2. For each visible (joint, movement, side), compute angle + smooth.
     * 3. Update channel state machine.
     * 4. Emit callbacks as needed.
     */
    processFrame(frame: PoseFrame): void {
        const now = frame.timestampMs;
        const visibleJoints = detectVisibleJoints(frame);
        const updatedKeys = new Set<string>();

        for (const vj of visibleJoints) {
            for (const dm of vj.movements) {
                const key = MovementDetector.key(vj.joint, dm.movement, vj.side);
                updatedKeys.add(key);
                this.updateChannel(vj.joint, dm.movement, vj.side, frame, now);
            }
        }

        this.pruneStaleChannels(updatedKeys, now);
        this.callbacks.onStateChange?.(this.getChannelStatuses());
    }

    /**
     * Update (or create) a single tracking channel with a new frame reading.
     */
    private updateChannel(
        joint: JointType,
        movement: MovementType,
        side: Side,
        frame: PoseFrame,
        now: number,
    ): void {
        const reading = computeMeasurement(joint, movement, side, frame.worldLandmarks, frame.landmarks);
        if (!reading || reading.confidenceScore < MIN_TRACKING_CONFIDENCE) return;

        const smoothedAngle = this.filterBank.push(joint, movement, side, reading.angleDeg, now);
        const key = MovementDetector.key(joint, movement, side);

        let ch = this.channels.get(key);
        if (!ch) {
            ch = this.createChannel(joint, movement, side, smoothedAngle, reading.confidenceScore, now);
            this.channels.set(key, ch);
        }

        ch.lastAngle = smoothedAngle;
        ch.confidence = reading.confidenceScore;
        ch.history.push({ angle: smoothedAngle, ts: now });

        const cutoff = now - MOVEMENT_WINDOW_MS;
        ch.history = ch.history.filter((h) => h.ts >= cutoff);

        if (ch.state === 'moving' || ch.state === 'stabilising') {
            ch.peakAngle = Math.max(ch.peakAngle, smoothedAngle);
        }

        this.advanceState(ch, now);
    }

    /**
     * Create a fresh channel structure.
     */
    private createChannel(
        joint: JointType, movement: MovementType, side: Side,
        angle: number, confidence: number, now: number,
    ): ChannelInternal {
        return {
            joint, movement, side,
            state: 'idle',
            history: [],
            stateEnteredAt: now,
            peakAngle: angle,
            lastAngle: angle,
            confidence,
            capturedAt: null,
        };
    }

    /**
     * Remove channels whose landmarks haven't been visible for >2 seconds.
     */
    private pruneStaleChannels(updatedKeys: Set<string>, now: number): void {
        for (const [key, ch] of this.channels) {
            if (updatedKeys.has(key) || ch.state === 'captured') continue;
            const lastTs = ch.history.at(-1)?.ts ?? 0;
            if (now - lastTs > 2000) {
                this.channels.delete(key);
            }
        }
    }

    /**
     * State machine transitions for a single channel.
     */
    private advanceState(ch: ChannelInternal, now: number): void {
        const delta = this.computeMovementDelta(ch);
        const stateAge = now - ch.stateEnteredAt;

        switch (ch.state) {
            case 'idle':
                if (delta >= MOVEMENT_THRESHOLD_DEG) {
                    ch.state = 'moving';
                    ch.stateEnteredAt = now;
                    ch.peakAngle = ch.lastAngle;
                }
                break;

            case 'moving':
                if (delta < STABILITY_THRESHOLD_DEG) {
                    ch.state = 'stabilising';
                    ch.stateEnteredAt = now;
                } else {
                    ch.peakAngle = Math.max(ch.peakAngle, ch.lastAngle);
                }
                break;

            case 'stabilising':
                if (delta >= MOVEMENT_THRESHOLD_DEG) {
                    // Back to moving — patient resumed movement
                    ch.state = 'moving';
                    ch.stateEnteredAt = now;
                } else if (stateAge >= STABILITY_HOLD_MS) {
                    // Stable long enough → capture
                    const canCapture =
                        ch.capturedAt === null ||
                        now - ch.capturedAt >= MovementDetector.RECAPTURE_COOLDOWN_MS;

                    if (canCapture) {
                        ch.state = 'captured';
                        ch.stateEnteredAt = now;
                        ch.capturedAt = now;
                        this.emitCapture(ch);
                    }
                    // Reset back to idle for next movement
                    ch.state = 'idle';
                    ch.stateEnteredAt = now;
                    ch.peakAngle = ch.lastAngle;
                }
                break;

            case 'captured':
                // Immediately return to idle
                ch.state = 'idle';
                ch.stateEnteredAt = now;
                break;
        }
    }

    /**
     * Compute the maximum angle delta within the history window.
     * This is max(angle) - min(angle) over the last MOVEMENT_WINDOW_MS.
     */
    private computeMovementDelta(ch: ChannelInternal): number {
        if (ch.history.length < 2) return 0;
        const angles = ch.history.map((h) => h.angle);
        return Math.max(...angles) - Math.min(...angles);
    }

    /**
     * Emit an auto-capture event with a CapturedMeasurement.
     */
    private emitCapture(ch: ChannelInternal): void {
        const measurement: CapturedMeasurement = {
            joint: ch.joint,
            movement: ch.movement,
            side: ch.side as 'left' | 'right' | 'midline',
            romDegrees: Math.round(ch.peakAngle * 100) / 100,
            confidence: ch.confidence,
            timestamp: Date.now(),
        };

        const key = MovementDetector.key(ch.joint, ch.movement, ch.side);
        this.callbacks.onAutoCapture?.({ measurement, channelKey: key });
    }

    /**
     * Get the current status of all active channels (for UI rendering).
     */
    getChannelStatuses(): ChannelStatus[] {
        const now = performance.now();
        const statuses: ChannelStatus[] = [];

        for (const ch of this.channels.values()) {
            statuses.push({
                joint: ch.joint,
                movement: ch.movement,
                side: ch.side,
                state: ch.state,
                currentAngle: ch.lastAngle,
                peakAngle: ch.peakAngle,
                confidence: ch.confidence,
                stateElapsedMs: now - ch.stateEnteredAt,
            });
        }

        // Sort: moving/stabilising first, then by confidence
        return statuses.sort((a, b) => {
            const stateOrder: Record<ChannelState, number> = {
                moving: 0,
                stabilising: 1,
                captured: 2,
                idle: 3,
            };
            const stateDiff = stateOrder[a.state] - stateOrder[b.state];
            if (stateDiff !== 0) return stateDiff;
            return b.confidence - a.confidence;
        });
    }

    /**
     * Get the number of active tracking channels.
     */
    get activeChannelCount(): number {
        return this.channels.size;
    }

    /**
     * Reset all state — filters, channels, history.
     */
    reset(): void {
        this.filterBank.resetAll();
        this.channels.clear();
    }

    /**
     * Update callbacks (useful when React props change).
     */
    setCallbacks(callbacks: MovementDetectorCallbacks): void {
        this.callbacks = callbacks;
    }
}
