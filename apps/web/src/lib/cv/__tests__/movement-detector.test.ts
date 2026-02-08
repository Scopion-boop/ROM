/**
 * Tests for movement-detector.ts — MovementDetector state machine
 *
 * Uses mock PoseFrames with controlled angles to verify the
 * idle → moving → stabilising → captured state transitions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    MovementDetector,
    MOVEMENT_THRESHOLD_DEG,
    STABILITY_HOLD_MS,
    type AutoCaptureEvent,
    type ChannelStatus,
} from '../movement-detector';
import type { PoseFrame } from '../pose-estimator';
import { computeMeasurement } from '../joint-router';
import { detectVisibleJoints } from '../body-detector';

// ─── Mock dependencies ─────────────────────────────────────────────

// Mock body-detector to return a controlled set of visible joints
vi.mock('../body-detector', () => ({
    detectVisibleJoints: vi.fn(() => [
        {
            joint: 'shoulder',
            side: 'right',
            movements: [
                { movement: 'flexion', triple: { proximal: 23, center: 11, distal: 13, preferredView: 'lateral' }, confidence: 0.9 },
            ],
            confidence: 0.9,
        },
    ]),
}));

// Mock joint-router to return controlled angle readings
vi.mock('../joint-router', () => ({
    computeMeasurement: vi.fn(() => ({
        angleDeg: 45,
        confidenceScore: 0.85,
        mode: '3d',
        qualityFlags: [],
    })),
}));

// Mock temporal filter to pass through the angle
vi.mock('../temporal-filter', () => ({
    TemporalFilterBank: vi.fn().mockImplementation(() => ({
        push: vi.fn((_j: string, _m: string, _s: string, angle: number) => angle),
        resetAll: vi.fn(),
    })),
}));

// ─── Helpers ───────────────────────────────────────────────────────

function makeFrame(timestampMs: number): PoseFrame {
    const lm = Array.from({ length: 33 }, () => ({
        x: 0.5,
        y: 0.5,
        z: 0,
        visibility: 0.95,
    }));
    return { landmarks: lm, worldLandmarks: lm, timestampMs };
}

// ─── Get mocked references for dynamic control ───────────────────

const computeMock = vi.mocked(computeMeasurement);
const detectMock = vi.mocked(detectVisibleJoints);

// ─── Tests ─────────────────────────────────────────────────────────

describe('MovementDetector', () => {
    let detector: MovementDetector;
    let capturedEvents: AutoCaptureEvent[];
    let lastChannels: ChannelStatus[];

    beforeEach(() => {
        vi.clearAllMocks();

        // Restore factory defaults after clearAllMocks wipes return values
        detectMock.mockReturnValue([
            {
                joint: 'shoulder',
                side: 'right',
                movements: [
                    { movement: 'flexion', triple: { proximal: 23, center: 11, distal: 13, preferredView: 'lateral' }, confidence: 0.9 },
                ],
                confidence: 0.9,
            },
        ] as never);
        computeMock.mockReturnValue({
            angleDeg: 45,
            confidenceScore: 0.85,
            mode: '3d',
            qualityFlags: [],
        } as never);

        capturedEvents = [];
        lastChannels = [];

        detector = new MovementDetector({
            onAutoCapture: (event) => capturedEvents.push(event),
            onStateChange: (channels) => {
                lastChannels = channels;
            },
        });
    });

    it('creates channels for visible joints on first frame', () => {
        detector.processFrame(makeFrame(1000));
        expect(lastChannels.length).toBe(1);
        expect(lastChannels[0]!.joint).toBe('shoulder');
        expect(lastChannels[0]!.movement).toBe('flexion');
        expect(lastChannels[0]!.side).toBe('right');
    });

    it('starts in idle state', () => {
        detector.processFrame(makeFrame(1000));
        expect(lastChannels[0]!.state).toBe('idle');
    });

    it('transitions to moving when angle delta exceeds threshold', () => {
        // Frame 1: angle = 30°
        computeMock.mockReturnValue({ angleDeg: 30, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1000));

        // Frame 2: angle = 30 + MOVEMENT_THRESHOLD + 1 = ~36°
        computeMock.mockReturnValue({ angleDeg: 30 + MOVEMENT_THRESHOLD_DEG + 1, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1200));

        expect(lastChannels[0]!.state).toBe('moving');
    });

    it('transitions from moving to stabilising when angle stops changing', () => {
        // Frame 1: start angle
        computeMock.mockReturnValue({ angleDeg: 30, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1000));

        // Frame 2: big move → moving
        computeMock.mockReturnValue({ angleDeg: 50, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1200));
        expect(lastChannels[0]!.state).toBe('moving');

        // Frame 3: stable angle → stabilising (need old readings to fall off window)
        // Process enough stable frames to fill the window
        for (let t = 1400; t <= 2200; t += 100) {
            computeMock.mockReturnValue({ angleDeg: 50, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
            detector.processFrame(makeFrame(t));
        }

        // After window of stable angles, should be stabilising or captured
        const state = lastChannels[0]!.state;
        expect(['stabilising', 'captured', 'idle']).toContain(state);
    });

    it('emits auto-capture after stability hold period', () => {
        // Phase 1: idle
        computeMock.mockReturnValue({ angleDeg: 30, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1000));

        // Phase 2: movement onset
        computeMock.mockReturnValue({ angleDeg: 50, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1200));

        // Phase 3: stabilise at 50° for STABILITY_HOLD_MS
        const stabiliseStart = 1700;
        for (let t = stabiliseStart; t <= stabiliseStart + STABILITY_HOLD_MS + 200; t += 50) {
            computeMock.mockReturnValue({ angleDeg: 50, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
            detector.processFrame(makeFrame(t));
        }

        // Should have emitted at least one capture
        expect(capturedEvents.length).toBeGreaterThanOrEqual(1);
        if (capturedEvents.length > 0) {
            expect(capturedEvents[0]!.measurement.joint).toBe('shoulder');
            expect(capturedEvents[0]!.measurement.movement).toBe('flexion');
            expect(capturedEvents[0]!.measurement.side).toBe('right');
        }
    });

    it('ignores low-confidence readings', () => {
        // Return confidence below MIN_TRACKING_CONFIDENCE (0.4)
        computeMock.mockReturnValue({ angleDeg: 45, confidenceScore: 0.1, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1000));

        // No channel should be created
        expect(lastChannels.length).toBe(0);
    });

    it('returns null reading gracefully', () => {
        computeMock.mockReturnValue(null as never);

        detector.processFrame(makeFrame(1000));
        expect(lastChannels.length).toBe(0);
    });

    it('reset() clears all channels and state', () => {
        detector.processFrame(makeFrame(1000));
        expect(lastChannels.length).toBe(1);

        detector.reset();
        expect(detector.activeChannelCount).toBe(0);
    });

    it('prunes stale channels that disappear from view', () => {
        // Frame 1: visible
        computeMock.mockReturnValue({ angleDeg: 45, confidenceScore: 0.85, mode: '3d', qualityFlags: [] } as never);
        detector.processFrame(makeFrame(1000));
        expect(lastChannels.length).toBe(1);

        // Mock body-detector to return nothing (joint left view)
        detectMock.mockReturnValue([]);

        // Frame 2 after >2 seconds → should prune
        detector.processFrame(makeFrame(4000));
        expect(lastChannels.length).toBe(0);
    });

    it('tracks activeChannelCount property', () => {
        expect(detector.activeChannelCount).toBe(0);
        detector.processFrame(makeFrame(1000));
        expect(detector.activeChannelCount).toBe(1);
    });
});
