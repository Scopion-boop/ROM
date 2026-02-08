/**
 * @rom/web — Angle computation between three landmarks.
 *
 * Ported from services/cv/app/pipeline.py with TypeScript types.
 * Supports both 2D (x, y) and 3D (x, y, z) computation.
 */

/** Minimal landmark shape — works with both MediaPipe NormalizedLandmark and Landmark. */
export interface Point3D {
    x: number;
    y: number;
    z: number;
}

/**
 * Calculate the angle at point B formed by rays BA and BC in 2D (x, y only).
 *
 * @returns Angle in degrees ∈ [0, 180].
 */
export function angleBetweenPoints2D(a: Point3D, b: Point3D, c: Point3D): number {
    const baX = a.x - b.x;
    const baY = a.y - b.y;
    const bcX = c.x - b.x;
    const bcY = c.y - b.y;

    const dot = baX * bcX + baY * bcY;
    const magBA = Math.hypot(baX, baY);
    const magBC = Math.hypot(bcX, bcY);

    if (magBA === 0 || magBC === 0) return 0;

    const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
    return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Calculate the angle at point B formed by rays BA and BC in 3D (x, y, z).
 *
 * Uses full spatial coordinates for depth-aware measurement — critical
 * for frontal-plane and transverse-plane movements.
 *
 * @returns Angle in degrees ∈ [0, 180].
 */
export function angleBetweenPoints3D(a: Point3D, b: Point3D, c: Point3D): number {
    const baX = a.x - b.x;
    const baY = a.y - b.y;
    const baZ = a.z - b.z;
    const bcX = c.x - b.x;
    const bcY = c.y - b.y;
    const bcZ = c.z - b.z;

    const dot = baX * bcX + baY * bcY + baZ * bcZ;
    const magBA = Math.hypot(baX, baY, baZ);
    const magBC = Math.hypot(bcX, bcY, bcZ);

    if (magBA === 0 || magBC === 0) return 0;

    const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
    return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Check whether landmarks have meaningful z-depth (not all ~0).
 */
export function hasMeaningfulDepth(points: Point3D[]): boolean {
    return points.some((p) => Math.abs(p.z) > 1e-6);
}

/**
 * Auto-select 2D or 3D angle computation based on depth availability.
 *
 * @param a Proximal landmark
 * @param b Center (vertex) landmark
 * @param c Distal landmark
 * @param prefer3D If true, use 3D when depth data is present. Default: true.
 * @returns `{ angleDeg, mode }` — the angle in degrees and which mode was used.
 */
export function computeAngle(
    a: Point3D,
    b: Point3D,
    c: Point3D,
    prefer3D = true,
): { angleDeg: number; mode: '2d' | '3d' } {
    const use3D = prefer3D && hasMeaningfulDepth([a, b, c]);

    if (use3D) {
        return { angleDeg: angleBetweenPoints3D(a, b, c), mode: '3d' };
    }
    return { angleDeg: angleBetweenPoints2D(a, b, c), mode: '2d' };
}
