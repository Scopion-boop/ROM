/**
 * @rom/web — Temporal filter for smoothing noisy angle readings.
 *
 * Applies a sliding-window median filter + exponential moving average
 * to produce stable ROM angle output (±1-2° variance target).
 *
 * Design choices:
 *  - Median filter removes outlier spikes (patient flinches, tracking glitches)
 *  - EMA smooths remaining noise for display stability
 *  - Separate filter instances per (joint, movement, side) to avoid cross-contamination
 */

export interface TemporalFilterOptions {
  /** Window size for the median filter. Must be odd. Default: 5. */
  medianWindow?: number;
  /** EMA smoothing factor α ∈ (0, 1]. Higher = more reactive. Default: 0.3. */
  emaAlpha?: number;
  /** Maximum age of a reading (ms) before the filter resets. Default: 2000. */
  maxGapMs?: number;
}

interface Reading {
  angleDeg: number;
  timestampMs: number;
}

export class TemporalFilter {
  private readonly medianWindow: number;
  private readonly emaAlpha: number;
  private readonly maxGapMs: number;

  private buffer: Reading[] = [];
  private emaValue: number | null = null;

  constructor(opts: TemporalFilterOptions = {}) {
    const mw = opts.medianWindow ?? 5;
    // Ensure odd window
    this.medianWindow = mw % 2 === 0 ? mw + 1 : mw;
    this.emaAlpha = opts.emaAlpha ?? 0.3;
    this.maxGapMs = opts.maxGapMs ?? 2000;
  }

  /**
   * Push a new raw angle reading and get back the smoothed value.
   *
   * @param angleDeg Raw angle from angle-calculator.
   * @param timestampMs Frame timestamp.
   * @returns Smoothed angle in degrees.
   */
  push(angleDeg: number, timestampMs: number): number {
    // Check for gap — reset if too long since last reading
    const lastReading = this.buffer[this.buffer.length - 1];
    if (lastReading && timestampMs - lastReading.timestampMs > this.maxGapMs) {
      this.reset();
    }

    this.buffer.push({ angleDeg, timestampMs });

    // Trim buffer to window size
    if (this.buffer.length > this.medianWindow) {
      this.buffer = this.buffer.slice(-this.medianWindow);
    }

    // Step 1: Median filter
    const medianValue = this.median(this.buffer.map((r) => r.angleDeg));

    // Step 2: EMA
    if (this.emaValue === null) {
      this.emaValue = medianValue;
    } else {
      this.emaValue = this.emaAlpha * medianValue + (1 - this.emaAlpha) * this.emaValue;
    }

    return Math.round(this.emaValue * 100) / 100;
  }

  /** Current smoothed value, or null if no readings yet. */
  get current(): number | null {
    return this.emaValue;
  }

  /** Number of readings in the buffer. */
  get bufferSize(): number {
    return this.buffer.length;
  }

  /** Reset all state. */
  reset(): void {
    this.buffer = [];
    this.emaValue = null;
  }

  /** Compute the median of a number array. */
  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
    }
    return sorted[mid] ?? 0;
  }
}

/**
 * Manages a collection of temporal filters, one per measurement key.
 */
export class TemporalFilterBank {
  private readonly filters = new Map<string, TemporalFilter>();
  private readonly opts: TemporalFilterOptions;

  constructor(opts: TemporalFilterOptions = {}) {
    this.opts = opts;
  }

  /** Build a unique key from measurement parameters. */
  private static key(joint: string, movement: string, side: string): string {
    return `${joint}:${movement}:${side}`;
  }

  /**
   * Push a reading and get the smoothed value for a specific measurement.
   */
  push(
    joint: string,
    movement: string,
    side: string,
    angleDeg: number,
    timestampMs: number,
  ): number {
    const k = TemporalFilterBank.key(joint, movement, side);
    let filter = this.filters.get(k);
    if (!filter) {
      filter = new TemporalFilter(this.opts);
      this.filters.set(k, filter);
    }
    return filter.push(angleDeg, timestampMs);
  }

  /** Get the current smoothed value for a specific measurement, or null. */
  getCurrent(joint: string, movement: string, side: string): number | null {
    const k = TemporalFilterBank.key(joint, movement, side);
    return this.filters.get(k)?.current ?? null;
  }

  /** Reset all filters. */
  resetAll(): void {
    for (const filter of this.filters.values()) {
      filter.reset();
    }
    this.filters.clear();
  }

  /** Number of active measurement channels. */
  get activeChannels(): number {
    return this.filters.size;
  }
}
