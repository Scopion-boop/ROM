import { randomUUID } from 'node:crypto';

export interface MeasurementRecord {
    id: string;
    sessionId: string;
    joint: string;
    movement: string;
    side: string;
    romDegrees: number;
    confidenceScore: number;
    qualityFlags: { code: string; message: string; severity: string }[];
    algorithmVersion: string;
    captureDurationMs: number;
    createdAt: string;
}

const measurements: Map<string, MeasurementRecord> = new Map();

export function createMeasurement(data: Omit<MeasurementRecord, 'id' | 'createdAt'>): MeasurementRecord {
    const record: MeasurementRecord = {
        id: randomUUID(),
        ...data,
        createdAt: new Date().toISOString(),
    };
    measurements.set(record.id, record);
    return record;
}

export function getMeasurement(id: string): MeasurementRecord | undefined {
    return measurements.get(id);
}

export function listMeasurementsBySession(sessionId: string): MeasurementRecord[] {
    return [...measurements.values()].filter((m) => m.sessionId === sessionId);
}

/** For testing: clear all measurements. */
export function _clearMeasurements(): void {
    measurements.clear();
}
