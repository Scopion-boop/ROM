/**
 * @rom/web — usePoseDetection hook
 *
 * Owns the PoseEstimator lifecycle, runs a requestAnimationFrame loop
 * at ~15 FPS, and exposes the latest PoseFrame for downstream consumers
 * (e.g. MovementDetector, LiveRomCapture).
 *
 * Usage:
 *   const { frame, loading, ready, error, fps } = usePoseDetection(videoRef);
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseEstimator, type PoseEstimatorOptions, type PoseFrame } from '../lib/cv/pose-estimator';

// ─── Constants ─────────────────────────────────────────────────────

/** Target ~15 FPS for pose detection (balance accuracy vs CPU load). */
const FRAME_INTERVAL_MS = 67;

/** Rolling window for FPS calculation. */
const FPS_SAMPLE_COUNT = 30;

// ─── Hook Options ──────────────────────────────────────────────────

export interface UsePoseDetectionOptions extends PoseEstimatorOptions {
  /** Enable/disable the detection loop. Default: true. */
  enabled?: boolean;
}

// ─── Hook Return ───────────────────────────────────────────────────

export interface UsePoseDetectionResult {
  /** Latest detected pose frame, or null if none yet. */
  frame: PoseFrame | null;
  /** True while the model is downloading / initialising. */
  loading: boolean;
  /** True once the estimator is initialised and producing frames. */
  ready: boolean;
  /** Error message if initialisation or detection fails. */
  error: string | null;
  /** Smoothed FPS of the detection loop. */
  fps: number;
}

// ─── Hook ──────────────────────────────────────────────────────────

export function usePoseDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UsePoseDetectionOptions = {},
): UsePoseDetectionResult {
  const { enabled = true, ...estimatorOpts } = options;

  const [frame, setFrame] = useState<PoseFrame | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);

  const estimatorRef = useRef<PoseEstimator | null>(null);
  const rafRef = useRef<number>(0);
  const lastDetectRef = useRef<number>(0);
  const frameTimesRef = useRef<number[]>([]);

  // ── FPS tracker ────────────────────────────────────────────────

  const trackFps = useCallback((now: number) => {
    const times = frameTimesRef.current;
    times.push(now);
    if (times.length > FPS_SAMPLE_COUNT) times.shift();
    if (times.length >= 2) {
      const elapsed = times.at(-1)! - times[0]!;
      setFps(elapsed > 0 ? Math.round(((times.length - 1) / elapsed) * 1000) : 0);
    }
  }, []);

  // ── Init / dispose PoseEstimator ───────────────────────────────

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    const estimator = new PoseEstimator(estimatorOpts);
    estimatorRef.current = estimator;

    setLoading(true);
    setError(null);

    estimator
      .init()
      .then(() => {
        if (disposed) return;
        setLoading(false);
        setReady(true);
      })
      .catch((err: unknown) => {
        if (disposed) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to initialise pose estimator');
      });

    return () => {
      disposed = true;
      estimator.dispose();
      estimatorRef.current = null;
      setReady(false);
    };
    // Only re-init when enabled changes; estimator options are stable at mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── rAF detection loop ─────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !ready) return;

    const loop = (timestamp: number) => {
      rafRef.current = requestAnimationFrame(loop);

      if (timestamp - lastDetectRef.current < FRAME_INTERVAL_MS) return;
      lastDetectRef.current = timestamp;

      const video = videoRef.current;
      const estimator = estimatorRef.current;
      if (!video || !estimator || video.readyState < 2) return;

      try {
        const result = estimator.detect(video, performance.now());
        if (result) {
          setFrame(result);
          trackFps(timestamp);
        }
      } catch {
        // Detection can fail transiently (e.g. tab hidden) — skip frame
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, ready, videoRef, trackFps]);

  return { frame, loading, ready, error, fps };
}
