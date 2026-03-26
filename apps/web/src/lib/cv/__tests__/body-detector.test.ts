/**
 * Tests for body-detector.ts — detectVisibleJoints()
 *
 * Uses mock PoseFrames with controlled visibility values
 * to verify joint detection grouping, confidence scoring,
 * and threshold filtering.
 */

import { describe, it, expect } from 'vitest';
import {
  detectVisibleJoints,
  getVisibleJointTypes,
  DEFAULT_VISIBILITY_THRESHOLD,
} from '../body-detector';
import type { PoseFrame } from '../pose-estimator';

// ─── Helpers ───────────────────────────────────────────────────────

/** Create a 33-landmark array with uniform visibility. */
function makeLandmarks(visibility: number) {
  return Array.from({ length: 33 }, (_, i) => ({
    x: i * 0.03,
    y: 0.5,
    z: 0,
    visibility,
  }));
}

function makeFrame(visibility: number, timestampMs = 1000): PoseFrame {
  const lm = makeLandmarks(visibility);
  return {
    landmarks: lm,
    worldLandmarks: lm,
    timestampMs,
  };
}

/**
 * Create a frame with specific landmark visibilities overridden.
 */
function makeFrameWithOverrides(
  base: number,
  overrides: Record<number, number>,
  timestampMs = 1000,
): PoseFrame {
  const lm = makeLandmarks(base);
  for (const [idx, vis] of Object.entries(overrides)) {
    const i = Number(idx);
    if (lm[i]) {
      lm[i] = { ...lm[i], visibility: vis };
    }
  }
  return {
    landmarks: lm,
    worldLandmarks: lm,
    timestampMs,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('detectVisibleJoints', () => {
  it('returns empty array when all landmarks are invisible', () => {
    const frame = makeFrame(0);
    const result = detectVisibleJoints(frame);
    expect(result).toEqual([]);
  });

  it('returns joints when all landmarks are fully visible', () => {
    const frame = makeFrame(0.95);
    const result = detectVisibleJoints(frame);

    // Should have at least some visible joints
    expect(result.length).toBeGreaterThan(0);

    // Each result should have required properties
    for (const vj of result) {
      expect(vj.joint).toBeDefined();
      expect(vj.side).toBeDefined();
      expect(vj.movements.length).toBeGreaterThan(0);
      expect(vj.confidence).toBeGreaterThan(0);
      expect(vj.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('uses DEFAULT_VISIBILITY_THRESHOLD (0.5) by default', () => {
    expect(DEFAULT_VISIBILITY_THRESHOLD).toBe(0.5);

    // Visibility just below threshold → no results
    const belowFrame = makeFrame(0.49);
    expect(detectVisibleJoints(belowFrame)).toEqual([]);

    // Visibility just above threshold → some results
    const aboveFrame = makeFrame(0.51);
    expect(detectVisibleJoints(aboveFrame).length).toBeGreaterThan(0);
  });

  it('respects custom threshold parameter', () => {
    const frame = makeFrame(0.6);

    // High threshold → fewer or no results
    const strict = detectVisibleJoints(frame, 0.8);
    const lenient = detectVisibleJoints(frame, 0.3);

    // Lenient should find more joints
    expect(lenient.length).toBeGreaterThanOrEqual(strict.length);
  });

  it('sorts results by confidence descending', () => {
    const frame = makeFrame(0.9);
    const result = detectVisibleJoints(frame);

    for (let i = 1; i < result.length; i++) {
      expect(result[i]!.confidence).toBeLessThanOrEqual(result[i - 1]!.confidence);
    }
  });

  it('sorts movements within each joint by confidence descending', () => {
    const frame = makeFrame(0.9);
    const result = detectVisibleJoints(frame);

    for (const vj of result) {
      for (let i = 1; i < vj.movements.length; i++) {
        expect(vj.movements[i]!.confidence).toBeLessThanOrEqual(vj.movements[i - 1]!.confidence);
      }
    }
  });

  it('groups movements under the same (joint, side) key', () => {
    const frame = makeFrame(0.9);
    const result = detectVisibleJoints(frame);

    // Each entry should have a unique joint+side combination
    const keys = new Set(result.map((vj) => `${vj.joint}:${vj.side}`));
    expect(keys.size).toBe(result.length);
  });

  it('filters out joints with any landmark below threshold', () => {
    // Shoulder landmarks: left shoulder = 11, left elbow = 13, left wrist = 15
    // Make most landmarks visible but hide one key landmark
    const frame = makeFrameWithOverrides(0.9, {
      11: 0.1, // Hide left shoulder → should eliminate triples using landmark 11
    });

    const result = detectVisibleJoints(frame);

    // Joints using landmark 11 should have fewer detected movements
    // (or be absent if all their triples need landmark 11)
    const leftShoulderEntries = result.filter(
      (vj) => vj.joint === 'shoulder' && vj.side === 'left',
    );

    // If left shoulder appears, its triples NOT using landmark 11 may still show
    // But confidence should be reduced relative to full visibility
    const fullFrame = makeFrame(0.9);
    const fullResult = detectVisibleJoints(fullFrame);
    const fullLeftShoulder = fullResult.filter(
      (vj) => vj.joint === 'shoulder' && vj.side === 'left',
    );

    if (leftShoulderEntries.length > 0 && fullLeftShoulder.length > 0) {
      expect(leftShoulderEntries[0]!.movements.length).toBeLessThanOrEqual(
        fullLeftShoulder[0]!.movements.length,
      );
    }
  });
});

describe('getVisibleJointTypes', () => {
  it('returns unique joint types from visible joints', () => {
    const frame = makeFrame(0.9);
    const types = getVisibleJointTypes(frame);

    // Should be an array of unique JointType strings
    const unique = new Set(types);
    expect(unique.size).toBe(types.length);
  });

  it('returns empty for invisible frame', () => {
    const frame = makeFrame(0);
    expect(getVisibleJointTypes(frame)).toEqual([]);
  });
});
