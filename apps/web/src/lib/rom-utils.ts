/**
 * rom-utils — Post-capture measurement utilities.
 *
 * - filterMaxRom(): keep only the highest ROM per (joint, movement, side)
 * - enrichWithNormative(): attach normal range data to each measurement
 */

import { compareToNormative, type CapturedMeasurement } from '@physiolens/shared-types';

// ─── Enriched Measurement (CapturedMeasurement + normative data) ───

export interface EnrichedMeasurement extends CapturedMeasurement {
    /** Normal max ROM in degrees for this joint/movement */
    normalRomDegrees: number | null;
    /** Measured ROM as percentage of normal max */
    percentOfNormal: number | null;
    /** Deficit from normal max in degrees */
    deficitDegrees: number | null;
    /** Whether ROM falls within normal limits */
    withinNormal: boolean | null;
    /** Status classification based on % of normal */
    status: 'normal' | 'mild' | 'moderate' | 'severe' | 'unknown';
    /** True when measurement exceeds 120% of normal — likely a tracking error */
    suspectAccuracy: boolean;
}

/**
 * Build a unique channel key for grouping measurements.
 */
function channelKey(m: CapturedMeasurement): string {
    return `${m.joint}:${m.movement}:${m.side}`;
}

/**
 * Filter measurements to keep only the maximum ROM per (joint, movement, side).
 * This is the clinical standard — report peak ROM, not every frame capture.
 */
export function filterMaxRom(measurements: CapturedMeasurement[]): CapturedMeasurement[] {
    const best = new Map<string, CapturedMeasurement>();

    for (const m of measurements) {
        const key = channelKey(m);
        const existing = best.get(key);

        if (!existing || m.romDegrees > existing.romDegrees) {
            best.set(key, m);
        }
    }

    return Array.from(best.values());
}

/**
 * Classify ROM deficit severity based on percentage of normal.
 *   ≥ 90% → normal
 *   70–89% → mild deficit
 *   50–69% → moderate deficit
 *   < 50% → severe deficit
 */
function classifyStatus(percentOfNormal: number | null): EnrichedMeasurement['status'] {
    if (percentOfNormal === null) return 'unknown';
    if (percentOfNormal >= 90) return 'normal';
    if (percentOfNormal >= 70) return 'mild';
    if (percentOfNormal >= 50) return 'moderate';
    return 'severe';
}

/**
 * Enrich measurements with normative range comparison data.
 * Uses the AMA6/AAOS normative ranges from shared-types.
 */
export function enrichWithNormative(measurements: CapturedMeasurement[]): EnrichedMeasurement[] {
    return measurements.map((m) => {
        const comparison = compareToNormative(
            m.joint,
            m.movement,
            m.romDegrees,
        );

        if (!comparison.normativeRange) {
            return {
                ...m,
                normalRomDegrees: null,
                percentOfNormal: null,
                deficitDegrees: null,
                withinNormal: null,
                status: 'unknown' as const,
                suspectAccuracy: false,
            };
        }

        const pct = comparison.percentOfNormal;
        return {
            ...m,
            normalRomDegrees: comparison.normativeRange.maxDegrees,
            percentOfNormal: pct,
            deficitDegrees: comparison.deficitDegrees,
            withinNormal: comparison.withinNormal,
            status: classifyStatus(pct),
            suspectAccuracy: pct > 120,
        };
    });
}

/**
 * Pipeline: filter to max ROM → enrich with normative data.
 * This is the standard post-capture processing pipeline.
 */
export function processCaptures(measurements: CapturedMeasurement[]): EnrichedMeasurement[] {
    return enrichWithNormative(filterMaxRom(measurements));
}
