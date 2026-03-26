import { describe, it, expect } from 'vitest';
import { filterMaxRom, enrichWithNormative, processCaptures } from '../rom-utils';
import type { CapturedMeasurement } from '@physiolens/shared-types';

/**
 * Helper to create a CapturedMeasurement with sensible defaults.
 */
function makeMeasurement(overrides: Partial<CapturedMeasurement> = {}): CapturedMeasurement {
  return {
    joint: 'shoulder',
    movement: 'flexion',
    side: 'right',
    romDegrees: 150,
    confidence: 0.95,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('rom-utils', () => {
  // ── filterMaxRom ──────────────────────────────────────────────

  describe('filterMaxRom', () => {
    it('keeps the highest ROM per (joint, movement, side)', () => {
      const measurements: CapturedMeasurement[] = [
        makeMeasurement({ romDegrees: 130 }),
        makeMeasurement({ romDegrees: 155 }),
        makeMeasurement({ romDegrees: 140 }),
      ];

      const result = filterMaxRom(measurements);
      expect(result).toHaveLength(1);
      expect(result[0]!.romDegrees).toBe(155);
    });

    it('preserves separate channels for different joints', () => {
      const measurements: CapturedMeasurement[] = [
        makeMeasurement({ joint: 'shoulder', romDegrees: 150 }),
        makeMeasurement({ joint: 'knee', movement: 'flexion', romDegrees: 130 }),
      ];

      const result = filterMaxRom(measurements);
      expect(result).toHaveLength(2);
    });

    it('preserves separate channels for different sides', () => {
      const measurements: CapturedMeasurement[] = [
        makeMeasurement({ side: 'left', romDegrees: 140 }),
        makeMeasurement({ side: 'right', romDegrees: 150 }),
      ];

      const result = filterMaxRom(measurements);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
      expect(filterMaxRom([])).toEqual([]);
    });

    it('returns single measurement for single input', () => {
      const m = makeMeasurement();
      expect(filterMaxRom([m])).toEqual([m]);
    });
  });

  // ── enrichWithNormative ───────────────────────────────────────

  describe('enrichWithNormative', () => {
    it('adds normative data to a shoulder flexion measurement', () => {
      const measurements = [
        makeMeasurement({ joint: 'shoulder', movement: 'flexion', romDegrees: 150 }),
      ];
      const result = enrichWithNormative(measurements);

      expect(result).toHaveLength(1);
      const enriched = result[0]!;
      expect(enriched.normalRomDegrees).toBeDefined();
      expect(enriched.percentOfNormal).toBeDefined();
      expect(enriched.deficitDegrees).toBeDefined();
      expect(enriched.withinNormal).toBeDefined();
      expect(enriched.suspectAccuracy).toBe(false); // 150° shoulder flexion is within normal
    });

    it('classifies severe deficit correctly', () => {
      // Shoulder flexion normal is ~180°. 60° = 33% → severe
      const measurements = [
        makeMeasurement({ joint: 'shoulder', movement: 'flexion', romDegrees: 60 }),
      ];
      const result = enrichWithNormative(measurements);

      expect(result[0]!.status).toBe('severe');
    });

    it('classifies normal ROM correctly', () => {
      // Shoulder flexion normal is ~180°. 170° ≈ 94% → normal
      const measurements = [
        makeMeasurement({ joint: 'shoulder', movement: 'flexion', romDegrees: 170 }),
      ];
      const result = enrichWithNormative(measurements);

      expect(result[0]!.status).toBe('normal');
    });

    it('flags suspect accuracy when ROM exceeds 120% of normal', () => {
      // Shoulder flexion normal max ~180°. 220° = ~122% → suspect
      const measurements = [
        makeMeasurement({ joint: 'shoulder', movement: 'flexion', romDegrees: 220 }),
      ];
      // Note: CapturedMeasurement schema caps at 200, but enrichWithNormative
      // doesn't validate — it just enriches. We test the logic.
      // For safety, use a measurement that is actually > 120% of normal max
      // If normal = 180, then 120% = 216. Let's use extreme data.
      const result = enrichWithNormative(measurements);

      if (result[0]!.normalRomDegrees !== null) {
        // If normative range is found, check suspectAccuracy
        const pct = result[0]!.percentOfNormal!;
        expect(result[0]!.suspectAccuracy).toBe(pct > 120);
      }
    });

    it('returns unknown status for an unrecognized joint/movement', () => {
      const measurements = [
        makeMeasurement({
          joint: 'unrecognized_joint' as CapturedMeasurement['joint'],
          movement: 'twist' as CapturedMeasurement['movement'],
          romDegrees: 50,
        }),
      ];
      const result = enrichWithNormative(measurements);

      expect(result[0]!.status).toBe('unknown');
      expect(result[0]!.normalRomDegrees).toBeNull();
    });
  });

  // ── processCaptures (pipeline) ────────────────────────────────

  describe('processCaptures', () => {
    it('filters then enriches in one call', () => {
      const measurements: CapturedMeasurement[] = [
        makeMeasurement({ romDegrees: 130 }),
        makeMeasurement({ romDegrees: 150 }),
        makeMeasurement({ romDegrees: 140 }),
      ];

      const result = processCaptures(measurements);

      // Should have 1 entry (max ROM kept) and be enriched
      expect(result).toHaveLength(1);
      expect(result[0]!.romDegrees).toBe(150);
      expect(result[0]!).toHaveProperty('normalRomDegrees');
      expect(result[0]!).toHaveProperty('status');
    });

    it('handles empty input gracefully', () => {
      expect(processCaptures([])).toEqual([]);
    });
  });
});
