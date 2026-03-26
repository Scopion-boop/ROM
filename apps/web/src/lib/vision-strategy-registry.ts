/**
 * Vision Strategy Registry — pluggable architecture for capture strategies.
 *
 * Any vision intelligence implementation (guided, auto-detect, ML-based, etc.)
 * registers itself here by providing a React component that satisfies
 * VisionStrategyProps. The CameraSetupWizard renders whichever strategy is active.
 *
 * This allows multiple vision strategies to be developed on separate Git branches
 * and plugged in by simply registering the component.
 */

import type { ComponentType } from 'react';
import type {
  JointType,
  CapturedMeasurement,
  VisionStrategyMeta,
  VisionStrategyKey,
} from '@physiolens/shared-types';
import type { WebcamCaptureHandle } from '../components/capture/WebcamCapture';

// ─── Props contract every vision strategy must implement ───────────

export interface VisionStrategyProps {
  /** Optional: pre-selected joints to filter (not required for auto-detect strategies) */
  joints?: JointType[];
  /** Ref to the shared WebcamCapture component for camera access */
  webcamRef: React.RefObject<WebcamCaptureHandle | null>;
  /** Optional secondary (phone) camera stream for dual-camera fusion */
  secondaryStream?: MediaStream | null;
  /** Called when all measurements are finalized */
  onComplete: (measurements: CapturedMeasurement[]) => void;
  /** Called on each individual capture event */
  onCapture?: (measurement: CapturedMeasurement) => void;
  /** Called each frame with pose landmarks for overlay rendering */
  onLandmarksUpdate?: (
    landmarks: import('../components/capture/PoseOverlay').OverlayLandmark[] | null,
  ) => void;
  /** Called each frame with angle indicator data for overlay */
  onAngleUpdate?: (angles: import('../components/capture/PoseOverlay').AngleIndicator[]) => void;
  /** Optional CSS class */
  className?: string;
}

// ─── Strategy registration entry ───────────────────────────────────

export interface VisionStrategyEntry {
  meta: VisionStrategyMeta;
  component: ComponentType<VisionStrategyProps>;
}

// ─── Registry ──────────────────────────────────────────────────────

const registry = new Map<string, VisionStrategyEntry>();

/**
 * Register a vision strategy. Called at import-time by each strategy module.
 */
export function registerVisionStrategy(entry: VisionStrategyEntry): void {
  registry.set(entry.meta.key, entry);
}

/**
 * Get a registered strategy by key.
 */
export function getVisionStrategy(key: string): VisionStrategyEntry | undefined {
  return registry.get(key);
}

/**
 * Get all registered strategies.
 */
export function getAllVisionStrategies(): VisionStrategyEntry[] {
  return Array.from(registry.values());
}

/**
 * Get the default strategy key.
 * Returns 'auto-detect' if registered, otherwise first available, or 'guided'.
 */
export function getDefaultStrategyKey(): VisionStrategyKey | string {
  if (registry.has('auto-detect')) return 'auto-detect';
  if (registry.size > 0) return registry.keys().next().value!;
  return 'guided';
}
