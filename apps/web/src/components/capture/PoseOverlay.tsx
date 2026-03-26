/**
 * PoseOverlay — Canvas overlay rendering pose landmarks + angle arcs.
 *
 * Draws MediaPipe landmarks, skeletal connections, and ROM angle
 * indicators on a transparent canvas positioned over the video feed.
 */

'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** Landmark with normalised [0,1] coordinates + visibility. */
export interface OverlayLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface AngleIndicator {
  /** Index of the vertex landmark (angle is measured here) */
  vertexIdx: number;
  /** Index of the first arm landmark */
  armAIdx: number;
  /** Index of the second arm landmark */
  armBIdx: number;
  /** Current ROM degrees to display */
  degrees: number;
  /** Label e.g. "R Shoulder Flexion" */
  label: string;
  /** Whether measurement is stable */
  isStable: boolean;
}

interface PoseOverlayProps {
  /** Ref to the <video> element the overlay sits on top of */
  videoRef: RefObject<HTMLVideoElement | null>;
  /** MediaPipe normalized landmarks (33) */
  landmarks: OverlayLandmark[] | null;
  /** Active angle indicators to render */
  angles?: AngleIndicator[];
  /** CSS class for the canvas wrapper */
  className?: string;
  /** Visibility threshold — landmarks below this are dimmed */
  visibilityThreshold?: number;
  /** When true, fills canvas with black background (skeleton-only mode, no video underneath) */
  standalone?: boolean;
}

// MediaPipe Pose connections (pairs of landmark indices)
const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
  // Left hand
  [15, 17],
  [15, 19],
  [15, 21],
  // Right hand
  [16, 18],
  [16, 20],
  [16, 22],
  // Left foot
  [27, 29],
  [27, 31],
  // Right foot
  [28, 30],
  [28, 32],
  // Face (simplified)
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 7],
  [0, 4],
  [4, 5],
  [5, 6],
  [6, 8],
  [9, 10],
];

export function PoseOverlay({
  videoRef,
  landmarks,
  angles = [],
  className = '',
  visibilityThreshold = 0.5,
  standalone = false,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Match canvas size to video (or parent container in standalone mode)
      canvas.width = video.videoWidth || video.clientWidth || 640;
      canvas.height = video.videoHeight || video.clientHeight || 480;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (standalone) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (!landmarks || landmarks.length < 33) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // Draw connections
      ctx.lineWidth = 2;
      for (const [i, j] of POSE_CONNECTIONS) {
        const a = landmarks[i];
        const b = landmarks[j];
        if (!a || !b) continue;

        const vis = Math.min(a.visibility, b.visibility);
        if (vis < visibilityThreshold) {
          ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
        } else {
          ctx.strokeStyle = `rgba(0, 255, 200, ${0.4 + vis * 0.6})`;
        }

        ctx.beginPath();
        ctx.moveTo(a.x * w, a.y * h);
        ctx.lineTo(b.x * w, b.y * h);
        ctx.stroke();
      }

      // Draw landmarks
      for (const lm of landmarks) {
        const visible = lm.visibility >= visibilityThreshold;
        ctx.fillStyle = visible ? 'rgba(0, 255, 200, 0.9)' : 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, visible ? 4 : 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw angle indicators
      for (const angle of angles) {
        const vertex = landmarks[angle.vertexIdx];
        const armA = landmarks[angle.armAIdx];
        const armB = landmarks[angle.armBIdx];
        if (!vertex || !armA || !armB) continue;

        const vx = vertex.x * w;
        const vy = vertex.y * h;

        // Highlight arms
        ctx.lineWidth = 3;
        ctx.strokeStyle = angle.isStable ? 'rgba(0, 255, 100, 0.9)' : 'rgba(255, 200, 0, 0.8)';
        ctx.beginPath();
        ctx.moveTo(armA.x * w, armA.y * h);
        ctx.lineTo(vx, vy);
        ctx.lineTo(armB.x * w, armB.y * h);
        ctx.stroke();

        // Angle text
        const textColor = angle.isStable ? '#00ff64' : '#ffc800';
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = textColor;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;

        const text = `${Math.round(angle.degrees)}°`;
        ctx.strokeText(text, vx + 10, vy - 10);
        ctx.fillText(text, vx + 10, vy - 10);

        // Label
        ctx.font = '12px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeText(angle.label, vx + 10, vy + 6);
        ctx.fillText(angle.label, vx + 10, vy + 6);

        // Stable indicator ring
        if (angle.isStable) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(0, 255, 100, 0.6)';
          ctx.beginPath();
          ctx.arc(vx, vy, 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [videoRef, landmarks, angles, visibilityThreshold, standalone]);

  return (
    <canvas
      ref={canvasRef}
      className={
        standalone
          ? `pointer-events-none h-full w-full ${className}`
          : `pointer-events-none absolute inset-0 h-full w-full ${className}`
      }
      style={{ transform: 'scaleX(-1)' }}
    />
  );
}
