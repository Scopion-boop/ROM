/**
 * @rom/web — PoseLandmarker wrapper for browser-side pose estimation.
 *
 * Wraps @mediapipe/tasks-vision PoseLandmarker with:
 *  - WASM/WebGPU delegate auto-selection
 *  - Lazy initialization (model downloaded on first use)
 *  - Video-mode detection for streaming frames
 *  - Proper cleanup / disposal
 *
 * All CV runs in-browser → $0 cloud compute.
 */

import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

/** Landmarks returned per-frame for one detected person. */
export interface PoseFrame {
  /** 33 normalized landmarks (x,y in [0,1], z relative depth, visibility [0,1]). */
  landmarks: PoseLandmarkerResult['landmarks'][0];
  /** 33 world landmarks (x,y,z in meters, visibility [0,1]). */
  worldLandmarks: PoseLandmarkerResult['worldLandmarks'][0];
  /** Timestamp of the source frame (ms). */
  timestampMs: number;
}

export interface PoseEstimatorOptions {
  /** Desired model complexity: 'lite' (fastest) or 'full' (most accurate). Default: 'lite'. */
  modelComplexity?: 'lite' | 'full';
  /** Maximum number of bodies to detect. Default: 1. */
  numPoses?: number;
  /** Minimum confidence to accept a detection. Default: 0.5. */
  minPoseDetectionConfidence?: number;
  /** Minimum confidence for landmark presence. Default: 0.5. */
  minPosePresenceConfidence?: number;
  /** Minimum confidence for tracking across frames. Default: 0.5. */
  minTrackingConfidence?: number;
  /** 'GPU' (WebGPU/WebGL) or 'CPU'. Default: 'GPU'. */
  delegate?: 'GPU' | 'CPU';
}

const MODEL_URLS: Record<string, string> = {
  lite: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
  full: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
};

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';

export class PoseEstimator {
  private landmarker: PoseLandmarker | null = null;
  private readonly options: Required<PoseEstimatorOptions>;
  private _ready = false;

  constructor(opts: PoseEstimatorOptions = {}) {
    this.options = {
      modelComplexity: opts.modelComplexity ?? 'lite',
      numPoses: opts.numPoses ?? 1,
      minPoseDetectionConfidence: opts.minPoseDetectionConfidence ?? 0.5,
      minPosePresenceConfidence: opts.minPosePresenceConfidence ?? 0.5,
      minTrackingConfidence: opts.minTrackingConfidence ?? 0.5,
      delegate: opts.delegate ?? 'GPU',
    };
  }

  /** Whether the model has been loaded and is ready for detection. */
  get ready(): boolean {
    return this._ready;
  }

  /** Download WASM + model and initialize the PoseLandmarker. */
  async init(): Promise<void> {
    if (this._ready) return;

    const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URLS[this.options.modelComplexity],
        delegate: this.options.delegate,
      },
      runningMode: 'VIDEO',
      numPoses: this.options.numPoses,
      minPoseDetectionConfidence: this.options.minPoseDetectionConfidence,
      minPosePresenceConfidence: this.options.minPosePresenceConfidence,
      minTrackingConfidence: this.options.minTrackingConfidence,
      outputSegmentationMasks: false,
    });

    this._ready = true;
  }

  /**
   * Detect poses in a video frame.
   *
   * @param source HTMLVideoElement or HTMLCanvasElement to process.
   * @param timestampMs Monotonically increasing timestamp for the frame.
   * @returns A PoseFrame for the first detected person, or null if nobody found.
   */
  detect(source: HTMLVideoElement | HTMLCanvasElement, timestampMs: number): PoseFrame | null {
    if (!this.landmarker) {
      throw new Error('PoseEstimator not initialized. Call init() first.');
    }

    const result = this.landmarker.detectForVideo(source, timestampMs);

    if (
      !result.landmarks ||
      result.landmarks.length === 0 ||
      !result.worldLandmarks ||
      result.worldLandmarks.length === 0
    ) {
      return null;
    }

    const lm = result.landmarks[0];
    const wlm = result.worldLandmarks[0];
    if (!lm || !wlm) return null;

    return {
      landmarks: lm,
      worldLandmarks: wlm,
      timestampMs,
    };
  }

  /** Release WASM resources. Always call when done. */
  dispose(): void {
    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }
    this._ready = false;
  }
}
