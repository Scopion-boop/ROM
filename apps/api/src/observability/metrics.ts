/**
 * Lightweight in-process metrics counters.
 *
 * Phase B will replace with Prometheus client or Datadog StatsD.
 * For pilot: simple counters accessible via /api/health/metrics.
 */

interface MetricCounters {
    [key: string]: number;
}

const counters: MetricCounters = {};
const startTime = Date.now();

export function incrementCounter(name: string, amount: number = 1): void {
    counters[name] = (counters[name] ?? 0) + amount;
}

export function getCounter(name: string): number {
    return counters[name] ?? 0;
}

export function getAllCounters(): Readonly<MetricCounters> {
    return { ...counters };
}

export function getUptimeSeconds(): number {
    return Math.floor((Date.now() - startTime) / 1000);
}

export function getMetricsSummary(): {
    uptime_seconds: number;
    counters: Readonly<MetricCounters>;
} {
    return {
        uptime_seconds: getUptimeSeconds(),
        counters: getAllCounters(),
    };
}

/** Test helper */
export function _resetCounters(): void {
    for (const key of Object.keys(counters)) {
        delete counters[key];
    }
}
