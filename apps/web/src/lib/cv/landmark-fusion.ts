/**
 * landmark-fusion.ts — Merge worldLandmarks from two camera angles.
 *
 * When a secondary (phone) camera is available, both cameras run
 * MediaPipe PoseLandmarker independently. This module merges the
 * two sets of 3D worldLandmarks into a single, higher-quality set
 * using weighted averaging based on visibility confidence.
 *
 * The fusion strategy:
 *   1. Match landmarks by index (MediaPipe always returns 33 landmarks)
 *   2. Weight each landmark's xyz by its visibility score
 *   3. Normalise the combined result
 *
 * This gives better depth estimation than a single camera because
 * the second angle provides information the first cannot see.
 */

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

/**
 * Fuse two sets of 33 world landmarks into one by visibility-weighted
 * averaging. Falls back to the single available set when only one
 * camera provides data.
 */
export function fuseLandmarks(primary: Landmark3D[], secondary: Landmark3D[] | null): Landmark3D[] {
  if (!secondary || secondary.length === 0) return primary;
  if (primary.length === 0) return secondary;

  const count = Math.min(primary.length, secondary.length);
  const fused: Landmark3D[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const a = primary[i]!;
    const b = secondary[i]!;

    const va = Math.max(a.visibility, 0.01); // avoid division by zero
    const vb = Math.max(b.visibility, 0.01);
    const total = va + vb;

    fused[i] = {
      x: (a.x * va + b.x * vb) / total,
      y: (a.y * va + b.y * vb) / total,
      z: (a.z * va + b.z * vb) / total,
      visibility: Math.max(a.visibility, b.visibility),
    };
  }

  return fused;
}

/**
 * Determine whether the secondary camera provides enough additional
 * value to justify using fused landmarks. Returns true if at least
 * `minImprovedLandmarks` landmarks have significantly higher visibility
 * in the secondary vs primary feed.
 */
export function isSecondaryUseful(
  primary: Landmark3D[],
  secondary: Landmark3D[],
  minImprovedLandmarks = 4,
  visibilityGain = 0.15,
): boolean {
  let improved = 0;
  const count = Math.min(primary.length, secondary.length);

  for (let i = 0; i < count; i++) {
    if ((secondary[i]?.visibility ?? 0) > (primary[i]?.visibility ?? 0) + visibilityGain) {
      improved++;
    }
  }

  return improved >= minImprovedLandmarks;
}
